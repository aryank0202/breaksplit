# breaksplit
Breaksplit: An app specifically designed for a large group trip management
Add your expense,
See what you are owed
See what you owe
Settle!

## Profile Propagation (All Devices)

This repo now includes a Cloud Function that propagates user profile changes
from `users/{uid}` to matching `trips/{tripId}/members/{uid}` docs.

Function: `propagateUserProfileToMembers`  
File: `functions/src/index.ts`

### Deploy

1. Install Firebase CLI and login.
2. Select your project:
   `firebase use <your-project-id>`
3. Install functions dependencies:
   `cd functions && npm install`
4. Deploy:
   `npm run deploy`

After deployment, changing display name/email/photo/venmo in Edit Profile
will propagate to other users' devices as their app data refreshes.
