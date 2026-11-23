"""Run against a local server or a public Pages URL: python tests/voice_journey.py BASE_URL"""
import sys, os
from playwright.sync_api import sync_playwright
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8943'
with sync_playwright() as w:
 for engine in ['chromium','webkit']:
  if engine=='chromium':
   browser=w.chromium.launch(channel=os.getenv('CHROME_CHANNEL') or None)
  else:
   browser=w.webkit.launch(executable_path=os.getenv('WEBKIT_EXECUTABLE') or None)
  p=browser.new_page(viewport={'width':390,'height':844});p.set_default_timeout(60000)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(base+'/');ui=p.frame_locator('iframe');ui.locator('[data-act=voiceEverywhere]').wait_for()
  f=p.frames[1]
  f.evaluate("if(window.speechSynthesis)Object.defineProperty(Object.getPrototypeOf(speechSynthesis),'getVoices',{configurable:true,value:()=>[]});true")
  # Observe decoded audio without substituting fake speech or audio files.
  f.evaluate("""window.played=[];const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){played.push(this);return originalPlay.call(this)};true""")
  ui.locator('[data-act=voiceEverywhere]').click()
  f.wait_for_function("played.some(a=>a.currentTime>0)")
  ui.locator('#screen [data-act=go][data-v=discover]').click()
  old=f.evaluate('browseId')
  ui.locator('.deck-foot [data-act=profileDecision]').click()
  ui.locator('#dialogbody [data-act=skipDecision]').wait_for()
  f.wait_for_function("document.querySelector('#dialogbody .reader-current')")
  ui.get_by_role('button',name='להישאר בפרופיל הזה').click()
  assert f.evaluate('browseId')==old
  ui.locator('.deck-foot [data-act=profileDecision]').click()
  ui.locator('[data-act=skipDecision]').click()
  assert f.evaluate('browseId')!=old
  # An unsent dictated greeting survives listen/edit before preview.
  ui.locator('[data-act=ask]').click();ui.locator('[data-act=writeGreeting]').click()
  ui.locator('[data-greeting-mic]').click();ui.locator('[data-mic=sample]').click()
  assert ui.locator('#greetingForm textarea').input_value()
  ui.locator('#greetingForm [type=submit]').click();assert ui.locator('#greetingPreview').inner_text()
  f.evaluate("chatId='ron';setUser('dana','chat')")
  count=f.evaluate('chat().msg.length')
  ui.locator('#msg').fill('היי רון.')
  ui.locator('[data-act=dictate]').click();ui.locator('[data-mic=sample]').click()
  assert f.evaluate('chat().msg.length')==count
  ui.locator('#chatform [type=submit]').click();assert 'תודה שכתבת' in ui.locator('#replyPreview').inner_text()
  ui.locator('[data-act=editReply]').click();ui.locator('#msg').fill('היום ראיתי פרפר סגול בגינה הקטנה שלי.')
  ui.locator('#chatform [type=submit]').click()
  # Explicitly exercise the self-hosted fallback on arbitrary text.
  f.evaluate('window.priorPlays=played.length')
  ui.locator('#dialogbody [data-act=listen]').click()
  f.wait_for_function("played.slice(priorPlays).some(a=>a.src.startsWith('blob:')&&a.currentTime>0)",timeout=90000)
  ui.locator('[data-act=confirmReply]').click()
  assert f.evaluate('chat().msg.length')==count+1
  assert f.evaluate('chat().msg.at(-1).text')=='היום ראיתי פרפר סגול בגינה הקטנה שלי.'
  assert not errors,errors
  assert f.evaluate("document.documentElement.scrollWidth<=innerWidth")
  print(engine,'passed',flush=True);browser.close()
