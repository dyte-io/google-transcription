/* eslint-disable no-plusplus */
import { DyteParticipants, DyteSelf } from '@dytesdk/web-core';
import '../utils/logger';
import { combineBuffers, float32ToInt16 } from '../utils/audio';
import speechToText from './googleAPIs';
import {
    GoogleSpeechRecognitionOptions,
    Transcription,
    TranscriptionData,
} from '../types';
import emitter from '../utils/emitter';

const BUFFER_SIZE = 4096;
const SAMPLE_RATE = 16000;

class GoogleSpeechRecognition {
    /**
     * @description Optionally define a regional endpoint:
     * https://cloud.google.com/speech-to-text/docs/endpoints
     * If this parameter is not defined, the US endpoint will be used by default.
     * @example 'https://eu-speech.googleapis.com'
     */
    public regionalEndpoint: string;

    public transcriptions: TranscriptionData[];

    #outputBuffer: Uint8Array;

    #tempBuffer: ArrayBuffer;

    #tempBufferView: Uint16Array;

    #audioContext: AudioContext;

    #audio: MediaStreamAudioSourceNode;

    #processor: any;

    #starting: boolean;

    #cancelStart: boolean;

    #self: DyteSelf;

    #participants: DyteParticipants;

    #apiKey: string;

    constructor(options: GoogleSpeechRecognitionOptions) {
        this.#apiKey = options.apiKey;
        this.regionalEndpoint = options.regionalEndpoint ?? 'https://speech.googleapis.com';
        this.#tempBuffer = new ArrayBuffer(BUFFER_SIZE * 2);
        this.#tempBufferView = new Uint16Array(this.#tempBuffer);
        this.#self = options.meeting.self;
        this.#participants = options.meeting.participants;
        this.transcriptions = [];

        this.#participants.on('broadcastedMessage', (data) => {
            this.transcriptions.push(data.payload);
            emitter().emit('transcription', data.payload);
        });
    }

    async #connectAudioContext() {
        const stream = new MediaStream();
        stream.addTrack(this.#self.audioTrack);

        if (!this.#audioContext) {
            this.#audioContext = new AudioContext({
                sampleRate: SAMPLE_RATE,
            });
        }

        try {
            this.#audio = this.#audioContext.createMediaStreamSource(stream);
        } catch (e) {
            this.#audioContext = new AudioContext();
            this.#audio = this.#audioContext.createMediaStreamSource(stream);
        }

        if (!this.#processor) {
            this.#processor = this.#audioContext.createScriptProcessor(
                BUFFER_SIZE,
                1,
                1,
            );
            this.#processor.onaudioprocess = (e: any) => {
                const input = e.inputBuffer.getChannelData(0);
                for (let i = 0; i < input.length; i++) {
                    this.#tempBufferView[i] = float32ToInt16(input[i]);
                }

                this.#outputBuffer = combineBuffers(this.#outputBuffer, this.#tempBuffer);
            };
        }

        this.#audio.connect(this.#processor);
        this.#processor.connect(this.#audioContext.destination);
    }

    async #startListening() {
        if (this.#starting) return;

        this.#starting = true;
        this.#outputBuffer = new Uint8Array(0);

        await this.#connectAudioContext();

        if (this.#cancelStart) {
            this.#cancelStart = false;
        }

        this.#starting = false;
    }

    async #stopListening(languageCode = 'en-US') {
        if (this.#starting) {
            this.#cancelStart = true;
        }

        if (this.#outputBuffer && this.#outputBuffer.length > 0) {
            const apiResult: Transcription = await speechToText(
                this.#outputBuffer,
                this.#audioContext.sampleRate,
                languageCode,
                this.#apiKey,
                this.regionalEndpoint,
            );
            this.#outputBuffer = new Uint8Array(0);

            const payload: TranscriptionData = {
                id: this.#self.id,
                name: this.#self.name,
                transcript: apiResult?.results
                    ? apiResult.results[0].alternatives[0]?.transcript
                    : null,
                date: new Date(),
            };

            if (payload.transcript) {
                this.#participants.broadcastMessage('newTranscription', payload);
            }
            return apiResult;
        }
        return null;
    }

    on(eventName: 'transcription', listener: (...args: any[]) => void) {
        return emitter().on(eventName, listener);
    }

    async transcribe() {
        const handleAudioStream = (interval: any) => {
            if (this.#self.audioEnabled) {
                this.#stopListening();
                this.#startListening();
            } else {
                this.#stopListening();
                clearInterval(interval);
            }
        };
        this.#self.on('audioUpdate', () => {
            const streamInterval = setInterval(() => {
                handleAudioStream(streamInterval);
            }, 10000);
            handleAudioStream(streamInterval);
        });
    }
}

export default GoogleSpeechRecognition;
