import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');

let context: AudioContext;
let processor: AudioWorkletNode;
let input: MediaStreamAudioSourceNode;
let globalStream: MediaStream;

function microphoneProcess(buffer: any) {
    socket.emit('audioStream', buffer);
}

export async function startRecording(audioTrack: MediaStreamTrack) {
    socket.emit('startStreaming', '');

    context = new AudioContext({
        latencyHint: 'interactive',
    });

    await context.audioWorklet.addModule('./src/utils/recorderWorkletProcessor.js');
    context.resume();

    globalStream = new MediaStream();
    globalStream.addTrack(audioTrack);
    input = context.createMediaStreamSource(globalStream);
    processor = new window.AudioWorkletNode(
        context,
        'recorder.worklet',
    );
    processor.connect(context.destination);
    context.resume();
    input.connect(processor);
    processor.port.onmessage = (e) => {
        const audioData = e.data;
        microphoneProcess(audioData);
    };
}

export function stopRecording() {
    socket.emit('stopStreaming', '');

    const track = globalStream.getTracks()[0];
    track.stop();

    input.disconnect(processor);
    processor.disconnect(context.destination);
    context.close().then(() => {
        input = null;
        processor = null;
        context = null;
    });
}

socket.on('speechData', (data) => {
    console.log(data);
});

window.onbeforeunload = () => {
    socket.emit('endGoogleCloudStream', '');
};
