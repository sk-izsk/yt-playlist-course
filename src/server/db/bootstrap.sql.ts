// ponytail: hand-written DDL kept in sync with schema.ts; move to drizzle-kit migrations once the schema starts changing often.
export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_synced_at INTEGER,
  pinned INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  available_updates INTEGER NOT NULL DEFAULT 0,
  line INTEGER
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  course_token TEXT,
  created_at INTEGER NOT NULL,
  read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  start_sec INTEGER,
  end_sec INTEGER,
  thumbnail TEXT NOT NULL DEFAULT '',
  transcript_status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  lesson_kind TEXT,
  notes_updated_at INTEGER,
  is_new INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS lessons_course_idx ON lessons(course_id, position);
CREATE TABLE IF NOT EXISTS transcripts (
  lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  segments TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS practice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  hint TEXT,
  url TEXT
);
CREATE TABLE IF NOT EXISTS quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT,
  at_sec INTEGER
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  at_sec INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;
