CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) <= 254),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  user_type TEXT NOT NULL CHECK (user_type IN ('Parent','Student','School')),
  category TEXT NOT NULL CHECK (category IN ('Scholarship','Concert','Admission','General Query')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 3000),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','In Progress','Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_category_idx ON inquiries (category);
CREATE INDEX IF NOT EXISTS inquiries_user_type_idx ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries (status);
