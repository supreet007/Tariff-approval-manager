# Tariff Approval Manager

A role-based tariff workflow management system built using **Vanilla JavaScript**, **Node.js**, and **JSON persistence**.

The application simulates a real-world tariff approval process involving **Creators**, **Approvers**, and **Viewers**.

---

# Features

## Creator
- View all available contracts
- Create new tariffs
- Edit Draft and Rejected tariffs
- Submit tariffs for approval
- View rejection reasons
- Access only tariffs created by themselves
- Track their own tariff count per contract

## Approver
- View pending tariffs
- Approve tariffs
- Reject tariffs with mandatory reasons
- Validate overlapping tariffs before approval
- Create new contracts
- Delete existing contracts
- View creator information for submitted tariffs

## Viewer
- Access only approved tariffs
- View approved contract information
- Access analytics dashboard

---

# Tariff Lifecycle

```text
Draft
 ↓
Pending
 ↓
Approved
or
Rejected
```

Rejected tariffs can be edited and resubmitted.

---

# Business Rules

### Overlap Validation

Only one **Approved Tariff** may exist for:

- Same Contract
- Same Container Size
- Same Move Type
- Overlapping validity dates

Validation occurs during the approval stage.

---

# Dashboard

## Viewer Dashboard

### Cards
- Approved Tariffs
- Active Contracts
- Currencies Used
- Average Price

### Charts
- Tariffs by Move Type
- Currency Distribution
- Container Size Distribution
- Approved Tariffs by Contract

---

# Authentication

Role-based login system implemented using Local Storage.

Users available:

| User | Password | Role |
|-------|----------|------|
| Creator Maya | creator123 | Creator |
| Creator Sam | creator123 | Creator |
| Approver Dev | approver123 | Approver |
| Viewer Noor | viewer123 | Viewer |

Login sessions persist across browser refreshes.

Logout functionality included.

---

# Persistence

Application data is persisted using:

```text
data/database.json
```

Data survives server restarts.

Persisted entities:

- Users
- Contracts
- Tariffs
- Approvals
- Rejections
- Contract deletions

---

# Tech Stack

Frontend

- HTML5
- CSS3
- Vanilla JavaScript

Backend

- Node.js
- HTTP Server API

Storage

- JSON File Persistence

Visualization

- Custom CSS Charts
- Dashboard Components

---

# Project Structure

```text
tariff-approval-manager/

├── data/
│   └── database.json
│
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── src/
│   ├── domain.js
│   ├── server.js
│   └── store.js
│
├── test/
│   └── business.test.js
│
├── README.md
├── PROMPT_LOGS.md
├── package.json
└── .gitignore
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/your-username/tariff-approval-manager.git

cd tariff-approval-manager
```

Install dependencies

```bash
npm install
```

---

# Running the Application

Start the server

```bash
npm start
```

or

```bash
node src/server.js
```

The application will run at

```text
http://localhost:3000
```

Open your browser and visit:

```text
http://localhost:3000
```

---

# Resetting Data

To reset the application state:

Delete

```text
data/database.json
```

Then restart the server.

A fresh database with seed data will be generated automatically.

---

# Sample Credentials

### Creator

```text
User: Creator Maya
Password: creator123
```

or

```text
User: Creator Sam
Password: creator123
```

### Approver

```text
User: Approver Dev
Password: approver123
```

### Viewer

```text
User: Viewer Noor
Password: viewer123
```

---

# AI Assisted Development

This project was developed using AI-assisted programming tools.

Tools used:

- ChatGPT (OpenAI)
- OpenAI Codex
- Claude

AI assistance was used for:

- System architecture
- Workflow design
- Dashboard planning
- Persistence implementation
- Authentication design
- UI refinement
- Debugging
- Code refactoring

Prompt logs are available in:

```text
PROMPT_LOGS.md
```

---

# Future Improvements

- JWT Authentication
- SQLite/PostgreSQL integration
- User Registration
- Password Hashing
- Export Dashboard Reports
- Audit Logs
- Pagination
- Search & Filters
- Dark Mode

---

# Author

Supreet Raju

Built as part of an AI-assisted Tariff Approval Manager assignment.
