# 🚂 Africa Railways: Team Onboarding

Welcome to the Digital Spine. To ensure project stability, please follow these protocols:

## 👥 Roles
- **Tech Staff (5):** Focus on `/backend` (Go) and `/contracts` (Sui Move).
- **Accountants (5):** Review settlement logic in `/api/v1/openapi.yaml`.

## 🛠️ Contribution Workflow
1. **Branching:** Do NOT push directly to `main`. Create a branch: `git checkout -b feature/your-name`.
2. **Local Root:** Always run scripts from the project root: `~/africa-railways`.
3. **Environment:** Copy `.env.example` to `.env` and enter your developer keys.

## 🚀 Deployment
Merging to `main` triggers the Vercel Production Build.
