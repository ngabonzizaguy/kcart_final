# DeliGo UI/UX Decisions Tracker

This document tracks all approved UI/UX decisions to avoid redundant questions.

---

## ✅ APPROVED DECISIONS

### Messages & Copy

| Component | Text | Status |
|-----------|------|--------|
| Login error | "Something went wrong" | ✅ Approved |
| Login success | "You're in! Let's get you to your business center..." | ✅ Approved |
| Signup error (empty fields) | "Please fill in all fields" | ✅ Approved |
| Signup error (password) | "Minimum 6 characters" | ✅ Approved |
| Signup success | "Welcome! Let's get your restaurant online." | ✅ Approved |
| Empty menu state | "Menu coming soon..." | ✅ Approved |
| Empty category state | "Menu coming soon..." | ✅ Approved |
| 404 not found | "Oops! We couldn't find that restaurant." | ✅ Approved |
| API slug conflict | "A business with this name already exists. Please choose a different name." | ✅ Approved |
| Onboarding Step 2 success | "Media saved!" | ✅ Approved |
| Onboarding Step 3 success | "Location saved!" | ✅ Approved |
| Onboarding Step 4 success | "Setup complete!" | ✅ Approved |
| Onboarding completion title | "You're all set!" | ✅ Approved |
| Onboarding completion subtitle | "Your Storefront is Ready" | ✅ Approved |

### Validation

| Feature | Rule | Status |
|---------|------|--------|
| Password validation | Minimum 6 characters | ✅ Approved |
| Auth form validation | Simple validation (no Zod) | ✅ Approved |
| API validation | Use Zod schema validation for type safety | ✅ Approved |
| Image upload | JPG, PNG, WebP only, max 5MB | ✅ Approved |
| Phone number | Minimum 10 characters | ✅ Approved |
| Delivery range | 1-50 km, default 5 km | ✅ Approved |

### User Flow

| Flow | Behavior | Status |
|------|----------|--------|
| Login redirect | Dashboard (layout checks onboarding) | ✅ Approved |
| Signup redirect | Onboarding immediately | ✅ Approved |
| Customer authentication | None - guest checkout only | ✅ Approved |
| Onboarding Steps | Step 1 → Step 2 → Step 3 → Step 4 → Complete | ✅ Approved |
| Step 1 (Business Info) | Navigate to /onboarding/media on success | ✅ Approved |
| Step 2 (Media) | Can skip, navigate to /onboarding/location | ✅ Approved |
| Step 3 (Location) | Required, navigate to /onboarding/contact | ✅ Approved |
| Step 4 (Contact) | Required, marks isSetupComplete=true, navigate to /onboarding/complete | ✅ Approved |
| Onboarding Complete | Show QR code, storefront URL, action buttons | ✅ Approved |

### UI Components

| Component | Style/Behavior | Status |
|-----------|----------------|--------|
| Currently Offline indicator | Subtle badge with AlertCircle icon | ✅ Approved |
| Add to Cart button | Floating Action Button (FAB) | ✅ Approved |
| Menu item layout | Category tabs | ✅ Approved |
| 404 page | Friendly message with home button | ✅ Approved |
| Card width | Full width on mobile (edge-to-edge) | ✅ Approved |
| ImageUpload | Drag/click upload, preview, remove button, loading state | ✅ Approved |
| QRCode | 200x200px, high error correction, white border with shadow | ✅ Approved |
| Onboarding steps indicator | "Step X of 4" centered at top | ✅ Approved |
| Business hours selector | Checkbox per day, time pickers, "Closed" state | ✅ Approved |

### API Behavior

| Feature | Implementation | Status |
|---------|----------------|--------|
| Slug conflicts | Ask vendors to choose different name | ✅ Approved |
| API responses | Return full vendor object | ✅ Approved |
| Error handling | Specific error messages (help users understand) | ✅ Approved |
| Image upload | POST /api/upload with FormData, returns URL | ✅ Approved |
| Onboarding Step 2 | POST /api/vendor/onboarding/media, updates logoUrl and coverUrl | ✅ Approved |
| Onboarding Step 3 | POST /api/vendor/onboarding/location, updates address and delivery | ✅ Approved |
| Onboarding Step 4 | POST /api/vendor/onboarding/contact, updates contact and sets isSetupComplete | ✅ Approved |
| File storage | Supabase Storage bucket 'vendor-assets', path: userId/folder/timestamp.ext | ✅ Approved |

### Design Principles

| Principle | Implementation | Status |
|-----------|----------------|--------|
| Mobile-first | Always design for 320px+ first | ✅ Approved |
| Touch targets | Minimum 44px height | ✅ Approved |
| Messaging tone | Friendly and reassuring | ✅ Approved |

---

## 🔄 TO IMPLEMENT

| Feature | Details | Priority |
|---------|---------|----------|
| Category tabs | Menu navigation with tabs | High |

---

## Phase 2 Implementation Summary

**Completed:**
- ✅ 4-step onboarding wizard (Business Info, Media, Location, Contact)
- ✅ Image upload functionality with Supabase Storage
- ✅ QR code generation and display
- ✅ Onboarding completion page with storefront URL
- ✅ Business hours selector with daily open/closed toggles
- ✅ All API routes with Zod validation

**Onboarding Flow:**
1. Step 1: Business name, type, description (EN + RW)
2. Step 2: Logo and cover image uploads (optional, can skip)
3. Step 3: Address, GPS coordinates, delivery range
4. Step 4: Phone, WhatsApp, business hours → Marks setup complete
5. Complete: Shows QR code, storefront URL, next steps

---

## Notes

- **Never ask about approved items again**
- Always check this file before asking questions
- Update this file when new decisions are made
- Auth pages: Simple validation (no Zod)
- API routes: Zod validation + specific error messages
- Mobile: Full-width cards (edge-to-edge)
- Onboarding: Step 2 (Media) is optional, all others required
