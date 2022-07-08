import { io, Socket } from 'socket.io-client';

export default class SocketClient {
    #socket: Socket;

    #context: AudioContext;

    #processor: AudioWorkletNode;

    #input: MediaStreamAudioSourceNode;

    #globalStream: MediaStream;

    constructor(participants: any, baseUrl: string) {
        this.#socket = io(baseUrl);

        this.#socket.on('speechData', (data) => {
            participants.broadcastMessage('newTranscription', data);
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

        await this.#context.audioWorklet.addModule('./src/utils/recorderWorkletProcessor.js');
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

        const track = this.#globalStream.getTracks()[0];
        track.stop();

        this.#input.disconnect(this.#processor);
        this.#processor.disconnect(this.#context.destination);
        this.#context.close().then(() => {
            this.#input = null;
            this.#processor = null;
            this.#context = null;
        });
    }
}
