import base64 from 'base64-js';

async function speechToText(
    audioBuffer: Uint8Array,
    sampleRate: number,
    languageCode: string,
    apiKey: string,
    regionalEndpoint: string,
) {
    const response = await fetch(
        `${regionalEndpoint}/v1/speech:recognize?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: sampleRate,
                    languageCode,
                    maxAlternatives: 1,
                    enableAutomaticPunctuation: true,
                    profanityFilter: true,
                    model: 'phone_call',
                },
                audio: {
                    content: base64.fromByteArray(audioBuffer),
                },
            }),
        },
    );

    const result = await response.json();

    if (result.error) {
        throw result.error.message;
    } else {
        return result;
    }
}

async function googleTranslate(
    text: string,
    source: string,
    target: string,
    apiKey: string,
) {
    const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}&q=${text}&format=text&model=base&target=${target}&source=${source}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    const result = await response.json();

    if (result.error) {
        throw result.error.message;
    } else {
        return result;
    }
}

export default speechToText;
export {
    googleTranslate,
};
