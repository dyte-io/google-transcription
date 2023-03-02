/* eslint-disable no-restricted-syntax */
import dotenv from 'dotenv';
import express from 'express';
// import speech from '@google-cloud/speech';
import http from 'http';
import { Server } from 'socket.io';
import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { v2 as GoogleTranslate } from '@google-cloud/translate';

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

const translationClient = new SpeechTranslationServiceClient({
    credentials,
});

const translate = new GoogleTranslate.Translate({ projectId, credentials });

const streams: { [id: string]: ReturnType<SpeechTranslationServiceClient['streamingTranslateSpeech']> } = {};
const encoding = 'linear16' as const;

async function translateText(text: string, targetLangCode: string) {
    const [translation] = await translate.translate(
        text,
        targetLangCode,
    );
    return translation;
}

io.on('connection', (socket) => {
    console.log('Connected to socket:', socket.id);
    let useTranslate = false;
    const initialRequest: {
        streamingConfig: {
            audioConfig: {
                audioEncoding: string,
                sourceLanguageCode: string,
                targetLanguageCode: string,
            },
            singleUtterance: boolean,
        },
        audioContent: null | string,
    } = {
        streamingConfig: {
            audioConfig: {
                audioEncoding: encoding,
                sourceLanguageCode: 'en-US',
                targetLanguageCode: 'th',
            },
            singleUtterance: false,
        },
        audioContent: null,
    };

    function stopRecognitionStream() {
        const recognizeStream = streams[socket.id];
        if (recognizeStream) {
            recognizeStream.end();
        }
        streams[socket.id] = null;
    }

    function startRecognitionStream() {
        const stream = translationClient
            .streamingTranslateSpeech()
            .on('error', (e: any) => {
                if (e.code && e.code === 4) {
                    console.log('Streaming translation reached its deadline.');
                } else {
                    console.log(e);
                }
            })
            .on(
                'data',
                async ({ result, error }: {
                    result: {
                        textTranslationResult: {
                            translation: string,
                            isFinal: boolean,
                        }
                    }, error: any,
                }) => {
                    if (error) {
                        console.log(error);
                        return;
                    }

                    console.log('Received speech:: ', result?.textTranslationResult);
                    let { translation } = result?.textTranslationResult ?? {};
                    if (useTranslate) {
                        translation = await translateText(
                            translation,
                            initialRequest.streamingConfig.audioConfig.targetLanguageCode,
                        );
                    }
                    socket.emit('speechData', {
                        transcript: translation,
                        isPartialTranscript: !result?.textTranslationResult?.isFinal,
                    });
                },
            );
        streams[socket.id] = stream;
    }

    socket.on('startStreaming', (data) => {
        console.log('stared streaming', data);

        const newRequest = JSON.parse(JSON.stringify(initialRequest));

        if (data?.source) {
            newRequest.streamingConfig.audioConfig.sourceLanguageCode = data.source;
        }
        if (data?.target) {
            newRequest.streamingConfig.audioConfig.targetLanguageCode = data.target;
        }

        if (!data?.source?.startsWith('en') && !data?.target?.startsWith('en')) {
            useTranslate = true;
            newRequest.streamingConfig.audioConfig.targetLanguageCode = 'en-US';
        }

        startRecognitionStream();
        const recognizeStream = streams[socket.id];
        recognizeStream?.write(newRequest);
    });

    socket.on('stopStreaming', () => {
        console.log('Stream stopped', socket.id);
        stopRecognitionStream();
    });

    socket.on('audioStream', (buffer: any) => {
        const recognizeStream = streams[socket.id];
        recognizeStream?.write({
            streamingConfig: initialRequest.streamingConfig,
            audioContent: buffer.toString('base64'),
        });
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
