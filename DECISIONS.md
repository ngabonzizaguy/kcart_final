# DeliGo UI/UX Decisions Tracker

This document tracks all approved UI/UX decisions to avoid redundant questions.

---

## ✅ APPROVED DECISIONS

### Messages & Copy

| Component | Text | Status |
|-----------|------|--------|
| Login error | "Something went wrong" | ✅ Approved |
| Login success | "Welcome back! Taking you to your dashboard..." | ✅ Approved |
| Signup error (empty fields) | "Please fill in all fields" | ✅ Approved |
| Signup error (password) | "Minimum 6 characters" | ✅ Approved |
| Signup success | "Welcome! Let's get your restaurant online." | ✅ Approved |
| Empty menu state | "Menu coming soon..." | ✅ Approved |
| Empty category state | "Menu coming soon..." | ✅ Approved |
| 404 not found | "This vendor doesn't exist or may have been removed." | ✅ Approved |

### Validation

| Feature | Rule | Status |
|---------|------|--------|
| Password validation | Minimum 6 characters | ✅ Approved |
| Form validation | Simple validation (no Zod) | ✅ Approved |

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
| Menu item layout | Single column list | ✅ Approved |
| 404 page | Friendly message with home button | ✅ Approved |
| Card max-width | max-w-lg (mobile-first) | ✅ Approved |

### Design Principles

| Principle | Implementation | Status |
|-----------|----------------|--------|
| Mobile-first | Always design for 320px+ first | ✅ Approved |
| Touch targets | Minimum 44px height | ✅ Approved |
| Messaging tone | Friendly and reassuring | ✅ Approved |

---

## 🔄 IN PROGRESS / PENDING

(None currently)

---

## Notes

- **Never ask about approved items again**
- Always check this file before asking questions
- Update this file when new decisions are made
- All team members should reference this document
