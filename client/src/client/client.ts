import { io, Socket } from 'socket.io-client';
import { TranscriptionData } from '../types';

export default class SocketClient {
    #socket: Socket;

    #context: AudioContext;

    #processor: AudioWorkletNode;

    #input: MediaStreamAudioSourceNode;

    #globalStream: MediaStream;

    constructor(participants: any, self: any, baseUrl: string) {
        this.#socket = io(baseUrl);

        this.#socket.on('speechData', (data) => {
            const transcriptionPayload: TranscriptionData = {
                name: self.name,
                id: self.id,
                transcript: data,
                date: new Date(),
            };
            console.log(data, transcriptionPayload);
            participants.broadcastMessage('newTranscription', transcriptionPayload);
        });

        window.onbeforeunload = () => {
            this.#socket.emit('endGoogleCloudStream', '');
        };
    }

    microphoneProcess(buffer: any) {
        this.#socket.emit('audioStream', buffer);
    }

    async startRecording(audioTrack: MediaStreamTrack, source: string, target: string) {
        this.#socket.emit('startStreaming', {
            source,
            target,
        });

        this.#context = new AudioContext({
            latencyHint: 'interactive',
        });

        await this.#context.audioWorklet.addModule('https://cdn.jsdelivr.net/npm/@dytesdk/google-transcription@0.0.5/dist/recorderWorkletProcessor.js');
        this.#context.resume();

        this.#globalStream = new MediaStream();
        this.#globalStream.addTrack(audioTrack);
        this.#input = this.#context.createMediaStreamSource(this.#globalStream);
        this.#processor = new window.AudioWorkletNode(
            this.#context,
            'recorder.worklet',
        );
        this.#processor.connect(this.#context.destination);
        this.#context.resume();
        this.#input.connect(this.#processor);
        this.#processor.port.onmessage = (e) => {
            const audioData = e.data;
            this.microphoneProcess(audioData);
        };
    }

    stopRecording() {
        this.#socket.emit('stopStreaming', '');

        this.#input?.disconnect(this.#processor);
        this.#processor?.disconnect(this.#context.destination);
        this.#context?.close().then(() => {
            this.#input = null;
            this.#processor = null;
            this.#context = null;
        });
    }
}
