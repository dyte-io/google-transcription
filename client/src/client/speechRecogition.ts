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

    socketClient: SocketClient;

    #participants: DyteParticipants;

    constructor(options: GoogleSpeechRecognitionOptions) {
        this.#self = options.meeting.self;
        this.baseUrl = options.baseUrl;
        this.#participants = options.meeting.participants;
        this.transcriptions = [];
        this.source = options.source ?? 'en';
        this.target = options.target ?? 'th';

        this.socketClient = new SocketClient(
            this.#participants,
            this.#self,
            this.baseUrl,
        );

        this.#participants.on('broadcastedMessage', (data: { type: string, payload: TranscriptionData}) => {
            if (data.type !== 'newTranscription') return;

            /**
             * NOTE(ravindra-dyte): We want to give the effect of in-place transcription update
             * Therefore we are removing previously in-progress line and putting the new one
            */

            // Remove all in-progress transcriptions of this user
            const filteredTranscriptions: TranscriptionData[] = [];
            this.transcriptions.forEach((transcription) => {
                const shouldKeep = transcription.id !== data.payload?.id // allow from others
            || ( // allow this peerId messages only if they are completed
                transcription.id === data.payload?.id
                    && !transcription.isPartialTranscript
            );
                if (shouldKeep) {
                    filteredTranscriptions.push(transcription);
                }
            });

            filteredTranscriptions.push(data.payload);
            this.transcriptions = filteredTranscriptions;

            emitter().emit('transcription', data.payload);
        });
    }

    on(eventName: 'transcription', listener: (...args: any[]) => void) {
        return emitter().on(eventName, listener);
    }

    async transcribe() {
        const handleAudioStream = async () => {
            if (this.#self.audioEnabled) {
                // Stop previous audio stream if any
                await this.socketClient.stopRecording();
                await this
                    .socketClient
                    .startRecording(this.#self.audioTrack, this.source, this.target);
                return;
            }

            this.socketClient.stopRecording();
        };

        handleAudioStream();

        this.#self.on('audioUpdate', () => {
            handleAudioStream();
        });
    }
}

export default GoogleSpeechRecognition;
