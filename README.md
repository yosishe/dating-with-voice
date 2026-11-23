# Dating with Voice · בואו נכיר

[פתיחת המוקאפ](https://yosishe.github.io/dating-with-voice/) · [הדרכה לדיירים](https://yosishe.github.io/dating-with-voice/learn.html)

מוקאפ אינטראקטיבי בעברית לדיירים בגירים, עם דפדוף בפרופילים, בקשות היכרות, שיחות וליווי צוות. כל הדמויות והאירועים הם דוגמאות. מצב ההדגמה נשמר בזיכרון הדף ומתאפס ברענון. אין חשבונות אמיתיים, שרת אפליקטיבי, שירות AI חיצוני או שליחת הודעות ו־SMS.

בכניסה בוחרים הקראה בכל מעבר (כולל מסכים אישיים) או לפי לחיצה. אפשר לשנות את הקצב ואת הבחירה בגלגל השיניים. בהגדלת תמונה נשמר כפתור החזרה. קודי כניסה וערכי שדות סיסמה אינם מוקראים. ההקראה אינה בוחרת פעולות בשביל המשתמש.

בשיחה אפשר להקשיב להודעה, לכתוב או להכתיב, לשמוע את הטיוטה ולתקן לפני שליחה. הכתבה במיקרופון זמינה רק בדפדפן שמדווח על תמיכה מותקנת בזיהוי עברית מקומי. אחרת אפשר להשתמש בהכתבת המקלדת של המכשיר או לתרגל בעזרת משפט מסומן כדוגמה. לא נשמרת הקלטה במוקאפ.

## Running locally

Serve this directory at its root. The app and the Hebrew speech fallback work from a static HTTP server. Microphone capabilities require HTTPS or localhost, a compatible device, and the resident's permission.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/. The phone presentation is in `index.html`; the complete interactive application, shared data, authorization simulation, and styles are in `app.html`. The resident guide, profile paging, page reader, and dictation modules are separate plain JavaScript files. Staff review routes are `app.html#worker` and `app.html#admin`.

Audio plays from bundled recordings when available, a device-local Hebrew voice, or the bundled Hebrew eSpeak NG synthesizer. The last option is an audible synthetic voice. A module worker loads the WebAssembly engine and produces WAV audio locally. The worker requests static engine assets from the app origin. Hosting serves versioned application assets and does not receive the text to synthesize.

## Browser regression check

With Python Playwright and its Chromium and WebKit browsers installed:

```sh
python tests/voice_journey.py http://localhost:8000
```

Set `CHROME_CHANNEL` or `WEBKIT_EXECUTABLE` when using a system browser. The test exercises narration, profile choices, sample dictation, edit/confirm, and real Hebrew audio generation on arbitrary draft text. Run `python tests/dictation.py http://localhost:8000` to check recognition callbacks, cancellation, assisted-chat preview and delivery to the other resident using a simulated device recognition API. Actual microphone quality and usability still require representative devices and residents.

## Bundled dependency

The files under `vendor/espeak-ng/` are the unmodified distribution and license from [espeak-ng 1.0.2](https://www.npmjs.com/package/espeak-ng/v/1.0.2), GPL-3.0-or-later. [Distribution source and build instructions](https://github.com/ianmarmour/espeak-ng.js/tree/eec88dbcc1482b1a03a76cf9d2025a0acde8982e). The dependency is pinned in `package-lock.json`. To reproduce the vendor directory:

```sh
npm ci --ignore-scripts
cp node_modules/espeak-ng/dist/* node_modules/espeak-ng/LICENSE vendor/espeak-ng/
```
