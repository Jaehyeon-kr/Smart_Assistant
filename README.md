# SmartQ - AI 교육 에이전트 프로젝트

> **PDF 기반 올인원 학습 플랫폼**

---

## 📌 프로젝트 개요

**SmartQ**는 대학생들의 강의 슬라이드 PDF를 업로드하면, AI 튜터를 통해 학습을 지원하는 웹 플랫폼입니다.

### 핵심 기능
- 📄 **PDF 업로드**: 강의 자료 PDF 업로드 (최대 50페이지 / 20MB)
- ✨ **자동 요약**: Claude AI로 한국어 요약 생성
- 🎯 **문제 생성**: 4선지 객관식 문제 5개 자동 생성
- 📝 **노트**: 학습 노트 자동 저장 (debounce)
- 🤖 **AI 튜터**: 실시간 대화형 학습 지원 (SSE 스트리밍)

---

## 📂 프로젝트 구조

```
new_sub/
├── frontend/                   ← React 프론트엔드
│   └── src/
│       ├── pages/              ← LoginPage, RegisterPage, DocumentsPage, StudyPage, SettingsPage
│       ├── components/         ← Navbar
│       └── api/                ← axios API 모듈
│
├── routes/                     ← Express 라우터
│   ├── auth.js                 ← 회원가입/로그인/탈퇴
│   ├── pdfs.js                 ← PDF 업로드/조회/삭제
│   └── study.js                ← 요약/문제/노트/AI 튜터
│
├── services/
│   ├── claudeService.js        ← Claude API (요약, 문제, 스트리밍)
│   └── pdfService.js           ← pdf-parse 텍스트 추출
│
├── middleware/auth.js           ← JWT 인증 미들웨어
├── db/init.js                  ← SQLite 초기화
├── server.js                   ← Express 서버 진입점
├── .env.example                ← 환경변수 예시
└── error_solve.md              ← 개발 중 에러 해결 기록
```

---

## 🚀 실행 방법

### 1. 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 등 실제 값 입력
```

### 2. 백엔드 실행

```bash
npm install
npm run dev      # http://localhost:4000
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install

# pdf.worker 복사 (최초 1회)
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs

npm start        # http://localhost:3000
```

---

## 📋 구현 현황 (FR-01 ~ FR-13)

| # | 기능 | 구현 상태 |
|----|------|---------|
| FR-01 | 회원가입 | ✅ 완료 |
| FR-02 | 로그인 | ✅ 완료 |
| FR-03 | 로그아웃 | ✅ 완료 |
| FR-04 | 회원탈퇴 | ✅ 완료 |
| FR-05 | PDF 업로드 | ✅ 완료 |
| FR-06 | 문서함 조회 | ✅ 완료 |
| FR-07 | PDF 삭제 | ✅ 완료 |
| FR-08 | PDF 뷰어 | ✅ 완료 |
| FR-09 | 탭 패널 (요약/문제/노트) | ✅ 완료 |
| FR-10 | 요약 탭 | ✅ 완료 |
| FR-11 | 문제 탭 | ✅ 완료 |
| FR-12 | 노트 탭 | ✅ 완료 |
| FR-13 | AI 튜터 (SSE 스트리밍) | ✅ 완료 |

---

## 📐 기술 스택

### 프론트엔드
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **PDF Viewer**: react-pdf + pdfjs-dist

### 백엔드
- **Runtime**: Node.js
- **Framework**: Express.js v4
- **Database**: SQLite3
- **PDF Processing**: pdf-parse v1.1.1
- **AI Integration**: Claude API (@anthropic-ai/sdk)
- **Authentication**: JWT + bcryptjs
- **File Upload**: multer v1

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────┐
│        React Frontend               │
│  (Component + State Management)     │
└──────────────┬──────────────────────┘
               │ HTTP/REST + SSE
               ▼
┌─────────────────────────────────────┐
│      Express Backend API            │
│  ├── Auth Routes                    │
│  ├── PDF Management                 │
│  ├── Study (요약/문제/노트)          │
│  └── AI Tutor (SSE)                 │
└──────────────┬──────────────────────┘
      ┌────────┼────────┐
      ▼        ▼        ▼
    SQLite  File     Claude
    (DB)    System   API
```

---

## 📊 데이터 모델 (5개 테이블)

| 테이블 | 설명 | 주요 필드 |
|--------|------|---------|
| **users** | 사용자 정보 | userId, email, passwordHash |
| **pdfs** | 업로드된 PDF | pdfId, userId, originalName, extractedText |
| **summaries** | AI 생성 요약 | summaryId, pdfId, content, status |
| **questions** | AI 생성 문제 | questionId, pdfId, content (JSON) |
| **notes** | 사용자 노트 | noteId, pdfId, content |

---

## 🔌 API 엔드포인트 (14개)

### 인증
```
POST   /api/auth/register      회원가입
POST   /api/auth/login         로그인
DELETE /api/auth/me            회원탈퇴
```

### PDF 관리
```
POST   /api/pdfs               PDF 업로드
GET    /api/pdfs               문서함 조회
DELETE /api/pdfs/:pdfId        PDF 삭제
GET    /api/pdfs/:pdfId/file   PDF 파일 반환
```

### 학습 콘텐츠
```
GET    /api/pdfs/:pdfId/summary              요약 조회
POST   /api/pdfs/:pdfId/summary/retry        요약 재생성
GET    /api/pdfs/:pdfId/questions            문제 조회
POST   /api/pdfs/:pdfId/questions/retry      문제 재생성
GET    /api/pdfs/:pdfId/note                 노트 조회
PUT    /api/pdfs/:pdfId/note                 노트 저장
```

### AI 튜터
```
POST   /api/pdfs/:pdfId/chat   AI 튜터 (SSE 스트리밍)
```

---

## 🎨 UI/UX

| 페이지 | URL | 설명 |
|--------|-----|------|
| 랜딩 | `/` | 서비스 소개 |
| 회원가입 | `/register` | 이메일 + 비밀번호 |
| 로그인 | `/login` | 로그인 |
| 문서함 | `/documents` | PDF 목록 + 업로드 |
| 학습 | `/study/:pdfId` | PDF 뷰어 + 학습 탭 |
| 설정 | `/settings` | 회원탈퇴 |

- 좌우 2단 레이아웃 (PDF 60% + 탭 40%)
- Primary Color: `#2C5F9E`

---

## 🤝 팀 정보

| 이름 | 학번 | 역할 |
|------|------|------|
| 심재현 | 24101944 | 백엔드, 프로젝트 매니저 |
| 김영희 | 24101927 | 프론트엔드, UI/UX |
| 김종빈 | 21102414 | 다이어그램, 문서화 |

---

## 📝 라이선스

이 프로젝트는 팀 프로젝트입니다.
