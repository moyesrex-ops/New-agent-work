# Store listings

Stampa ships as a **PWA** first. Suppliers arrive from a WhatsApp invite, not
from a store search, so a listing cannot sit on the critical path to a first
stamp.

This folder is the listing pack for when developer accounts exist. **This
environment cannot upload to Google Play or the App Store.** Those require:

| Store | What is missing here |
|---|---|
| Google Play | Google Play Console account ($25 one-time), Play App Signing upload key, a production HTTPS origin for Digital Asset Links |
| Apple App Store | Apple Developer Program ($99/year), bundle id, provisioning, App Store Connect API key |

Until those exist, install from the browser: Open `/s`, then Add to Home Screen.
Trusted Web Activity packaging uses `stores/android/twa-manifest.json` with
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) once `APP_URL` is
a durable https origin.

Do not point a store listing at a tunnel URL.
