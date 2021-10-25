export function bufferToHex(buffer: ArrayBuffer) { // buffer is an ArrayBuffer
    const hex: string[] = []
    new Uint8Array(buffer).forEach(x => hex.push(x.toString(16).padStart(2, '0')))
    return hex.join('');
}