# ValueVis

A web app for aligning daily tasks, habits, and goals with your core values. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Values** — Select up to 3 core values from Schwartz Value Theory and track how your daily actions reflect them
- **Calendar** — View and manage events, link them to your values, and practice mental rehearsal. Supports Google Calendar import
- **Todo** — Task management organized by project and priority, with value linking
- **Habits** — Morning and evening routines tied to your values
- **Coach** — AI-powered chat coach that knows your values, goals, and progress

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Google Sign-In enabled

### Installation

```bash
git clone https://github.com/ireneyaejinnam/value-vis-web.git
cd value-vis-web
npm install
```

### Configuration

Create a `.env` file in the root (see `.env.example`):

```env
VITE_OPENAI_API_KEY=your_openai_api_key   # optional — app runs in demo mode without it
```

Update `src/config/firebase.ts` with your own Firebase project config.

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building for production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Zustand** — state management (persisted to localStorage)
- **React Router v6** — routing
- **Firebase Auth** — Google Sign-In
- **Google Calendar API** — calendar import
- **OpenAI API** — streaming AI coach (optional)

## Deployment

The app is deployed on Vercel. Any push to `main` triggers an automatic redeploy.
