import dotenv from 'dotenv';
import express from 'express';
// import speech from '@google-cloud/speech';
import http from 'http';
import socketStream from 'socket.io-stream';
import { Server } from 'socket.io';
import { pipeline } from 'stream';

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
const ss = socketStream as any;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

io.on('connection', (socket) => {
    console.log('Connected to socket:', socket.id);

    ss(socket).on('audioStream', (stream: any) => {
        pipeline(stream, process.stdout, (err) => console.error(err));
        // const speechClient = new speech.SpeechClient({
        //     credentials: {
        //         project_id: 'long-victor-290219',
        //         private_key_id: process.env.PRIVATE_KEY_ID,
        //         private_key: process.env.PRIVATE_KEY,
        //         client_email: process.env.CLIENT_EMAIL,
        //     },
        // });

        // const request = {
        //     config: {
        //         encoding: 'LINEAR16',
        //         sampleRateHertz: 16000,
        //         languageCode: 'en-US',
        //     },
        //     interimResults: true,
        // };

        // const recognizeStream = speechClient
        //     .streamingRecognize(request)
        //     .on('error', console.error)
        //     .on('data', (data) => {
        //         console.log(data);
        //     });

        // console.log(recognizeStream, stream);
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
