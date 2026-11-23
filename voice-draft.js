// The underlying form stays mounted while the resident dictates or tries a sample.
(() => {
  const dialog=document.createElement('dialog');
  dialog.id='voice-draft';dialog.className='reader-panel';dialog.setAttribute('aria-labelledby','voice-draft-title');
  document.body.append(dialog);
  let target, identity, revision=0, engine=null;
  function closeMic(){
    if(recognizer){const old=recognizer;recognizer=null;old.abort()}
  }
  function valid(){
    return dialog.open&&target?.isConnected&&role==='resident'&&identity===user+'|'+page+'|'+chatId;
  }
  function finish(text){
    if(!valid()){dialog.close();return}
    const value=[target.value.trim(),text.trim()].filter(Boolean).join(' ');
    if(target.maxLength>=0&&value.length>target.maxLength){show('הטקסט ארוך מדי. אפשר להכתיב משפט קצר יותר.');return}
    target.value=value;target.dispatchEvent(new Event('input',{bubbles:true}));
    dialog.close();target.focus();target.setSelectionRange(value.length,value.length);
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&dialog.open){closeMic();dialog.close()}
  });
  function show(status=''){
    dialog.innerHTML='<h2 id="voice-draft-title">להכתיב טיוטה</h2><p>אפשר לומר משפט. המילים יופיעו בשדה ואפשר יהיה לתקן אותן.</p>'+
      (status?'<p role="status">'+esc(status)+'</p>':'')+
      (engine?'<button class="btn primary" data-mic="record">להתחיל הכתבה במכשיר</button>':'<p>אפשר לתרגל עם משפט לדוגמה או להשתמש במיקרופון של המקלדת בשדה הכתיבה.</p>')+
      '<button class="btn" data-mic="sample">לתרגל עם משפט לדוגמה</button><button class="quiet" data-mic="close">חזרה לכתיבה</button>';
  }
  window.voiceDraft=async field=>{
    if(!field||field.disabled||field.readOnly||role!=='resident')return;
    target=field;identity=user+'|'+page+'|'+chatId;engine=null;const ticket=++revision;
    stopVoice();show();dialog.showModal();
    const candidate=await localDictation();
    if(candidate&&valid()&&ticket===revision){engine=candidate;show()}
  };
  dialog.addEventListener('close',()=>{revision++;closeMic();target?.focus({preventScroll:true})});
  dialog.addEventListener('click',e=>{
    const action=e.target.closest('[data-mic]')?.dataset.mic;
    if(!action)return;
    if(!valid()||action==='close'){dialog.close();return}
    if(action==='sample'){
      const greeting=!!target.closest('#greetingForm');
      finish(greeting?'היי, ראיתי את הפרופיל שלך. מה כיף לך לעשות בסוף השבוע?':'תודה שכתבת לי. מה כיף לך לעשות בסוף השבוע?');return
    }
    if(action==='stop'){recognizer?.stop();return}
    if(action!=='record'||!engine||recognizer)return;
    try{
      stopVoice();
      const mic=recognizer=new engine();
      mic.lang='he-IL';mic.processLocally=true;mic.interimResults=false;
      mic.onresult=event=>{if(recognizer===mic&&valid()){recognizer=null;finish(event.results[0][0].transcript)}};
      mic.onerror=()=>{if(recognizer===mic){recognizer=null;show('לא התקבל טקסט. אפשר לנסות שוב.')}};
      mic.onend=()=>{if(recognizer===mic){recognizer=null;show('ההכתבה הסתיימה. אפשר לנסות שוב.')}};
      mic.start();dialog.innerHTML='<h2 id="voice-draft-title">המיקרופון פתוח</h2><p>אפשר לומר משפט אחד.</p><button class="btn primary" data-mic="stop">לסיים הכתבה</button><button class="quiet" data-mic="close">לבטל ולחזור לכתיבה</button>';
    }catch{recognizer=null;show('המיקרופון אינו זמין כרגע.')}
  });
  function sync(){
    if(dialog.open&&!valid())dialog.close();
    const field=document.querySelector('#greetingForm textarea');
    if(!field||field.form.querySelector('[data-greeting-mic]'))return;
    const button=document.createElement('button');button.type='button';button.className='quiet';button.dataset.greetingMic='';button.textContent='להכתיב הודעת היכרות';button.onclick=()=>window.voiceDraft(field);
    field.closest('label').after(button);
  }
  for(const el of [$('dialogbody'),$('screen')])new MutationObserver(sync).observe(el,{subtree:true,childList:true});
})();
