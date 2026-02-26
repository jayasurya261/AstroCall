# 🔮 AstroCall — Live Astrology Consultation Platform

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-Video_&_Voice-FF5733?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**AstroCall** is a modern, full-featured astrology consultation platform that connects users with professional astrologers through real-time video and voice calls, live chat, personalized birth charts, and daily horoscopes.

[Features](#-features) · [Architecture](#-architecture) · [Design Decisions](#-design-decisions) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [AI Usage Notes](#-ai-usage-notes)

</div>

---

## ✨ Features

### 👤 For Users
- **Explore Astrologers** — Discover astrologers with ratings, specializations, languages, and real-time availability status
- **Video & Voice Calls** — Book and join real-time consultations powered by LiveKit
- **Live Chat** — Real-time messaging with astrologers via Firestore
- **Birth Chart (Kundli)** — Enter birth details once → auto-generates a personalized North Indian style Kundli chart with 9 planetary positions
- **Daily Horoscope** — Personalized daily predictions with Love, Career, Health categories, mood score, lucky number, and compatible sign
- **Favorites** — Save and manage favorite astrologers for quick access
- **Reviews & Ratings** — Submit star ratings and comments after completed sessions
- **User Profile** — View session history, stats, and manage account settings

### 🔭 For Astrologers
- **Dashboard** — Manage incoming session requests (accept/reject), view stats, and track earnings
- **Online/Offline Toggle** — Control availability in real-time
- **Hourly Rate Editor** — Set and update consultation rates
- **Languages & Specializations** — Select spoken languages (12 Indian languages) and specialization tags (Vedic, Tarot, Numerology, Palmistry, Vastu, etc.)
- **Client Messages** — View and respond to chat conversations
- **Reviews Section** — View all received reviews with ratings
- **Profile Photo Upload** — Upload and update profile avatar

### 🌐 Platform Features
- **Multi-Language Support (i18n)** — Full app translated in **English**, **Hindi**, **Tamil**, and **Telugu** with a language switcher in the navbar
- **Dark Mode** — System-aware theme toggle (Light / Dark / System)
- **Responsive Design** — Fully responsive across mobile, tablet, and desktop
- **Google-Only Authentication** — Streamlined sign-in with Google OAuth via Firebase Auth (no email/password)
- **Role-Based Access** — Separate dashboards for Users, Astrologers, and Admins
- **Admin Dashboard** — Manage users, astrologers, and platform settings
- **Real-Time Data** — Firestore-powered real-time updates across the platform

---

## 🏗 Architecture

### High-Level Overview

AstroCall is a **serverless single-page application (SPA)** — there is no custom backend server. All server-side concerns are handled by managed services:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                             │
│  React 19 SPA  ─  Vite 7  ─  Tailwind CSS 4  ─  shadcn/ui         │
├──────────────┬───────────────┬──────────────────┬───────────────────┤
│  Firebase    │  LiveKit      │  Astrology       │  i18n             │
│  Auth + DB   │  WebRTC       │  Engine          │  4 languages      │
│  + Storage   │  Video/Voice  │  (client-side)   │  (browser detect) │
└──────┬───────┴───────┬───────┴──────────────────┴───────────────────┘
       │               │
       ▼               ▼
  ┌──────────┐   ┌───────────┐
  │ Firebase │   │  LiveKit  │
  │ Cloud    │   │  Cloud    │
  │ (Google) │   │  (WebRTC) │
  └──────────┘   └───────────┘
```

### Component Architecture

The codebase follows a **layered component architecture** with three distinct tiers:

| Layer | Directory | Purpose |
|-------|-----------|---------|
| **UI Primitives** | `src/components/ui/` | 11 shadcn/ui components (Button, Card, Badge, Avatar, etc.) built on Radix UI headless primitives |
| **Domain Components** | `src/components/astrology/` | 3 astrology-specific components — `BirthChart`, `DailyHoroscope`, `DailyPanchang` |
| **Layout Components** | `src/components/layout/` | `Navbar` and `Footer` — shared application shell |
| **Page Components** | `src/pages/` | 13 route-level pages composing all of the above |

### Data Flow & State Management

```
                        ┌─────────────────┐
                        │   AuthContext    │
                        │ (React Context)  │
                        └────────┬────────┘
                                 │ provides: currentUser, userRole,
                                 │ login/signup/logout functions
                                 ▼
                   ┌─────────────────────────┐
                   │      Page Components     │
                   │  (direct Firestore calls)│
                   └─────────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ Firebase │  │ Firebase │  │   LiveKit     │
        │Firestore │  │ Storage  │  │  (WebRTC)     │
        │ (7 cols) │  │ (photos) │  │  (video/voice)│
        └──────────┘  └──────────┘  └──────────────┘
```

**State management is intentionally minimal** — there is no Redux, Zustand, or other global store. `AuthContext` is the only React Context. Individual pages make direct Firestore calls within `useEffect` hooks, keeping each page self-contained.

### Firestore Data Model

| Collection | Document ID | Key Fields | Purpose |
|------------|------------|------------|---------|
| `users` | `auth.uid` | `email`, `role`, `createdAt`, `birthDetails` | User profiles & role mapping |
| `astrologers` | `auth.uid` | `name`, `bio`, `languages[]`, `specializations[]`, `hourlyRate`, `isOnline`, `rating`, `photoURL` | Astrologer public profiles |
| `sessions` | auto-ID | `userId`, `astrologerId`, `status`, `callType`, `roomName`, `createdAt` | Call booking & session lifecycle |
| `reviews` | auto-ID | `userId`, `astrologerId`, `rating`, `comment`, `createdAt` | Post-session reviews |
| `chats` | auto-ID | `participants[]`, `lastMessage`, `updatedAt` | Chat conversation metadata |
| `messages` | auto-ID | `chatId`, `senderId`, `text`, `createdAt` | Individual chat messages |
| `favorites` | auto-ID | `userId`, `astrologerId` | User's saved astrologers |

### Authentication Flow

```
User clicks "Sign in with Google"
        │
        ▼
  Firebase Google OAuth popup
        │
        ▼
  ┌─ User exists in Firestore? ─┐
  │ YES                          │ NO
  ▼                              ▼
  Fetch role from `users`    Show role-selection UI
  collection, redirect to    (User / Astrologer)
  role-specific dashboard         │
                                  ▼
                             Create `users` doc
                             (+ `astrologers` doc
                              if role=astrologer)
                                  │
                                  ▼
                             Redirect to dashboard
```

The auth is a **two-step Google login**: `loginWithGoogle()` authenticates and checks Firestore, then `completeGoogleLoginWithRole()` persists the chosen role. `onAuthStateChanged` restores sessions on page reload.

### Routing & Access Control

All 13 routes are defined in `App.jsx` via React Router DOM v7. The `HomeRedirect` component checks `userRole` and redirects:

- **Unauthenticated** → Landing page (`Home.jsx`)
- **`user`** → `/user-dashboard`
- **`astrologer`** → `/astrologer-dashboard`
- **`superadmin`** → `/admin-dashboard`

### Deployment

- **Hosting**: Vercel (static SPA deployment)
- **SPA Routing**: `vercel.json` rewrites all paths to `/` for client-side routing
- **Build**: `vite build` produces a static `dist/` folder

---

## 🧠 Design Decisions

### 1. Serverless / No Custom Backend

**Decision**: No Express, Next.js API routes, or Cloud Functions — the client talks directly to Firebase and LiveKit.

**Rationale**: For an MVP/student project, this eliminates ops complexity entirely. Firebase handles auth, database, storage, and security rules. The tradeoff is that LiveKit tokens are currently generated client-side (see below), which is acceptable for prototyping but must be moved server-side for production.

### 2. Client-Side LiveKit Token Generation

**Decision**: LiveKit JWT tokens are generated in the browser using the `jose` library (`src/lib/livekit.js`).

**Rationale**: This avoids standing up a token server during development. The API key and secret are stored in environment variables exposed to the client. **⚠️ For production, this MUST be moved to a backend (Cloud Function or API route)** to prevent API secret exposure.

### 3. Google-Only Authentication

**Decision**: No email/password registration — Google OAuth is the only sign-in method.

**Rationale**: Reduces friction significantly (one-tap sign-in), avoids password management headaches, and provides a verified profile photo and display name from the Google account. The two-step flow (authenticate → select role) keeps the UX clean while supporting multiple user types.

### 4. No Global State Management Library

**Decision**: Only `AuthContext` exists; no Redux/Zustand/Jotai.

**Rationale**: Each page is relatively self-contained — astrologer listings, dashboards, chat, etc. all fetch their own data via Firestore hooks. Adding a state library would introduce unnecessary complexity for the current feature set. If the app grows (e.g., shared notifications, real-time presence), this decision would need revisiting.

### 5. Client-Side Astrology Calculations

**Decision**: All zodiac, Kundli, horoscope, and Panchang calculations happen in `src/lib/astrology.js` — no external API calls.

**Rationale**: Deterministic algorithms (hash-based daily variation, orbital period approximations) mean zero API costs and instant results. The Kundli positions are simplified estimates, not full astronomical ephemeris calculations — the comments in code make this explicit. This is appropriate for an entertainment/spiritual app, not a scientific tool.

### 6. shadcn/ui + Radix UI Component System

**Decision**: Use shadcn/ui (copy-paste model) over a traditional component library like MUI or Ant Design.

**Rationale**: shadcn/ui gives full control over component source code (`src/components/ui/`), integrates natively with Tailwind CSS, and uses Radix UI headless primitives for accessibility. Components are vendored into the repo, so there's no risk of upstream breaking changes.

### 7. i18n from Day One

**Decision**: All user-facing text is externalized to JSON locale files (`src/locales/`) from the start.

**Rationale**: Targeting an Indian market requires multilingual support (English, Hindi, Tamil, Telugu). Building i18n into the initial architecture is dramatically cheaper than retrofitting it later. `i18next-browser-languagedetector` auto-selects the user's language with a manual override in the navbar.

### 8. Flat File Structure (No Barrel Exports)

**Decision**: Pages, components, and lib files are in flat directories — no index.js barrel files or deeply nested folder-per-component structure.

**Rationale**: For a ~30-file project, flat structure is easier to navigate. Vite's `@` alias (configured in `vite.config.js`) keeps imports clean: `@/components/ui/button` instead of `../../../components/ui/button`.

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + Vite 7 |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **Video/Voice** | LiveKit (WebRTC) |
| **Routing** | React Router DOM 7 |
| **i18n** | react-i18next + i18next-browser-languagedetector |
| **Themes** | next-themes |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Toasts** | Sonner |
| **JWT (client)** | jose |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A **Firebase** project with Authentication, Firestore, and Storage enabled
- A **LiveKit** account (for video/voice calls)

### 1. Clone the Repository

```bash
git clone https://github.com/jayasurya261/AstroCall.git
cd AstroCall
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
VITE_LIVEKIT_API_KEY=your_livekit_api_key
VITE_LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 4. Firebase Setup

1. Enable **Google Sign-In** in Firebase Console → Authentication → Sign-in Methods
2. Create a **Firestore Database** with the following collections:
   - `users` — User profiles and birth details
   - `astrologers` — Astrologer profiles (name, bio, languages, specializations, hourlyRate, isOnline)
   - `sessions` — Call session records
   - `reviews` — User reviews for astrologers
   - `chats` — Chat conversation metadata
   - `messages` — Individual chat messages
   - `favorites` — User favorite astrologers
3. Enable **Firebase Storage** for profile photo uploads

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
src/
├── assets/                  # Static assets
├── components/
│   ├── astrology/           # BirthChart, DailyHoroscope, DailyPanchang components
│   ├── layout/              # Navbar, Footer
│   ├── ui/                  # shadcn/ui components (Button, Card, Badge, etc.)
│   ├── ThemeProvider.jsx     # Dark mode provider
│   └── ThemeToggle.jsx       # Theme toggle button
├── contexts/
│   └── AuthContext.jsx       # Firebase auth context with role management
├── lib/
│   ├── astrology.js          # Zodiac calculator, planetary positions, horoscope engine
│   ├── firebase.js           # Firebase config and initialization
│   ├── livekit.js            # LiveKit token generation and call helpers
│   └── utils.js              # Utility functions
├── locales/
│   ├── en.json               # English translations
│   ├── hi.json               # Hindi translations
│   ├── ta.json               # Tamil translations
│   └── te.json               # Telugu translations
├── pages/
│   ├── Home.jsx              # Landing page
│   ├── Login.jsx             # Google OAuth sign-in page
│   ├── Astrologers.jsx       # Browse astrologers directory
│   ├── AstrologerProfile.jsx # Individual astrologer profile
│   ├── AstrologerDashboard.jsx # Astrologer management dashboard
│   ├── AstrologerReviews.jsx # Dedicated reviews page
│   ├── UserDashboard.jsx     # User dashboard with sessions, chart & horoscope
│   ├── UserProfile.jsx       # User profile & settings
│   ├── Chat.jsx              # Real-time chat interface
│   ├── Favorites.jsx         # Saved astrologers
│   ├── CallRoom.jsx          # LiveKit video/voice call room
│   ├── About.jsx             # About page
│   └── AdminDashboard.jsx    # Admin panel
├── i18n.js                   # i18next configuration
├── App.jsx                   # Root component with routing
├── main.jsx                  # Entry point
└── index.css                 # Global styles & Tailwind directives
```

---

## 🌍 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English  | `en` | ✅ Complete |
| Hindi    | `hi` | ✅ Complete |
| Tamil    | `ta` | ✅ Complete |
| Telugu   | `te` | ✅ Complete |

---

## 🔮 Astrology Features

### Birth Chart (Kundli)
- North Indian style SVG chart with 12 houses
- 9 planetary positions: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
- Ascendant (Lagna) calculation based on birth time
- Zodiac sign, element, and ruling planet display
- One-time entry — saved to Firestore and reused automatically

### Daily Horoscope
- Personalized predictions based on zodiac sign
- Categories: General, Love, Career, Health
- Daily mood score with visual bar
- Lucky number, lucky color, compatible sign
- Changes every day (deterministic algorithm)

---

## 🤖 AI Usage Notes

This section documents how AI tools were used during the development of AstroCall, in the spirit of transparency.

### What AI Was Used For

| Area | How AI Assisted |
|------|----------------|
| **Scaffolding** | Initial project structure, Vite + React + Tailwind setup, and boilerplate file generation |
| **Component Development** | Page components (dashboards, profiles, chat UI) were built iteratively with AI pair-programming — the developer described features and refined AI-generated code |
| **Astrology Engine** | The zodiac calculation logic, Kundli house placement algorithm, daily horoscope generator, and Panchang calculator in `src/lib/astrology.js` were co-authored with AI assistance |
| **i18n Translations** | Hindi, Tamil, and Telugu locale files (`src/locales/`) were generated with AI translation and reviewed by the developer |
| **Integration Code** | Firebase auth flow, Firestore CRUD operations, LiveKit token generation, and real-time data subscriptions |
| **UI/UX Refinement** | Responsive layouts, dark mode theming, and shadcn/ui component customization |

### What the Developer Did

- **Product vision & feature design** — Defined what the app should do 
- **Architecture decisions** — Chose the serverless SPA approach, Firebase + LiveKit stack, client-side astrology engine, and i18n strategy
- **Code review & iteration** — Every AI-generated output was reviewed, tested, and refined through multiple iterations
- **UI/UX changes** — Designed and iterated on layouts, color schemes, component styling, and responsive breakpoints across all pages
- **Debugging & integration** — Resolved runtime issues, Firebase configuration, LiveKit call flows, and cross-component data flow
- **Manual testing** — Personally tested every feature end-to-end — auth flows, video/voice calls, chat, booking sessions, astrologer dashboard actions, birth chart generation, horoscope display, favorites, reviews, and i18n switching
- **Deployment** — Configured Vercel, environment variables, and production settings
- **Domain expertise** — Specified astrology domain requirements (Vedic chart layout, Panchang elements, 12 Indian languages for specializations)


---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Jayasurya](https://github.com/jayasurya261)**

⭐ Star this repo if you found it useful!

</div>
