# SmartQ 프로젝트 구조

## 📁 백엔드 폴더 구조 (완성)

```
smartq-backend/
├── routes/
│   ├── auth.js              ✅ 회원가입, 로그인, 탈퇴
│   ├── pdfs.js              ✅ PDF 업로드, 조회, 삭제
│   └── study.js             ✅ 요약, 문제, 노트, AI 튜터
├── services/
│   ├── claudeService.js     ✅ Claude API 통합
│   └── pdfService.js        ✅ PDF 텍스트 추출
├── middleware/
│   └── auth.js              ✅ JWT 검증
├── db/
│   └── init.js              ✅ DB 초기화 (5개 테이블)
├── uploads/                 ✅ PDF 파일 저장소
├── server.js                ✅ 메인 서버
├── package.json             ✅ 의존성
├── .env                     ✅ 환경변수
└── .gitignore              ✅ git 무시 목록
```

---

## 📁 프론트엔드 폴더 구조 (예정)

```
smartq-frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── DocumentList/
│   │   │   ├── DocumentsPage.jsx
│   │   │   └── DocumentCard.jsx
│   │   ├── PDFViewer/
│   │   │   └── PDFViewerComponent.jsx
│   │   ├── Tabs/
│   │   │   ├── SummaryTab.jsx
│   │   │   ├── QuestionsTab.jsx
│   │   │   ├── NoteTab.jsx
│   │   │   └── AITutorTab.jsx
│   │   ├── Common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   └── Layout/
│   │       └── MainLayout.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── StudyPage.jsx
│   │   └── SettingsPage.jsx
│   ├── api/
│   │   ├── api.js           (axios 인스턴스)
│   │   ├── auth.js          (인증 API)
│   │   ├── documents.js     (PDF API)
│   │   └── study.js         (학습 API)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   └── useAPI.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── utils/
│   │   ├── validation.js
│   │   └── storage.js
│   ├── App.jsx
│   └── index.js
├── public/
│   └── index.html
├── package.json
└── .gitignore
```

---

## 🔌 API 엔드포인트 구조

```
/api/
├── auth/
│   ├── POST   /register      (회원가입)
│   ├── POST   /login         (로그인)
│   └── DELETE /me            (회원탈퇴)
├── pdfs/
│   ├── POST   /              (PDF 업로드)
│   ├── GET    /              (문서함 조회)
│   ├── DELETE /:pdfId        (PDF 삭제)
│   └── GET    /:pdfId/file   (PDF 파일)
└── pdfs/
    ├── GET    /:pdfId/summary
    ├── POST   /:pdfId/summary/retry
    ├── GET    /:pdfId/questions
    ├── POST   /:pdfId/questions/retry
    ├── GET    /:pdfId/note
    ├── PUT    /:pdfId/note
    └── POST   /:pdfId/chat   (SSE)
```

---

## 📊 데이터 흐름

### 1. 회원가입/로그인
```
RegisterPage
    ↓
POST /api/auth/register
    ↓
bcrypt 해싱 → DB 저장
    ↓
로그인 페이지로 이동
```

### 2. PDF 업로드
```
DocumentsPage
    ↓
[PDF 파일 선택]
    ↓
POST /api/pdfs (multipart/form-data)
    ↓
multer → 파일 저장 (/uploads/{userId}/)
pdf-parse → 텍스트 추출
    ↓
Promise.all:
  ① Claude API → 요약 생성
  ② Claude API → 문제 생성
  ③ 빈 노트 생성
    ↓
StudyPage로 이동
```

### 3. 학습 (요약 탭)
```
StudyPage
    ↓
GET /api/pdfs/:pdfId/summary
    ↓
status = 'processing' → 3초마다 폴링
status = 'done' → 요약 텍스트 표시
status = 'failed' → [재시도] 버튼
```

### 4. 노트 저장 (debounce)
```
NoteTab
    ↓
[사용자 입력]
    ↓
debounce(2000ms)
    ↓
PUT /api/pdfs/:pdfId/note
    ↓
DB 업데이트
```

### 5. AI 튜터 (SSE)
```
AITutorTab
    ↓
[사용자 메시지 입력]
    ↓
POST /api/pdfs/:pdfId/chat
    ↓
Claude API stream
    ↓
SSE 청크 수신
    ↓
실시간 텍스트 표시
```

---

## 🗄️ 데이터베이스 구조

### Users
```
userId (PK)
├── email (UNIQUE)
├── passwordHash (bcrypt)
└── createdAt

Relation: 1 → N (PDFs)
```

### PDFs
```
pdfId (PK)
├── userId (FK)
├── originalName
├── storedName (UUID)
├── extractedText
├── pageCount
└── createdAt

Relations:
├── 1 → 1 Summaries
├── 1 → 1 Questions
└── 1 → 1 Notes
```

### Summaries, Questions, Notes
```
All have:
├── [type]Id (PK)
├── pdfId (FK, UNIQUE)
├── content (TEXT)
└── status/updatedAt
```

---

## 🔐 인증 흐름

```
Client                    Server
   │                        │
   │─── POST /register ────→│
   │                        ├─ 검증
   │                        ├─ bcrypt 해싱
   │                        └─ DB 저장
   │←── success/error ──────│
   │
   │─── POST /login ────────→│
   │                        ├─ 검증
   │                        ├─ 비밀번호 비교
   │                        └─ JWT 생성
   │←── JWT token ─────────│
   │
   ├─ localStorage.setItem('token')
   │
   │─── GET /api/pdfs ─────→│ (Authorization: Bearer JWT)
   │                        ├─ JWT 검증
   │                        └─ 요청 처리
   │←── response ──────────│
```

---

## 📦 의존성 (Dependencies)

### 백엔드
```json
{
  "express": "HTTP 프레임워크",
  "cors": "CORS 설정",
  "dotenv": "환경변수",
  "multer": "파일 업로드",
  "pdf-parse": "PDF 텍스트 추출",
  "@anthropic-ai/sdk": "Claude API",
  "bcryptjs": "비밀번호 해싱",
  "jsonwebtoken": "JWT",
  "sqlite3": "데이터베이스",
  "uuid": "파일명 UUID",
  "nodemon": "개발용"
}
```

### 프론트엔드 (예정)
```json
{
  "react": "UI 프레임워크",
  "react-router-dom": "라우팅",
  "axios": "HTTP 클라이언트",
  "react-pdf": "PDF 렌더링",
  "lodash": "유틸리티"
}
```

---

## 🚀 실행 방법

### 1. 백엔드 시작
```bash
cd smartq-backend
npm install
npm run dev
# http://localhost:4000
```

### 2. 프론트엔드 시작 (추후)
```bash
cd smartq-frontend
npm install
npm start
# http://localhost:3000
```

---

## ✅ 체크리스트

### 백엔드
- [x] 폴더 구조
- [x] 환경변수
- [x] 데이터베이스
- [x] API 라우트
- [x] 서비스
- [x] 미들웨어
- [x] 서버 시작

### 프론트엔드 (다음)
- [ ] 폴더 구조
- [ ] 라우팅
- [ ] 인증 페이지
- [ ] 문서함 페이지
- [ ] 학습 페이지
- [ ] 스타일링

---

**현재 상태: 백엔드 개발 완료 (100%) ✅**

다음: 프론트엔드 개발 시작 (0%)
