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

### Validation

| Feature | Rule | Status |
|---------|------|--------|
| Password validation | Minimum 6 characters | ✅ Approved |
| Auth form validation | Simple validation (no Zod) | ✅ Approved |
| API validation | Use Zod schema validation for type safety | ✅ Approved |

### User Flow

| Flow | Behavior | Status |
|------|----------|--------|
| Login redirect | Dashboard (layout checks onboarding) | ✅ Approved |
| Signup redirect | Onboarding immediately | ✅ Approved |
| Customer authentication | None - guest checkout only | ✅ Approved |

### UI Components

| Component | Style/Behavior | Status |
|-----------|----------------|--------|
| Currently Offline indicator | Subtle badge with AlertCircle icon | ✅ Approved |
| Add to Cart button | Floating Action Button (FAB) | ✅ Approved |
| Menu item layout | Category tabs | ✅ Approved |
| 404 page | Friendly message with home button | ✅ Approved |
| Card width | Full width on mobile (edge-to-edge) | ✅ Approved |

### API Behavior

| Feature | Implementation | Status |
|---------|----------------|--------|
| Slug conflicts | Ask vendors to choose different name | ✅ Approved |
| API responses | Return full vendor object | ✅ Approved |
| Error handling | Specific error messages (help users understand) | ✅ Approved |

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

## Notes

- **Never ask about approved items again**
- Always check this file before asking questions
- Update this file when new decisions are made
- Auth pages: Simple validation (no Zod)
- API routes: Zod validation + specific error messages
- Mobile: Full-width cards (edge-to-edge)
