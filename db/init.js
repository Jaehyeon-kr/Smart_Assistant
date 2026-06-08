const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'smartq.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Users 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. PDFs 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS pdfs (
      pdfId INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      originalName VARCHAR(255) NOT NULL,
      storedName VARCHAR(255) NOT NULL,
      extractedText TEXT,
      pageCount INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    )
  `);

  // 3. Summaries 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS summaries (
      summaryId INTEGER PRIMARY KEY AUTOINCREMENT,
      pdfId INTEGER UNIQUE NOT NULL,
      content TEXT,
      status VARCHAR(20) DEFAULT 'processing',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
    )
  `);

  // 4. Questions 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      questionId INTEGER PRIMARY KEY AUTOINCREMENT,
      pdfId INTEGER UNIQUE NOT NULL,
      content TEXT,
      status VARCHAR(20) DEFAULT 'processing',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
    )
  `);

  // 5. Notes 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      noteId INTEGER PRIMARY KEY AUTOINCREMENT,
      pdfId INTEGER UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pdfId) REFERENCES pdfs(pdfId) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('DB 초기화 오류:', err);
    } else {
      console.log('✓ 데이터베이스 테이블 생성 완료');
    }
  });
});

module.exports = db;
