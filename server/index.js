/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express');
const speech = require('@google-cloud/speech');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

io.on('connection', (client) => {
    console.log('Connected to socket');
    client.on('audioStream', (stream) => {
        console.log(stream);
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
