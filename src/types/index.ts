import DyteClient from "@dytesdk/web-core";

type GoogleSpeechRecognitionOptions = {
    apiKey: string;
    meeting: DyteClient;
    regionalEndpoint?: string;
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
};


