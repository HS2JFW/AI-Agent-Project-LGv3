# Rule: Play Spoken (Text-to-Speech) Notification on Task Completion

When completing a major task, compilation, build check, or multi-step user instruction, ALWAYS proactively play the custom Thai teenage female voice notification announcing that work is complete, unless instructed otherwise.

## Spoken Command to Execute
At the conclusion of your working steps, execute the following terminal command via `run_command`:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Dragomo\.gemini\play_voice_notification.ps1"
```

*(Note: This script plays a high-quality Microsoft Edge Neural Thai female voice (`th-TH-PremwadeeNeural`, adjusted to a youthful/cute tone) speaking the exact phrase: "ได้แก้ระบบของคุณเสร็จแล้ว ลองทำงานดูอีกครั้ง").*
