import DyteClient from '@dytesdk/web-core';
import { defineCustomElements } from '@dytesdk/ui-kit/loader/index.es2017';
import GoogleSpeechRecognition, { TranscriptionData } from '../src/index';

defineCustomElements();

const init = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const roomName = params.get('roomName') || '';
        const authToken = params.get('authToken') || '';

        if (!authToken || (roomName && !authToken)) {
            alert('Please pass authToken (and roomName, if you are using v1 APIs) in query params');
            return;
        }

        const meeting = await DyteClient.init({
            authToken,
            roomName,
            apiBase: 'https://api.dyte.io',
            defaults: {
                audio: false,
                video: false,
            },
        });

        // Initialize speech client
        const speech = new GoogleSpeechRecognition({
            meeting,
            target: 'hi',
            source: 'en-US',
            baseUrl: 'http://localhost:3001',
        });

        // Listen for transcriptions
        speech.on('transcription', async () => {
            const transcription = document.getElementById('dyte-transcriptions') as HTMLDivElement;
            const list = speech.transcriptions.slice(-3);
            transcription.innerHTML = '';
            list.forEach((item: TranscriptionData) => {
                const speaker = document.createElement('span');
                speaker.classList.add('dyte-transcription-speaker');
                speaker.innerText = `${item.name}: `;

                const text = document.createElement('span');
                text.classList.add('dyte-transcription-text');
                text.innerText = item.transcript.trim() !== '' ? item.transcript : '...';

                const container = document.createElement('span');
                container.classList.add('dyte-transcription-line');
                container.appendChild(speaker);
                container.appendChild(text);

                transcription.appendChild(container);
            });
        });

        // Initialize transcriptions
        speech.transcribe();

        (document.getElementById('my-meeting') as any).meeting = meeting;
    } catch (e) {
        console.log(e);
    }
};

init();
