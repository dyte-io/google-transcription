import dotenv from 'dotenv';
import express from 'express';
// import speech from '@google-cloud/speech';
import http from 'http';
import { Server } from 'socket.io';
import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';

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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const translationClient = new SpeechTranslationServiceClient({
    credentials: {
        private_key: process.env.PRIVATE_KEY,
        client_email: process.env.CLIENT_EMAIL,
    },
});

const streams: { [id: string]: any } = {};
const encoding = 'linear16' as const;

const initialRequest: any = {
    streamingConfig: {
        audioConfig: {
            audioEncoding: encoding,
            sourceLanguageCode: 'en-US',
            targetLanguageCode: 'th',
        },
        singleUtterance: true,
    },
    audioContent: null,
};

io.on('connection', (socket) => {
    console.log('Connected to socket:', socket.id);

    function stopRecognitionStream() {
        let recognizeStream = streams[socket.id];
        if (recognizeStream) {
            recognizeStream.end();
        }
        recognizeStream = null;
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
            .on('data', ({ result, error }: { result: {
                textTranslationResult: {
                    translation: string,
                    isFinal: boolean,
                }
            }, error: any }) => {
                if (error) {
                    console.log(error);
                    return;
                }
                socket.emit('speechData', result.textTranslationResult.translation);
            });
        streams[socket.id] = stream;
    }

    socket.on('startStreaming', (data) => {
        initialRequest.streamingConfig.audioConfig = {
            audioEncoding: encoding,
            sourceLanguageCode: data.source,
            targetLanguageCode: data.target,
        };
        console.log('Started streaming', socket.id);
        startRecognitionStream();
        const recognizeStream = streams[socket.id];
        recognizeStream?.write(initialRequest);
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
