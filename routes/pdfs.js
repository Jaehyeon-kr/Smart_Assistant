const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { extractTextFromPDF } = require('../services/pdfService');
const { generateSummary, generateQuestions } = require('../services/claudeService');
const db = require('../db/init');

const router = express.Router();

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId;
    const uploadPath = path.resolve(process.env.UPLOAD_DIR, String(userId));

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    cb(null, `${uuid}.pdf`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('PDF 파일만 업로드 가능합니다'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE),
  },
});

// POST /api/pdfs - PDF 업로드
router.post('/pdfs', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PDF 파일을 업로드해주세요' });
  }

  try {
    const userId = req.userId;
    const filePath = req.file.path;
    // multer on Windows may decode filename as latin1; fix to utf8
    const rawName = req.file.originalname;
    const originalName = Buffer.from(rawName, 'latin1').toString('utf8').replace(/\uFFFD/g, '') || rawName;
    const storedName = req.file.filename;

    // PDF 텍스트 추출
    const { text: extractedText, pages: pageCount } = await extractTextFromPDF(
      filePath
    );

    // 페이지 수 검증
    if (pageCount > 50) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ error: 'PDF는 최대 50페이지까지만 업로드 가능합니다' });
    }

    // PDF 정보를 DB에 저장
    db.run(
      'INSERT INTO pdfs (userId, originalName, storedName, extractedText, pageCount) VALUES (?, ?, ?, ?, ?)',
      [userId, originalName, storedName, extractedText, pageCount],
      function (err) {
        if (err) {
          fs.unlinkSync(filePath);
          return res.status(500).json({ error: 'PDF 저장 실패' });
        }

        const pdfId = this.lastID;

        // Promise.all로 3가지 작업 병렬 실행
        Promise.all([
          // 1. 요약 생성
          new Promise((resolve) => {
            db.run(
              'INSERT INTO summaries (pdfId, status) VALUES (?, ?)',
              [pdfId, 'processing'],
              async function (err) {
                if (err) {
                  resolve();
                  return;
                }

                const content = await generateSummary(extractedText);
                const status = content ? 'done' : 'failed';

                db.run(
                  'UPDATE summaries SET content = ?, status = ? WHERE pdfId = ?',
                  [content, status, pdfId],
                  () => resolve()
                );
              }
            );
          }),

          // 2. 문제 생성
          new Promise((resolve) => {
            db.run(
              'INSERT INTO questions (pdfId, status) VALUES (?, ?)',
              [pdfId, 'processing'],
              async function (err) {
                if (err) {
                  resolve();
                  return;
                }

                const content = await generateQuestions(extractedText);
                const status = content ? 'done' : 'failed';

                db.run(
                  'UPDATE questions SET content = ?, status = ? WHERE pdfId = ?',
                  [JSON.stringify(content), status, pdfId],
                  () => resolve()
                );
              }
            );
          }),

          // 3. 빈 노트 생성
          new Promise((resolve) => {
            db.run(
              'INSERT INTO notes (pdfId, content) VALUES (?, ?)',
              [pdfId, ''],
              () => resolve()
            );
          }),
        ]).then(() => {
          res.status(201).json({
            data: {
              pdfId,
              originalName,
              summaryStatus: 'processing',
              questionsStatus: 'processing',
            },
          });
        });
      }
    );
  } catch (err) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'PDF 업로드 중 오류 발생' });
  }
});

// GET /api/pdfs - 문서함 조회
router.get('/pdfs', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.all(
    'SELECT pdfId, originalName, createdAt FROM pdfs WHERE userId = ? ORDER BY createdAt DESC',
    [userId],
    async (err, pdfs) => {
      if (err) {
        return res.status(500).json({ error: '문서 조회 실패' });
      }

      // 각 PDF의 요약/문제 상태 조회
      const result = await Promise.all(
        pdfs.map(
          (pdf) =>
            new Promise((resolve) => {
              db.get(
                'SELECT status FROM summaries WHERE pdfId = ?',
                [pdf.pdfId],
                (err, summary) => {
                  db.get(
                    'SELECT status FROM questions WHERE pdfId = ?',
                    [pdf.pdfId],
                    (err, questions) => {
                      resolve({
                        ...pdf,
                        summaryStatus: summary?.status || 'unknown',
                        questionsStatus: questions?.status || 'unknown',
                      });
                    }
                  );
                }
              );
            })
        )
      );

      res.json({ data: result });
    }
  );
});

// DELETE /api/pdfs/:pdfId - PDF 삭제
router.delete('/pdfs/:pdfId', authMiddleware, (req, res) => {
  const { pdfId } = req.params;
  const userId = req.userId;

  db.get('SELECT storedName FROM pdfs WHERE pdfId = ? AND userId = ?', [pdfId, userId], (err, pdf) => {
    if (err || !pdf) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
    }

    db.run('DELETE FROM pdfs WHERE pdfId = ? AND userId = ?', [pdfId, userId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'PDF 삭제 실패' });
      }

      // 파일 삭제
      const filePath = path.resolve(process.env.UPLOAD_DIR, String(userId), pdf.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ data: { message: '삭제되었습니다' } });
    });
  });
});

// GET /api/pdfs/:pdfId/file - PDF 파일 반환
router.get('/pdfs/:pdfId/file', authMiddleware, (req, res) => {
  const { pdfId } = req.params;
  const userId = req.userId;

  db.get('SELECT storedName FROM pdfs WHERE pdfId = ? AND userId = ?', [pdfId, userId], (err, pdf) => {
    if (err || !pdf) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다' });
    }

    const filePath = path.resolve(process.env.UPLOAD_DIR, String(userId), pdf.storedName);

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).json({ error: 'PDF 다운로드 실패' });
      }
    });
  });
});

module.exports = router;
