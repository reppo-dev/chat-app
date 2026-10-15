# 🌐 EchoNet — Full-Stack Real-Time Social & Messaging Platform

<div align="center">

![EchoNet Banner](screenshots/03-home.png)

<p align="center">
  <strong>A high-performance, real-time social networking and direct messaging platform built with modern Go and Next.js.</strong>
</p>

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-E03C11?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org)
[![Built with Antigravity](https://img.shields.io/badge/Built%20With-Antigravity-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://antigravity.google)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Screenshots](#-screenshots) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**EchoNet** is an enterprise-grade, full-stack social media and instant communication application. Designed with concurrency, low latency, and responsive UI in mind, it combines a blazing-fast **Go (Gin + pgx)** backend with a cutting-edge **Next.js 16 (React 19 + Turbopack)** frontend.

Whether posting rich updates with customized color backgrounds, sending instant messages via low-latency WebSockets, managing friendships, or getting live notification alerts, EchoNet delivers a seamless social experience.

---

## 📸 Screenshots

<div align="center">

### 🌟 Main Feed & Theme Modes

| ☀️ Light Mode Feed | 🌙 Dark Mode Feed |
| :---: | :---: |
| ![Light Mode](screenshots/03-home.png) | ![Dark Mode](screenshots/13-home-dark-mode.png) |

---

### 👤 Profile & User Customization

| 👤 User Profile | ✏️ Edit Profile Modal |
| :---: | :---: |
| ![Profile](screenshots/04-profile.png) | ![Edit Profile](screenshots/14-edit-profile-modal.png) |

---

### 💬 Instant Messaging & Discovery

| 💬 New Conversation Dialog | 🔍 User Search Dialog |
| :---: | :---: |
| ![Chat Dialog](screenshots/11-new-conversation-dialog.png) | ![Search Dialog](screenshots/10-search-dialog.png) |

---

### 🔔 Live Notifications & Community

| 🔔 Notifications Dropdown | 👥 Community Groups |
| :---: | :---: |
| ![Notifications](screenshots/12-notifications-dropdown.png) | ![Groups](screenshots/07-groups.png) |

---

### 🛍️ Market & Video Hub

| 🛍️ Marketplace | 📺 Watch / Video Feed |
| :---: | :---: |
| ![Marketplace](screenshots/06-marketplace.png) | ![Watch](screenshots/05-watch.png) |

---

### 🔐 Authentication

| 🔑 Login Page | 📝 Register Page |
| :---: | :---: |
| ![Login](screenshots/01-login.png) | ![Signup](screenshots/02-signup.png) |

</div>

---

## ✨ Key Features

### 📡 Real-Time Communication Engine
- **WebSocket Hub:** Instant bidirectional event distribution for messages, presence, read receipts, and live notifications.
- **Floating Chat Dock:** Non-intrusive floating conversation windows allowing uninterrupted navigation while chatting.
- **Read Receipts & Delivery States:** Visual indicators for delivered, seen, and unread message counters.

### 📝 Dynamic Social Feed & Content Creation
- **Rich Post Creation:** Support for text, background color styling themes, and image/video media uploads.
- **Granular Privacy Controls:** Audience visibility filters (`Public`, `Friends`, `Only Me`).
- **Interactive Reactions:** Multi-reaction engine supporting `Like`, `Love`, `Haha`, `Wow`, `Sad`, and `Angry`.
- **Nested Discussions:** Real-time comments and replies per post.

### 🤝 Social Graph & Relationships
- **Friend Requests:** Send, accept, decline, or cancel friend requests in real-time.
- **User Discovery:** Search users by name or email with instant typeahead query filters.
- **Mutual Network:** Friends overview and active contact counters.

### 🔔 Intelligent Notifications
- Real-time alerts for friend requests, reactions to posts, and discussion comments.
- One-click "Mark All as Read" with persistent database syncing.

### 🎨 Modern UI / UX Architecture
- **Next.js 16 & React 19:** Powered by App Router, Server Components, and Turbopack.
- **Fluid Theming:** Automatic System, Light, and Dark mode switching powered by `next-themes` and Tailwind CSS v4.
- **Robust State Management:** Redux Toolkit for UI & session cache alongside TanStack Query v5 for server-state caching and invalidation.

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 16 + React 19)"]
        UI[UI Components & Pages]
        Redux[Redux Toolkit Store]
        ReactQuery[TanStack Query Cache]
        WSClient[WebSocket Client]
        Axios[Axios HTTP Client]
    end

    subgraph Server ["Backend (Go + Gin Engine)"]
        Router[HTTP Router & Middleware]
        AuthGuard[JWT Auth Middleware]
        WSHub[WebSocket Hub & Client Pool]
        APIHandlers[REST API Controllers]
        SQLC[SQLC Generated Layer]
    end

    subgraph Database ["Persistence Layer"]
        PG[(PostgreSQL 16+)]
        Storage[(Media Storage /uploads)]
    end

    UI --> Redux
    UI --> ReactQuery
    ReactQuery --> Axios
    Axios -- "REST (JSON) / JWT" --> Router
    WSClient -- "ws://... / Events" <--> WSHub
    Router --> AuthGuard
    AuthGuard --> APIHandlers
    APIHandlers --> SQLC
    WSHub --> SQLC
    APIHandlers --> Storage
    SQLC --> PG
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Base UI](https://base-ui.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **HTTP & Realtime:** [Axios](https://axios-http.com/) & Native WebSockets

### Backend
- **Language:** [Go](https://golang.org/) (1.22+)
- **HTTP Framework:** [Gin Web Framework](https://gin-gonic.com/)
- **Database Driver:** [pgx/v5](https://github.com/jackc/pgx)
- **Database Generator:** [sqlc](https://sqlc.dev/) (Type-safe SQL compiler)
- **Migrations:** [golang-migrate](https://github.com/golang-migrate/migrate)
- **Security & Tokens:** [golang-jwt/jwt/v5](https://github.com/golang-jwt/jwt) & `golang.org/x/crypto/bcrypt`
- **Config Management:** [cleanenv](https://github.com/ilyakaznacheev/cleanenv)
- **Networking:** [quic-go](https://github.com/quic-go/quic-go) & WebSocket Hub

### Database & Infrastructure
- **Database:** PostgreSQL 15+ / 16+ with custom ENUMs and indexed foreign key relationships.

---

## 📂 Project Structure

```
chat-app/
├── backend/
│   ├── cmd/
│   │   └── api/             # Application entrypoint (main.go)
│   ├── config/              # Configuration files (dev.env)
│   ├── internal/
│   │   ├── config/          # Environment loader
│   │   ├── db/
│   │   │   ├── migrations/  # PostgreSQL schema migration files
│   │   │   ├── queries/     # Raw SQL query definitions for SQLC
│   │   │   └── sqlc/        # Auto-generated type-safe Go database code
│   │   ├── middleware/      # Authentication & CORS middleware
│   │   ├── models/          # Data transfer objects & custom models
│   │   ├── realtime/        # WebSocket Hub, Client, & Event dispatchers
│   │   ├── routes/          # API route definitions and HTTP handlers
│   │   └── utils/           # JWT, Bcrypt password hashing, and helpers
│   ├── uploads/             # Local upload storage for media files
│   ├── go.mod               # Go module specifications
│   ├── Makefile             # Database migration and generation recipes
│   └── sqlc.yaml            # SQLC compiler configuration
│
├── frontend/
│   ├── app/                 # Next.js App Router (Pages, Layouts, Providers)
│   │   ├── (auth)/          # Login & Signup routes
│   │   └── (home)/          # Feed, Profile, Groups, Watch, Events, Saved
│   ├── components/          # Reusable UI primitives (buttons, modals, sidebar)
│   ├── features/            # Feature-centric modules
│   │   ├── auth/            # Authentication forms & hooks
│   │   ├── chat/            # Chat dock, messages, conversations
│   │   ├── feed/            # Post composer, feeds, reactions
│   │   ├── friends/         # Friend requests, user search
│   │   └── profile/         # Profile header, edit dialog
│   ├── hooks/               # Custom reusable React hooks
│   ├── lib/                 # Core utilities (API client, Redux store, types)
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies and scripts
│
└── screenshots/             # Application showcase screenshots
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Go** (v1.22 or higher)
- **Node.js** (v20 or higher) & **pnpm** (v9 or higher)
- **PostgreSQL** (v15 or higher)
- **golang-migrate** *(optional, for running migrations via Makefile)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/reppo-dev/chat-app.git
cd chat-app
```

---

### 2. Database Setup

1. Create a PostgreSQL database named `chat-app`:
   ```sql
   CREATE DATABASE "chat-app";
   ```

2. Run the database migrations:
   ```bash
   cd backend
   # Using Makefile:
   make migrateup

   # Or execute the migration SQL files located in:
   # backend/internal/db/migrations/
   ```

---

### 3. Backend Configuration & Launch

1. Configure your environment file in `backend/config/dev.env`:
   ```env
   JWT_KEY=your-super-secret-jwt-key-here
   DB=postgres://postgres:password@localhost:5432/chat-app?sslmode=disable
   HTTP_ADDRESS=0.0.0.0:9090
   DB_DRIVER=pgx
   ```

2. Run the Go backend:
   ```bash
   cd backend
   go run cmd/api/main.go
   ```
   *The server will start listening on `http://localhost:9090`.*

---

### 4. Frontend Installation & Launch

1. Install frontend dependencies:
   ```bash
   cd frontend
   pnpm install
   ```

2. *(Optional)* Configure frontend environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9090
   ```
   *(Defaults to `http://localhost:9090` if not specified).*

3. Start the Next.js development server:
   ```bash
   pnpm dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 📡 API Documentation

### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register-email` | Register a new user | ❌ |
| `POST` | `/api/auth/login-email` | Authenticate & retrieve tokens | ❌ |
| `POST` | `/api/auth/logout` | Terminate session & revoke refresh token | ✅ |
| `POST` | `/api/auth/refresh-session` | Exchange refresh token for new access token | ❌ (Cookie) |
| `POST` | `/api/auth/current-user` | Retrieve authenticated user profile | ✅ |

### 👤 Users & Profiles
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/users/profile/:user_id` | Get user details and statistics | ✅ |
| `PUT` | `/api/users/profile` | Update profile (bio, avatar, phone, etc.) | ✅ |
| `GET` | `/api/users/search?q=:query` | Search users by name or email | ✅ |
| `GET` | `/api/users` | List users | ✅ |

### 📰 Posts & Feed
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/posts/feed` | Paginated feed of posts | ✅ |
| `POST` | `/api/posts` | Create a post (text, media, theme color) | ✅ |
| `GET` | `/api/posts/:post_id` | Fetch specific post by ID | ✅ |
| `PUT` | `/api/posts/:post_id` | Update post content or privacy | ✅ |
| `DELETE` | `/api/posts/:post_id` | Delete post | ✅ |
| `GET` | `/api/posts/user/:user_id` | Get all posts authored by a user | ✅ |

### 💬 Comments & Reactions
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/posts/:post_id/comments` | List comments for a post | ✅ |
| `POST` | `/api/posts/:post_id/comments` | Add comment or reply | ✅ |
| `PUT` | `/api/comments/:comment_id` | Edit comment content | ✅ |
| `DELETE` | `/api/comments/:comment_id` | Delete comment | ✅ |
| `POST` | `/api/posts/:post_id/reactions` | Add or update reaction (`like`, `love`, etc.) | ✅ |
| `DELETE` | `/api/posts/:post_id/reactions` | Remove reaction | ✅ |

### 💬 Conversations & Real-Time Messaging
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/conversations` | List user conversations | ✅ |
| `POST` | `/api/conversations` | Create direct or group conversation | ✅ |
| `GET` | `/api/conversations/:id/messages` | Fetch messages in a conversation | ✅ |
| `POST` | `/api/conversations/:id/messages` | Send message in a conversation | ✅ |
| `POST` | `/api/messages/:id/seen` | Mark message as read | ✅ |
| `GET` | `/ws` or `/api/ws` | WebSocket connection for real-time events | ✅ |

### 👥 Friendships & Requests
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/friends` | Get accepted friends list | ✅ |
| `POST` | `/api/friends/requests` | Send friend request | ✅ |
| `GET` | `/api/friends/requests/received` | List received pending requests | ✅ |
| `GET` | `/api/friends/requests/sent` | List sent pending requests | ✅ |
| `POST` | `/api/friends/requests/:id/accept` | Accept friend request | ✅ |
| `POST` | `/api/friends/requests/:id/reject` | Reject friend request | ✅ |
| `DELETE` | `/api/friends/:friend_id` | Remove friend | ✅ |

### 🔔 Notifications
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications` | Get user notifications list | ✅ |
| `PUT` | `/api/notifications/:id/read` | Mark single notification as read | ✅ |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | ✅ |

### 📁 File Uploads
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/upload` | Upload single file (image/video/attachment) | ✅ |
| `POST` | `/api/upload/multiple` | Upload batch of files | ✅ |

---

## ⚡ Real-Time WebSocket Events

The WebSocket connection delivers structured JSON frames conforming to:
```json
{
  "event_type": "event_name",
  "payload": { ... }
}
```

Supported real-time events include:
- `online` / `offline` — User presence transitions
- `message` / `message_updated` / `message_deleted` — Direct message lifecycle
- `delivered` / `read` — Instant read receipts
- `typing` — Live typing indicators
- `notification` — Real-time user alert dispatch
- `friend_request` / `friendship_created` — Instant relationship updates
- `reaction` / `comment` — Live post engagement updates

---

## 🤖 Built with Antigravity

This project was built and engineered with **[Google Antigravity](https://antigravity.google)** — the advanced agentic AI coding assistant and IDE. Antigravity accelerated full-stack development, WebSocket event choreography, and UI engineering across both Go and Next.js layers.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ using <strong>Google Antigravity</strong> by the EchoNet Team</sub>
</div>
