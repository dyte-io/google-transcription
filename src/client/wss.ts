import { io } from 'socket.io-client';
import ss from 'socket.io-stream';

const socket = io('ws://localhost:3001', { transports: ['websocket', 'polling'] });

const speechToText = (audio: MediaStreamTrack) => {
    // // const stream = (ss as any).createStream();
    // // console.log(stream);
    // // // stream.addTrack(audio);
    console.log(audio);
    // socket.emit('audioStream', audio);
    ss(socket).emit('audioStream', 'xscdv');
};

export default speechToText;
