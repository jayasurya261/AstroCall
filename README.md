# 🔮 AstroCall — Live Astrology Consultation Platform

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-Video_&_Voice-FF5733?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**AstroCall** is a modern, full-featured astrology consultation platform that connects users with professional astrologers through real-time video and voice calls, live chat, personalized birth charts, and daily horoscopes.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Screenshots](#-screenshots)

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
