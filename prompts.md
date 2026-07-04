# PROMPT LOGS

This document contains the primary prompts used during the AI-assisted development of the **Tariff Approval Manager** project.

AI Tools Used:
- ChatGPT (OpenAI)
- OpenAI Codex
- Claude

AI was used for:
- System design
- Architecture discussions
- UI planning
- Workflow definition
- Feature enhancements
- Debugging
- Persistence implementation
- Authentication design
- Refactoring

---

# Prompt 1 — Initial Project Definition

```text
You are a senior full-stack engineer helping me build an interview assignment.

First understand the project requirements and explain them back to me before writing any code.

i want to create a small full stack model for tariff approval manager application,
the application must contain 3 user options

1.Creator
2.Approver
3.Viewer

Entities

Contract:
- name
- valid_from
- valid_until

A contract can contain multiple tariffs.

Tariff:
- container size (20FT, 40FT, 45FT)
- move type (IMPORT, EXPORT, TRANSSHIPMENT)
- currency (USD, EUR)
- price
- valid_from
- valid_until
- status
- creator_id
- rejection_reason

Workflow:
Draft
→ Pending
→ Rejected
→ Edit
→ Pending

Role Permissions

Creator:
- create tariffs
- edit Draft tariffs
- edit Rejected tariffs
- submit tariffs
- cannot approve tariffs

Approver:
- view Pending tariffs
- approve tariffs
- reject tariffs
- cannot modify tariff values
- cannot approve their own tariff

Viewer:
- can only view approved contracts and tariffs

go through these, these is the outline of how the project should be and what are all needed to be present in it, after this i will send the rules and other ui things
```

---

# Prompt 2 — Business Rules & Architecture

```text
Business Rules

Rule 1:
Tariff validity dates must lie within the validity period of the parent contract.

Rule 2:
Approved tariffs with the same:
- contract
- container size
- move type

cannot have overlapping validity periods.

Boundary Condition:
If one tariff ends on 30 June and another starts on 30 June,
consider this an overlap.

Overlap formula:

new_start <= existing_end

AND

new_end >= existing_start

Validation Strategy:
Perform overlap validation during APPROVAL instead of submission.

Dashboard Requirements:
- count by status
- count by currency
- count by move type
- simple chart

Tests Required:
1. overlap rule
2. permission rule

Please explain:

1. What the project does
2. The business problem it solves
3. The entities involved
4. The workflow
5. Edge cases
6. Suggested architecture
7. Suggested tech stack
8. Suggested API design

Do not generate code yet.
Only discuss design and architecture.
```

---

# Prompt 3 — Dashboard Access Restriction

```text
Dashboard access is restricted to the Approver role only.

Creators do not have access to the dashboard.

Viewers can only browse approved contracts and approved tariffs and do not see analytics.

The dashboard contains:
- Counts by tariff status
- Breakdown by currency
- Breakdown by move type
- At least one chart visualization

This follows the assignment requirement that the dashboard is only visible to Approvers.
```

---

# Prompt 4 — UI & Workflow Improvements

```text
IT'S actually pretty good more than i expected i want to add some more features and make some changes to the ui

1.I want you to remove the submit and edit button from creator side once the status of the tariff is approved as there's not usage for those.

2.Also the ui should be like the users should see the contracts first so the first page must be the page which shows the list of contracts , then once we get into the contract we can get to see the tariffs inside it.

3.Also the dashboard option should only be available to the approver page not all other pages remove it from viewer and creator

4.Add currency INR option also

5.The first page with the contracts should show the contract name, contract validity and a small crisp description about it.
```

---

# Prompt 5 — Dashboard Expansion & Enhancements

```text
there are somethings i needed to add

1.I have asked for a user name column in the approver page where he can see which creator has creator has created the particular tariff.

2.In viewer page remove the reason column as it is not needed for the user.

3.Planning to add dashboard options for the viewer also :

Viewer Dashboard

Cards
────────────────────
Approved Tariffs
Active Contracts
Currencies Used
Average Price
────────────────────

Bar Chart
Tariffs by Move Type

Pie Chart
Currency Distribution

Pie Chart
Container Size Distribution

Horizontal Bar Chart
Approved Tariffs by Contract

4.Add a + icon in the approver page to add new contracts, once a new contract is added i want it to be updated to the creators also

5.Small change is that while clicking the submit button as creator and approve as approver it shows a pop up message which is good but with a exclamation mark, i want to change it as a tick mark, like i want exclamation mark only for the negative things in the ui like rejection, error message etc, for approval and submission i want a tick mark
```

---

# Prompt 6 — Bug Fixes & UX Improvements

```text
it's good now but little changes needs to be made

1.In approver side there's a bug as it shows 1 in tariffs but actually there's none, the tariff count should based on the role like for the creator it should show count of all the tariffs including the approved,pending, rejected and drafts in contract page for that particular contract, but for the creator side it should only show the tariff count which is waiting for the approval.

2.While rejecting the tariff , i got a pop at the task bar, i want a pop up inside the window for that application for writing the reason.

3.Also in the creators page alone we can add a column with the creator user name which could help to know which creator has created this tariff.

4.The major problem is the error message it makes all the other items in the ui to get in a corner, i want a pop up with exclamation which shows that there's a error.
```

---

# Prompt 7 — Viewer Analytics Dashboard

```text
Viewer Dashboard

Cards
────────────────────
Approved Tariffs
Active Contracts
Currencies Used
Average Price
────────────────────

Bar Chart
Tariffs by Move Type

Pie Chart
Currency Distribution

Pie Chart
Container Size Distribution

Horizontal Bar Chart
Approved Tariffs by Contract
```

---

# Prompt 8 — Contract Management

```text
Add a + icon in the approver page to create contracts.

Requirements:
- Only Approvers can create contracts
- Newly created contracts should automatically become visible to all Creators
- Contracts should support deletion
- Deleting a contract should also delete associated tariffs
- Show a confirmation popup before deletion
```

---

# Prompt 9 — Persistent Storage

```text
Implement lightweight persistence.

Requirements:

- Data should survive server restarts
- Contracts should persist
- Tariffs should persist
- Approvals should persist
- Rejections should persist
- Contract deletions should persist

Use a database.json file instead of introducing a database dependency.
```

---

# Prompt 10 — Authentication

```text
Implement role-based login.

Users:

Creator Maya
Password : creator123

Creator Sam
Password : creator123

Approver Dev
Password : approver123

Viewer Noor
Password : viewer123

Requirements:

- LocalStorage persistence
- Logout support
- Session restoration
- Users should only access their permitted actions
- Creators can only create/edit tariffs
- Approvers can only approve/reject
- Viewers can only browse approved data
```

---

# Prompt 11 — Delete Confirmation Modal

```text
Replace browser confirm() with an in-app modal.

Requirements:

Delete Contract

⚠

Deleting this contract will remove all associated tariffs.

Cancel      Delete

Only proceed when the user confirms.
```

---

# Prompt 12 — Login UI

```text
Create a dedicated login screen.

The application should no longer use a role switcher.

Users must authenticate before entering the system.

After login:

Creator → Creator Workspace

Approver → Approval Workspace

Viewer → Viewer Workspace

Persist session using localStorage.

Provide logout functionality.
```

---

# AI Usage Summary

This project was developed using AI-assisted programming tools.

Tools Used

- ChatGPT (GPT-5.5)
- OpenAI Codex
- Claude

AI assistance was primarily used for:

- Requirements analysis
- Architecture planning
- UI design decisions
- Dashboard planning
- Authentication design
- Persistent storage implementation
- Feature enhancements
- Refactoring
- Debugging
- Documentation generation

Final integration, testing, validation and implementation decisions were performed manually.
