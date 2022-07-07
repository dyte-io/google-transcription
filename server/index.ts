import dotenv from 'dotenv';
import express from 'express';
import speech from '@google-cloud/speech';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const speechClient = new speech.SpeechClient({
    credentials: {
        private_key: process.env.PRIVATE_KEY,
        client_email: process.env.CLIENT_EMAIL,
    },
});

const streams: { [id: string]: any } = {};

const encoding = 'LINEAR16' as const;
const sampleRateHertz = 16000;
const languageCode = 'en-US';

const request = {
    config: {
        encoding,
        sampleRateHertz,
        languageCode,
        profanityFilter: false,
        enableWordTimeOffsets: true,
    },
    interimResults: true,
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
        console.log('client: ', socket);
        const recognizeStream = speechClient
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', (data) => {
                console.log('Transcription: ', data);
                // process.stdout.write(
                //     data.results[0] && data.results[0].alternatives[0]
                //         ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                //         : '\n\nReached transcription time limit, press Ctrl+C\n',
                // );
                socket.emit('speechData', data);

                if (data.results[0] && data.results[0].isFinal) {
                    stopRecognitionStream();
                    startRecognitionStream();
                }
            });
        streams[socket.id] = recognizeStream;
    }

    socket.on('startStreaming', () => {
        console.log('Started streaming', socket.id);
        startRecognitionStream();
    });

    socket.on('stopStreaming', () => {
        console.log('Stream stopped', socket.id);
        stopRecognitionStream();
    });

    socket.on('audioStream', (buffer: any) => {
        const recognizeStream = streams[socket.id];
        const rand = Math.random() < 0.2;

        const resp = recognizeStream?.write(buffer);
        if (rand) {
            console.log('isWrite', resp);
        }
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
