# MedMom Security Specification

## Data Invariants
1. **Ownership**: Every medication belongs to a specific user. Only that user can create, update, or delete their medications.
2. **Connectivity**: A user can only view the medications status of another user if there is an `accepted` connection between them.
3. **Pill Verification**: Medication status transitions from 'Pending' to 'Taken' should ideally be accompanied by a verification step (though rules can't enforce a "valid photo" easily, they can enforce that the update only touches the `status` and `updatedAt` fields).
4. **ID Integrity**: All document IDs must be valid alphanumeric strings to prevent ID poisoning.

## The Dirty Dozen (Attack Vectors)
1. **Privilege Escalation**: User A attempts to read User B's medications without a connection.
2. **Identity Spoofing**: User A attempts to create a medication in User B's subcollection.
3. **Ghost Connection**: User A creates a "connection" document for User B without User B's consent (rules must enforce requester ID).
4. **Shadow Update**: User A updates their own medication but adds an `isAdmin: true` field.
5. **PII Leak**: An unauthenticated user attempts to list the `/users` collection.
6. **Orphaned Writes**: A user creates a medication referencing a non-existent user profile.
7. **Resource Poisoning**: A user injects a 1MB string into the medication `name`.
8. **Recursive List Attack**: A user attempts to list all medications for all users in a single query.
9. **Terminal State Bypass**: A user attempts to change a medication from 'Taken' back to 'Pending' (status locking).
10. **Timestamp Fraud**: A user sets `updatedAt` to a future date to bypass schedule logic.
11. **Connection Theft**: User A tries to change the `targetId` of an existing connection.
12. **Self-Promotion**: User A updates their `/users/{userId}` profile to set `role: 'admin'`.

## Test Runner Plan
Use `firestore.rules.test.ts` to verify:
- Unauthorized read of subcollections is blocked.
- Connections require valid `uidA` matching current user.
- Partial updates are strictly constrained using `affectedKeys()`.
