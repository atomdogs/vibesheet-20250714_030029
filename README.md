# vibesheet-20250714_030029

## Project Description  
A monorepo-based TypeScript SaaS web application and Chrome extension for automated LinkedIn content ideation, scheduling, real-time engagement alerts, analytics, and CRM integration.  
Full spec: https://docs.google.com/document/d/1YA2cVRfziaGFrzOriwxqXDE6d979JB7-WpNT5n-I3oQ/edit?usp=sharing

---

## Overview  
vibesheet provides:  
- AI-driven post ideation with tone analysis  
- Rich WYSIWYG editor streaming GPT-4/Claude drafts  
- Drag-and-drop calendar scheduling  
- Real-time engagement radar (desktop + Chrome extension)  
- Interactive analytics dashboard  
- CSV export & CRM push (HubSpot, Pipedrive)  
- Secure LinkedIn OAuth (AWS KMS encryption)  
- Scalable microservices (Express API, background workers, Kubernetes)  
- CI/CD (GitHub Actions) & IaC (Terraform)

---

## Features  
- LinkedIn OAuth onboarding + PII deletion  
- Voice-tuned AI content prompts  
- Real-time AI streaming in editor  
- Drag-and-drop scheduler (BullMQ + Redis)  
- Engagement alerts via SSE + Chrome extension  
- Desktop notifications & in-extension comment drafting  
- Analytics charts (Chart.js)  
- CRM export (CSV, HubSpot, Pipedrive)  
- Rate limiting & global error handling  
- Configuration management (validated loader)  
- Deployment: Vercel (frontend), Railway (API), Kubernetes (workers)

---

## Table of Contents  
1. [Installation](#installation)  
2. [Setup & Environment](#setup--environment)  
3. [Running Locally](#running-locally)  
4. [Usage Examples](#usage-examples)  
5. [Architecture & Components](#architecture--components)  
6. [Dependencies](#dependencies)  
7. [Deployment](#deployment)  
8. [Contributing](#contributing)  
9. [License](#license)

---

## Installation  

```bash
# Clone the monorepo
git clone https://github.com/your-org/vibesheet-20250714_030029.git
cd vibesheet-20250714_030029

# Install all workspaces (uses Yarn workspaces or npm workspaces)
yarn install
# or
npm install
```

---

## Setup & Environment  

1. Copy `.env.example` to `.env` at repo root and fill in credentials:  
   - LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET  
   - AWS_KMS_KEY_ID, AWS_REGION  
   - REDIS_URL, DATABASE_URL  
   - OPENAI_API_KEY  
   - CRM_WEBHOOK_URL, CRM_TYPE  
2. Initialize Terraform infra (optional):  
   ```bash
   cd infra/terraform
   terraform init
   terraform apply
   ```  

---

## Running Locally  

```bash
# Start API server
cd packages/api
yarn dev   # uses ts-node-dev

# Start Next.js frontend
cd packages/frontend
yarn dev   # http://localhost:3000

# Start background workers
cd packages/workers
yarn dev

# Load Chrome extension in dev mode:
# In Chrome, go to chrome://extensions ? Load unpacked ? packages/extension/src

# (Optional) Run CI checks
yarn workspace infra-ci test
```

---

## Usage Examples  

1. **Onboarding**  
   - Visit http://localhost:3000  
   - Sign up or SSO  
   - Complete LinkedIn OAuth flow  
2. **Create AI Post**  
   - Go to `/dashboard`  
   - Click ?New Post? ? editor streams draft  
3. **Schedule Post**  
   - Drag draft onto calendar in `/dashboard`  
4. **Engagement Alerts**  
   - Desktop notifications pop up  
   - Chrome extension shows in-page alerts and quick-reply popup  
5. **Analytics & CRM**  
   - View `/analytics` charts  
   - Click ?Export to CRM? in `/settings`

---

## Architecture & Components  

### Frontend (Next.js + TailwindUI)  
- **Components**  
  - `dashboardsidebar.tsx` ? sidebar navigation  
  - `topnavbar.tsx` ? header with user menu  
  - `calendarschedulercomponent.tsx` ? drag-and-drop scheduler  
  - `richtexteditorwrapper.tsx` ? WYSIWYG + AI streaming  
  - `notificationpopover.tsx` ? engagement alerts popover  
- **Pages**  
  - `_app.tsx` ? global layout & providers  
  - `index.tsx` ? landing / onboarding  
  - `dashboard.tsx` ? content ideation & scheduler  
  - `analytics.tsx` ? metrics dashboard  
  - `settings.tsx` ? account & CRM configuration  

### API Layer (Express)  
- **Middleware**  
  - `authmiddleware.ts` ? JWT/session verification  
  - `ratelimitermiddleware.ts` ? per-user/IP throttling  
  - `errorhandlermiddleware.ts` ? error formatting & logging  
- **Config**  
  - `configloader.ts` ? validated env loader  
- **Services**  
  - `linkedinoauthhandler.ts` ? OAuth flow & token encryption  
  - `toneanalysisservice.ts` ? build user tone profiles  
  - `promptbuilderservice.ts` ? assemble AI prompts  
  - `aiservice.ts` ? GPT/Claude streaming & caching  
  - `schedulerservice.ts` ? BullMQ job enqueue  
  - `engagementmonitorservice.ts` ? poll LinkedIn & SSE  
  - `analyticscollector.ts` ? aggregate metrics  
  - `crmexporterservice.ts` ? CSV/CRM export  

### Background Workers  
- `workerBootstrap.ts` ? worker startup  
- `feedbackloopservice.ts` ? daily repurpose prompts  

### Chrome Extension  
- `extension/src/background.ts` ? background polling  
- `extension/src/contentScript.ts` ? inject in-page alerts  
- `extension/src/popup.tsx` ? quick-draft UI  
- `extension/src/manifest.json`  

### CI/CD & Infrastructure  
- `infra/ci/github-actions.yml` ? build, test, deploy pipelines  
- `infra/terraform/*.tf` ? VPC, Kubernetes cluster, secrets  

---

## Dependencies  

- Node.js ? 14  
- Yarn or npm  
- Next.js, React, TailwindCSS  
- Express.js  
- BullMQ & Redis  
- AWS SDK (KMS)  
- OpenAI SDK  
- Chart.js (for analytics)  
- Terraform CLI, GitHub Actions runner  

---

## Deployment  

- Frontend ? Vercel  
- API ? Railway / Docker container  
- Workers ? Kubernetes (EKS/GKE/AKS)  
- CI/CD ? GitHub Actions  
- Infrastructure as code ? Terraform  

---

## Contributing  

1. Fork the repo  
2. Create a feature branch  
3. Run tests & linters  
4. Submit a pull request  
5. Ensure CI passes before review  

---

## License  

This project is licensed under the MIT License. See LICENSE for details.