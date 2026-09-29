# 🧠 NexusAI — Deal Intelligence Agent

> **Autonomous AI Sales Agent with Persistent Deal Memory & Actionable Sales Intelligence**

NexusAI is a production-ready hackathon prototype of an enterprise AI agent built for B2B sales teams. Unlike generic AI chatbots, NexusAI maintains **persistent, long-term memory** across every customer interaction in a deal lifecycle—remembering customer statements, objections, competitor benchmark mentions, stakeholder dynamics, pricing tactics, and feature requirements.

Over time, NexusAI uses this persistent memory to brief sales representatives before calls, detect deal risks automatically, recommend the **Next Best Action** with confidence scores, and answer deal-specific questions using memory retrieval.

---

## 🚀 Key Features

1. **Persistent Deal Memory Core**
   - Every call, demo, email, or meeting note is stored and indexed in structured database tables.
   - Extracts and categorizes memories into: *Objection, Requirement, Customer Statement, Competitor Mention, Pricing Discussion, Stakeholder Information, Action Item, Sales Tactic,* and *Outcome*.

2. **Sales Intelligence Dashboard**
   - Live pipeline metrics: Total Active Deals, Deals Requiring Attention, Deals At Risk, Closing Soon, Win Rate (%), and Total Pipeline Value ($).
   - Filterable & Searchable deal cards (Acme Corporation, TechNova, Global Systems, Apex Financial, CyberShield).
   - Visual stage distribution chart using Recharts.

3. **Deal Intelligence Page**
   - **Deal Overview**: Stage, probability, value, close date, account owner, deal health, last interaction, recommended action.
   - **Customer Profile**: Pain points, stakeholders (Sarah Johnson VP Ops, Mike Chen Eng, David Vance Procurement), requirements, budget, timeline, priorities.
   - **Competitor Intelligence**: Tracks mentioned competitors (e.g. Salesforce, HubSpot), customer sentiment, consideration reasons, and counter-strategies.
   - **Visual Pipeline Progress Bar**: Stage progress timeline showing interaction history per stage.

4. **Add Interaction & Real-Time AI Extraction Pipeline**
   - Submitting interaction notes automatically runs the AI Extraction pipeline.
   - Extracts new objections, requirements, stakeholders, competitors, buying signals, risks, and action items.
   - Automatically updates deal risk level and synthesizes a new **Next Best Action**.

5. **AI Deal Brief & "BRIEF ME" Feature**
   - **AI Deal Brief**: Synthesizes executive summary, main objections, buying signals, current risk, recommended strategy, and next action.
   - **"BRIEF ME" (Pre-Call Briefing)**: Generates a 60-second pre-call briefing detailing: *What Happened, What Matters Most, What Worked Previously, What to Avoid, Recommended Approach,* and *Suggested Talking Points*.

6. **Next Best Action & Risk Detection**
   - Dedicated AI card displaying the top recommended action + **"WHY?" reasoning** derived from memory + confidence percentage badge.
   - Automatic risk level detection (Low / Medium / High) with risk explanations and mitigation steps.

7. **Deal Memory Search & Embedded AI Chat Assistant**
   - Instant search across deal memory (`"Sarah"`, `"Salesforce"`, `"implementation"`, `"pricing"`).
   - Embedded chat drawer allowing reps to ask natural language questions about the current deal using memory-retrieved context.

---

## 🏗️ Technology Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Glassmorphism UI
- **Backend**: Node.js, Express, REST API
- **Database**: PostgreSQL (`pg` driver) with schema DDL + automatic zero-config persistent local store fallback (`server/data/store.json`) for instant execution.
- **AI Core**: Google Gemini 1.5 Flash (`@google/generative-ai`) with a smart context-aware fallback engine in Demo Mode.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# AI API Key (Optional: If omitted, system runs in Smart Demo AI Mode)
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL Database (Optional: If omitted, uses server/data/store.json)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/deal_intelligence
```

---

## 🛠️ Quick Start & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally (Frontend + Backend Concurrently)

```bash
npm run dev
```

- **Frontend App**: `http://localhost:3000`
- **Express Backend API**: `http://localhost:5000/api`

### 3. Database Setup (Optional PostgreSQL)

If using PostgreSQL, execute the schema and seed scripts:

```bash
psql -U postgres -d deal_intelligence -f server/db/schema.sql
```

---

## 🎬 Hackathon Judging Demo Flow ("The Memory Moment")

To demonstrate the **Persistent Deal Memory + AI Intelligence Pipeline**:

1. **Open the Application**: Go to `http://localhost:3000`.
2. **Select Acme Corporation**: Click on **Acme Corporation** ($120,000 | Stage: Negotiation | Risk: Medium).
3. **Review Current Memory**:
   - Notice historical interactions: Discovery Call, Product Demo, Pricing Discussion, Technical Discussion, Follow-up.
   - Notice current Next Best Action: *"Schedule a 30-minute implementation planning call with Sarah Johnson"*.
4. **Trigger "The Memory Moment"**:
   - Click **"+ Add Interaction"**.
   - Select Type: **Call**.
   - Paste this new customer statement:
     > *"Sarah said they are interested in moving forward, but implementation time is still the biggest concern. She wants a detailed 30-day implementation plan."*
   - Click **"Process & Save Memory"**.
5. **Observe AI Agent Adaptation**:
   - The AI extraction pipeline runs in real-time, extracting a **Critical Requirement** (*30-day implementation plan*) and **High Risk**.
   - The **Next Best Action** adapts to: *"Schedule a 30-minute implementation planning meeting with Sarah Johnson to review the 30-day onboarding plan"*, with confidence increasing to **92%**.
6. **Test "BRIEF ME"**:
   - Click **[ BRIEF ME ]** at the top right to see pre-call talking points tailored to Sarah's 30-day requirement.
7. **Ask the Deal AI Assistant**:
   - Open the bottom-right AI Assistant and ask: *"What should I discuss in my next meeting?"*
   - The agent answers using the **complete updated deal history**!
8. **Reset Demo Dataset**:
   - Click **"Reset Demo Memory"** in the top header anytime to restore the baseline seed state.

---

## 📁 Project Structure

```
.
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── .env.example
├── README.md
├── server/
│   ├── index.ts                # Express REST API routes & server entry
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL DDL schema
│   │   ├── seedData.ts         # Demo dataset definitions
│   │   └── dbStore.ts          # Unified Database & Storage Adapter
│   └── services/
│       └── aiService.ts        # AI Pipeline (Gemini LLM + Fallback AI Engine)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types.ts
    ├── services/
    │   └── api.ts              # Frontend API client
    └── components/
        ├── Header.tsx          # Top navigation & system status
        ├── Sidebar.tsx         # Left navigation bar
        ├── SalesDashboard.tsx  # Pipeline dashboard & deal table
        └── DealIntelligence.tsx # Main Deal Intelligence view & modals
```
