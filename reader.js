(() => {
  const screen = $('screen');
  const preferences = new Map();
  const prefs = () => {
    const key=role==='resident'?user:role+'|'+worker;
    if (!preferences.has(key)) preferences.set(key, {automatic:false, privateAudio:false, speed:1});
    return preferences.get(key);
  };
  const dock = document.createElement('div');
  dock.className = 'reader-dock';
  dock.innerHTML = '<button type="button" class="reader-play">'+icon('volume2')+'<span>להקשיב למסך</span></button><button type="button" class="reader-settings" aria-label="אפשרויות הקראה">'+'⚙'+'</button>';
  const host = document.querySelector('.mast-in');
  const settings = document.createElement('dialog');
  settings.className='reader-panel';settings.setAttribute('aria-labelledby','reader-heading');
  settings.innerHTML='<h2 id="reader-heading">איך נוח לי להקשיב?</h2><label><input type="checkbox"> להקריא מסכי הדרכה ופרופילים במעבר לעמוד חדש</label><label><input type="checkbox" name="privateAudio"> להקריא גם מסכים אישיים בקול במעבר ביניהם</label><p>זה כולל הודעות, בקשות ומספרים שכבר בחרתם לשתף. מי שנמצא לידך יוכל לשמוע.</p><label>מהירות ההקראה <select><option value="1">רגילה</option><option value=".82">איטית</option><option value=".68">איטית מאוד</option></select></label><button type="button" class="btn primary">חזרה למסך</button>';
  document.body.append(settings);
  let sequence=0, audio=null, active=false, paused=false, parts=[], position=0, current=null, previousKey='', previousContent=null, previousUser=user;
  function stop() {
    sequence++;active=false;paused=false;offlineHebrew.cancel();
    if(audio){audio.pause();audio=null}
    if('speechSynthesis' in window) speechSynthesis.cancel();
    current?.classList.remove('reader-current');current=null;
    dock.querySelector('span').textContent='להקשיב למסך';
  }
  function surface(){
    if(settings.open)return settings;
    if($('voice-draft')?.open)return $('voice-draft');
    const lesson=$('learning-dialog');
    if(lesson?.open)return lesson;
    if($('dialog').open)return $('dialogbody');
    return screen;
  }
  // Traverse visible content once. Keep each sentence attached to its original element.
  function collect(root) {
    const result=[];
    const spoken=new Set();
    function add(el,text) {
      for(const sentence of text.replace(/\s+/gu,' ').trim().split(/(?<=[.!?])\s+/u)){
        if(sentence&&sentence!==result.at(-1)?.text)result.push({el,text:sentence});
      }
    }
    function visit(el){
      if(spoken.has(el))return;
      if(!el.getClientRects().length||el.matches('.reader-dock,[aria-hidden=true],svg,script,style,progress,[data-act=listen],.reader-current-ignore')||getComputedStyle(el).visibility==='hidden')return;
      spoken.add(el);
      if(el.matches('details:not([open])')){const summary=el.querySelector('summary');if(summary)visit(summary);return}
      if(el.matches('input,textarea,select')){
        if(el.matches('[type=password],[autocomplete=one-time-code],[type=tel]')||page==='code'||page==='login')return;
        const value=el.matches('select')?el.selectedOptions[0]?.textContent:el.matches('[type=radio],[type=checkbox]')?(el.checked?'מסומן':'לא מסומן'):el.value||el.placeholder;
        if(value)add(el,value);return;
      }
      if(el.matches('button,a,summary,img,.bubble,.profile-meta')){
        const label=el.matches('.chapter-open')?el.textContent.split('·').at(-1).trim():el.matches('.bubble')?el.querySelector('small')?.textContent.split('·')[0].trim()+'. '+el.querySelector('span')?.textContent:el.getAttribute('aria-label')||el.innerText||el.alt||'';
        add(el,label+(el.disabled?' · לא זמין':''));return;
      }
      if(el.matches('p,h1,h2,h3,h4,li')&&!el.querySelector('button,input,textarea,select,a')){add(el,el.innerText);return}
      for(const child of el.childNodes){
        if(child.nodeType===Node.TEXT_NODE)add(el,child.textContent);
        else if(child.nodeType===Node.ELEMENT_NODE)visit(child);
      }
    }
    if(root===screen&&root.querySelector('.paged-deck')){
      const deck=root.querySelector('.paged-deck');
      for(const selector of ['.profile-meta','.profile-title-row h1','.body>p','.body>.notice','.visual img','.deck-count','.visual button','.profile-heading button','.profile-title-row button','.review-notice','.opening-quota','.deck-foot'])deck.querySelectorAll(selector).forEach(visit);
      // Return paths and actions outside the profile card remain available.
      for(const child of root.querySelectorAll('button'))if(!deck.contains(child))visit(child);
      visit(root);
    }else {
      const title=root.querySelector('h1,h2');if(title)visit(title);
      // Lead with the choice and its consequences before the universal close control.
      const body=root.querySelector(':scope > .stack');
      if(root===$('dialogbody')&&body)visit(body);
      visit(root);
    }
    if(root===screen)visit($('nav'));
    if(root===screen&&page==='discover'&&stage===0&&root.querySelector('.paged-deck')){
      const target=root.querySelector('.profile-title');
      result.splice(1,0,{el:target,text:'החץ השמאלי מספר עוד על אותו אדם. כדי לראות אדם אחר, בוחרים לדלג לאדם הבא.'});
    }
    if(root===screen&&page==='chat'){
      const heading=root.querySelector('h1');
      if(heading)result.unshift({el:heading,text:'שיחה עם '+titleOf(chatId)+'.'});
    }
    if(root===screen&&$('toast').textContent)add($('toast'),$('toast').textContent);
    return result;
  }
  function play(){
    if(!active)return;
    current?.classList.remove('reader-current');
    if(position>=parts.length){stop();return}
    const {el,text}=parts[position];current=el;el.classList.add('reader-current');
    const ticket=sequence;
    const next=()=>{if(active&&sequence===ticket){position++;play()}};
    const fail=()=>{
      if(sequence!==ticket)return;
      stop();
      const message='הקול לא הופעל. בדקו את עוצמת הקול ולחצו שוב על הרמקול.';
      if(surface()===screen){notify(message);return}
      const note=document.createElement('p');note.className='reader-error';note.setAttribute('role','status');note.textContent=message;
      surface().querySelector('.reader-error')?.remove();dock.before(note);
    };
    const clip=audioClips[text];
    if(clip){audio=new Audio(clip);audio.playbackRate=prefs().speed;audio.onended=next;audio.onerror=fail;audio.play().catch(fail);return}
    const voice=window.speechSynthesis?.getVoices().find(v=>v.localService&&/^he(?:-|_|$)/i.test(v.lang));
    const fallback=()=>{if(sequence===ticket)offlineHebrew.say(text,prefs().speed,next,fail)};
    if(!voice){fallback();return}
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang='he-IL';utterance.rate=.9*prefs().speed;utterance.onend=next;utterance.onerror=e=>{if(!['canceled','interrupted'].includes(e.error))fallback()};speechSynthesis.speak(utterance);
  }
  function start(){
    stopVoice();stop();parts=collect(surface());position=0;active=true;dock.querySelector('span').textContent='לעצור הקראה';play();
  }
  dock.querySelector('.reader-play').onclick=()=>{
    if(active){stop();paused=true;dock.querySelector('span').textContent='להמשיך להקשיב';return}
    if(paused){paused=false;active=true;dock.querySelector('span').textContent='לעצור הקראה';play();return}
    start();
  };
  dock.querySelector('.reader-settings').onclick=()=>{
    stop();settings.querySelector('input').checked=prefs().automatic;
    settings.querySelector('[name=privateAudio]').checked=prefs().privateAudio;
    settings.querySelector('select').value=String(prefs().speed).replace(/^0\./,'.');
    settings.showModal();sync();
  };
  settings.querySelector('input').onchange=e=>prefs().automatic=e.target.checked;
  settings.querySelector('[name=privateAudio]').onchange=e=>prefs().privateAudio=e.target.checked;
  settings.querySelector('select').onchange=e=>prefs().speed=Number(e.target.value);
  settings.querySelector('.btn').onclick=()=>settings.close();
  settings.addEventListener('close',()=>{sync();dock.querySelector('.reader-settings').focus()});
  function sync(){
    const root=surface(),photo=!!root.querySelector('.photo-viewer'),enabled=!photo&&!recognizer;
    const target=root===screen?host:root;
    dock.hidden=!enabled;dock.querySelector('.reader-settings').hidden=settings.open;
    if(target!==dock.parentElement)target.append(dock);
    const key=[user,role,page,root.id||root.className,root===screen?'':root.querySelector('h1,h2')?.textContent,browseId,stage,chatId,requestPage,chatProfilePage,ownStage,guideIndex,interview,root.querySelector('.deck-count')?.textContent].join('|');
    const content=root===screen?screen.firstElementChild:root.firstElementChild;
    if(key===previousKey&&content===previousContent)return;
    const changedPage=key!==previousKey;
    const changedPerson=previousUser!==user;previousUser=user;
    previousKey=key;previousContent=content;stop();
    const decision=page==='discover'&&!!root.querySelector('[data-act=skipDecision]');
    const general=decision||root===$('learning-dialog')||(root===screen&&['discover','guide','service','welcome','contract'].includes(page));
    if(photo&&changedPage&&role==='resident'&&prefs().automatic&&!document.hidden){
      speak('התמונה מוגדלת. כדי לחזור לפרופיל לוחצים בכל מקום.');return;
    }
    const autorun=role==='resident'&&(general?prefs().automatic:prefs().privateAudio);
    if(changedPage&&!changedPerson&&enabled&&autorun&&root!==settings&&!recognizer&&!document.hidden)start();
  }
  const watch=new MutationObserver(sync);
  for(const container of [screen,$('dialog'),$('learning-dialog'),$('voice-draft'),settings].filter(Boolean))watch.observe(container,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  // Stop private content before navigation or typing. The original app owns all actions.
  document.addEventListener('click',e=>{if((active||paused)&&!dock.contains(e.target))stop()},true);
  document.addEventListener('input',()=>{if(active||paused)stop()},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  window.addEventListener('pagehide',stop);
  window.speechSynthesis?.getVoices();
  sync();
  if(new URLSearchParams(location.search).has('voice')&&role==='resident'){
    const explanation='אפשר להקשיב לכל מסך, להכתיב תשובה ולשמוע אותה לפני השליחה. בהקראה אוטומטית יישמעו גם הודעות ופרטים אישיים. מי שנמצא לידך יוכל לשמוע.';
    modal('איך נוח לי להשתמש בקול?', '<p>'+explanation+'</p>'+quiet('לשמוע את ההסבר','listen',explanation,'volume2')+btn('להפעיל הקראה בכל המסכים','voiceEverywhere','','primary','volume2')+quiet('להקשיב רק בלחיצה','close'));
    const startButton=$('dialogbody').querySelector('[data-act=voiceEverywhere]');
    startButton.onclick=()=>{prefs().automatic=true;prefs().privateAudio=true;closeDialog();};
  }
})();
