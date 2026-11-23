(() => {
 if(new URLSearchParams(location.search).get('learn')!=='1')return;
 // Local teaching state only; all practice uses the existing app's consent and validation.
 document.body.classList.add('resident-learning','resident-only');
 const step=(title,text,target,actions=[],check=()=>true)=>({title,text,target,actions,check});
 const chapters=[
 {title:'להכיר דרך הפרופיל',icon:'users',start:()=>go('discover'),steps:[
 step('אדם אחד בכל פעם','התמונה והטקסט מספרים על אותו אדם. השם, הגיל והעיר מופיעים יחד. אין כאן הבטחה להתאמה. אפשר להכיר בקצב שלך.','.profile-heading'),
 step('עוד על אותו אדם','החץ שמשמאל מציג את החלק הבא של הפרופיל. ננסה ללחוץ עליו. הוא לא מחליף את האדם.','.deck-next, .nextpart',['stage'],()=>stage>0),
 step('לחזור לחלק הקודם','החץ שמימין מחזיר לחלק הקודם של אותו פרופיל. אפשר לקרוא שוב כמה שרוצים.','.prevpart',['stage']),
 step('לראות תמונה גדולה','לוחצים על „הגדל תמונה”. לחיצה נוספת על התמונה או על „חזור” מחזירה לפרופיל. אפשר גם ללחוץ חצי שנייה על התמונה.','[data-act=expandProfilePhoto]',['expandProfilePhoto']),
 step('לעבור לאדם אחר','כדי לראות אדם אחר לוחצים על „לדלג לאדם הבא”. האדם השני לא מקבל הודעת דחייה. בסוף המאגר אפשר לחזור לפרופילים שכבר ראית.','[data-act=nextPerson], [data-act=skipDecision]',['nextPerson','skipDecision'])]},
 {title:'הפרופיל שלי',icon:'user-round',start:()=>go('myProfile'),steps:[
 step('מה אחרים רואים עליי','כאן אפשר לראות את התמונה והפרטים שמופיעים בפרופיל שלך. מספר הטלפון והבחירה בעזרה בשיחה נשארים פרטיים.','.profile-heading'),
 step('אפשר לבקש שינוי','אפשר לעדכן תמונה, תחביבים או את „קצת עליי”. הצוות בודק את השינוי לפני הפרסום. אפשר למלא יחד עם העו״ס של הדירה.','[data-act=editSelf]',['editSelf'])]},
 {title:'לשלוח הודעת היכרות',icon:'message-circle',start:()=>go('discover'),steps:[
 step('הודעה למי שמעניין אותי','לוחצים על הכפתור עם שם האדם. תיפתח בחירה בין רעיונות להודעה לבין כתיבה במילים שלך. עדיין לא נשלח דבר.','[data-act=ask]',['ask','sendGreeting']),
 step('למצוא מה לכתוב','ההצעות מתחילות בתחביבים המשותפים. אפשר לבחור הצעה או לכתוב משפט משלך. קודם רואים את ההודעה ורק אחר כך מחליטים אם לשלוח.','[data-act=pickGreeting], [data-act=writeGreeting]',['pickGreeting','submit:greetingForm'],()=>!!$('greetingPreview')),
 step('לקרוא לפני השליחה','אפשר לערוך את ההודעה. רק „לשלוח בקשת היכרות” שולח אותה. אפשר גם לחזור בלי לשלוח. אפשר לפנות לעד 3 אנשים חדשים ביום; ההודעות בשיחות קיימות אינן מוגבלות.','[data-act=confirmGreeting]',['confirmGreeting'],()=>!$('greetingPreview'))]},
 {title:'לשלוח לייק',icon:'heart',start:()=>go('discover'),steps:[
 step('לייק בלי הודעה','לייק אומר שיש לך עניין להכיר. הוא מציג לצד השני את הפרופיל שלך, בלי טקסט. לוחצים על הלב כדי לקרוא ולאשר.','[data-act=likeProfile]',['likeProfile']),
 step('הבחירה נשארת שלך','רק אישור „לשלוח לייק” שולח אותו. מותר לחזור לפרופיל בלי לשלוח. גם לייק נספר כפנייה חדשה אחת. שיחה תיפתח רק בהסכמה של שניכם.','[data-act=confirmLike]',['confirmLike'],()=>!$('dialog').open||!$('dialogbody').querySelector('[data-act=confirmLike]'))]},
 {title:'בקשות שקיבלתי',icon:'heart-handshake',start:()=>go('requests'),steps:[
 step('מי רוצה להכיר אותי?','כאן מופיעות רק בקשות שקיבלת: לייק או הודעה. אפשר להיכנס לפרופיל של מי שפנה אליך, גם אם עוד לא ראית אותו קודם.','[data-act=senderProfile]',['senderProfile'],()=>page==='senderProfile'),
 step('לקרוא ואז לבחור','אפשר לדפדף בחיצים ולחזור לבקשה. מותר לקחת זמן לחשוב או לבחור לא להמשיך. אף אחד לא חייב להכיר.','[data-act=backToRequest]',['backToRequest']),
 step('להכיר ולענות','אם מתאים לך, אפשר לאשר ולענות. הודעת הפתיחה תישאר בתחילת השיחה. אפשר לבחור רעיון לתשובה או לכתוב, ולבדוק לפני השליחה.','[data-act=accept]',['accept'],()=>page==='chat')]},
 {title:'להמשיך שיחה',icon:'message-circle',start:()=>{chatId='ron';setUser('dana','chat')},steps:[
 step('קודם קוראים מה נכתב','זו שיחה לדוגמה. קוראים את ההודעה האחרונה ועונים למה שנשאל. לחיצה על התמונה הקטנה פותחת את הפרופיל, ואפשר לחזור לאותה שיחה.','[data-act=viewChatProfile]',['viewChatProfile']),
 step('עזרה רק כשצריך','בפתיחת הפרופיל בוחרים יחד עם העו״ס איך נוח לדבר. במסלול עם עזרה יש ליווי בשלוש שאלות ראשונות והצעות לתשובה. במסלול עצמאי יש רעיון לפתיחה. אין צורך להשתמש בהצעה.','[data-act=backToChat]',['backToChat']),
 step('התשובה היא שלך','חושבים על מה שהצד השני כתב ועל משהו משותף. אפשר לכתוב במשפט קצר. הצעה של האפליקציה לא נשלחת לבד. בשיחה שכבר נפתחה אפשר להמשיך להתכתב ללא מכסה יומית.','#msg',['submit:chatform','confirmReply'],()=>chat()?.msg.some(m=>m.from===user))]},
 {title:'לבקש עזרה מהצוות',icon:'circle-help',start:()=>{returnPage=page;go('help')},steps:[
 step('עזרה בלי לעצור שיחה','אפשר לבקש עזרה בהבנת הודעה או בבחירה מה לעשות. בוחרים במה צריך עזרה ואיך נוח שהצוות יחזור אליך. הודעות השיחה לא נשלחות לצוות.','#helpRequestForm'),
 step('לראות שהבקשה התקבלה','רק לחיצה על „לשלוח בקשת עזרה” יוצרת בקשה. אחריה אפשר לראות מי מטפל ומה המצב. בקשת עזרה לא מקפיאה את השיחה.','[data-act=callback]',['callback'],()=>db.events.some(e=>e.kind==='callback'&&e.id===user))]},
 {title:'לדווח על משהו לא נעים',icon:'flag',start:()=>enterStation('report'),steps:[
 step('תרגול בשיחה לדוגמה','כאן מתרגלים דיווח עם דמויות לדוגמה. בוחרים מה קרה. פתיחת המסך ובחירת סיבה עדיין לא שולחות דיווח.','[data-act=reason]',['reason'],()=>!!reportReason),
 step('דיווח עוצר את השיחה','רק שליחת הדיווח עוצרת מיד את השיחה לבדיקה. הצוות רואה את הסיבה. הצד השני רואה הודעה כללית ולא את זהות הפונה. אפשר לחזור בלי לשלוח.','[data-act=sendReport]',['sendReport'],()=>!!chat()?.onHold),
 step('הצוות יבדוק ויחזור','הדיווח ומצב הטיפול יופיעו גם בעדכונים מהצוות. השיחה לא נפתחת לבד כשהבדיקה מסתיימת. אם תוצע חזרה, הבחירה תהיה שלך.','[data-act=mySafetyUpdate]')]},
 {title:'לסיים ולחסום קשר',icon:'shield-check',start:()=>enterStation('block'),steps:[
 step('תרגול חסימה','בחסימה השיחה מסתיימת. לא תוכלו לשלוח זה לזה הודעות או בקשות, ולא תראו שוב זה את זה בפרופילים. חסימה בפני עצמה אינה דיווח לצוות.','[data-act=confirmBlock]'),
 step('אישור או חזרה','לוחצים „לסיים ולחסום” רק אם זה מה שרוצים. אפשר לחזור בלי לחסום. אחרי חסימה אפשר לעבור לשיחות האחרות.','[data-act=confirmBlock]',['confirmBlock'],()=>!!chat()?.blocker)]},
 {title:'להחליף מספרי טלפון',icon:'phone',start:()=>enterStation('phone'),steps:[
 step('שיתוף רק בהסכמה','זו שיחה לדוגמה. אפשר לבקש החלפת מספרים רק כשהקשר פתוח. המספרים נשארים מוסתרים עד ששניכם מסכימים.','[data-act=consent]'),
 step('מותר גם לא לשתף','אפשר לשלוח בקשה או לחזור לשיחה בלי לשתף. האישור שלך לבדו לא חושף את המספרים. אין צורך למהר.','[data-act=consent]',['consent'],()=>chat()?.consent.includes(user)),
 step('לפני שנפגשים','אם שני הצדדים אישרו, כל אחד רואה את המספר של האחר. הצוות רואה שהיה שיתוף, בלי המספרים עצמם. לפני פגישה מספרים לצוות.','[data-act=close]')]},
 {title:'לבקש שיחת הכנה לפגישה',icon:'users',start:()=>enterStation('meeting'),steps:[
 step('מתכוננים ביחד','זו בקשת פגישה לדוגמה. קוראים את כללי הבטיחות. אפשר לבקש ליווי. מספרים לצוות לפני שקובעים מקום ומועד.','.meeting-tips'),
 step('בקשה אינה פגישה שנקבעה','מסמנים שסיפרת לצוות רק אחרי שעשית זאת. בתרגול אפשר לדמות את האישור. „לשלוח בקשה לשיחת הכנה” מעדכן את הצוות; הוא לא קובע פגישה.','#toldStaff',['sendMeeting'],()=>!!pairEvent('meeting',chat())),
 step('אפשר לשנות את ההחלטה','רואים מי המלווה ומה השלב הבא. כל עוד הבקשה ממתינה אפשר לבטל אותה. תכנון מפגש נפתח רק אם שני הדיירים רוצים להתקדם.','[data-act=withdrawMeeting]')]}
 ];
 let chapter=-1,index=0,practicing=false,returnFocus=null;
 const tried=new Set(),read=new Set();
 const panel=document.createElement('dialog');panel.id='learning-dialog';panel.setAttribute('aria-labelledby','learning-title');document.body.append(panel);
 const dock=document.createElement('button');dock.id='learning-dock';dock.type='button';dock.textContent='הדרכה';document.querySelector('.mast-in').append(dock);
 const key=()=>chapter+':'+index;
 const control=(text,action,primary=false)=>'<button type="button" class="btn '+(primary?'primary':'')+'" data-learn="'+action+'">'+esc(text)+'</button>';
 function clearHighlight(){document.querySelectorAll('.learning-target').forEach(el=>el.classList.remove('learning-target'))}
 function close(){stopVoice();panel.close();returnFocus?.isConnected&&returnFocus.focus({preventScroll:true})}
 function show(html){clearHighlight();returnFocus=document.activeElement;panel.innerHTML=html;panel.showModal();panel.scrollTop=0;panel.querySelector('h1,h2')?.focus({preventScroll:true})}
 function menu(){practicing=false;dock.textContent='הדרכה';show('<div class="learning-top"><h1 id="learning-title" tabindex="-1">לומדים להכיר</h1><button data-learn="exit" aria-label="סגירת ההדרכה">×</button></div><p>אפשר ללמוד צעד אחר צעד, או לבחור נושא.</p><p class="helptext">זהו תרגול עם דמויות לדוגמה. שום הודעה או בקשה לא נשלחת לאדם אמיתי.</p>'+control(chapter<0?'מתחילים עם הפרופיל':'להמשיך מאיפה שעצרתי',chapter<0?'chapter:0':'resume',true)+'<div class="learning-chapters">'+chapters.map((c,i)=>'<button data-learn="chapter:'+i+'">'+icon(c.icon)+'<span>'+esc(c.title)+'</span>'+(c.steps.every((_,j)=>read.has(i+':'+j))?'<span class="learning-read">נקרא</span>':'')+'</button>').join('')+'</div>'+control('להתנסות לבד','exit'))}
 function instruction(){
 practicing=false;const c=chapters[chapter],s=c.steps[index];read.add(key());dock.textContent='הדרכה';
 show('<div class="learning-top"><span>'+esc(c.title)+'</span><button data-learn="exit" aria-label="סגירת ההדרכה">×</button></div><p class="learning-count">שלב '+(index+1)+' מתוך '+c.steps.length+'</p><h2 id="learning-title" tabindex="-1">'+esc(s.title)+'</h2><p id="learning-text">'+esc(s.text)+'</p>'+ (tried.has(key())?'<p class="learning-done" role="status">הפעולה נוסתה במוקאפ</p>':'')+'<button class="quiet" data-learn="listen">'+icon('volume2')+'להקשיב להסבר</button>'+control('לנסות במסך','try',true)+'<div class="learning-navigation">'+(index?control('הסבר קודם','previous'):'')+control(index===c.steps.length-1?'סיום הנושא':'הסבר הבא','next')+'</div>'+control('לכל נושאי ההדרכה','menu'));
 }
 function practice(){close();practicing=true;dialogHelp();dock.textContent='חזרה להסבר';const s=chapters[chapter].steps[index];document.querySelectorAll(s.target).forEach(el=>el.classList.add('learning-target'));const target=document.querySelector(s.target);if(target&&!$('dialog').open)target.focus?.({preventScroll:true});else if(!target)notify('אפשר להמשיך מהמצב הנוכחי או לחזור להסבר בכפתור ההדרכה')}
 function observe(action){if(!practicing||chapter<0)return;const s=chapters[chapter].steps[index];if(s.actions.includes(action)&&s.check()){tried.add(key());dock.textContent='הדרכה · השלב הבא';clearHighlight()}}
 dock.onclick=()=>chapter<0?menu():(tried.has(key())&&index<chapters[chapter].steps.length-1?(index++,instruction()):instruction());
 panel.addEventListener('click',e=>{const a=e.target.closest('[data-learn]')?.dataset.learn;if(!a)return;
 if(a.startsWith('chapter:')){close();clearHighlight();chapter=Number(a.split(':')[1]);index=0;chapters[chapter].start();instruction();return}
 if(a==='exit'){practicing=false;clearHighlight();close();dock.textContent='הדרכה';return}
 if(a==='listen'){speak(chapters[chapter].steps[index].text);return}
 if(a==='try'){practice();return}
 if(a==='previous')index--;if(a==='next'){if(index===chapters[chapter].steps.length-1){menu();return}index++}
 if(a==='menu'){menu();return}instruction();
 });
 panel.addEventListener('cancel',()=>{practicing=false;clearHighlight();stopVoice();dock.textContent='הדרכה'});
 // Listen after the app has handled an action; never send or confirm on the learner's behalf.
 document.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a)setTimeout(()=>observe(a),0)});
 function dialogHelp(){
  const body=$('dialogbody');
  if(!practicing||!$('dialog').open||body.querySelector('.photo-viewer, [data-learning-help]'))return;
  const help=document.createElement('button');help.type='button';help.className='quiet';help.dataset.learningHelp='';help.textContent='חזרה להסבר בהדרכה';help.onclick=instruction;body.append(help);
 }
 new MutationObserver(dialogHelp).observe($('dialog'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('submit',e=>{const id=e.target.id;setTimeout(()=>observe('submit:'+id),0)});
 document.addEventListener('click',e=>{if(e.target.closest('[data-act=startGuide]')){e.preventDefault();e.stopImmediatePropagation();menu()}},true);
 window.addEventListener('hashchange',()=>document.body.classList.add('resident-only'));
 menu();
})();
