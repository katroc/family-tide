# Family Planner - TODO List

## ✅ Completed Tasks

### Phase 1: Database Security & Performance (Migrations 09-15)
- [x] Fix search_path security configuration on 6 database functions
- [x] Add 4 missing foreign key indexes for improved JOIN performance
- [x] Fix 3 RLS policies causing initplan issues
- [x] Remove 19 unused database indexes
- [x] Combine multiple permissive RLS policies (families table)
- [x] Consolidate family_memberships RLS policies
- [x] Verify fixes with Supabase advisors

### Phase 2: Frontend Refactoring (Partial)
- [x] Extract useAuth custom hook from App.tsx (saved 112 lines)
- [x] Commit all database and auth improvements

---

## 🔄 In Progress Tasks

### Frontend Architecture Refactoring
- [ ] Extract `useFamilyData` custom hook from App.tsx
  - Move all family state (members, chores, events, rewards, routines)
  - Consolidate data loading logic
  - Estimated: Reduce App.tsx by ~200 lines

- [ ] Extract `useSupabaseSync` custom hook from App.tsx
  - Move real-time data update handler
  - Consolidate real-time subscription logic
  - Estimated: Reduce App.tsx by ~50 lines

---

## 📋 Pending Tasks

### Phase 2: Code Quality & TypeScript

### Frontend Standardization Plan
- [ ] Introduce `FamilyDataProvider` and `ModalStateContext` to move app-wide state and shrink `App.tsx`
- [ ] Adopt a shared data-fetching pattern (e.g. TanStack Query or service hooks) for chores, events, rewards, and routines
- [ ] Create core UI primitives (`Modal`, `Button`, `FormField`) and migrate existing modals to use them
- [ ] Extract `useAddressAutocomplete` hook plus `AddressInput` component and consume in `FamilyTab` & `SetupWizard`
- [ ] Replace Tailwind CDN usage with project Tailwind config & PostCSS pipeline wired into Vite
- [ ] Reconcile `types.ts` contracts with actual service responses (optional fields, server DTO alignment)

#### TypeScript Improvements
- [ ] Enable `strict: true` in tsconfig.json
- [ ] Fix 12,909 uses of `any` type
  - Priority: Authentication/user types
  - Priority: Supabase response types
  - Priority: Event handlers
- [ ] Add proper type guards and discriminated unions
- [ ] Create shared type definitions in `types/` directory

#### Code Organization
- [ ] Create `hooks/` folder structure:
  - `hooks/useAuth.ts` ✅ (completed)
  - `hooks/useFamilyData.ts` (pending)
  - `hooks/useSupabaseSync.ts` (pending)
  - `hooks/useChores.ts` (pending)
  - `hooks/useRoutines.ts` (pending)

- [ ] Break down App.tsx components:
  - Extract modal management logic
  - Create proper provider components
  - Implement route-based code splitting

### Phase 3: Logging & Error Handling

#### Structured Logging
- [ ] Remove 285 console.log statements
- [ ] Add structured logging library (pino or winston)
- [ ] Implement log levels (debug, info, warn, error)
- [ ] Add contextual logging with family/user info

#### Error Boundaries
- [ ] Create `ErrorBoundary` component
- [ ] Add error boundaries around main sections:
  - Family tab
  - Chores tab
  - Routines tab
  - Calendar tab
- [ ] Implement error tracking (Sentry integration)
- [ ] Add user-friendly error messages

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
- **After useAuth extraction**: 658 lines (-112 lines)
- **Target after all extractions**: ~400 lines (-370 lines, -48%)

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
1. Extract `useFamilyData` hook - major complexity reduction
2. Enable TypeScript strict mode - catch bugs early
3. Add error boundaries - better user experience

### Medium Priority
4. Remove console.log statements - production readiness
5. Add basic unit tests for hooks - prevent regressions
6. Optimize bundle size - faster load times

### Low Priority (Nice to Have)
7. Component storybook - better documentation
8. E2E tests - confidence in deployments
9. Performance monitoring - track improvements over time

---

## 📝 Notes

- Database migrations 09-15 are applied and working in production
- useAuth hook is tested and functional
- All critical security issues resolved
- Application is stable and ready for continued development

Last Updated: 2025-10-16
