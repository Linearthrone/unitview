# Firestore Schema for UnitView App

## Collections
- `patients` — Core patient data including room, status, and risks
- `nurses` — Nursing staff and patient assignments
- `assignments` — Snapshots of shift-based assignments
- `rooms` — Room and bed tracking, nurse linkage
- `spectralink` — Wireless comms device tracking (Spectralink)

## Setup
1. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. Run the seed script (`firestore-seed.js`) separately to populate with test data.

---

Modify security rules as needed per hospital policy.