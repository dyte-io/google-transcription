/* eslint-disable no-plusplus */
import { DyteParticipants, DyteSelf } from '@dytesdk/web-core';
import '../utils/logger';
import {
    GoogleSpeechRecognitionOptions,
    TranscriptionData,
} from '../types';
import emitter from '../utils/emitter';
import { startRecording, stopRecording } from './client';

class GoogleSpeechRecognition {
    /**
     * @description Optionally define a regional endpoint:
     * https://cloud.google.com/speech-to-text/docs/endpoints
     * If this parameter is not defined, the US endpoint will be used by default.
     * @example 'https://eu-speech.googleapis.com'
     */
    public regionalEndpoint: string;

    public transcriptions: TranscriptionData[];

    public translate: boolean;

    public source: string;

    public target: string;

    #self: DyteSelf;

    #participants: DyteParticipants;

    constructor(options: GoogleSpeechRecognitionOptions) {
        this.regionalEndpoint = options.regionalEndpoint ?? 'https://speech.googleapis.com';
        this.#self = options.meeting.self;
        this.#participants = options.meeting.participants;
        this.transcriptions = [];
        this.translate = options.translate ?? false;
        this.source = options.source ?? 'en';
        this.target = options.target ?? 'th';

        this.#participants.on('broadcastedMessage', (data) => {
            if (data.type !== 'newTranscription') return;
            this.transcriptions.push(data.payload);
            emitter().emit('transcription', data.payload);
        });
    }

    on(eventName: 'transcription', listener: (...args: any[]) => void) {
        return emitter().on(eventName, listener);
    }

    async transcribe() {
        const handleAudioStream = async () => {
            if (this.#self.audioEnabled) {
                startRecording(this.#self.audioTrack);
                return;
            }

            stopRecording();
        };
        this.#self.on('audioUpdate', () => {
            handleAudioStream();
        });
    }
}

export default GoogleSpeechRecognition;
