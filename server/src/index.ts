import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v2 as GoogleTranslate } from '@google-cloud/translate';
import { v1 as GoogleSpeech } from '@google-cloud/speech';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 3001;
const projectId = process.env.PROJECT_ID;
const credentials = {
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const speechClient = new GoogleSpeech.SpeechClient({
    credentials,
});

const translate = new GoogleTranslate.Translate({ projectId, credentials });

const streams: { [id: string]: ReturnType<GoogleSpeech.SpeechClient['streamingRecognize']> } = {};

async function translateText(text: string, targetLangCode: string) {
    const [translation] = await translate.translate(
        text,
        targetLangCode,
    );
    return translation;
}

type StartStreamingRequest = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: number,
        sourceLanguageCode: string,
        targetLanguageCode: string,
    },
    singleUtterance: false,
}

io.on('connection', (socket) => {
    console.log('Connected to socket:', socket.id);
    const startStreamingRequest: StartStreamingRequest = {
        config: {
            encoding: 'LINEAR16' as const,
            sampleRateHertz: 16000,
            sourceLanguageCode: 'en-US',
            targetLanguageCode: 'hi',
        },
        singleUtterance: false,
    };

    function stopRecognitionStream() {
        const recognizeStream = streams[socket.id];
        if (recognizeStream) {
            recognizeStream.end();
        }
        streams[socket.id] = null;
    }

    async function startRecognitionStream() {
        const stream = await speechClient.streamingRecognize({
            config: {
                encoding: startStreamingRequest.config.encoding,
                languageCode: startStreamingRequest.config.sourceLanguageCode,
                sampleRateHertz: startStreamingRequest.config.sampleRateHertz,
            },
            singleUtterance: false,
        })
            .on('error', (e: any) => {
                console.log('Websocket Error:: ', e);
                if (e.code && e.code === 4) {
                    console.log('Streaming translation reached its deadline.');
                }
            })
            .on(
                'data',
                async ({ results, error }: {
                    results: {
                        alternatives: {'words':string[], 'transcript':string, 'confidence':number}[],
                        isFinal: true,
                        stability: number,
                        resultEndTime: { seconds: string, nanos: number },
                        channelTag: number,
                        languageCode: string,
                      }[],
                      error: null,
                }) => {
                    if (error) {
                        console.log('Error in data listener:: ', error);
                        return;
                    }

                    console.log('Received speech:: ', JSON.stringify(results[0]?.alternatives));
                    const transcription = results[0]?.alternatives[0].transcript;
                    let translatedText = transcription;
                    if (
                        startStreamingRequest.config.sourceLanguageCode
                        !== startStreamingRequest.config.targetLanguageCode
                    ) {
                        translatedText = await translateText(
                            transcription,
                            startStreamingRequest.config.targetLanguageCode,
                        );
                        console.log('Translated text::', translatedText);
                    }
                    socket.emit('speechData', {
                        transcript: translatedText,
                        isPartialTranscript: !results[0]?.isFinal,
                    });
                },
            );
        streams[socket.id] = stream;
    }

    socket.on('startStreaming', (data) => {
        console.log('stared streaming', data);

        if (data?.source) {
            startStreamingRequest.config.sourceLanguageCode = data.source;
            startStreamingRequest.config.targetLanguageCode = data.source;
        }
        if (data?.target) {
            startStreamingRequest.config.targetLanguageCode = data.target;
        }

        startRecognitionStream();
        const recognizeStream = streams[socket.id];
        recognizeStream?.write(startStreamingRequest);
    });

    socket.on('stopStreaming', () => {
        console.log('Stream stopped', socket.id);
        stopRecognitionStream();
    });

    socket.on('audioStream', (buffer: any) => {
        const recognizeStream = streams[socket.id];
        if (recognizeStream?.writable && !recognizeStream?.destroyed) {
            recognizeStream?.write(buffer);
        }
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
