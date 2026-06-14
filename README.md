# SplitWise Pro — Intelligent Shared Expense Management Platform

## Overview

SplitWise Pro is a full-stack shared expense management platform designed to solve real-world expense tracking challenges in dynamic groups where members can join or leave over time.

The application was built around a realistic dataset containing inconsistent records, duplicate expenses, multiple currencies, membership changes, settlement entries, and other data-quality issues. The system not only manages expenses but also intelligently analyzes imported data, detects anomalies, generates audit reports, and provides transparent balance calculations.

The primary goal of the platform is to ensure that every balance, settlement, and anomaly can be traced and explained.

---

## Key Features

### Authentication & Security

* Secure JWT-based authentication
* Password hashing using bcrypt
* Protected routes
* Session management using HttpOnly cookies

### Group Management

* Create and manage expense groups
* Dynamic member lifecycle support
* Join and leave date tracking
* Historical membership preservation

### Expense Management

* Create, edit, and delete expenses
* Support for multiple split strategies:

  * Equal Split
  * Percentage Split
  * Exact Amount Split
  * Weighted Split
* Expense categorization and notes

### Advanced CSV Import Engine

The application imports the provided CSV dataset without requiring manual modifications.

Import capabilities include:

* CSV validation
* Data normalization
* Anomaly detection
* Error reporting
* Import auditing

### Anomaly Detection System

The importer detects and reports issues such as:

* Duplicate expenses
* Conflicting duplicate records
* Missing currency values
* Invalid dates
* Ambiguous dates
* Negative amounts
* Zero-value transactions
* Currency inconsistencies
* Membership conflicts
* Settlement entries recorded as expenses
* Invalid split configurations
* Name variations and normalization issues

Every anomaly is logged and surfaced through the import report instead of being silently ignored.

### Balance Calculation Engine

The balance engine calculates:

* Total paid amount
* Total owed amount
* Net balance per member
* Group-wide balances

All calculations are transparent and traceable.

### Debt Simplification Engine

The application generates optimized settlement recommendations that minimize the number of transactions required to settle all debts within a group.

Example:

Instead of:

A → B ₹500

A → C ₹300

D → C ₹200

The engine produces the minimum transaction set required to settle balances.

### Import Reporting

Every import generates a detailed report containing:

* Total rows processed
* Imported rows
* Skipped rows
* Detected anomalies
* Actions taken

This provides a complete audit trail for imported data.

---

## Technology Stack

### Frontend

* Next.js 16 (App Router)
* TypeScript
* Tailwind CSS
* Responsive UI Components

### Backend

* Next.js Route Handlers
* TypeScript

### Database

* PostgreSQL
* Neon Database

### ORM

* Prisma ORM 7

### Validation & Parsing

* Zod
* PapaParse

### Authentication

* jose (JWT)
* bcryptjs

---

## Project Architecture

```text
src
├── app
│   ├── (auth)
│   ├── (dashboard)
│   ├── api
│   └── import
│
├── lib
│   ├── auth
│   ├── csv-parser
│   ├── anomaly-detector
│   ├── balance-engine
│   ├── debt-simplifier
│   ├── validators
│   └── prisma
│
├── generated
│   └── prisma
│
prisma
├── schema.prisma
└── migrations
```

---

## Database Design

Core entities:

### User

Stores account and authentication information.

### Group

Represents a shared expense group.

### GroupMember

Tracks membership history including join and leave dates.

### Expense

Stores individual expense records.

### ExpenseParticipant

Stores split allocation information.

### Settlement

Tracks payments made between members.

### ImportAnomaly

Stores anomalies detected during CSV import.

---

## Installation & Setup

### Prerequisites

* Node.js 18+
* npm
* PostgreSQL Database (Neon recommended)

### Clone Repository

```bash
git clone <repository-url>
cd splitwise-pro
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="your_database_url"
JWT_SECRET="your_secure_secret"
```

### Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Run Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## AI Usage

AI tools were used as development assistants for:

* Exploring implementation approaches
* Debugging issues
* Reviewing schema designs
* Generating small code snippets
* UI refinement

All architectural decisions, anomaly handling policies, business logic, testing, debugging, and final implementation validation were performed manually.

Additional details are documented in:

```text
AI_USAGE.md
```

---

## Additional Documentation

### SCOPE.md

Contains:

* Detected anomalies
* Handling policies
* Database schema overview

### DECISIONS.md

Contains:

* Architectural decisions
* Trade-offs considered
* Reasoning behind implementation choices

### AI_USAGE.md

Contains:

* AI usage details
* Validation process
* Incorrect AI suggestions and corresponding corrections

---

## Deliverables

* Public deployed application
* GitHub repository with meaningful commit history
* CSV import engine
* Anomaly detection framework
* Balance calculation engine
* Debt simplification engine
* Import reporting system
* Complete project documentation

---

## Author

Ayush 

B.Tech Computer Science Engineering

Lovely Professional University

2023–2027
