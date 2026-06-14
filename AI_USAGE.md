# AI_USAGE.md

## AI Usage & Development Notes

This project was developed and reviewed by me. AI tools were used occasionally as coding assistants for brainstorming implementation approaches, debugging issues, and accelerating repetitive development tasks. All major architectural decisions, business rules, anomaly handling policies, database design, and final implementations were reviewed, modified, tested, and validated by me before inclusion in the project.

### AI Tools Used

* ChatGPT
* General-purpose AI coding assistants for code suggestions and debugging support

### How AI Was Used

AI assistance was used for:

* Understanding different implementation approaches
* Generating small code snippets and boilerplate code
* Debugging TypeScript and build issues
* Reviewing Prisma schema designs
* Discussing CSV parsing and validation strategies
* UI refinement and styling suggestions

AI was not used as an autonomous developer. All generated suggestions were manually reviewed, tested, and adapted to fit the project requirements.

### Examples Where AI Suggestions Were Incorrect

#### Case 1: Dynamic Membership Handling

**Initial Suggestion**

Calculate balances using all group members for every expense.

**Issue**

This ignored the requirement that members can join and leave over time.

**Resolution**

Implemented membership validation using join and leave dates so expenses only affect active members at the time of the transaction.

---

#### Case 2: Duplicate Expense Handling

**Initial Suggestion**

Automatically remove suspected duplicate expenses.

**Issue**

Automatic deletion could remove legitimate user data.

**Resolution**

Duplicates are now detected and reported as anomalies for user review instead of being silently deleted.

---

#### Case 3: Currency Processing

**Initial Suggestion**

Treat all expense amounts uniformly regardless of currency.

**Issue**

The dataset contains both INR and USD transactions, which would lead to incorrect balance calculations.

**Resolution**

Added currency validation and conversion handling to ensure balances are calculated correctly and transparently.

### Verification Performed

Throughout development, the following validations were performed:

* Local testing with the provided CSV dataset
* Verification of anomaly detection rules
* Validation of balance calculations
* Database migration testing
* API testing
* Type checking with TypeScript
* Production build verification using `npm run build`

### Responsibility Statement

AI tools were used only as development assistants. All final decisions, business logic, architecture, testing, debugging, and implementation validation were performed by me. I am able to explain and modify every major component of the application and justify the decisions made during development.
