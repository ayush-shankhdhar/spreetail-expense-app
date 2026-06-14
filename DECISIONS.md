# DECISIONS.md

# Decision Log

This document records the major architectural, product, and engineering decisions made during development, including alternative approaches that were considered and the rationale behind the final choice.

---

## 1. Monetary Data Representation

### Problem

Expense calculations require exact financial precision.

### Options Considered

1. Float
2. Integer (store paisa/cents)
3. Decimal

### Chosen Option

Decimal

### Reason

Floating point arithmetic can introduce rounding errors during balance calculations and expense splitting. Decimal values provide predictable and accurate financial calculations while keeping implementation simple and readable.

---

## 2. Application Architecture

### Problem

Choosing how to structure frontend and backend.

### Options Considered

1. MERN Stack
2. Next.js + Express
3. Next.js Full Stack

### Chosen Option

Next.js Full Stack using App Router and Route Handlers.

### Reason

Provides a single codebase, type safety, simplified deployment, and eliminates the need for maintaining a separate backend service.

---

## 3. Database Selection

### Problem

Selecting a relational database.

### Options Considered

1. MongoDB
2. MySQL
3. PostgreSQL

### Chosen Option

PostgreSQL

### Reason

The project contains highly relational data including users, groups, memberships, expenses, settlements, and anomalies. PostgreSQL provides strong relational modeling and transaction support.

---

## 4. ORM Selection

### Problem

Database access layer.

### Options Considered

1. Raw SQL
2. Sequelize
3. Prisma

### Chosen Option

Prisma

### Reason

Provides strong TypeScript support, schema-driven development, migrations, and improved developer productivity.

---

## 5. Authentication Strategy

### Problem

Secure user authentication.

### Options Considered

1. Session-based authentication
2. NextAuth
3. JWT Authentication

### Chosen Option

JWT stored in HttpOnly cookies.

### Reason

Provides a lightweight solution while protecting tokens from client-side JavaScript access.

---

## 6. Dynamic Membership Handling

### Problem

Group membership changes over time.

### Options Considered

1. Ignore join and leave dates
2. Store only current members
3. Track membership history

### Chosen Option

Track membership history using joinDate and leaveDate.

### Reason

The assignment explicitly includes members joining and leaving the group. Historical membership is required for accurate balance calculations.

---

## 7. CSV Import Strategy

### Problem

Importing a dataset containing inconsistent and invalid records.

### Options Considered

1. Reject entire file on first error
2. Automatically fix everything silently
3. Import with anomaly reporting

### Chosen Option

Import with anomaly reporting.

### Reason

The assignment requires every anomaly to be detected, surfaced, and handled transparently.

---

## 8. Duplicate Expense Handling

### Problem

Duplicate expenses exist in the dataset.

### Options Considered

1. Automatically delete duplicates
2. Ignore duplicates
3. Flag duplicates for review

### Chosen Option

Flag duplicates for review.

### Reason

Automatic deletion could remove valid records. Review preserves transparency and data integrity.

---

## 9. Currency Handling

### Problem

Dataset contains both INR and USD transactions.

### Options Considered

1. Treat all currencies equally
2. Store separate balances by currency
3. Convert to a common base currency

### Chosen Option

Convert to INR before balance calculation.

### Reason

Simplifies balance calculations and settlement generation while preserving transaction history.

---

## 10. Settlement Processing

### Problem

Some entries represent debt settlements rather than expenses.

### Options Considered

1. Treat settlements as expenses
2. Ignore settlements
3. Store settlements separately

### Chosen Option

Store settlements separately.

### Reason

Settlements reduce debt and should not increase group expenses.

---

## 11. Debt Simplification Algorithm

### Problem

Reducing the number of transactions required to settle balances.

### Options Considered

1. No simplification
2. Graph optimization approach
3. Greedy debtor-creditor matching

### Chosen Option

Greedy debtor-creditor matching.

### Reason

Provides near-optimal results while remaining easy to understand, implement, and explain during review.

---

## 12. Import Audit Trail

### Problem

Tracking how imported data was processed.

### Options Considered

1. Store only imported expenses
2. Log errors only
3. Store every anomaly and action

### Chosen Option

Store every anomaly and action.

### Reason

Provides complete traceability and supports debugging, reporting, and audit requirements.

---

## 13. User Interface Direction

### Problem

Choosing the overall product experience.

### Options Considered

1. Traditional CRUD dashboard
2. Splitwise clone
3. Modern SaaS-style experience

### Chosen Option

Modern SaaS-style dashboard.

### Reason

Provides better usability, clearer data visualization, and a more polished user experience while remaining functional.

---

## 14. Validation Strategy

### Problem

Ensuring imported and user-submitted data is valid.

### Options Considered

1. Frontend validation only
2. Backend validation only
3. Validation on both frontend and backend

### Chosen Option

Backend-first validation with frontend assistance.

### Reason

Server-side validation guarantees data integrity regardless of client behavior.

---

## Summary

The overall philosophy of the project was:

* Never silently modify financial data.
* Prioritize correctness over convenience.
* Keep calculations explainable and traceable.
* Preserve auditability of imported records.
* Ensure every decision can be justified during review and discussion.

