/* eslint-disable no-plusplus */
import log from 'loglevel';
import emitter from './emitter';

function convertFloat32ToInt16(buffer: Buffer) {
    let l = buffer.length;
    const buf = new Int16Array(l / 3);

    while (l--) {
        if (l % 3 === 0) {
            buf[l / 3] = buffer[l] * 0xFFFF;
        }
    }
    return buf.buffer;
}

function microphoneProcess(e: any) {
    const left = e.inputBuffer.getChannelData(0);
    const left16 = convertFloat32ToInt16(left);
    log.info(left16);
    emitter().emit('binaryAudioData', left16);
}

const float32ToInt16 = (f: number) => {
    const multiplier = f < 0 ? 0x8000 : 0x7fff; // 16-bit signed range is -32768 to 32767
    return f * multiplier;
};

const combineBuffers = (a: ArrayBuffer, b: ArrayBuffer) => {
    const result = new Uint8Array(a.byteLength + b.byteLength);
    result.set(new Uint8Array(a), 0);
    result.set(new Uint8Array(b), a.byteLength);
    return result;
};

export default microphoneProcess;

export {
    float32ToInt16,
    combineBuffers,
};
