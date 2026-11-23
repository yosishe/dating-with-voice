// Device-local playback shared by individual listen buttons and page narration.
const offlineHebrew = (() => {
  let worker, counter=0, audio, url;
  function cancel(){
    counter++;
    if(audio){audio.pause();audio.onended=null;audio=null}
    if(url){URL.revokeObjectURL(url);url=null}
  }
  function say(text,speed,ended,failed){
    cancel();
    const id=counter;
    try {
      worker ??= new Worker('./voice-worker.js',{type:'module'});
      worker.onerror=()=>{worker?.terminate();worker=null;if(id===counter)failed()};
      worker.onmessage=({data})=>{
        if(data.id!==counter)return;
        if(data.error){failed();return}
        url=URL.createObjectURL(new Blob([data.wave],{type:'audio/wav'}));
        audio=new Audio(url);audio.playbackRate=speed;
        audio.onended=()=>{if(counter===id){cancel();ended()}};
        audio.onerror=()=>{if(counter===id)failed()};
        audio.play().catch(()=>{if(counter===id)failed()});
      };
      worker.postMessage({id,text});
    } catch { failed() }
  }
  return {say,cancel};
})();
