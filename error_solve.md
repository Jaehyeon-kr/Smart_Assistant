# SmartQ 개발 에러 해결 기록

## 1. 로그인 후 토큰 파싱 오류
**증상**: 회원가입 후 로그인이 안 됨
**원인**: 백엔드 응답 형식이 `{ data: { token: "..." } }`인데 프론트에서 `res.data.token`으로 읽음. axios가 응답을 `.data`에 담기 때문에 실제 토큰은 `res.data.data.token`에 있음
**해결**: `LoginPage.jsx`에서 `res.data.data?.token || res.data.token`으로 수정

---

## 2. 문서함 `documents.map is not a function`
**증상**: 로그인 후 문서함 접근 시 런타임 에러
**원인**: 백엔드가 `{ data: [...] }` 형식으로 반환하는데 프론트에서 `res.data`를 배열로 사용. 실제 배열은 `res.data.data`에 있음
**해결**: `DocumentsPage.jsx`에서 `res.data.data || res.data || []`로 수정
**추가 수정**:
- `doc.id` → `doc.pdfId`
- `doc.status` → `doc.summaryStatus`
- 업로드 후 pdfId: `res.data?.data?.pdfId`

---

## 3. pdf-parse v2 호환성 문제
**증상**: PDF 업로드 시 `pdf is not a function` 에러
**원인**: `pdf-parse` v2에서 export 방식이 변경됨. `require('pdf-parse')`가 함수가 아닌 객체를 반환
**해결**: `pdf-parse@1.1.1`로 다운그레이드
```bash
npm install pdf-parse@1.1.1
```

---

## 4. Express v5 서버 자동 종료
**증상**: `node server.js` 실행 후 바로 종료됨
**원인**: Express v5의 async 에러 처리 방식 변경으로 인해 unhandled error 발생 시 프로세스 종료
**해결**: Express v4로 다운그레이드
```bash
npm install express@4
```

---

## 5. multer v2 호환성 문제
**증상**: 파일 업로드 관련 오류
**원인**: multer v2 API 변경
**해결**: multer v1으로 다운그레이드
```bash
npm install multer@1
```

---

## 6. res.sendFile 절대 경로 오류
**증상**: PDF 파일 요청 시 서버가 죽으며 `TypeError: path must be absolute or specify root to res.sendFile`
**원인**: `UPLOAD_DIR=./uploads` (상대 경로)를 `path.join()`으로 조합하면 상대 경로가 그대로 유지됨. `res.sendFile()`은 절대 경로만 허용
**해결**: `routes/pdfs.js`에서 `path.join` → `path.resolve`로 변경
```js
// 변경 전
const filePath = path.join(process.env.UPLOAD_DIR, String(userId), pdf.storedName);
// 변경 후
const filePath = path.resolve(process.env.UPLOAD_DIR, String(userId), pdf.storedName);
```
`path.resolve`는 상대 경로를 현재 작업 디렉토리 기준 절대 경로로 자동 변환해줌

---

## 7. react-pdf worker 설정 오류
**증상**: PDF 뷰어에 "PDF를 불러올 수 없습니다" 표시
**원인**: react-pdf v10 + pdfjs-dist v5에서 worker 파일이 `.mjs` 형식으로 변경됨. CDN의 `.js` 경로가 맞지 않음
**해결**: worker 파일을 public 폴더에 복사 후 경로 수정
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```
```js
// StudyPage.jsx
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;
```

---

## 8. ANTHROPIC_API_KEY 미설정
**증상**: PDF 업로드 시 "업로드에 실패했습니다"
**원인**: `.env`의 `ANTHROPIC_API_KEY`가 테스트 키(`sk-ant-v7-test-key-here`)로 설정되어 있어 Claude API 호출 실패
**해결**: `.env`에 실제 API 키 입력
**주의**: API 키를 채팅/코드에 노출하지 말 것. 노출 시 즉시 콘솔에서 폐기하고 새 키 발급

---

## 9. StudyPage API 응답 파싱 오류 (요약/문제/노트)
**증상**: 요약/문제/노트가 표시되지 않고 실패로 표시됨
**원인**: 백엔드 응답이 `{ data: { status, content } }` 형식인데, axios가 응답을 `.data`에 담기 때문에 실제 데이터는 `res.data.data`에 있음. 프론트에서 `res.data.status`, `res.data.content`로 읽어서 undefined 반환
**해결**: `StudyPage.jsx`에서 모든 API 응답 파싱을 `res.data.data.*`로 수정
```js
// 변경 전
const s = res.data?.status;
const content = res.data?.content;
// 변경 후
const s = res.data?.data?.status || res.data?.status;
const content = res.data?.data?.content || res.data?.content;
```
**영향 범위**: 요약(fetchSummary), 문제(fetchQuestions), 노트(getNote) 모두 해당

---

## 10. AI 튜터 SSE 파싱 오류
**증상**: AI 튜터에서 메시지 전송 시 "오류가 발생했습니다" 표시
**원인 1**: 백엔드가 `data: {"chunk":"[DONE]"}\n\n` 형식으로 SSE를 전송하는데, 프론트에서 raw 문자열 `chunk === '[DONE]'`로 비교. JSON을 파싱하지 않아 청크 내용을 읽을 수 없음
**원인 2**: `history` 파라미터가 undefined일 때 `...history` spread에서 오류 발생 (claudeService.js)
**원인 3**: 프론트에서 history를 전송하지 않아 대화 맥락 누락
**해결**:
- `StudyPage.jsx` SSE 파싱: `JSON.parse(raw)`로 파싱 후 `parsed.chunk` 사용
- `claudeService.js`: `const safeHistory = Array.isArray(history) ? history : []`로 방어 처리
- `StudyPage.jsx`: `handleSend`에서 이전 메시지 history를 올바르게 전달
