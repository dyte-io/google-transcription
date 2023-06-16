import { io, Socket } from 'socket.io-client';
import { TranscriptionData } from '../types';

// eslint-disable-next-line import/extensions, import/no-unresolved
import recorderWorkerUrl from '../utils/recorderWorkletProcessor.js?url';

async function createWorkletNode(
    context: BaseAudioContext,
    name: string,
    url: string,
) {
    // ensure audioWorklet has been loaded
    try {
        return new AudioWorkletNode(context, name);
    } catch (err) {
        await context.audioWorklet.addModule(url);
        return new AudioWorkletNode(context, name);
    }
}

export default class SocketClient {
    #socket: Socket;

    #context: AudioContext;

    #processor: AudioWorkletNode;

    #input: MediaStreamAudioSourceNode;

    #globalStream: MediaStream;

    constructor(participants: any, self: any, baseUrl: string) {
        const socketUrl = new URL(baseUrl);
        socketUrl.searchParams.append('speakerId', self.userId);
        this.#socket = io(socketUrl);

        this.#socket.on('speechData', (data) => {
            const transcriptionPayload: TranscriptionData = {
                name: self.name,
                id: self.id,
                transcript: data?.transcript,
                isPartialTranscript: data?.isPartialTranscript,
                date: new Date(),
            };
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

        this.#globalStream = new MediaStream();
        this.#globalStream.addTrack(audioTrack);
        this.#input = this.#context.createMediaStreamSource(this.#globalStream);
        this.#processor = await createWorkletNode(this.#context, 'recorder.worklet', recorderWorkerUrl);
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
