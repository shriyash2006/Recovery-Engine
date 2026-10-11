-- =============================================================================
-- RECOVERY ENGINE — CLOUD SQL SCHEMA DEFINITION
-- Cloud SQL Instance: recovery-engine-9da3c-instance (us-east4)
-- Database:           recovery-engine-9da3c-database
-- Project:            recovery-engine-9da3c-service
-- =============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('teacher', 'professor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('Upcoming', 'Ongoing', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('Pending', 'Sent', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE (Teachers, Professors, Students)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,            -- e.g. 'CS302'
    name VARCHAR(200) NOT NULL,                   -- e.g. 'Operating Systems'
    description TEXT,
    modules_count INT NOT NULL DEFAULT 1,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLASSES / SECTIONS TABLE
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL,           -- e.g. 'Section A'
    academic_term VARCHAR(50),                   -- e.g. 'Fall 2026'
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, section_name, academic_term)
);

-- 5. CLASS MEMBERS (Enrollment M:N)
CREATE TABLE IF NOT EXISTS class_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),                     -- e.g. 'R2024-101'
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- 6. LECTURE PLANNER & SCHEDULE
CREATE TABLE IF NOT EXISTS lecture_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,                 -- e.g. 'Process Scheduling Algorithms'
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_location VARCHAR(100),                  -- e.g. 'Room 402'
    status session_status NOT NULL DEFAULT 'Upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lecture_plan_id UUID REFERENCES lecture_plans(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,              -- e.g. 'PDF', 'PPTX'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_plan_id UUID NOT NULL REFERENCES lecture_plans(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    taken_by_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDIVIDUAL ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_present BOOLEAN NOT NULL DEFAULT TRUE,
    remarks TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- 10. ABSENTEE NOTIFICATIONS & AI AUDIT LOG
CREATE TABLE IF NOT EXISTS absentee_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    lecture_plan_id UUID NOT NULL REFERENCES lecture_plans(id) ON DELETE CASCADE,
    email_to VARCHAR(255) NOT NULL,
    email_subject VARCHAR(255) NOT NULL,
    email_summary TEXT NOT NULL,
    ai_provider VARCHAR(50) NOT NULL,            -- e.g. 'Gemini', 'Groq', 'Fallback'
    status notification_status NOT NULL DEFAULT 'Pending',
    email_message_id VARCHAR(255),               -- Resend email message ID
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_plans_class_date ON lecture_plans(class_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id, is_present);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON absentee_notifications(status);
