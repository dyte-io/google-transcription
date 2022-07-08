import DyteClient from '@dytesdk/web-core';

type GoogleSpeechRecognitionOptions = {
    meeting: DyteClient;
    source: string;
    target: string;
    baseUrl: string;
}

type Transcription = {
    results: {
        alternatives: {
            transcript: string;
        }[];
        languageCode: string;
        resultEndTime: string;
    }[];
}

type TranslatedText = {
    data: {
        translations: {
            translatedText: string,
        }[]
    }
}

type TranscriptionData = {
    id: string;
    name: string;
    transcript: string;
    date: Date;
}

export {
    GoogleSpeechRecognitionOptions,
    Transcription,
    TranscriptionData,
    TranslatedText,
};
