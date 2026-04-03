# Requirements Document

## Introduction

The Missed Class Recovery Engine (MCRE) is an intelligent academic recovery platform built on top of the existing Ascent Scholar Next.js 15 application. It automates the detection of absent students and delivers personalized class recovery materials — AI-generated summaries and relevant PDF pages — via email, immediately after a teacher posts attendance. The system serves three roles: Teacher (Admin portal), Student (passive email recipient), and Developer (monitoring portal). It integrates with the existing Firebase stack (Auth, Firestore, Storage) and extends the existing Genkit AI flows already present in the codebase.

---

## Glossary

- **MCRE**: Missed Class Recovery Engine — the full system described in this document.
- **System**: The MCRE web application as a whole.
- **Auth_Service**: Firebase Authentication, responsible for identity and session management.
- **Firestore**: Firebase Firestore database, the primary data store.
- **Storage**: Firebase Storage, used for file uploads and extracted assets.
- **Teacher**: An authenticated user with role `"teacher"` who manages subjects, materials, and attendance.
- **Developer**: An authenticated user with role `"developer"` who monitors system health and manages accounts.
- **Student**: A passive recipient (no login) identified by registration number and email address within a subject roster.
- **Subject**: An academic course unit owned by a Teacher, containing modules, a lecture plan, a student roster, and attendance records.
- **StudyMaterial**: A PDF or PPTX file uploaded by a Teacher for a specific module of a Subject.
- **ML_Pipeline**: The server-side process that extracts headings and topics from StudyMaterials and generates summaries using the Genkit AI flows.
- **ExtractedTopic**: A structured heading/topic with start page, end page, and confidence score, produced by the ML_Pipeline from a StudyMaterial.
- **LecturePlan**: A mapping of dates and time slots to topics for a Subject, owned by a Teacher.
- **LecturePlanEntry**: A single row in a LecturePlan: one date, one slot, one topic reference.
- **AttendanceRecord**: A record of student presence/absence for a specific Subject, date, and slot.
- **AttendanceEntry**: A single student's presence or absence status within an AttendanceRecord.
- **Recovery_Engine**: The server-side orchestration process triggered when a Teacher posts attendance; it identifies absentees, fetches relevant content, generates summaries, and dispatches emails.
- **Email_Service**: The third-party transactional email provider (Resend) used to send recovery emails and teacher summaries.
- **RecoveryEmail**: A Firestore document recording the details and delivery status of one recovery email sent to one Student.
- **TeacherSummaryLog**: A Firestore document recording the summary email sent to the Teacher after attendance is posted.
- **Admin_Portal**: The Teacher-facing web interface at `/dashboard/*`.
- **Developer_Portal**: The Developer-facing web interface at `/developer/*`.
- **Middleware**: Next.js middleware that enforces route-level authentication and role-based access control.
- **Parser**: A server-side utility that extracts structured data from uploaded Excel or PDF files.
- **Pretty_Printer**: A utility that serializes structured data back into a human-readable format (used for round-trip validation).

---

## Requirements

### Requirement 1: Authentication and Role-Based Access Control

**User Story:** As a Teacher or Developer, I want to log in with my email and password so that I can access my role-specific portal securely.

#### Acceptance Criteria

1. THE Auth_Service SHALL authenticate users using email and password via Firebase Authentication.
2. WHEN a user successfully authenticates, THE System SHALL redirect the user to `/dashboard` if their role is `"teacher"`, or to `/developer` if their role is `"developer"`.
3. WHEN an unauthenticated user attempts to access any route under `/dashboard/*` or `/developer/*`, THE Middleware SHALL redirect the user to the login page.
4. WHEN an authenticated Teacher attempts to access any route under `/developer/*`, THE Middleware SHALL redirect the user to `/dashboard`.
5. WHEN an authenticated Developer attempts to access any route under `/dashboard/*`, THE Middleware SHALL redirect the user to `/developer`.
6. IF authentication fails due to invalid credentials, THEN THE Auth_Service SHALL return an error message indicating the failure reason without exposing internal system details.
7. THE System SHALL provide a single login page accessible at `/` (or `/login`) for all roles.

---

### Requirement 2: Subject Management

**User Story:** As a Teacher, I want to create and manage subjects so that I can organize my courses, students, and materials in one place.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display all subjects owned by the authenticated Teacher as a grid of subject cards on the dashboard.
2. WHEN a Teacher submits a valid new subject form (subject name, subject code, class ID, total modules), THE System SHALL create a Subject document in Firestore under `/subjects/{subjectId}` with the Teacher's uid as `teacherId`.
3. WHEN a Teacher selects a subject card, THE Admin_Portal SHALL navigate to the subject detail page displaying five tabs: Study Material, Lecture Plan, Students, Attendance, and Reports.
4. IF a Teacher submits a new subject form with a duplicate subject code for the same class, THEN THE System SHALL return a validation error and SHALL NOT create a duplicate Subject document.
5. THE System SHALL associate all sub-collections (studyMaterials, lecturePlan, students, attendance) under the owning Subject document in Firestore.

---

### Requirement 3: Study Material Upload and ML Processing

**User Story:** As a Teacher, I want to upload PDF or PPTX study materials per module so that the system can extract topics and prepare content for student recovery emails.

#### Acceptance Criteria

1. WHEN a Teacher uploads a PDF or PPTX file for a module, THE Storage SHALL store the file at `/subjects/{subjectId}/materials/{moduleNumber}/{fileName}` and THE System SHALL create a StudyMaterial document in Firestore with `processingStatus: "pending"`.
2. WHEN a StudyMaterial document is created with `processingStatus: "pending"`, THE ML_Pipeline SHALL begin topic extraction using structural analysis (font size, bold text, numbering patterns) and the existing Genkit `automatedLectureContentAnalysisFlow` as a fallback.
3. WHEN the ML_Pipeline completes topic extraction, THE System SHALL update the StudyMaterial document with an array of ExtractedTopic objects and set `processingStatus: "processed"`.
4. IF the ML_Pipeline fails to extract any topics from a StudyMaterial, THEN THE System SHALL set `processingStatus: "failed"` and SHALL log the failure to `/systemLogs/{logId}`.
5. WHEN a StudyMaterial has `processingStatus: "processed"`, THE Admin_Portal SHALL display the extracted topics in an editable list so the Teacher can review and correct headings, page ranges, and sub-headings.
6. WHEN a Teacher saves edits to extracted topics, THE System SHALL update the corresponding ExtractedTopic entries in Firestore and SHALL preserve the Teacher's corrections on subsequent reprocessing.
7. THE System SHALL accept PDF files up to 50 MB and PPTX files up to 50 MB per upload.
8. IF a Teacher uploads a file exceeding 50 MB, THEN THE System SHALL reject the upload and SHALL display an error message stating the file size limit.
9. THE ML_Pipeline SHALL assign a confidence score between 0.0 and 1.0 to each ExtractedTopic, reflecting extraction certainty.

---

### Requirement 4: Lecture Plan Management

**User Story:** As a Teacher, I want to create and manage a lecture plan mapping dates and slots to topics so that the system knows what was taught on any given day.

#### Acceptance Criteria

1. THE Admin_Portal SHALL allow a Teacher to add LecturePlanEntry records manually by selecting a date, a time slot, and a topic from the processed ExtractedTopics of the Subject.
2. WHEN a Teacher uploads a PDF or Excel file as a lecture plan, THE Parser SHALL extract date, slot, and topic data and populate LecturePlanEntry records in Firestore under `/subjects/{subjectId}/lecturePlan`.
3. FOR ALL valid LecturePlan documents, parsing a lecture plan file then printing it then parsing the result SHALL produce an equivalent set of LecturePlanEntry records (round-trip property).
4. IF a Teacher uploads a lecture plan file that contains rows with missing date or slot values, THEN THE Parser SHALL skip those rows and SHALL report the count of skipped rows to the Teacher.
5. WHEN a Teacher saves a LecturePlanEntry, THE System SHALL validate that the date is a valid calendar date and the slot is a non-empty string before persisting to Firestore.
6. THE Admin_Portal SHALL display all LecturePlanEntry records for a Subject in a sortable table ordered by date and slot.

---

### Requirement 5: Student Roster Management

**User Story:** As a Teacher, I want to upload or manually add student details for each subject so that the system can identify absentees and send them recovery emails.

#### Acceptance Criteria

1. WHEN a Teacher uploads an Excel or PDF file containing student details, THE Parser SHALL extract name, registration number, email, mobile number, and section for each row and create Student documents in Firestore under `/subjects/{subjectId}/students/{studentId}`.
2. FOR ALL valid student roster files, parsing the file then printing the roster then parsing the result SHALL produce an equivalent set of Student records (round-trip property).
3. WHEN a Teacher manually submits a student form with name, registration number, and email, THE System SHALL create a Student document in Firestore.
4. IF a Teacher uploads a student file containing a registration number that already exists in the Subject's roster, THEN THE System SHALL update the existing Student document rather than creating a duplicate.
5. THE Admin_Portal SHALL display the student roster in a searchable, paginated table supporting search by name and registration number.
6. THE Admin_Portal SHALL support bulk deletion of selected Student records.
7. IF a student record is missing a valid email address, THEN THE System SHALL flag that record with a validation warning and SHALL NOT send recovery emails to that student.

---

### Requirement 6: Attendance Recording

**User Story:** As a Teacher, I want to record attendance for a specific date and slot so that the system can identify which students were absent.

#### Acceptance Criteria

1. WHEN a Teacher selects a date and slot on the Attendance tab, THE Admin_Portal SHALL auto-populate the associated topic from the LecturePlan if a matching LecturePlanEntry exists.
2. THE Admin_Portal SHALL display the full student roster as a checklist so the Teacher can manually mark each student as present or absent.
3. WHEN a Teacher uploads an Excel or PDF attendance sheet, THE Parser SHALL extract student identifiers and presence/absence statuses and populate the attendance checklist.
4. FOR ALL valid attendance sheet files, parsing the file then printing the attendance data then parsing the result SHALL produce an equivalent set of AttendanceEntry records (round-trip property).
5. IF a Teacher uploads an attendance sheet containing registration numbers not found in the Subject's student roster, THEN THE System SHALL highlight the unmatched entries and SHALL NOT discard the rest of the upload.
6. THE System SHALL save attendance in `status: "draft"` state until the Teacher explicitly clicks the POST button.
7. WHEN a Teacher clicks POST on a draft AttendanceRecord, THE System SHALL transition the record to `status: "posted"` and SHALL trigger the Recovery_Engine.
8. IF a Teacher attempts to POST an AttendanceRecord for a date and slot that already has a `status: "posted"` record, THEN THE System SHALL display a confirmation dialog before allowing a duplicate post.
9. THE Admin_Portal SHALL support multiple time slots per day for the same Subject.

---

### Requirement 7: Recovery Engine — Core Orchestration

**User Story:** As a Teacher, I want the system to automatically send personalized recovery materials to absent students the moment I post attendance so that students can catch up without manual intervention.

#### Acceptance Criteria

1. WHEN an AttendanceRecord transitions to `status: "posted"`, THE Recovery_Engine SHALL identify all AttendanceEntry records with `status: "absent"` within that AttendanceRecord.
2. WHEN the Recovery_Engine identifies absent students, THE Recovery_Engine SHALL fetch the LecturePlanEntry for the posted date and slot to determine the topic taught.
3. IF no LecturePlanEntry exists for the posted date and slot, THEN THE Recovery_Engine SHALL log a warning to `/systemLogs/{logId}` and SHALL send a generic notification email to each absentee indicating that lecture plan details are unavailable.
4. WHEN the Recovery_Engine has identified the topic, THE Recovery_Engine SHALL fetch the corresponding StudyMaterial and its ExtractedTopics from Firestore.
5. IF the StudyMaterial for the identified topic has `processingStatus` other than `"processed"`, THEN THE Recovery_Engine SHALL log a warning and SHALL send recovery emails without PDF attachment, including only the AI-generated summary.
6. WHEN the Recovery_Engine has the ExtractedTopics, THE Recovery_Engine SHALL invoke the existing Genkit `personalizedMissedLectureRecoveryFlow` to generate a lecture summary and email body for each absent student.
7. WHEN the ML_Pipeline generates a summary for a topic that has been previously summarized, THE System SHALL return the cached summary from Storage at `/subjects/{subjectId}/summaries/{topicId}.txt` rather than invoking the LLM again.
8. WHEN the Recovery_Engine has a generated summary, THE Recovery_Engine SHALL use pdf-lib to extract the relevant page range from the StudyMaterial PDF and store the extracted pages at `/subjects/{subjectId}/extracted-pdfs/{topicId}.pdf` in Storage.
9. THE Recovery_Engine SHALL send one recovery email per absent student containing the AI-generated summary and, where a processed StudyMaterial exists, the extracted PDF pages as an attachment.
10. WHEN all recovery emails have been dispatched, THE Recovery_Engine SHALL send one summary email to the Teacher listing the total absentee count, each absentee's name and registration number, and the email delivery status for each.
11. WHEN all emails are dispatched, THE Recovery_Engine SHALL create a TeacherSummaryLog document in Firestore and SHALL update each RecoveryEmail document with the final `emailStatus`.
12. THE Recovery_Engine SHALL process up to 200 absent students per AttendanceRecord without timeout or data loss.

---

### Requirement 8: Email Delivery

**User Story:** As a Student, I want to receive a personalized email with a summary of the class I missed and the relevant study material so that I can recover the content efficiently.

#### Acceptance Criteria

1. THE Email_Service SHALL send recovery emails using the Resend API with the Teacher's configured sender address.
2. WHEN the Email_Service sends a recovery email, THE Email_Service SHALL include the student's name, the lecture topic, the lecture date, the AI-generated summary, and a reference to relevant page numbers in the email body.
3. WHERE a processed PDF extraction exists for the topic, THE Email_Service SHALL attach the extracted PDF pages to the recovery email.
4. WHEN the Email_Service successfully delivers an email, THE System SHALL update the corresponding RecoveryEmail document with `emailStatus: "sent"` and the delivery timestamp.
5. IF the Email_Service fails to deliver an email, THEN THE System SHALL update the RecoveryEmail document with `emailStatus: "failed"` and SHALL log the error to `/systemLogs/{logId}`.
6. THE Email_Service SHALL use the email subject line generated by the `personalizedMissedLectureRecoveryFlow` output.
7. IF a Student record has no valid email address, THEN THE Email_Service SHALL skip that student and SHALL record `emailStatus: "skipped"` on the RecoveryEmail document.

---

### Requirement 9: Reports and Dashboard

**User Story:** As a Teacher, I want to view attendance history and email delivery statistics so that I can monitor student engagement and recovery outcomes.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display a dashboard with summary statistics cards showing total subjects, total students across all subjects, total posted attendance records, and total recovery emails sent.
2. THE Admin_Portal SHALL display a recent activity feed on the dashboard showing the last 10 attendance posts with subject name, date, slot, absentee count, and email delivery status.
3. WHEN a Teacher navigates to the Reports tab of a Subject, THE Admin_Portal SHALL display a paginated list of all AttendanceRecords for that Subject ordered by date descending.
4. WHEN a Teacher selects an AttendanceRecord in the Reports tab, THE Admin_Portal SHALL display the full list of absent students, the topic taught, and the email delivery status for each absentee.
5. THE Admin_Portal SHALL display a student-wise absence summary showing each student's total absence count and the list of dates they were absent.
6. THE Admin_Portal SHALL provide a downloadable CSV report of absentees for any selected AttendanceRecord.
7. WHEN a Teacher downloads a CSV report, THE System SHALL include columns for student name, registration number, email, topic missed, and email delivery status.

---

### Requirement 10: Developer Portal

**User Story:** As a Developer, I want to monitor system health, inspect logs, manage the ML pipeline, and manage teacher accounts so that I can maintain and troubleshoot the platform.

#### Acceptance Criteria

1. THE Developer_Portal SHALL display a system health dashboard showing counts of total users, total subjects, total emails sent, total ML processing jobs, and counts of failed jobs in the last 24 hours.
2. THE Developer_Portal SHALL display a filterable log viewer showing entries from `/systemLogs/{logId}` filterable by log type (email, ML, auth, API) and by date range.
3. THE Developer_Portal SHALL display a list of all StudyMaterials with their `processingStatus`, allowing a Developer to trigger reprocessing of any StudyMaterial with `processingStatus: "failed"`.
4. WHEN a Developer triggers reprocessing of a StudyMaterial, THE ML_Pipeline SHALL re-run topic extraction and SHALL update the StudyMaterial document accordingly.
5. THE Developer_Portal SHALL allow a Developer to create, deactivate, and view Teacher accounts stored in Firestore under `/users/{uid}`.
6. WHEN a Developer deactivates a Teacher account, THE System SHALL prevent that Teacher from authenticating until the account is reactivated.

---

### Requirement 11: File Parsing — Excel and PDF Uploads

**User Story:** As a Teacher, I want to upload Excel or PDF files for student rosters, lecture plans, and attendance sheets so that I do not have to enter data manually.

#### Acceptance Criteria

1. THE Parser SHALL accept `.xlsx` and `.csv` files for student roster, lecture plan, and attendance uploads.
2. THE Parser SHALL accept `.pdf` files for lecture plan and attendance uploads.
3. WHEN a valid Excel file is provided, THE Parser SHALL parse it into the corresponding structured data type (Student array, LecturePlanEntry array, or AttendanceEntry array).
4. WHEN a valid PDF file is provided, THE Parser SHALL extract tabular or structured text and parse it into the corresponding structured data type.
5. FOR ALL valid Excel files, parsing the file then serializing the result to Excel then parsing again SHALL produce an equivalent structured data set (round-trip property).
6. IF a Parser receives a file with an unsupported MIME type, THEN THE Parser SHALL return a descriptive error identifying the unsupported type.
7. IF a Parser receives a file that is structurally valid but contains no parseable data rows, THEN THE Parser SHALL return an empty array and SHALL report zero rows parsed to the caller.

---

### Requirement 12: Security and Data Access Control

**User Story:** As a system operator, I want data access to be strictly controlled so that teachers can only access their own subjects and students, and the recovery email pipeline cannot be tampered with by client-side code.

#### Acceptance Criteria

1. THE Firestore SHALL enforce security rules such that a Teacher can only read and write Subject documents where `teacherId` equals the Teacher's authenticated uid.
2. THE Firestore SHALL enforce security rules such that RecoveryEmail documents can only be written by the Firebase Admin SDK (server-side), not by client-side requests.
3. THE Storage SHALL enforce security rules such that files under `/subjects/{subjectId}/*` can only be read and written by the Teacher who owns that Subject or by the Firebase Admin SDK.
4. THE System SHALL validate all file uploads server-side for MIME type and file size before storing to Storage, independent of client-side validation.
5. THE Middleware SHALL verify the Firebase ID token on every request to `/api/*` routes before processing the request.
6. IF a request to any `/api/*` route is made without a valid Firebase ID token, THEN THE Middleware SHALL return HTTP 401 without processing the request.

