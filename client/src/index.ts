import DyteGoogleSpeechRecognition from './client/speechRecogition';
import type { TranscriptionData } from './types';

export type {
    TranscriptionData,
};

if (typeof window !== 'undefined') {
    // Putting it on wimdow to allow import using scipt tag in plain HTML, JS solutions.
    Object.assign(window, { DyteGoogleSpeechRecognition });
}

export default DyteGoogleSpeechRecognition;
