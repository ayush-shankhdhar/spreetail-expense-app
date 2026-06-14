# SCOPE.md

## Project Scope

The goal of this project was to build a comprehensive, production-ready Shared Expense Management application that ingests, parses, and resolves a notoriously messy historical CSV file of flatmate expenses.

### In Scope

- **Authentication System**: Secure user registration, login, and session management using stateless JWTs.
- **Group Management**: Creating groups, viewing members, and managing dynamic joining/leaving dates for flatmates.
- **Expense Tracking**: Logging shared expenses, handling multiple split configurations (equal, unequal, percentage, shares), and supporting multiple currencies.
- **Balance & Debt Calculation**: An engine that calculates who owes what across the entire group, taking into account precision and rounding limits to ensure zero leakage.
- **Debt Simplification Algorithm**: An implementation that calculates the minimum number of transactions needed to settle all debts in a group.
- **Advanced CSV Ingestion Pipeline**:
  - Full anomaly detection for over 20 specific edge cases present in the provided dataset.
  - Automated fixing of format errors (dates, spacing, capitalization).
  - Explicit flagging and skipping of unrecoverable or conflicting errors.
  - Detailed import reporting with visual indicators.
- **Modern User Interface**: A Next.js App Router front-end with a custom design system based on Tailwind CSS, featuring dashboards, detailed lists, and data visualization.

### Out of Scope

- **Real-time Notifications**: Emails or push notifications when new expenses are added.
- **Social Auth**: Login via Google, Facebook, etc.
- **Third-Party Integrations**: Connecting to actual bank APIs (Plaid) or payment processors (Stripe, Venmo) to physically process the calculated settlements.
- **Receipt Scanning**: OCR to automatically ingest receipts from images.
