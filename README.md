# Tariff Approval Manager

A small full-stack interview assignment for managing tariff approval under existing contracts.

## What It Covers

- Creator can create, edit, and submit own Draft or Rejected tariffs.
- Approver can review Pending tariffs, approve, reject, and access analytics.
- Viewer can browse only approved contracts and approved tariffs.
- Contracts are shown first; tariff work happens inside a selected contract.
- Tariff validity must stay inside the parent contract period.
- Approved tariffs with the same contract, container size, and move type cannot overlap.
- Overlap validation runs during approval, not submission.

## Run

```bash
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

The tests cover the overlap rule and permission behavior, including dashboard access.

## API Summary

- `GET /api/users`
- `GET /api/contracts`
- `GET /api/tariffs`
- `POST /api/contracts/:contractId/tariffs`
- `PATCH /api/tariffs/:id`
- `POST /api/tariffs/:id/submit`
- `POST /api/tariffs/:id/approve`
- `POST /api/tariffs/:id/reject`
- `GET /api/dashboard`

Send the selected user with:

```text
x-user-id: u_creator
```

or `u_approver` / `u_viewer`.
