# DECISIONS.md

## Technical Decisions

### 1. Database Schema & Floating Point Math
**Decision**: Use Prisma `Decimal` type mapped to PostgreSQL `DECIMAL(10, 2)` for all monetary amounts, instead of standard `Float` or `Int` (cents).
**Rationale**: In an expense management application, calculating exact splits across varying numbers of members leads to floating-point imprecision. Using a dedicated `Decimal` type prevents $10.00 split 3 ways from resulting in missing or extra cents.

### 2. Next.js App Router & Server Components
**Decision**: Utilize Next.js 16 with the App Router architecture, pushing maximum logic to Server Routes (API) and Server Components.
**Rationale**: Simplifies the backend logic, eliminates the need for an external API service (like an Express server), and increases type safety by allowing shared interfaces across frontend and backend.

### 3. Stateless Authentication
**Decision**: Implement authentication using JWT stored in `HttpOnly` cookies, parsed in Next.js middleware, rather than using NextAuth or a heavy stateful session store.
**Rationale**: Minimizes database queries on every authenticated request while ensuring the token is protected against XSS attacks.

### 4. Handling CSV Anomalies
**Decision**: Implement a multi-phase import pipeline (Parse -> Detect -> Process). Anomalies are never silently discarded. They are explicitly marked with an `actionTaken` value, recorded in the database, and surfaced to the user.
**Rationale**: The prompt strictly emphasized that data should never be modified silently. By defining an `AnomalyType` enum and associating it with individual row processing logic, the system maintains a complete audit trail.

### 5. Multi-Currency Handling
**Decision**: Use a strict conversion pipeline, where expenses explicitly marked as `USD` are immediately converted to `INR` at a fixed exchange rate (83 INR = 1 USD) before entering the balance engine.
**Rationale**: Simplifies the balance calculations, preventing a matrix of multi-currency debts, while still fulfilling the requirement for Priya’s USD expenses.

### 6. Dynamic Group Memberships
**Decision**: Memberships require both a `joinDate` and an optional `leaveDate`. The balance engine evaluates if a user was an active member on the `expenseDate` before assigning a share.
**Rationale**: Specifically handles the edge cases regarding Meera (left in March), Dev (visitor for one week in March), and Sam (joined in April).

### 7. Debt Simplification
**Decision**: Implemented a greedy algorithm that nets out all balances and pairs the highest debtor with the highest creditor iteratively.
**Rationale**: Reduces the number of settlement transactions (e.g., A owes B $10, B owes C $10 -> simplified to A owes C $10). Required for creating the exact "Recommendation" interface requested.
