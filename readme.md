<div align="center">

# 🛠️ HomeCrew Server

### *API & backend service for the HomeCrew home services platform.*

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ea44f?style=for-the-badge)](https://homecrew-rosy.vercel.app)
[![Client Repo](https://img.shields.io/badge/Client-Repository-blue?style=for-the-badge)](https://github.com/nihalxofficial/HomeCrew-Home-Services-Platform)

</div>

---

## 📑 Table of Contents

- [About](#-about)
- [Project Overview](#-project-overview)
  - [Objective](#objective)
  - [Platforms Used](#platforms-used)
  - [Deployments](#deployments)
- [Architecture](#-architecture)
- [AI Integrations](#-ai-integrations)
- [Tech Stack / npm Packages](#-npm-packages-used)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [License](#-license)

---

## 📖 About

This is the backend API for [HomeCrew](https://homecrew-rosy.vercel.app) — a home services booking platform. It handles authentication, service/category data, bookings, and two separate AI-powered features (a conversational advisor and a listing generator), serving the [Next.js client](https://github.com/nihalxofficial/HomeCrew-Home-Services-Platform) over a REST API.

---

## 🎯 Project Overview

### Objective
To provide a typed, maintainable Express API that backs the HomeCrew client — handling auth, service catalog data, bookings, and multi-provider AI integration — while keeping both AI providers' API keys server-side only.

### Platforms Used
- **Runtime:** Node.js, TypeScript
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT via `jose-cjs`
- **AI:** Google Gemini (chatbot) + Groq (listing generation)
- **Hosting:** Vercel

### Deployments
| Component | Link |
|---|---|
| 🌐 Live App (client) | [homecrew-rosy.vercel.app](https://homecrew-rosy.vercel.app) |
| 📁 Client Repo | [HomeCrew-Home-Services-Platform](https://github.com/nihalxofficial/HomeCrew-Home-Services-Platform) |

---

## 🏗️ Architecture

The API follows a layered backend architecture to keep concerns separated and testable:

```
Route → Controller → Service → Repository → Model
```

- **Route** — defines endpoints and applies middleware (auth, validation)
- **Controller** — parses the request, calls the relevant service, shapes the response
- **Service** — business logic, orchestrates repository calls (or third-party AI calls)
- **Repository** — data-access layer, isolates Mongoose queries from business logic
- **Model** — Mongoose schemas/models

---

## 🤖 AI Integrations

Two separate AI providers power two distinct features, each picked to match the shape of the task:

### 1. AI Advisor Chatbot — Google Gemini
Handles multi-turn conversation with customers to help diagnose a home/appliance problem before matching them to a service.

- **Endpoint:** `POST /api/chat`
- **Model:** `gemini-flash-latest` (auto-resolves to Google's current recommended Flash model)
- **Input:** `{ message: string, history: { role: "user" | "model", text: string }[] }`
- **Output:** `{ reply: string }`
- The server is stateless — the client sends the full conversation history with every request; Gemini's `startChat()` handles multi-turn context from that history.

### 2. AI Service Listing Generator — Groq
Takes a rough one-line idea from a pro and generates a complete draft service listing.

- **Endpoint:** `POST /api/services/generate`
- **Model:** `openai/gpt-oss-120b` (migrated from the now-deprecated `llama-3.3-70b-versatile`)
- **Input:** `{ idea: string }`
- **Output:** a structured JSON draft matching the `Service` schema (`title`, `category`, `shortDescription`, `fullDescription`, `price`, `priceUnit`, `duration`, `tags`)
- Cross-references existing `Service` categories in MongoDB so generated listings stay consistent with the platform's real category set.

### 3. AI Service Matcher — Groq
Takes a customer's problem description and classifies it against existing service categories to surface matching listings.

- **Endpoint:** `POST /api/advisor`
- **Model:** `openai/gpt-oss-120b`
- **Input:** `{ problemDescription: string }`
- **Output:** `{ category, confidence, reasoning, matchedServices }`

> Both providers' API keys are read from server-side environment variables only — never exposed to the Next.js client.

---

## 📦 npm Packages Used

| Package | Purpose |
|---|---|
| `express` | Web framework / routing |
| `typescript` | Type safety across the server |
| `mongodb` / `mongoose` | Database driver & ODM |
| `jose-cjs` | JWT signing & verification |
| `@google/generative-ai` | Gemini SDK — powers the AI Advisor Chatbot |
| `groq-sdk` | Groq SDK — powers the AI Service Listing Generator & Matcher |

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=your_client_app_url

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

> Never commit `.env` to version control.
>
> Model names for both providers change fairly often as they retire older versions — if either AI endpoint starts returning 404s, check [Google AI Studio](https://aistudio.google.com) or [console.groq.com/docs/models](https://console.groq.com/docs/models) for the current model name before assuming the integration is broken.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/nihalxofficial/HomeCrew-Server.git
cd HomeCrew-Server

# Install dependencies
npm install

# Start development server
npm run dev
```

The API will be available at [http://localhost:5000](http://localhost:5000).

---

## 📄 License

<!-- Add your chosen license, e.g. MIT -->
This project is licensed under the MIT License.
