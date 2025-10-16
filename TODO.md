# Family Planner - TODO List

## ✅ Completed Tasks

### Phase 1: Database Security & Performance (Migrations 09-15) ✅
- [x] Fix search_path security configuration on 6 database functions
- [x] Add 4 missing foreign key indexes for improved JOIN performance
- [x] Fix 3 RLS policies causing initplan issues
- [x] Remove 19 unused database indexes
- [x] Combine multiple permissive RLS policies (families table)
- [x] Consolidate family_memberships RLS policies
- [x] Verify fixes with Supabase advisors
- **Result:** All critical security/performance issues resolved ✅

### Phase 2: Frontend Refactoring ✅
- [x] Extract useAuth custom hook from App.tsx (128 lines)
- [x] Extract useFamilyData custom hook + Context Provider (393 lines)
- [x] Extract useSupabaseSync hook for real-time updates (91 lines)
- [x] Extract useModalState hook (Codex collaboration)
- [x] Convert App.tsx to use Provider pattern (FamilyDataProvider, ModalStateProvider)
- **Result:** App.tsx: 770 → ~450 lines (42% reduction, 320+ lines saved) ✅

### Phase 3: TypeScript Configuration ✅
- [x] Verified TypeScript strict mode enabled in tsconfig.json
- [ ] Fix remaining TS errors (mostly unused imports - in progress with Codex)

---

## 🔄 In Progress Tasks

### Frontend Improvements (Ongoing with Codex)
- [x] Extract modal state management (useModalState)
- [x] Convert to Provider pattern
- [ ] Fix remaining TypeScript errors (unused imports, type mismatches)
- [ ] Clean up component prop interfaces

---

## 📋 Pending Tasks

### Phase 2: Code Quality & TypeScript

### Frontend Standardization Plan
- [x] Introduce `FamilyDataProvider` and `ModalStateContext` to move app-wide state and shrink `App.tsx`
- [x] Adopt a shared data-fetching pattern (TanStack Query) for family snapshot/mutations
- [x] Create core UI primitives (`Modal`, `Button`, `FormField`) and migrate core modals to use them
  - [ ] Evaluate remaining specialty dialogs (QR modals, Setup wizard) for migration or dedicated wrappers
- [x] Extract `useAddressAutocomplete` hook plus reuseable formatting util and consume in `FamilyTab` & `SetupWizard`
- [ ] Replace Tailwind CDN usage with project Tailwind config & PostCSS pipeline wired into Vite
- [ ] Reconcile `types.ts` contracts with actual service responses (optional fields, server DTO alignment)

#### TypeScript Improvements
- [x] Enable `strict: true` in tsconfig.json (already enabled)
- [ ] Fix 12,909 uses of `any` type (in progress with Codex)
  - Priority: Authentication/user types
  - Priority: Supabase response types
  - Priority: Event handlers
- [ ] Add proper type guards and discriminated unions
- [ ] Create shared type definitions in `types/` directory

#### Code Organization
- [x] Create `hooks/` folder structure:
  - `hooks/useAuth.ts` ✅ (completed)
  - `hooks/useFamilyData.tsx` ✅ (completed - with Context Provider)
  - `hooks/useSupabaseSync.ts` ✅ (completed)
  - `hooks/useModalState.ts` ✅ (completed)
  - `hooks/useChores.ts` (pending - can extract if needed)
  - `hooks/useRoutines.ts` (pending - can extract if needed)

- [x] Break down App.tsx components:
  - [x] Extract modal management logic (useModalState)
  - [x] Create proper provider components (FamilyDataProvider, ModalStateProvider)
  - [ ] Implement route-based code splitting

### Phase 3: Logging & Error Handling

#### Structured Logging
- [x] Add structured logging library (custom logger utility)
- [x] Implement log levels (debug, info, warn, error)
- [x] Add contextual logging with family/user info
- [ ] Replace ~271 console.log statements (80% complete - 218 of ~271 replaced)
  - [x] useSupabaseSync hook - 7 statements
  - [x] useFamilyData hook - 11 statements
  - [x] useAuth hook - 13 statements
  - [x] App.tsx - 9 statements
  - [x] supabaseDataService.ts - 83 statements
  - [x] supabaseService.ts - 51 statements
  - [x] SetupWizard.tsx - 18 statements
  - [x] RealtimeProvider.tsx - 8 statements
  - [x] performanceCache.ts - 9 statements
  - [x] index.tsx - 5 statements
  - [x] dataService.ts - 4 statements
  - [ ] authService.ts - 42 statements (reverted by concurrent Codex work)
  - [ ] QRScannerModal.tsx - 6 statements
  - [ ] CalendarTab.tsx - 4 statements
  - [ ] familyDataLoader.ts - 3 statements
  - [ ] Others - ~11 statements remaining

#### Error Boundaries
- [x] Create `ErrorBoundary` component
- [x] Add error boundaries around main sections:
  - [x] Family tab
  - [x] Chores tab
  - [x] Routines tab
  - [x] Calendar tab
- [ ] Implement error tracking (Sentry integration)
- [x] Add user-friendly error messages

### Phase 4: Testing

#### Test Setup
- [ ] Install and configure Vitest
- [ ] Install React Testing Library
- [ ] Set up test utilities and helpers
- [ ] Configure test coverage reporting

#### Test Implementation
- [ ] Unit tests for custom hooks (useAuth, useFamilyData, etc.)
- [ ] Component tests for critical UI components
- [ ] Integration tests for key user flows:
  - Authentication flow
  - Creating/joining family
  - Adding chores/routines
  - Completing tasks
- [ ] Target: 70%+ code coverage

#### E2E Tests
- [ ] Install Playwright
- [ ] E2E test for complete user journey
- [ ] E2E test for multi-user scenarios

### Phase 5: Performance Optimization

#### React Performance
- [ ] Add React.memo to these components:
  - FamilyMemberCard (re-renders on every state change)
  - ChoreItem
  - RoutineStepItem
  - CalendarEventCard
  - RewardCard
- [ ] Implement useMemo/useCallback for expensive computations
- [ ] Add virtual scrolling for long lists (routines, chores)
- [ ] Add Suspense boundaries for code splitting

#### Data Loading
- [ ] Implement proper pagination (currently loading all data)
- [ ] Add stale-while-revalidate pattern
- [ ] Consider React Query for better cache management
- [ ] Reduce real-time subscription scope

#### Bundle Optimization
- [ ] Tree-shake unused Lucide icons (current: loading all)
- [ ] Lazy load QR scanner library (50KB)
- [ ] Split vendor chunks properly
- [ ] Target: Reduce bundle from 450KB to 200KB

### Phase 6: Developer Experience

#### Tooling
- [ ] Add ESLint with React/TypeScript rules
- [ ] Add Prettier for consistent formatting
- [ ] Add husky + lint-staged for pre-commit hooks
- [ ] Add conventional commits

#### Documentation
- [ ] Add JSDoc comments to public APIs
- [ ] Create architecture decision records (ADRs)
- [ ] Document data flow and state management
- [ ] Add component storybook
- [ ] Update README with:
  - Architecture overview
  - Development setup
  - Testing guide
  - Deployment guide

### Phase 7: Mobile Optimization

#### Capacitor Integration
- [ ] Add proper iOS splash screens
- [ ] Add proper Android splash screens
- [ ] Implement native sharing (alternative to QR)
- [ ] Add haptic feedback for interactions
- [ ] Optimize for mobile performance (avoid large re-renders)
- [ ] Test on actual devices (iOS/Android)

### Phase 8: Feature Enhancements

#### User Requested Features
- [ ] Implement reward redemption flow
- [ ] Add chore notification system
- [ ] Add recurring chores support
- [ ] Add family photo gallery
- [ ] Add points leaderboard view
- [ ] Add routine streaks/achievements

#### Security Enhancements
- [ ] Enable leaked password protection in Supabase dashboard
- [ ] Enable MFA options in Supabase dashboard
- [ ] Add rate limiting for API calls
- [ ] Add input sanitization
- [ ] Security audit

---

## 📊 Current Metrics

### Code Quality
- **Total Lines of Code**: ~6,250
- **TypeScript `any` usage**: 12,909 occurrences
- **Console.log statements**: 285
- **Test Coverage**: 0%

### App.tsx Stats
- **Before refactoring**: 770 lines
- **After Phase 2 refactoring**: ~450 lines (-320 lines, -42%)
- **Extractions completed**:
  - useAuth hook: 128 lines
  - useFamilyData hook + Context: 335 lines
  - useSupabaseSync hook: 91 lines
  - useModalState hook: ~150 lines (by Codex)
- **Future target**: ~350-400 lines with additional optimizations

### Database Performance
- **Security vulnerabilities fixed**: 6
- **Performance issues fixed**: 22
- **Indexes added**: 4
- **Indexes removed**: 19
- **Net storage saved**: ~2-5MB per 10k rows

### Remaining Warnings
- ⚠️ Enable leaked password protection (requires Supabase dashboard)
- ⚠️ Enable MFA options (requires Supabase dashboard)
- ⚠️ 4 new indexes flagged as unused (just created, need usage time)

---

## 🎯 Priority Recommendations

### High Priority (Do Next)
1. ~~Extract `useFamilyData` hook~~ ✅ **COMPLETED**
2. ~~Enable TypeScript strict mode~~ ✅ **COMPLETED**
3. ~~Add error boundaries~~ ✅ **COMPLETED**
4. Fix remaining TypeScript errors (unused imports, type mismatches) - in progress with Codex

### Medium Priority
5. Remove console.log statements - production readiness
6. Add basic unit tests for hooks - prevent regressions
7. Optimize bundle size - faster load times
8. Create core UI primitives (Modal, Button, FormField)

### Low Priority (Nice to Have)
9. Component storybook - better documentation
10. E2E tests - confidence in deployments
11. Performance monitoring - track improvements over time

---

## 📝 Notes

- Database migrations 09-15 are applied and working in production ✅
- All 4 major custom hooks extracted and functional (useAuth, useFamilyData, useSupabaseSync, useModalState) ✅
- Provider pattern implemented (FamilyDataProvider, ModalStateProvider) ✅
- TypeScript strict mode verified as enabled ✅
- All critical security issues resolved ✅
- App.tsx reduced by 42% (770 → 450 lines) ✅
- Error boundaries implemented around all main tabs ✅
- Structured logging utility created with log levels (debug, info, warn, error) ✅
- Core hooks (useSupabaseSync, useFamilyData) now use structured logging ✅
- Application is stable and ready for continued development
- Codex is concurrently handling TypeScript error cleanup

Last Updated: 2025-10-16
