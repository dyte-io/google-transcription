import DyteClient  from '@dytesdk/web-core';
import { defineCustomElements } from '@dytesdk/ui-kit/loader/index.es2017.js';

defineCustomElements();

const init = async () => {
    try {
        const roomName = 'ssriks-upmjmj';
        const { authToken } = await (
            await fetch('https://api.staging.dyte.in/auth/anonymous')
          ).json();

        const meeting = await DyteClient.init({
          authToken,
          roomName,
          apiBase: 'https://api.staging.dyte.in',
          defaults: {
            audio: false,
            video: false,
          },
        });
        console.log(meeting);
    
        (document.getElementById('my-meeting') as any).meeting = meeting;

    } catch (e) {
        console.log(e);
    }
    
};
init();
