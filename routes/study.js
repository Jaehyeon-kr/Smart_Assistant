const express = require('express');
const authMiddleware = require('../middleware/auth');
const { generateSummary, generateQuestions, streamAITutor } = require('../services/claudeService');
const db = require('../db/init');

const router = express.Router();

// GET /api/pdfs/:pdfId/summary - 요약 조회
router.get('/pdfs/:pdfId/summary', authMiddleware, (req, res) => {
  const { pdfId } = req.params;

  db.get('SELECT content, status FROM summaries WHERE pdfId = ?', [pdfId], (err, summary) => {
    if (err || !summary) {
      return res.status(404).json({ error: '요약을 찾을 수 없습니다' });
    }

    res.json({ data: { status: summary.status, content: summary.content } });
  });
});

// POST /api/pdfs/:pdfId/summary/retry - 요약 재생성
router.post('/pdfs/:pdfId/summary/retry', authMiddleware, (req, res) => {
  const { pdfId } = req.params;

  db.get('SELECT extractedText FROM pdfs WHERE pdfId = ?', [pdfId], async (err, pdf) => {
    if (err || !pdf) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
    }

    // status를 processing으로 재설정
    db.run('UPDATE summaries SET status = ? WHERE pdfId = ?', ['processing', pdfId], async () => {
      const content = await generateSummary(pdf.extractedText);
      const status = content ? 'done' : 'failed';

      db.run('UPDATE summaries SET content = ?, status = ? WHERE pdfId = ?', [content, status, pdfId], () => {
        res.json({ data: { status } });
      });
    });
  });
});

// GET /api/pdfs/:pdfId/questions - 문제 조회
router.get('/pdfs/:pdfId/questions', authMiddleware, (req, res) => {
  const { pdfId } = req.params;

  db.get('SELECT content, status FROM questions WHERE pdfId = ?', [pdfId], (err, questions) => {
    if (err || !questions) {
      return res.status(404).json({ error: '문제를 찾을 수 없습니다' });
    }

    let parsedContent = null;
    if (questions.content && questions.status === 'done') {
      try {
        parsedContent = JSON.parse(questions.content);
        // 클라이언트에 answer 필드 제거
        parsedContent = parsedContent.map(({ answer, ...rest }) => rest);
      } catch {
        parsedContent = null;
      }
    }

    res.json({ data: { status: questions.status, content: parsedContent } });
  });
});

// POST /api/pdfs/:pdfId/questions/retry - 문제 재생성
router.post('/pdfs/:pdfId/questions/retry', authMiddleware, (req, res) => {
  const { pdfId } = req.params;

  db.get('SELECT extractedText FROM pdfs WHERE pdfId = ?', [pdfId], async (err, pdf) => {
    if (err || !pdf) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
    }

    // status를 processing으로 재설정
    db.run('UPDATE questions SET status = ? WHERE pdfId = ?', ['processing', pdfId], async () => {
      const content = await generateQuestions(pdf.extractedText);
      const status = content ? 'done' : 'failed';

      db.run('UPDATE questions SET content = ?, status = ? WHERE pdfId = ?', [JSON.stringify(content), status, pdfId], () => {
        res.json({ data: { status } });
      });
    });
  });
});

// GET /api/pdfs/:pdfId/note - 노트 조회
router.get('/pdfs/:pdfId/note', authMiddleware, (req, res) => {
  const { pdfId } = req.params;

  db.get('SELECT content, updatedAt FROM notes WHERE pdfId = ?', [pdfId], (err, note) => {
    if (err || !note) {
      return res.status(404).json({ error: '노트를 찾을 수 없습니다' });
    }

    res.json({ data: { content: note.content, updatedAt: note.updatedAt } });
  });
});

// PUT /api/pdfs/:pdfId/note - 노트 저장
router.put('/pdfs/:pdfId/note', authMiddleware, (req, res) => {
  const { pdfId } = req.params;
  const { content } = req.body;

  db.run(
    'UPDATE notes SET content = ?, updatedAt = CURRENT_TIMESTAMP WHERE pdfId = ?',
    [content, pdfId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: '노트 저장 실패' });
      }

      res.json({ data: { updatedAt: new Date().toISOString() } });
    }
  );
});

// POST /api/pdfs/:pdfId/chat - AI 튜터 (SSE)
router.post('/pdfs/:pdfId/chat', authMiddleware, async (req, res) => {
  const { pdfId } = req.params;
  const { message, history } = req.body;

  try {
    const pdf = await new Promise((resolve, reject) => {
      db.get('SELECT extractedText FROM pdfs WHERE pdfId = ?', [pdfId], (err, pdf) => {
        if (err || !pdf) reject(new Error('PDF를 찾을 수 없습니다'));
        else resolve(pdf);
      });
    });

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await streamAITutor(pdf.extractedText, message, history);

    // 스트림 결과 처리
    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    });

    stream.finalMessage().then(() => {
      res.write('data: {"chunk":"[DONE]"}\n\n');
      res.end();
    });

    stream.on('error', (err) => {
      console.error('AI 튜터 스트리밍 오류:', err);
      res.write('data: {"error":"응답 생성 실패"}\n\n');
      res.end();
    });
  } catch (err) {
    console.error('AI 튜터 오류:', err);
    res.status(500).json({ error: 'AI 튜터 오류 발생' });
  }
});

module.exports = router;
