# Pages Migration Checklist

## Overview
Migrating all pages from trip-share-hub (React Router) to my-app (Next.js App Router)

---

## Pages to Migrate

### ✅ 1. Landing Page (`/`)
**Source:** `trip-share-hub/src/pages/Landing.tsx`
**Target:** `src/app/page.tsx`
**Status:** ✅ COMPLETED
**Changes Made:**
- Converted to Next.js with `"use client"` directive
- Replaced `useNavigate` with `useRouter` from `next/navigation`
- Updated image imports to use Next.js Image component (placeholder for now)
- All animations and styles preserved

---

### ⬜ 2. Auth Page (`/auth`)
**Source:** `trip-share-hub/src/pages/Auth.tsx`
**Target:** `src/app/auth/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Replace `useNavigate` → `useRouter` from `next/navigation`
- Replace `navigate("/dashboard")` → `router.push("/dashboard")`
- Replace `navigate("/")` → `router.push("/")`

**Features:**
- Login/Signup tabs
- Form validation
- Email/password inputs
- Navigation to dashboard

---

### ⬜ 3. Dashboard Page (`/dashboard`)
**Source:** `trip-share-hub/src/pages/Dashboard.tsx`
**Target:** `src/app/dashboard/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Replace `useNavigate` → `useRouter`
- Update all `navigate()` calls to `router.push()`
- Convert image imports to Next.js Image component or use `/assets/` paths
- Import Header component
- Preserve all animations and interactions

**Features:**
- User greeting with avatar
- Active trip hero section with collage
- Trip statistics
- Quick action chips
- Past trips carousel
- Empty state

**Images Used:**
- `tripMachuPicchu` → `/assets/trip-machu-picchu.png`
- `tripParacas` → `/assets/trip-paracas.png`
- `tripChile` → `/assets/trip-chile.png`

---

### ⬜ 4. Create Session Page (`/create-session`)
**Source:** `trip-share-hub/src/pages/CreateSession.tsx`
**Target:** `src/app/create-session/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Replace `useNavigate` → `useRouter`
- Update navigation calls
- Import ShareSessionDialog component

**Features:**
- Session name input
- Start/end date pickers
- Session code generation
- Share dialog integration

---

### ⬜ 5. Join Session Page (`/join/:code`)
**Source:** `trip-share-hub/src/pages/JoinSession.tsx`
**Target:** `src/app/join/[code]/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Create dynamic route folder structure: `src/app/join/[code]/page.tsx`
- Replace `useParams` from react-router → `useParams` from `next/navigation`
- Replace `useNavigate` → `useRouter`
- File upload functionality preserved
- LocalStorage usage preserved

**Features:**
- Profile image upload
- Name input
- Session info display
- Camera integration

---

### ⬜ 6. Session Page (`/session/:id`)
**Source:** `trip-share-hub/src/pages/Session.tsx`
**Target:** `src/app/session/[id]/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Create dynamic route: `src/app/session/[id]/page.tsx`
- Replace `useParams` (no import change needed)
- Import Header component
- Import ShareSessionDialog component

**Features:**
- Chat interface with bot
- Expense list with scroll
- Debt summary
- Real-time expense tracking
- Share dialog

---

### ⬜ 7. Trip View Page (`/trip/:id`)
**Source:** `trip-share-hub/src/pages/TripView.tsx`
**Target:** `src/app/trip/[id]/page.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Create dynamic route: `src/app/trip/[id]/page.tsx`
- Replace `useNavigate` → `useRouter`
- Replace `useParams` from react-router → `useParams` from `next/navigation`
- Replace `useSearchParams` from react-router → `useSearchParams` from `next/navigation`
- Update image import to use `/assets/` path
- Import Header, TripExpenses, TripMemoryMap, TripMoments components

**Features:**
- Hero header with cover image
- Section navigation (expenses/map/moments)
- Dynamic section switching based on URL params
- Tab navigation for different views

**Images Used:**
- `tripChile` → `/assets/trip-chile.png`

---

### ⬜ 8. Not Found Page (`/not-found`)
**Source:** `trip-share-hub/src/pages/NotFound.tsx`
**Target:** `src/app/not-found.tsx`
**Status:** 🔄 PENDING
**Required Changes:**
- Add `"use client"` directive
- Remove `useLocation` and `useEffect` (Next.js handles 404s automatically)
- Replace `<a href="/">` with Next.js `<Link href="/">`
- Simplified error display

---

## Components to Update

### ⬜ 9. Header Component
**Source:** `src/components/Header.tsx`
**Target:** Same file, update in place
**Status:** 🔄 PENDING
**Required Changes:**
- Replace `import { useNavigate, useLocation } from "react-router-dom"` → `import { useRouter, usePathname } from "next/navigation"`
- Replace `const navigate = useNavigate()` → `const router = useRouter()`
- Replace `const location = useLocation()` → `const pathname = usePathname()`
- Replace all `navigate()` calls → `router.push()`
- Replace `location.pathname` → `pathname`

---

### ⬜ 10. NavLink Component
**Source:** `src/components/NavLink.tsx`
**Target:** Same file, update in place
**Status:** 🔄 PENDING
**Required Changes:**
- Replace `import { Link } from "react-router-dom"` → `import Link from "next/link"`
- Replace `to` prop → `href` prop
- Update active route detection logic to use Next.js `usePathname()`

---

## Migration Pattern Reference

### Navigation
```typescript
// Before (React Router)
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/path");

// After (Next.js)
"use client";
import { useRouter } from "next/navigation";
const router = useRouter();
router.push("/path");
```

### Route Parameters
```typescript
// Before (React Router)
import { useParams } from "react-router-dom";
const { id } = useParams();

// After (Next.js)
import { useParams } from "next/navigation";
const { id } = useParams();
```

### Current Path
```typescript
// Before (React Router)
import { useLocation } from "react-router-dom";
const location = useLocation();
const path = location.pathname;

// After (Next.js)
import { usePathname } from "next/navigation";
const pathname = usePathname();
```

### Search Params
```typescript
// Before (React Router)
import { useSearchParams } from "react-router-dom";
const [searchParams] = useSearchParams();

// After (Next.js)
import { useSearchParams } from "next/navigation";
const searchParams = useSearchParams();
```

### Images
```typescript
// Before (Vite)
import myImage from "@/assets/image.png";
<img src={myImage} alt="..." />

// After (Next.js)
// Option 1: Direct path
<img src="/assets/image.png" alt="..." />

// Option 2: Next.js Image (recommended)
import Image from "next/image";
<Image src="/assets/image.png" alt="..." width={500} height={300} />
```

---

## Progress Tracker

- [x] Landing Page
- [ ] Auth Page
- [ ] Dashboard Page
- [ ] Create Session Page
- [ ] Join Session Page (`/join/[code]`)
- [ ] Session Page (`/session/[id]`)
- [ ] Trip View Page (`/trip/[id]`)
- [ ] Not Found Page
- [ ] Header Component
- [ ] NavLink Component
- [ ] Test all routes
- [ ] Verify images
- [ ] Final build

---

## Testing Checklist

After migration, test:
- [ ] All navigation links work
- [ ] All dynamic routes load correctly
- [ ] Images display properly
- [ ] Forms submit and redirect correctly
- [ ] Dialogs/modals open and close
- [ ] Animations work
- [ ] Build completes without errors
- [ ] Dev server runs without errors
