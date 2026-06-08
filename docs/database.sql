-- LecQ 데이터베이스 스키마
-- SQLite3 기준 (PostgreSQL은 데이터타입만 조정)

-- 1. Users 테이블
CREATE TABLE users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PDFs 테이블
CREATE TABLE pdfs (
    pdfId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    originalName VARCHAR(255) NOT NULL,
    storedName VARCHAR(255) NOT NULL,
    extractedText TEXT,
    pageCount INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);

-- 3. Summaries 테이블 (요약)
CREATE TABLE summaries (
    summaryId INTEGER PRIMARY KEY AUTOINCREMENT,
    pdfId INTEGER UNIQUE NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'processing',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
);

-- 4. Questions 테이블 (문제)
CREATE TABLE questions (
    questionId INTEGER PRIMARY KEY AUTOINCREMENT,
    pdfId INTEGER UNIQUE NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'processing',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
);

-- 5. Notes 테이블 (노트)
CREATE TABLE notes (
    noteId INTEGER PRIMARY KEY AUTOINCREMENT,
    pdfId INTEGER UNIQUE NOT NULL,
    content TEXT DEFAULT '',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_pdfs_userId ON pdfs(userId);
CREATE INDEX idx_summaries_pdfId ON summaries(pdfId);
CREATE INDEX idx_summaries_status ON summaries(status);
CREATE INDEX idx_questions_pdfId ON questions(pdfId);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_notes_pdfId ON notes(pdfId);
