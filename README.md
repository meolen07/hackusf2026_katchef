# KatChef

**Turn your fridge into dinner.**

KatChef is an AI-powered cooking companion that helps people go from fridge chaos to realistic meal ideas in a calm, delightful way.

Built as a real cross-platform product:
- mobile app with Expo + React Native
- web app with Expo Web
- deployable FastAPI backend
- Firebase auth + Firestore persistence
- Google Vision ingredient detection
- Gemini-powered meal guidance

## Why KatChef

Most people already have food at home, but still get stuck on the same question:

**"What can I actually cook with this?"**

KatChef solves that by combining:
- ingredient scanning
- a searchable virtual fridge
- a fast AI cooking assistant
- a product UX that feels polished instead of robotic

## Core Experience

### KatLens
Take a photo of ingredients and let KatChef detect what is in the image.

### MyFridge
Keep a living inventory of what you already have, search it quickly, and clean it up before things go to waste.

### Chat with KatChef
Ask broad questions like:
- "Give me a healthy dinner idea"
- "What should I use before it goes bad?"
- "Turn my fridge into lunch"

KatChef responds with realistic recipes, concise cooking tips, and step-by-step ideas.

### Profile + Badges
Track progress with a lightweight reward loop:
- levels
- XP
- unlockable badges
- avatar support
- food preferences like vegan / allergies

## What Makes It Feel Like a Real Product

- premium cream / coral / green design language
- Poppins + Inter typography
- responsive layouts for mobile and desktop
- platform-aware scan flow
- web + mobile auth handling
- graceful AI fallback behavior
- deployable frontend and backend setup

## Tech Stack

### Frontend
- Expo SDK 54
- React Native
- React Native Web
- React Navigation
- Zustand
- Firebase Auth
- Firestore

### Backend
- FastAPI
- Uvicorn
- Firebase Admin
- Google Cloud Vision
- Gemini API

### AI Layer
- prompt + chain helpers in `ai/chatbot/`
- resilient backend recipe fallback generation
- fast path responses for common meal prompts

## Repo Structure

```text
katchef1/
├── ai/
│   └── chatbot/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routers/
│   ├── services/
│   └── main.py
├── frontend/
│   ├── assets/
│   ├── firebase/
│   ├── scripts/
│   ├── src/
│   ├── app.config.js
│   ├── app.json
│   ├── eas.json
│   └── package.json
├── .env.example
├── Dockerfile
├── requirements.txt
└── README.md
```

## Run Locally

### 1. Create env file

```bash
cp .env.example .env
```

### 2. Start backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8081}
```

Health check:

```bash
curl http://127.0.0.1:8081/health
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run web
```

Useful frontend commands:

```bash
npm run start:lan
npm run start:tunnel
npm run start:dev-client
npm run typecheck
npm run export:web
npm run preview:web
```

## Environment

### Backend private env vars

These stay in root `.env` and should never be committed:

- `GEMINI_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_PROJECT_ID`
- `BACKEND_CORS_ORIGINS`
- `BACKEND_CORS_ORIGIN_REGEX`

### Frontend public env vars

These are synced into `frontend/.env` before Expo starts:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_API_PORT`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

## Firebase Setup

KatChef expects a real Firebase project.

Enable:
- Authentication
- Firestore Database

Turn on these providers:
- Email / Password
- Google
- Anonymous

Also:
- create Firestore
- publish `frontend/firebase/firestore.rules`
- add `localhost`, `127.0.0.1`, and your deployed web domain to Firebase authorized domains

## Google Vision + Gemini Setup

### Vision
KatLens uses Google Cloud Vision from the backend.

You need:
- Vision API enabled
- Google Cloud billing enabled
- backend credentials configured

### Gemini
KatChef chat uses Gemini from the backend.

You need:
- `GEMINI_API_KEY`
- a valid model

Current default:
- `gemini-2.5-flash`

## Web Deployment

KatChef supports Expo web export.

```bash
cd frontend
npm run export:web
```

Deploy:
- `frontend/dist/`

Production notes:
- set `EXPO_PUBLIC_API_BASE_URL` to your deployed backend
- add SPA rewrites if your static host requires them
- add the deployed web domain to:
  - Firebase Auth authorized domains
  - backend CORS

## Mobile Deployment

KatChef is prepared for Expo / EAS builds.

Relevant files:
- `frontend/app.config.js`
- `frontend/app.json`
- `frontend/eas.json`

Build examples:

```bash
cd frontend
eas login
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

Notes:
- mobile should point to a public HTTPS backend in production
- native Google sign-in is meant for real native builds, not plain Expo Go
- scan uses platform-aware behavior: live camera on native, photo upload fallback on web

## Backend Deployment

### Uvicorn

```bash
uvicorn backend.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8081}
```

### Docker

```bash
docker build -t katchef-api .
docker run --env-file .env -p 8081:8081 katchef-api
```

Health endpoint:

```text
GET /health
```

## Deployment Checklist

- fill `.env`
- configure Firebase Auth + Firestore
- publish Firestore rules
- enable Google Vision API
- enable Google Cloud billing for Vision
- add Gemini API key
- run:

```bash
cd frontend && npm run typecheck
cd frontend && npm run export:web
python3 -m compileall backend ai
```

- verify `GET /health`
- deploy backend
- set production `EXPO_PUBLIC_API_BASE_URL`
- deploy web or build mobile with EAS

## Demo Notes

For the cleanest demo:
- use a real backend URL
- use a real Firebase project
- use food photos with clear lighting for KatLens
- use `New chat` before demoing chatbot flows

## Status

KatChef is set up as:
- a web app
- a mobile app
- a deployable backend
- a polished hackathon / startup MVP

## License

Hackathon project. Add a license before open-source distribution.
