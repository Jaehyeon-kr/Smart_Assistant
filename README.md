# LecQ - AI 교육 에이전트 프로젝트

> **PDF 기반 올인원 학습 플랫폼**

---

## 📌 프로젝트 개요

**LecQ**는 대학생들의 강의 슬라이드 PDF를 업로드하면, AI 튜터를 통해 학습을 지원하는 웹 플랫폼입니다.

### 핵심 기능
- 📄 **PDF 업로드**: 강의 자료 PDF 업로드
- ✨ **자동 요약**: Claude AI로 한국어 요약 생성
- 🎯 **문제 생성**: 4선지 객관식 문제 5개 자동 생성
- 📝 **노트**: 학습 노트 자동 저장
- 🤖 **AI 튜터**: 실시간 대화형 학습 지원

---

## 📂 프로젝트 구조

```
LecQ/
├── 📄 명세서 (완전한 요구사항)
│   ├── LecQ_완전_명세서.md          ← 전체 명세서 (필독!)
│   ├── LecQ_프로젝트_요약.md         ← 요약 버전
│   └── img/                         ← 49개 페이지 이미지 (다이어그램 포함)
│
├── 🛠️ 개발 가이드
│   ├── 개발_체크리스트.md           ← 상세 구현 체크리스트
│   ├── 빠른_시작_가이드.md          ← 5분 안에 시작하기
│   ├── 데이터베이스_스키마.sql       ← DB 구조
│   └── README.md                   ← 이 파일
│
├── lecq-frontend/                  ← React 프론트엔드 (개발 예정)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
│
└── lecq-backend/                   ← Node.js/Express 백엔드 (개발 예정)
    ├── routes/
    ├── controllers/
    ├── models/
    ├── services/
    ├── server.js
    └── package.json
```

---

## 🚀 빠른 시작 (5분)

### 1단계: 프로젝트 생성
```bash
# 프론트엔드
npx create-react-app lecq-frontend
cd lecq-frontend
npm install axios react-router-dom react-pdf

# 백엔드 (새 터미널)
mkdir lecq-backend
cd lecq-backend
npm init -y
npm install express cors dotenv multer pdf-parse @anthropic-ai/sdk bcryptjs jsonwebtoken sqlite3
```

### 2단계: 폴더 구조 생성
```bash
# 각각의 프로젝트 폴더 구조 생성
# 자세한 내용은 '빠른_시작_가이드.md' 참고
```

### 3단계: 개발 시작
```bash
# 프론트엔드 실행
cd lecq-frontend && npm start    # http://localhost:3000

# 백엔드 실행 (새 터미널)
cd lecq-backend && npm run dev   # http://localhost:4000
```

---

## 📋 개발 체크리스트 (4주)

### Week 1: 인증 (회원가입, 로그인)
- [ ] RegisterPage, LoginPage UI
- [ ] /api/auth/register, /api/auth/login API
- [ ] JWT 토큰 관리 (localStorage)
- [ ] 회원탈퇴 기능

### Week 2: PDF 관리
- [ ] DocumentsPage (문서함)
- [ ] PDF 업로드 API + multer
- [ ] pdf-parse 텍스트 추출
- [ ] 문서함 CRUD (생성, 조회, 삭제)

### Week 3: 학습 기능
- [ ] StudyPage (PDF 뷰어 + 탭 패널)
- [ ] 요약 탭 (Claude API)
- [ ] 문제 탭 (4선지 JSON)
- [ ] 노트 탭 (debounce 저장)

### Week 4: AI 튜터 + 마무리
- [ ] AI 튜터 (SSE 스트리밍)
- [ ] 전체 통합 테스트
- [ ] UI/UX 개선
- [ ] 배포 준비

---

## 📐 주요 기술 스택

### 프론트엔드
- **Framework**: React 18+
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **PDF Viewer**: react-pdf (pdfjs-dist)
- **Styling**: CSS3

### 백엔드
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (개발) / PostgreSQL (배포)
- **PDF Processing**: pdf-parse
- **AI Integration**: Claude API (@anthropic-ai/sdk)
- **Authentication**: JWT + bcryptjs

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────┐
│        React Frontend               │
│  (Component + State Management)     │
└──────────────┬──────────────────────┘
               │ HTTP/REST
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

## 📊 데이터 모델

### 5개 핵심 테이블

| 테이블 | 설명 | 주요 필드 |
|--------|------|---------|
| **users** | 사용자 정보 | userId, email, passwordHash |
| **pdfs** | 업로드된 PDF | pdfId, userId, originalName, extractedText |
| **summaries** | AI 생성 요약 | summaryId, pdfId, content, status |
| **questions** | AI 생성 문제 | questionId, pdfId, content (JSON) |
| **notes** | 사용자 노트 | noteId, pdfId, content |

자세한 내용은 `데이터베이스_스키마.sql` 참고

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

## 🎨 UI/UX 설계

### 주요 페이지

| 페이지 | URL | 설명 |
|--------|-----|------|
| Landing | `/` | 서비스 소개 |
| 회원가입 | `/register` | 이메일 + 비밀번호 |
| 로그인 | `/login` | 로그인 |
| 문서함 | `/documents` | PDF 목록 + 업로드 |
| 학습 | `/study/:pdfId` | PDF 뷰어 + 학습 탭 |
| 설정 | `/settings` | 회원탈퇴 |

### 설계 원칙
- 좌우 2단 레이아웃 (PDF 60% + 탭 40%)
- Primary Color: #2C5F9E
- 최소 해상도: 1280px

---

## 📌 필수 요구사항 (FR-01 ~ FR-13)

| # | 기능 | 구현 상태 |
|----|------|---------|
| FR-01 | 회원가입 | ⏳ 예정 |
| FR-02 | 로그인 | ⏳ 예정 |
| FR-03 | 로그아웃 | ⏳ 예정 |
| FR-04 | 회원탈퇴 | ⏳ 예정 |
| FR-05 | PDF 업로드 | ⏳ 예정 |
| FR-06 | 문서함 조회 | ⏳ 예정 |
| FR-07 | PDF 삭제 | ⏳ 예정 |
| FR-08 | PDF 뷰어 | ⏳ 예정 |
| FR-09 | 탭 패널 | ⏳ 예정 |
| FR-10 | 요약 탭 | ⏳ 예정 |
| FR-11 | 문제 탭 | ⏳ 예정 |
| FR-12 | 노트 탭 | ⏳ 예정 |
| FR-13 | AI 튜터 | ⏳ 예정 |

---

## 🐛 버그 방지 체크리스트

- [ ] **보안**: 비밀번호 bcrypt 해싱, JWT 검증, CORS 설정
- [ ] **데이터 무결성**: CASCADE 삭제, UNIQUE 제약, 정규식 검증
- [ ] **API 응답**: 형식 일관성 ({ "data": {...} })
- [ ] **파일 처리**: UUID 변환, 파일 크기/페이지 제한
- [ ] **사용자 경험**: 로딩 스피너, 오류 메시지, 상태 표시

---

## 📚 참고 자료

### 명세서 문서
- `LecQ_완전_명세서.md` - 전체 명세서 (필독!)
- `개발_체크리스트.md` - 상세 구현 가이드
- `빠른_시작_가이드.md` - 5분 안에 시작

### 이미지 & 다이어그램
- `img/page-36.png` - Use Case Diagram
- `img/page-38.png` - Class Diagram (ERD)
- `img/page-40.png` ~ `page-44.png` - Sequence Diagrams

### 공식 문서
- [Express.js](https://expressjs.com/)
- [React](https://react.dev)
- [Claude API](https://anthropic.com/docs)
- [SQLite](https://www.sqlite.org/)

---

## 🤝 팀 정보

| 이름 | 학번 | 역할 |
|------|------|------|
| 심재현 | 24101944 | 백엔드, 프로젝트 매니저 |
| 김영희 | 24101927 | 프론트엔드, UI/UX |
| 김종빈 | 21102414 | 다이어그램, 문서화 |

---

## 📅 일정

| 주차 | 목표 | 산출물 |
|------|------|--------|
| 1주 | 인증 완성 | 회원가입/로그인 |
| 2주 | PDF 관리 | 문서함 CRUD |
| 3주 | 학습 기능 | 요약/문제/노트 |
| 4주 | AI 튜터 완성 | 전체 기능 완성 + 배포 준비 |

---

## 🚀 배포

### 프로덕션 체크리스트
- [ ] 환경변수 설정 (API 키 등)
- [ ] React 빌드: `npm run build`
- [ ] 데이터베이스 마이그레이션 (SQLite → PostgreSQL)
- [ ] CORS 도메인 설정
- [ ] HTTPS/SSL 인증서
- [ ] 로깅 및 모니터링

---

## 📞 문제 해결

### Q: CORS 오류?
A: `server.js`의 CORS 설정 확인

### Q: JWT 만료?
A: localStorage 토큰 확인, 로그인 페이지로 이동

### Q: PDF 텍스트가 공백?
A: 텍스트 레이어가 있는 PDF만 지원 (OCR 미지원)

### Q: Claude API 비용?
A: Rate limiting 설정 또는 프롬프트 최적화

---

## 📝 라이선스

이 프로젝트는 팀 프로젝트입니다.

---

## ✨ 마지막 조언

1. **명세서를 먼저 읽으세요**
   - `LecQ_완전_명세서.md` 필독!
   - 모든 요구사항이 상세히 기록되어 있습니다.

2. **체크리스트를 따르세요**
   - `개발_체크리스트.md`를 단계별로 진행
   - 빠진 부분이 없는지 확인

3. **4주 로드맵을 지키세요**
   - Week 1: 인증
   - Week 2: PDF 관리
   - Week 3: 학습 기능
   - Week 4: AI 튜터

4. **테스트를 자주 하세요**
   - 각 기능 완성 후 API 테스트
   - 전체 통합 테스트

5. **명세서와 100% 일치시키세요**
   - UI/UX 디자인 원칙 준수
   - API 응답 형식 일관성
   - 오류 메시지 정확성

---

**준비됐나요? 이제 시작할 준비가 되었습니다! 🎉**

더 자세한 내용은 `LecQ_완전_명세서.md`를 참고하세요.
