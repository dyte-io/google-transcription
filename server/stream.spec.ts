// import { pipeline } from 'stream';
// import fs from 'fs';
import { io } from 'socket.io-client';
import ss from 'socket.io-stream';
import { pipeline } from 'stream';

const socket = io('http://localhost:3001');
socket.on('connect', () => {
    const stream = (ss as any).createStream();
    (ss as any)(socket).emit('audioStream', stream);
    pipeline(process.stdin, stream, console.error);
});
