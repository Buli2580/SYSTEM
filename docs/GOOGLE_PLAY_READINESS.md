# SYSTEM — Google Play Readiness 1.0

## Android identity
- App name: SYSTEM
- Package / applicationId: `pl.systemworld.app`
- Version name: `1.0.0`
- Version code: `1`
- First Play upload must happen only after confirming this package ID is final.

## Build
Preferred store artifact: Android App Bundle (`.aab`).

EAS profiles:
- `device-test` -> APK for direct device testing.
- `play-internal` -> AAB for Google Play.

Typical commands after connecting an Expo account/project:
```bash
npx eas-cli build --platform android --profile play-internal
```

For every later Play upload increment `android.versionCode`.

## Background location
Core user-facing reason:
SYSTEM measures and verifies an active movement quest even when the screen is off or the app is not in use.

The app now shows a prominent in-app disclosure before requesting location permissions for this flow.

Play Console still requires:
1. Sensitive permissions declaration for background location.
2. A short Android video showing: starting a movement quest -> in-app disclosure -> Android permission prompt -> app in background -> distance continues -> return to SYSTEM.
3. The store description must visibly explain the background-location quest feature.
4. Privacy policy URL must be public and final.

## Data Safety inventory
Review in Play Console against the actual production build:
- Account information: email / account id.
- User profile: handle, public name, bio, optional ranking location.
- Precise location: used during active GPS quests, including background when enabled.
- App activity / progression: quests, XP, levels, streaks, verification summaries.
- Diagnostics / technical sync metadata.
- No passwords are stored by the app outside Supabase Auth.
- No full GPS route is uploaded to SYSTEM CLOUD by the current sync outbox.
- Location is not used for advertising.

## Account deletion
The mobile app includes an in-app request path in SYSTEM ONLINE.
Before Play submission we still need a public web resource that lets a user request account deletion without reinstalling the app.

## Store listing draft
Short description:
"Zamień prawdziwe cele w misje, zdobywaj XP i rozwijaj swoją postać."

Internal-test notes:
"Pierwsza wersja testowa SYSTEM. Testujemy onboarding, misje, zapis progresu, GPS w tle, SYSTEM CLOUD i rankingi."

## Manual blockers before first Play upload
- Active Google Play Console developer account with verified identity.
- Confirm final developer/public name.
- Confirm final package ID before first upload.
- Public production privacy-policy URL.
- Public external account-deletion request URL.
- Play App Signing / upload credentials.
- Complete Data Safety and background-location declaration in Play Console.
- Add internal tester Google accounts.
