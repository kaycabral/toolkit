---
'@cbrl/supabase': minor
---

`authCallbackRoute` fails closed: when `onSession` throws, the session the code exchange just wrote is signed out (`scope: 'local'`, clearing the session cookies), the new `onSessionError` hook receives the error and the user is redirected to `failurePath` instead of getting a 500 while signed in.
