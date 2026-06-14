# AI_USAGE.md

## AI Usage & Automation Notes

This project was built iteratively using Antigravity, an advanced agentic AI coding assistant powered by Gemini 3.1 Pro. The generation of this application involved a collaborative pairing session where the AI agent generated code according to the specific prompt and CSV data files provided.

### Tasks Delegated to AI

- **Boilerplate & Foundation**: Project initialization via `create-next-app`, configuration of Tailwind CSS, layout creation, and basic Next.js routing structures.
- **Database Architecture**: Generating the `schema.prisma` definitions, writing `Prisma Client` calls, and executing database migrations against the Neon Postgres instance.
- **Authentication**: Implementing the JWT signing/verification library, password hashing with `bcryptjs`, and Next.js proxy routing.
- **CSV Parsing Engine**: The core anomaly detection logic was written by the AI based on the explicit rules provided regarding missing data, wrong types, dynamic members, and USD requirements.
- **UI & Styling**: Implementation of the "vibrant, dark mode, glassmorphism" aesthetic, including custom CSS variables, responsive design, and CSS animations.

### Verification Performed

- The AI continuously ran `npm run build` during execution to check Next.js build compilation errors (e.g., catching and fixing a deprecated `middleware` export requirement for Turbopack).
- Schema synchronisation was executed using `npx prisma migrate dev`.
- Type checking was executed throughout to ensure Zod validation types aligned with Prisma schema output types.
