# SCOPE.md

# Project Scope

The objective of this project was to build a shared expense management platform capable of importing and processing a real-world, inconsistent expense dataset while maintaining transparency, traceability, and correctness.

---

# CSV Data Anomaly Log

The provided dataset contained multiple inconsistencies and edge cases. The import engine was designed to detect, report, and handle these issues without silently modifying user data.

## 1. Duplicate Expenses

### Detection

Expenses with highly similar:

* Description
* Date
* Amount
* Participants

### Handling

Flagged as potential duplicates and added to the import report for review.

### Action

Not automatically deleted.

---

## 2. Conflicting Duplicate Records

### Detection

Similar expenses with different amounts.

### Example

Same dinner recorded twice with different values.

### Handling

Flagged as conflicting duplicates.

### Action

Marked for manual review.

---

## 3. Name Variations

### Detection

Examples:

* Priya
* priya
* Priya S

### Handling

Normalization rules applied.

### Action

Mapped to a canonical user identity.

---

## 4. Mixed Date Formats

### Detection

Examples:

* YYYY-MM-DD
* DD/MM/YYYY
* Month Name formats

### Handling

Normalized to ISO format.

### Action

Stored as standardized dates.

---

## 5. Ambiguous Dates

### Detection

Example:

04/05/2026

### Handling

Flagged as ambiguous.

### Action

Requires manual review.

---

## 6. Missing Currency

### Detection

Currency field empty.

### Handling

Flagged during import.

### Action

Added to anomaly report.

---

## 7. Multiple Currencies

### Detection

Dataset contains:

* INR
* USD

### Handling

Currency conversion workflow applied.

### Action

Tracked separately before balance calculations.

---

## 8. Negative Amounts

### Detection

Expense amount less than zero.

### Handling

Interpreted as potential refunds.

### Action

Flagged and logged.

---

## 9. Zero Value Transactions

### Detection

Expense amount equals zero.

### Handling

Marked as invalid transaction.

### Action

Excluded from balance calculations.

---

## 10. Settlement Logged as Expense

### Detection

Description indicated a payment between users.

### Handling

Converted to settlement entry.

### Action

Excluded from expense totals.

---

## 11. Membership Timeline Violations

### Detection

Expenses involving users outside their active membership period.

### Examples

* Meera included after leaving.
* Sam included before joining.

### Handling

Membership dates validated against expense dates.

### Action

Flagged and excluded.

---

## 12. Invalid Split Configuration

### Detection

Split type inconsistent with provided split details.

### Handling

Flagged during validation.

### Action

Requires review before import.

---

## 13. Invalid Participant References

### Detection

Participants not found in group membership records.

### Handling

Rejected from automatic import.

### Action

Added to anomaly report.

---

# Import Policy

The importer follows three rules:

1. Never silently modify financial data.
2. Every anomaly must be visible to the user.
3. Every action taken must be recorded in the import report.

---

# Database Schema

## User

Stores user identity and authentication data.

Fields:

* id
* name
* email
* password
* createdAt

---

## Group

Stores expense groups.

Fields:

* id
* name
* createdAt

---

## GroupMember

Tracks membership history.

Fields:

* id
* userId
* groupId
* joinDate
* leaveDate

---

## Expense

Stores expense records.

Fields:

* id
* description
* amount
* currency
* expenseDate
* paidById
* groupId

---

## ExpenseParticipant

Stores split information.

Fields:

* id
* expenseId
* userId
* shareAmount

---

## Settlement

Stores debt settlements.

Fields:

* id
* payerId
* receiverId
* amount
* date

---

## ImportAnomaly

Stores anomalies detected during import.

Fields:

* id
* rowNumber
* anomalyType
* originalValue
* fixedValue
* actionTaken
* createdAt

---

# Assumptions

* Membership dates determine whether a user participates in an expense.
* Settlement entries are not treated as expenses.
* Duplicate expenses require review before removal.
* Currency conversions are applied before final balance calculations.
* Financial calculations prioritize correctness over automatic assumptions.
