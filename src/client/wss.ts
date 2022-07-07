import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', { transports: ['websocket', 'polling'] });
// const BUFFER_SIZE = 4096;
const SAMPLE_RATE = 16000;

let processor: any;
let input: any;
let context: AudioContext;

function microphoneProcess(buffer: any) {
    console.log(buffer);
    socket.emit('audioStream', buffer);
}

export async function speechToText(audioTrack: MediaStreamTrack) {
    const stream = new MediaStream();
    stream.addTrack(audioTrack);
    context = new AudioContext({
        sampleRate: SAMPLE_RATE,
        latencyHint: 'interactive',
    });

    socket.emit('startStreaming');
    context.resume();

    input = context.createMediaStreamSource(stream);

    await context.audioWorklet.addModule('./src/utils/recorderWorkletProcessor.js');

    processor = new window.AudioWorkletNode(
        context,
        'recorder.worklet',
    );

    processor.connect(context.destination);
    context.resume();
    input.connect(processor);
    processor.port.onmessage = (e: any) => {
        const audioData = e.data;
        microphoneProcess(audioData);
    };
}

export async function stopSpeechToText() {
    context.close();
}
