# Implementation Plan: Missed Class Recovery Engine (MCRE)

## Overview

Incremental implementation across 6 phases: Foundation → Data Entry → ML Pipeline → Core Engine → Developer Portal → Polish & Tests. Each task builds on the previous, ending with full integration. The design document, requirements, and existing Genkit flows are assumed available throughout.

Install new dependencies before starting:
```bash
npm install firebase-admin pdf-parse pdf-lib xlsx resend @tanstack/react-table sonner
npm install --save-dev @types/pdf-parse fast-check
```

## Tasks

- [ ] 1. Foundation — Auth, Middleware, Route Groups, Firebase Admin
  - [ ] 1.1 Create Firebase Admin SDK singleton at `src/lib/firebase-admin.ts`
    - Initialize `firebase-admin` using `FIREBASE_SERVICE_ACCOUNT_KEY` env var (JSON string) or Application Default Credentials
    - Export `adminAuth`, `adminFirestore`, `adminStorage` singletons
    - Guard against re-initialization in hot-reload environments
    - _Requirements: 12.2, 12.5_

  - [ ] 1.2 Create Next.js middleware at `middleware.ts`
    - Verify Firebase ID token from `Authorization: Bearer <token>` header on all `/api/*` routes
    - Verify session cookie on protected page routes (`/dashboard/*`, `/developer/*`)
    - Redirect unauthenticated requests to `/login`
    - Redirect teacher accessing `/developer/*` → `/dashboard`
    - Redirect developer accessing `/dashboard/*` → `/developer`
    - Return HTTP 401 for unauthenticated `/api/*` requests
    - _Requirements: 1.3, 1.4, 1.5, 12.5, 12.6_

  - [ ]* 1.3 Write property tests for middleware redirect logic (Properties 1 & 2)
    - **Property 1: Role-based redirect correctness** — for any valid role + route combination, redirect target equals the role's designated portal
    - **Property 2: Protected route enforcement** — for any `/dashboard/*` or `/developer/*` path without a valid token, redirect is always `/login`
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
    - **Validates: Requirements 12.5, 12.6**

  - [ ]* 1.4 Write property test for API token enforcement (Property 17)
    - **Property 17: API route token enforcement** — for any `/api/*` request without a valid token, middleware returns HTTP 401 without invoking the handler
    - **Validates: Requirements 12.5, 12.6**

  - [ ] 1.5 Restructure app routes into route groups
    - Create `src/app/(auth)/login/page.tsx` — login form using `react-hook-form` + `zod`, calls Firebase `signInWithEmailAndPassword`, stores session cookie, redirects by role
    - Create `src/app/(admin)/layout.tsx` — sidebar nav with links to Dashboard, Subjects; wraps children in Firebase client provider
    - Create `src/app/(admin)/dashboard/page.tsx` — placeholder stats cards
    - Create `src/app/(admin)/subjects/page.tsx` — placeholder subject grid
    - Create `src/app/(developer)/layout.tsx` — developer sidebar nav
    - Create `src/app/(developer)/dashboard/page.tsx` — placeholder health cards
    - Move or alias existing `/dashboard` and `/developer` routes to new groups
    - _Requirements: 1.1, 1.2, 1.7_

  - [ ] 1.6 Create shared TypeScript types at `src/types/mcre.ts`
    - Define all interfaces from the design: `User`, `Subject`, `StudyMaterial`, `ExtractedTopic`, `LecturePlanEntry`, `Student`, `AttendanceRecord`, `AttendanceEntry`, `RecoveryEmail`, `TeacherSummaryLog`, `SystemLog`
    - Define `ParseResult<T>` generic interface
    - _Requirements: 2.2, 3.1, 4.2, 5.1, 6.1_

  - [ ] 1.7 Create `src/lib/system-logger.ts`
    - `writeLog(entry: Omit<SystemLog, 'logId' | 'createdAt'>): Promise<void>` using Admin Firestore
    - _Requirements: 3.4, 7.3, 8.5, 10.2_

  - [ ] 1.8 Checkpoint — Ensure middleware tests pass and login page renders
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 2. Subject Management
  - [ ] 2.1 Create `POST /api/subjects` and `GET /api/subjects` route at `src/app/api/subjects/route.ts`
    - `GET`: fetch all subjects where `teacherId === req.uid` from Firestore
    - `POST`: validate body (subjectName, subjectCode, classId, totalModules), check for duplicate subjectCode+classId, create Subject document
    - Return HTTP 409 on duplicate
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 2.2 Build `SubjectCard` and `SubjectForm` components
    - `src/components/admin/SubjectCard.tsx` — displays subject name, code, class ID; links to `/subjects/[subjectId]`
    - `src/components/admin/SubjectForm.tsx` — `react-hook-form` + `zod` form for creating a subject; calls `POST /api/subjects`; shows `sonner` toast on success/error
    - Wire into `src/app/(admin)/subjects/page.tsx` — grid of SubjectCards + "New Subject" button
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.3 Build subject detail page with 5-tab layout
    - `src/app/(admin)/subjects/[subjectId]/page.tsx` — Radix UI Tabs: Study Material, Lecture Plan, Students, Attendance, Reports
    - Each tab renders a placeholder component initially
    - _Requirements: 2.3, 2.5_

- [ ] 3. Student Roster Management
  - [ ] 3.1 Create Excel and PDF parsers for student roster
    - `src/lib/parsers/excel-parser.ts` — `parseStudentRoster(buffer: Buffer): ParseResult<Student[]>` using `xlsx`; normalize header variants; compute `hasValidEmail`
    - `src/lib/parsers/pdf-parser.ts` — `parseStudentRosterPDF(buffer: Buffer): ParseResult<Student[]>` using `pdf-parse`; line-by-line tabular heuristics
    - `src/lib/parsers/pretty-printer.ts` — `printStudentRoster(students: Student[]): Buffer` using `xlsx`
    - _Requirements: 5.1, 11.1, 11.3, 11.4_

  - [ ]* 3.2 Write property test for student roster parse round-trip (Property 5)
    - **Property 5: Student roster parse round-trip** — for any valid `Student[]`, `parseStudentRoster(printStudentRoster(students))` produces equivalent records
    - **Validates: Requirements 5.2, 11.5**

  - [ ] 3.3 Create student API routes at `src/app/api/students/route.ts` and `src/app/api/students/parse/route.ts`
    - `GET /api/students?subjectId=`: fetch student roster from Firestore sub-collection
    - `POST /api/students`: create single student document; validate name, registrationNumber, email
    - `DELETE /api/students`: bulk delete by studentId array
    - `POST /api/students/parse`: accept `multipart/form-data`; validate MIME type + size (≤50 MB) server-side; call parser; upsert by registrationNumber
    - _Requirements: 5.1, 5.3, 5.4, 5.6, 12.4_

  - [ ]* 3.4 Write property test for student upsert on duplicate registration number (Property 7)
    - **Property 7: Student upsert on duplicate registration number** — after any upload, exactly one Student document exists per registrationNumber within a subject
    - **Validates: Requirements 5.4**

  - [ ] 3.5 Build `StudentsTab` component
    - `src/components/admin/tabs/StudentsTab.tsx` — `@tanstack/react-table` paginated + searchable table (name, reg number, email, section, hasValidEmail badge)
    - `StudentUploadForm.tsx` — file input for xlsx/csv/pdf; calls `POST /api/students/parse`; shows parsed count + skipped count via `sonner`
    - Manual add form using `react-hook-form`
    - Bulk delete with checkbox selection
    - _Requirements: 5.1, 5.3, 5.5, 5.6, 5.7_

  - [ ]* 3.6 Write property test for invalid email skip logic (Property 8)
    - **Property 8: Invalid email students are skipped** — for any Student where `hasValidEmail === false`, the recovery engine must produce `emailStatus: "skipped"` and not invoke the email sender
    - **Validates: Requirements 5.7, 8.7**

- [ ] 4. Lecture Plan Management
  - [ ] 4.1 Extend parsers for lecture plan
    - Add `parseLecturePlan(buffer: Buffer): ParseResult<LecturePlanEntry[]>` to `excel-parser.ts`
    - Add `parseLecturePlanPDF(buffer: Buffer): ParseResult<LecturePlanEntry[]>` to `pdf-parser.ts`
    - Add `printLecturePlan(entries: LecturePlanEntry[]): Buffer` to `pretty-printer.ts`
    - Skip rows with missing date or slot; include skip count in `ParseResult`
    - _Requirements: 4.2, 4.4, 11.1, 11.2_

  - [ ]* 4.2 Write property test for lecture plan parse round-trip (Property 4)
    - **Property 4: Lecture plan parse round-trip** — for any valid `LecturePlanEntry[]`, `parseLecturePlan(printLecturePlan(entries))` produces equivalent records
    - **Validates: Requirements 4.3, 11.5**

  - [ ] 4.3 Create lecture plan API routes at `src/app/api/lecture-plan/route.ts` and `src/app/api/lecture-plan/parse/route.ts`
    - `GET /api/lecture-plan?subjectId=`: fetch all entries ordered by date+slot
    - `POST /api/lecture-plan`: create/update single LecturePlanEntry; validate date (ISO 8601) and non-empty slot
    - `DELETE /api/lecture-plan?entryId=`: delete entry
    - `POST /api/lecture-plan/parse`: multipart upload; validate MIME + size; call parser; bulk-write entries to Firestore; return parsed/skipped counts
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ] 4.4 Build `LecturePlanTab` component
    - `src/components/admin/tabs/LecturePlanTab.tsx` — sortable table of entries (date, slot, topic heading); `@tanstack/react-table`
    - Manual add form: date picker (`react-day-picker`), slot input, topic select from processed ExtractedTopics
    - File upload form for xlsx/csv/pdf; shows skipped row count via `sonner`
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [ ] 5. Study Material Upload and ML Pipeline
  - [ ] 5.1 Create Storage upload API at `src/app/api/materials/route.ts`
    - `POST /api/materials`: accept multipart upload; validate MIME (pdf/pptx only) and size (≤50 MB) server-side; upload to Storage at `/subjects/{subjectId}/materials/{moduleNumber}/{fileName}`; create StudyMaterial document with `processingStatus: "pending"`; trigger ML pipeline asynchronously
    - Return HTTP 400 with descriptive error for invalid MIME or oversized files
    - _Requirements: 3.1, 3.7, 3.8, 12.4_

  - [ ]* 5.2 Write property test for server-side upload validation (Property 16)
    - **Property 16: Server-side upload validation** — for any file with unsupported MIME type or size > 50 MB, the validation function returns an error regardless of client-side state
    - **Validates: Requirements 3.7, 3.8, 12.4**

  - [ ] 5.2 Implement ML pipeline at `src/app/api/ml/process/route.ts`
    - `POST /api/ml/process`: fetch StudyMaterial from Firestore; set `processingStatus: "processing"`
    - Stage 1: download PDF from Storage; use `pdf-parse` to extract text with positional metadata; apply heading heuristics (font size, bold, numbering, all-caps); assign confidence scores in `[0.0, 1.0]`
    - Stage 2 fallback: if < 3 topics or avg confidence < 0.5, call `automatedLectureContentAnalysisFlow`; map output to `ExtractedTopic[]` with `confidenceScore: 0.7`
    - Update StudyMaterial with `extractedTopics` and `processingStatus: "processed"` or `"failed"`
    - On failure: write SystemLog with `type: "ml"`, `level: "error"`
    - _Requirements: 3.2, 3.3, 3.4, 3.9_

  - [ ]* 5.3 Write property test for confidence score bounds (Property 3)
    - **Property 3: Confidence score bounds** — for any StudyMaterial processed by the ML pipeline, every ExtractedTopic must have `confidenceScore` in `[0.0, 1.0]`
    - **Validates: Requirements 3.9**

  - [ ] 5.4 Create ML reprocess route at `src/app/api/ml/reprocess/route.ts`
    - `POST /api/ml/reprocess`: developer-only (verify role); re-run ML pipeline for a `studyMaterialId`; preserve `teacherCorrectedTopics`
    - _Requirements: 10.3, 10.4_

  - [ ] 5.5 Build `StudyMaterialTab` component
    - `src/components/admin/tabs/StudyMaterialTab.tsx` — list of uploaded materials per module with processing status badge
    - File upload form per module; calls `POST /api/materials`; shows `sonner` progress toast
    - Editable topic list when `processingStatus === "processed"`: inline edit for heading, page range, sub-headings; save calls `PATCH /api/materials/topics`
    - _Requirements: 3.1, 3.5, 3.6_

  - [ ] 5.6 Create `PATCH /api/materials/topics` route
    - Accept `{ materialId, subjectId, topics: ExtractedTopic[] }`; validate; update `teacherCorrectedTopics` in Firestore; set `isTeacherCorrected: true` on edited entries
    - _Requirements: 3.6_

  - [ ] 5.7 Checkpoint — Ensure ML pipeline processes a PDF and topics appear in the UI
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Attendance Recording
  - [ ] 6.1 Extend parsers for attendance sheets
    - Add `parseAttendanceSheet(buffer: Buffer, roster: Student[]): ParseResult<AttendanceEntry[]>` to `excel-parser.ts`
    - Add `parseAttendanceSheetPDF(buffer: Buffer, roster: Student[]): ParseResult<AttendanceEntry[]>` to `pdf-parser.ts`
    - Add `printAttendanceSheet(entries: AttendanceEntry[]): Buffer` to `pretty-printer.ts`
    - Highlight unmatched registration numbers in warnings array
    - _Requirements: 6.3, 6.5, 11.1, 11.2_

  - [ ]* 6.2 Write property test for attendance sheet parse round-trip (Property 6)
    - **Property 6: Attendance sheet parse round-trip** — for any valid `AttendanceEntry[]`, `parseAttendanceSheet(printAttendanceSheet(entries), roster)` produces equivalent records
    - **Validates: Requirements 6.4**

  - [ ] 6.3 Create attendance API routes at `src/app/api/attendance/route.ts` and `src/app/api/attendance/parse/route.ts`
    - `GET /api/attendance?subjectId=&date=&slot=`: fetch AttendanceRecord
    - `POST /api/attendance`: create draft AttendanceRecord with full entry list
    - `PATCH /api/attendance`: update entries on existing draft record
    - `POST /api/attendance/parse`: multipart upload; validate; call parser; return entries + unmatched list
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [ ]* 6.4 Write property test for attendance draft state invariant (Property 9)
    - **Property 9: Attendance draft state invariant** — for any AttendanceRecord that has not been POSTed, `status === "draft"` and no RecoveryEmail documents exist for that record
    - **Validates: Requirements 6.6**

  - [ ] 6.5 Build `AttendanceTab` component
    - `src/components/admin/tabs/AttendanceTab.tsx` — date picker + slot selector; auto-populate topic from LecturePlan
    - `AttendanceChecklist.tsx` — full roster as checkbox list (present/absent); supports file upload to pre-populate
    - `PostAttendanceButton.tsx` — disabled until at least one entry exists; shows confirmation dialog if duplicate posted record exists; calls `POST /api/attendance/post`
    - Show unmatched registration numbers as warning banner
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 6.8, 6.9_

- [ ] 7. Recovery Engine — Core Orchestration
  - [ ] 7.1 Create Resend email client at `src/lib/email/resend-client.ts`
    - Initialize `Resend` with `RESEND_API_KEY` env var
    - `sendRecoveryEmail(params: RecoveryEmailParams): Promise<EmailResult>` — HTML email with student name, topic, date, summary, page references; attach extracted PDF if available
    - `sendTeacherSummary(params: TeacherSummaryParams): Promise<EmailResult>` — HTML table of absentees with delivery status
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 7.10_

  - [ ]* 7.2 Write property test for recovery email body field presence (Property 13)
    - **Property 13: Recovery email body contains required fields** — for any valid recovery email params, the rendered email body contains student name, lecture topic, lecture date, and AI-generated summary
    - **Validates: Requirements 8.2**

  - [ ] 7.3 Implement summary caching utility at `src/lib/summary-cache.ts`
    - `getCachedSummary(subjectId: string, topicId: string): Promise<string | null>` — check Storage at `/subjects/{subjectId}/summaries/{topicId}.txt`
    - `cacheSummary(subjectId: string, topicId: string, summary: string): Promise<void>` — write to Storage
    - _Requirements: 7.7_

  - [ ]* 7.4 Write property test for summary caching idempotence (Property 11)
    - **Property 11: Summary caching idempotence** — for any topic with a cached summary, invoking the recovery engine again returns the cached value without calling the Genkit LLM flow
    - **Validates: Requirements 7.7**

  - [ ] 7.5 Implement PDF page extraction utility at `src/lib/pdf-extractor.ts`
    - `extractPages(sourcePath: string, startPage: number, endPage: number, destPath: string): Promise<void>` — download PDF from Storage, use `pdf-lib` to extract page range, upload result to Storage
    - Check if extracted PDF already exists at `destPath` before re-extracting
    - _Requirements: 7.8_

  - [ ] 7.6 Implement the Recovery Engine at `src/app/api/attendance/post/route.ts`
    - `POST /api/attendance/post`: verify auth token; accept `{ attendanceRecordId, subjectId }`
    - Update AttendanceRecord `status → "posted"`, set `postedAt`
    - Fetch absent entries; fetch LecturePlanEntry for date+slot (log warning + send generic email if missing)
    - Fetch StudyMaterial + ExtractedTopics (log warning + send without PDF if not processed)
    - For each absent student: check `hasValidEmail`; check summary cache; call `personalizedMissedLectureRecoveryFlow` on cache miss; cache result; extract PDF pages; send recovery email via Resend; create RecoveryEmail document
    - Dispatch emails in parallel batches of 10 using `Promise.allSettled`
    - After all emails: send teacher summary email; create TeacherSummaryLog document
    - Update all RecoveryEmail documents to terminal status (`sent`/`failed`/`skipped`)
    - Return `{ success, absentCount, emailsSent, errors }`
    - _Requirements: 7.1–7.12, 8.1–8.7_

  - [ ]* 7.7 Write property test for recovery email count equals absent student count (Property 10)
    - **Property 10: Recovery email count equals absent student count** — for any posted AttendanceRecord with N absent students, exactly N RecoveryEmail documents are created
    - **Validates: Requirements 7.1, 7.9**

  - [ ]* 7.8 Write property test for terminal email status (Property 12)
    - **Property 12: All RecoveryEmail documents reach a terminal status** — after any completed Recovery Engine run, every RecoveryEmail has `emailStatus` in `{"sent", "failed", "skipped"}`
    - **Validates: Requirements 7.11, 8.4, 8.5, 8.7**

  - [ ] 7.9 Checkpoint — End-to-end: post attendance → emails dispatched → Firestore updated
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Reports and Dashboard
  - [ ] 8.1 Build `ReportsTab` component
    - `src/components/admin/tabs/ReportsTab.tsx` — paginated `@tanstack/react-table` of AttendanceRecords ordered by date descending
    - Row expansion: absent students list with topic and email delivery status badge
    - Student-wise absence summary: total absence count per student + dates
    - "Download CSV" button per record
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

  - [ ] 8.2 Create CSV export route at `src/app/api/reports/csv/route.ts`
    - `GET /api/reports/csv?attendanceRecordId=&subjectId=`: fetch AttendanceRecord + RecoveryEmail docs; build CSV with columns: student name, registration number, email, topic missed, email delivery status; return as `text/csv` download
    - Add `printAttendanceCSV(data: CSVReportRow[]): string` to `pretty-printer.ts`
    - _Requirements: 9.6, 9.7_

  - [ ]* 8.3 Write property test for CSV report completeness (Property 15)
    - **Property 15: CSV report completeness** — for any AttendanceRecord, the generated CSV contains exactly one row per absent student with all required columns
    - **Validates: Requirements 9.6, 9.7**

  - [ ] 8.4 Build admin dashboard stats and activity feed
    - Update `src/app/(admin)/dashboard/page.tsx` — stats cards: total subjects, total students, total posted records, total recovery emails sent (aggregate Firestore queries)
    - Recent activity feed: last 10 attendance posts with subject name, date, slot, absentee count, email delivery status
    - _Requirements: 9.1, 9.2_

- [ ] 9. Developer Portal
  - [ ] 9.1 Build system health dashboard
    - `src/components/developer/SystemHealthCards.tsx` — counts: total users, subjects, emails sent, ML jobs, failed jobs in last 24h (Firestore aggregate queries via Admin SDK)
    - Wire into `src/app/(developer)/dashboard/page.tsx`
    - _Requirements: 10.1_

  - [ ] 9.2 Build log viewer
    - `src/components/developer/LogViewer.tsx` — `@tanstack/react-table` paginated table of `/systemLogs`; filter by `type` (email/ml/auth/api) and date range
    - Create `GET /api/logs` route: fetch logs with Firestore `where` + `orderBy`; developer-only
    - _Requirements: 10.2_

  - [ ]* 9.3 Write property test for log filter correctness (Property 14)
    - **Property 14: Log filter correctness** — for any set of logs and any filter criteria, all returned logs satisfy the filter and no matching log is omitted
    - **Validates: Requirements 10.2**

  - [ ] 9.4 Build ML pipeline manager
    - `src/components/developer/MLPipelineManager.tsx` — table of StudyMaterials with `processingStatus: "failed"`; "Reprocess" button calls `POST /api/ml/reprocess`; shows `sonner` toast on result
    - _Requirements: 10.3, 10.4_

  - [ ] 9.5 Build user management
    - `src/components/developer/UserManagement.tsx` — table of `/users` with create/deactivate actions
    - Create `GET /api/users`, `POST /api/users`, `PATCH /api/users` routes at `src/app/api/users/route.ts`
    - `POST /api/users`: create Firebase Auth user + Firestore `/users/{uid}` document with role `"teacher"`
    - `PATCH /api/users` deactivate: set `isActive: false` in Firestore + call `adminAuth.revokeRefreshTokens(uid)`
    - _Requirements: 10.5, 10.6_

  - [ ] 9.6 Checkpoint — Developer portal fully navigable with real data
    - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Security — Firestore Rules and Storage Rules
  - [ ] 10.1 Update `firestore.rules`
    - Teachers can read/write Subject documents only where `teacherId === request.auth.uid`
    - RecoveryEmail documents: deny all client writes (server-only via Admin SDK)
    - TeacherSummaryLog documents: deny all client writes
    - SystemLog documents: deny all client reads and writes
    - Sub-collections inherit subject ownership rule
    - _Requirements: 12.1, 12.2_

  - [ ]* 10.2 Write property test for Firestore subject ownership isolation (Property 18)
    - **Property 18: Firestore subject ownership isolation** — for any Teacher uid and any Subject where `teacherId !== uid`, Firestore security rules deny read and write access
    - Use Firebase Emulator Suite for this test
    - **Validates: Requirements 12.1**

  - [ ] 10.3 Update Firebase Storage security rules
    - Files under `/subjects/{subjectId}/*` readable/writable only by the owning teacher or Admin SDK
    - _Requirements: 12.3_

- [ ] 11. Polish — Error Handling, Loading States, Toast Notifications
  - [ ] 11.1 Add `sonner` `<Toaster />` to root layout and replace existing toast usage
    - Update `src/app/layout.tsx` to include `<Toaster />`
    - Replace `useToast` hook calls in existing components with `sonner` `toast()`
    - _Requirements: all UI-facing requirements_

  - [ ] 11.2 Add loading skeletons and error boundaries to all data-fetching components
    - Use `src/components/ui/skeleton.tsx` for table and card loading states
    - Add `error.tsx` files in route segments for graceful error display
    - _Requirements: all UI-facing requirements_

  - [ ] 11.3 Wire `FirebaseErrorListener` into admin and developer layouts
    - Ensure `src/components/FirebaseErrorListener.tsx` is rendered in both `(admin)/layout.tsx` and `(developer)/layout.tsx`
    - _Requirements: 1.6_

- [ ] 12. Final Integration and Remaining PBT Tests
  - [ ]* 12.1 Write property test for Excel file parse round-trip (Property 5 — Excel variant)
    - **Property 5: Student roster parse round-trip (Excel)** — `parseStudentRoster(printStudentRoster(students))` preserves all fields for any valid Student array
    - **Validates: Requirements 11.5**

  - [ ]* 12.2 Write property test for Excel lecture plan round-trip (Property 4 — Excel variant)
    - **Property 4: Lecture plan parse round-trip (Excel)** — `parseLecturePlan(printLecturePlan(entries))` preserves all fields
    - **Validates: Requirements 4.3, 11.5**

  - [ ]* 12.3 Write property test for Excel attendance round-trip (Property 6 — Excel variant)
    - **Property 6: Attendance sheet parse round-trip (Excel)** — `parseAttendanceSheet(printAttendanceSheet(entries), roster)` preserves all fields
    - **Validates: Requirements 6.4**

  - [ ] 12.4 Final checkpoint — All tests pass, all routes respond correctly, end-to-end flow verified
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `fc.configureGlobal({ numRuns: 100 })`
- All 18 correctness properties from the design document are covered across tasks 1.3, 1.4, 3.2, 3.4, 3.6, 4.2, 5.2, 5.3, 6.2, 6.4, 7.2, 7.4, 7.7, 7.8, 8.3, 9.3, 10.2, 12.1–12.3
- The Firebase Admin SDK is used exclusively for server-side writes to RecoveryEmail, TeacherSummaryLog, and SystemLog collections
- Checkpoints at tasks 1.8, 5.7, 7.9, 9.6, and 12.4 ensure incremental validation
