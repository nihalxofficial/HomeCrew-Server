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
- [Tech Stack / npm Packages](#-npm-packages-used)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [License](#-license)

---

## 📖 About

This is the backend API for [HomeCrew](https://homecrew-rosy.vercel.app) — a home services booking platform. It handles authentication, service/category data, bookings and the platform's core business logic, serving the [Next.js client](https://github.com/nihalxofficial/HomeCrew-Home-Services-Platform) over a REST API.

---

## 🎯 Project Overview

### Objective
To provide a typed, maintainable Express API that backs the HomeCrew client — handling auth, service catalog data and bookings — built with a clean, layered structure rather than logic packed directly into route handlers.

### Platforms Used
- **Runtime:** Node.js, TypeScript
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT via `jose-cjs`
- **Hosting:** Vercel

### Deployments
| Component | Link |
|---|---|
| 🌐 Live App (client) | [homecrew-rosy.vercel.app](https://homecrew-rosy.vercel.app) |
| 📁 Client Repo | [HomeCrew-Home-Services-Platform](https://github.com/nihalxofficial/HomeCrew-Home-Services-Platform) |

---

## 📦 npm Packages Used

| Package | Purpose |
|---|---|
| `express` | Web framework / routing |
| `typescript` | Type safety across the server |
| `mongodb` / `mongoose` | Database driver & ODM |
| `jose-cjs` | JWT signing & verification |

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=your_client_app_url
```

> Never commit `.env` to version control.

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

## 🗺️ Roadmap

<!-- Optional: list planned improvements, e.g. -->
- [ ] Booking & payment endpoints
- [ ] Pro/provider listing management endpoints
- [ ] Rate limiting & request validation middleware
- [ ] API documentation (Swagger/OpenAPI)

---

## 📄 License

<!-- Add your chosen license, e.g. MIT -->
This project is licensed under the MIT License.
