# Deeply Mobile

React Native mobile app for **Deeply** — a breathing exercise, relaxation, and freediving training platform inspired by professional freedivers.

---

## Stack

| Concern | Technology |
|---------|-----------|
| Framework | Expo SDK 54 + Expo Router v6 |
| Language | TypeScript (strict) |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| Server state | TanStack Query v5 |
| HTTP client | Axios (token injection + 401 refresh) |
| Client state | Zustand v5 |
| Validation | Zod + React Hook Form |
| Token storage | expo-secure-store |
| Animations | react-native-reanimated + expo-linear-gradient |

---

## Project Structure

```
deeply-mobile/
├── app/                          # Expo Router — file-based routes
│   ├── _layout.tsx               # Root layout: providers + animated splash gate
│   ├── index.tsx                 # Home screen entry
│   └── +not-found.tsx            # 404 fallback
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios instance + Bearer interceptor + refresh logic
│   │   ├── endpoints.ts          # All API endpoint constants
│   │   ├── types.ts              # TypeScript types for all backend DTOs
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── culture.service.ts
│   │       ├── dive.service.ts
│   │       ├── train.service.ts
│   │       └── user.service.ts
│   ├── features/
│   │   └── home/
│   │       ├── HomeScreen.tsx
│   │       ├── components/       # TrainBlockCard, DivePreviewCard, HomeHeader, SectionHeader
│   │       └── hooks/
│   │           └── useHomeData.ts
│   ├── shared/
│   │   ├── components/           # AppText, AppButton, AppCard, LoadingView, ErrorView, EmptyView, SplashView
│   │   └── lib/                  # cn (className merge), queryClient
│   ├── store/
│   │   └── authStore.ts          # Zustand — auth state + SecureStore persistence
│   ├── theme/
│   │   ├── colors.ts             # Brand color tokens
│   │   ├── spacing.ts            # 4pt grid spacing scale
│   │   └── typography.ts         # Font size / weight / tracking scale
│   └── config/
│       └── env.ts                # EXPO_PUBLIC_* env variables
├── global.css                    # NativeWind Tailwind directives
├── tailwind.config.js            # Brand palette + custom tokens
├── metro.config.js               # NativeWind Metro integration
├── babel.config.js               # NativeWind Babel preset
└── .env.example                  # Environment variable template
```

---

## Backend

The app connects to **deeply-backend** — a NestJS v11 + Prisma API.

| Module | Public Endpoints |
|--------|-----------------|
| auth | `POST /auth/apple`, `POST /auth/refresh` |
| culture | `GET /culture/sections`, `GET /culture/articles`, `GET /culture/articles/:slug` |
| train | `GET /train/blocks`, `GET /train/programs/:slug/trainings`, `GET /train/trainings/:slug` |
| dive | `GET /dive/templates`, `GET /dive/templates/:slug` |

Auth-gated endpoints (require Bearer JWT): `/user`, `/train/private`, `/train/runs`, `/results/*`, `/dive/run`, `DELETE /auth/account`.

Swagger docs available at `http://localhost:3000/docs` when backend is running.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`) or use `npx expo`
- iOS Simulator (Xcode) or Android Emulator, or the [Expo Go](https://expo.dev/go) app

### 1. Clone and install

```bash
git clone https://github.com/EugeniBykovski/deeply-mobile-app.git
cd deeply-mobile-app
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Local development (simulator)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Physical device — use your machine's LAN IP
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:3000/api
```

### 3. Start the backend

```bash
# From the deeply-backend directory
npm run dev
# API runs at http://localhost:3000
```

### 4. Start the mobile app

```bash
npm start

# Then:
# Press i  — open iOS Simulator
# Press a  — open Android Emulator
# Scan QR  — open in Expo Go on your device
```

---

## Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0B1C1D` | Main background |
| `surface` | `#122628` | Elevated surface |
| `card` | `#173A35` | Card background |
| `border` | `#1F4A43` | Subtle borders |
| `primary` | `#2A7A6F` | Primary actions |
| `accent` | `#3BBFAD` | Teal highlight, active state |
| `ink` | `#F0F4F4` | Primary text |
| `inkSecondary` | `#A8C4C2` | Secondary text |
| `inkMuted` | `#6B9490` | Muted / placeholder text |

---

## Architecture Principles

- **Feature-sliced structure** — each feature lives in `src/features/<name>/` with its own components, hooks, and screen. No cross-feature imports.
- **API layer isolation** — all HTTP logic lives in `src/api/`. Components never call Axios directly; they use TanStack Query hooks that call services.
- **Typed contracts** — `src/api/types.ts` mirrors backend DTOs exactly. If the backend changes a shape, there's one place to update.
- **Auth interceptor** — tokens are injected automatically per request. On 401, the interceptor refreshes transparently and retries the original request. Components never handle token logic.
- **Theme tokens** — colors/spacing/typography are defined once in `src/theme/` and mirrored in `tailwind.config.js`. No magic hex values in components.

---

## Adding a New Feature

1. Create `src/features/<name>/` with `components/`, `hooks/`, and `<Name>Screen.tsx`
2. Add the API service in `src/api/services/<name>.service.ts`
3. Add the route in `app/<name>.tsx` (or a group like `app/(tabs)/<name>.tsx`)
4. Add query keys to the relevant hooks file

---

## Planned Features

- [ ] Apple Sign-In (`expo-apple-authentication` → `POST /auth/apple`)
- [ ] Training program browser + session player
- [ ] Breath-hold / apnea timer
- [ ] Dive templates detail view + run tracking
- [ ] User profile + settings
- [ ] Session history + achievements (`/results/summary`)
- [ ] Notifications / reminders
- [ ] Offline cache strategy
- [ ] Localization (EN / RU — backend already supports both)
- [ ] Tab navigation (Train, Dive, Results, Profile)
- [ ] Custom font (DM Sans or similar)
