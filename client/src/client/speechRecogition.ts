/* eslint-disable no-plusplus */
import { DyteParticipants, DyteSelf } from '@dytesdk/web-core';
import '../utils/logger';
import {
    GoogleSpeechRecognitionOptions,
    TranscriptionData,
} from '../types';
import emitter from '../utils/emitter';
import SocketClient from './client';

class GoogleSpeechRecognition {
    public transcriptions: TranscriptionData[];

    public source: string;

    public target: string;

    public baseUrl: string;

    #self: DyteSelf;

    #socketClient: SocketClient;

    #participants: DyteParticipants;

    constructor(options: GoogleSpeechRecognitionOptions) {
        this.#self = options.meeting.self;
        this.baseUrl = options.baseUrl;
        this.#participants = options.meeting.participants;
        this.transcriptions = [];
        this.source = options.source ?? 'en';
        this.target = options.target ?? 'th';

        this.#socketClient = new SocketClient(
            this.#participants,
            this.baseUrl,
        );

        this.#participants.on('broadcastedMessage', (data) => {
            if (data.type !== 'newTranscription') return;
            const transcriptionPayload: TranscriptionData = {
                name: this.#self.name,
                transcript: data.payload,
                id: this.#self.id,
                date: new Date(),
            };
            this.transcriptions.push(transcriptionPayload);
            emitter().emit('transcription', transcriptionPayload);
        });
    }

    on(eventName: 'transcription', listener: (...args: any[]) => void) {
        return emitter().on(eventName, listener);
    }

    async transcribe() {
        const handleAudioStream = async () => {
            if (this.#self.audioEnabled) {
                this.#socketClient.startRecording(this.#self.audioTrack, this.source, this.target);
                return;
            }

            this.#socketClient.stopRecording();
        };

        handleAudioStream();

        this.#self.on('audioUpdate', () => {
            handleAudioStream();
        });
    }
}

export default GoogleSpeechRecognition;
