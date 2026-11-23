// A fresh CLI instance per phrase keeps the embedded voice dictionary immutable.
import createEngine from './vendor/espeak-ng/espeak-ng.js';
async function loadEngine(){
  const compressed=typeof DecompressionStream==='function';
  const filename='espeak-ng.wasm'+(compressed?'.gz':'');
  const response=await fetch(new URL('./vendor/espeak-ng/'+filename,import.meta.url));
  if(!response.ok)throw new Error('Voice engine unavailable');
  if(!compressed)return response.arrayBuffer();
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
const binary=loadEngine();
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
