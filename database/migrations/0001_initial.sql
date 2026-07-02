PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	role TEXT NOT NULL CHECK (role IN ('REPORTER', 'ADMIN', 'TECHNICIAN', 'FACILITY_MANAGER')),
	reporter_type TEXT CHECK (reporter_type IN ('STUDENT', 'LECTURER')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
	id TEXT PRIMARY KEY,
	request_number TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	reporter_id TEXT NOT NULL REFERENCES users(id),
	assigned_technician_id TEXT REFERENCES users(id),
	category TEXT NOT NULL,
	location TEXT NOT NULL,
	description TEXT NOT NULL,
	priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
	status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')),
	reviewed_by TEXT REFERENCES users(id),
	reviewed_at TEXT,
	assigned_by TEXT REFERENCES users(id),
	assigned_at TEXT,
	resolved_at TEXT,
	closed_by TEXT REFERENCES users(id),
	closed_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_comments (
	id TEXT PRIMARY KEY,
	report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
	author_id TEXT NOT NULL REFERENCES users(id),
	body TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_status_history (
	id TEXT PRIMARY KEY,
	report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
	changed_by TEXT NOT NULL REFERENCES users(id),
	from_status TEXT CHECK (from_status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')),
	to_status TEXT NOT NULL CHECK (to_status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED')),
	note TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_confirmations (
	id TEXT PRIMARY KEY,
	report_id TEXT NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
	reporter_id TEXT NOT NULL REFERENCES users(id),
	confirmed INTEGER NOT NULL CHECK (confirmed IN (0, 1)),
	note TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users (id, name, email, role, reporter_type) VALUES
	('usr_reporter_001', 'Pelapor Demo', 'pelapor@example.edu', 'REPORTER', 'STUDENT'),
	('usr_admin_001', 'Administrator Demo', 'admin@example.edu', 'ADMIN', NULL),
	('usr_technician_001', 'Teknisi Fasilitas', 'teknisi.fasilitas@example.edu', 'TECHNICIAN', NULL),
	('usr_technician_002', 'Teknisi IT', 'teknisi.it@example.edu', 'TECHNICIAN', NULL),
	('usr_manager_001', 'Manajer Fasilitas Demo', 'manager@example.edu', 'FACILITY_MANAGER', NULL);

CREATE INDEX IF NOT EXISTS idx_reports_request_number ON reports (request_number);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_technician_id ON reports (assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports (priority);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports (category);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports (location);
CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments (report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON report_status_history (report_id);
