<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://dyte.io">
    <img src="https://dyte-uploads.s3.ap-south-1.amazonaws.com/dyte-logo-dark.svg" alt="Logo" width="80">
  </a>
  <h2 align="center">Google Transcriptions by Dyte</h3>
  <p align="center">
    <br />
    <a href="https://docs.dyte.io"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/dyte-in/plugin-sdk/issues">Report Bug</a>
    •
    <a href="https://github.com/dyte-in/plugin-sdk/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
## Table of Contents
- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  <!-- - [Quickstart](#quickstart) -->
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## About The Project
This package provides audio transcriptions in various [languages](https://cloud.google.com/translate/media/docs/languages).
### Built With
- [Dyte](https://dyte.io/)
- [Typescript](https://typescriptlang.org/)

<!-- GETTING STARTED -->
## Getting Started
### Prerequisites
- npm
### Installation
```sh
npm i @dytesdk/google-transcription
```

<!-- USAGE EXAMPLES -->
## Usage
A speech object can be created using `GoogleSpeechRecognition` class.
```ts
import GoogleSpeechRecognition, { TranscriptionData } from '@dytesdk/google-transcription';

const speech = new GoogleSpeechRecognition({
    meeting,
    target: 'th',
    source: 'en-US',
    baseUrl: <backend-url>,
});


speech.on('transcription', async (data) => {
    // ... do something with transcription
});

speech.transcribe();

```

## Contributing
We really appreciate contributions in the form of bug reports and feature suggestions. Help us make Dyte better with your valuable contributions on our [forum]('https://discord.com/invite/pxRcdNufvk') 🙂.

## License
All rights reserved. © Dyte Inc.
