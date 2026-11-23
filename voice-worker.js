// A fresh CLI instance per phrase keeps the embedded voice dictionary immutable.
import createEngine from './vendor/espeak-ng/espeak-ng.js';
const binary = fetch(new URL('./vendor/espeak-ng/espeak-ng.wasm', import.meta.url))
  .then(response => {
    if (!response.ok) throw new Error('Voice engine unavailable');
    return response.arrayBuffer();
  });
self.onmessage = async ({data: {id, text}}) => {
  try {
    const engine = await createEngine({
      wasmBinary: await binary,
      arguments: ['-v', 'he', '-s', '145', '-w', 'phrase.wav', '--', text],
    });
    const wave = engine.FS.readFile('phrase.wav');
    if (wave.length < 44) throw new Error('Empty speech');
    self.postMessage({id, wave}, [wave.buffer]);
  } catch {
    self.postMessage({id, error: true});
  }
};
