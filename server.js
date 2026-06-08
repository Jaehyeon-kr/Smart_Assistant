require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// DB 초기화
require('./db/init');

// 라우트 임포트
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdfs');
const studyRoutes = require('./routes/study');

const app = express();

// 미들웨어
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// uploads 폴더가 없으면 생성
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
process.env.UPLOAD_DIR = uploadDir;

// 정적 파일 서빙 (업로드된 PDF)
app.use('/uploads', express.static(process.env.UPLOAD_DIR));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api', studyRoutes);

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '서버가 정상 작동 중입니다' });
});

// 프론트엔드 빌드 파일 서빙 (production)
const frontendBuild = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '서버 오류 발생' });
});

// 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n✓ SmartQ 서버 시작: http://localhost:${PORT}`);
  console.log(`✓ 환경: ${process.env.NODE_ENV}`);
  console.log(`✓ 데이터베이스: ${process.env.DB_PATH}\n`);
});

module.exports = app;
