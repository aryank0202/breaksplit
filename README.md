# breaksplit
Breaksplit: An app specifically designed for a large group trip management
Add your expense,
See what you are owed
See what you owe
Settle!

## Profile Propagation (All Devices)

Current default path is Spark-compatible (no Blaze required):
- Profile save writes `users/{uid}`.
- Then it fan-outs updates to this user's `trips/{tripId}/members/{uid}` docs.
- Other users read member snapshots and see updated name/photo on refresh.

Optional advanced path:
- A Cloud Function implementation exists under `functions/src/index.ts`.
- Deploying it requires Blaze.
