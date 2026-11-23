"""Exercise the device recognition API contract, including cancel and a late result."""
import os,sys
from playwright.sync_api import sync_playwright
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8943'
with sync_playwright() as w:
 b=w.chromium.launch(channel=os.getenv('CHROME_CHANNEL') or None)
 p=b.new_page(viewport={'width':320,'height':693})
 p.add_init_script("""class TestRecognition{
  get processLocally(){return true} set processLocally(v){window.requestedLocal=v}
  static async available(opts){return opts.processLocally&&opts.langs[0]==='he-IL'?'available':'unavailable'}
  start(){window.testMic=this}stop(){this.onend?.()}abort(){this.onend?.()}
 };window.SpeechRecognition=TestRecognition""")
 p.goto(base+'/app.html#yael-chat')
 form=p.locator('#roundForm');form.wait_for()
 before=p.evaluate('chat().msg.length')
 form.locator('[data-act=dictate]').click();p.locator('[data-mic=record]').click()
 assert p.evaluate("requestedLocal&&testMic.lang==='he-IL'")
 p.locator('[data-mic=close]').click()
 p.evaluate("testMic.onresult({results:[[{transcript:'לא להוסיף'}]]})")
 assert not form.locator('textarea').input_value()
 form.locator('[data-act=dictate]').click();p.locator('[data-mic=record]').click()
 p.evaluate("testMic.onresult({results:[[{transcript:'כן, איזה שיר שמעת?'}]]})")
 assert form.locator('textarea').input_value()=='כן, איזה שיר שמעת?'
 form.locator('[type=submit]').click();assert p.locator('#roundPreview').inner_text()=='כן, איזה שיר שמעת?'
 assert p.evaluate('chat().msg.length')==before
 p.locator('[data-act=commitRound]').click()
 assert p.evaluate('chat().msg.at(-1).text')=='כן, איזה שיר שמעת?'
 p.evaluate("enterMixedDemo('noam')")
 assert 'כן, איזה שיר שמעת?' in p.locator('#thread').inner_text()
 print('Passed assisted dictation, cancellation, preview and peer delivery (simulated device API)')
 b.close()
