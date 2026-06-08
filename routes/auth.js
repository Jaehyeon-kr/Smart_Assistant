const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const db = require('../db/init');

const router = express.Router();

// 이메일 정규식 검증
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 비밀번호 규칙 검증 (8자+, 영문+숫자)
const validatePassword = (password) => {
  return (
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

// POST /api/auth/register - 회원가입
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // 입력값 검증
  if (!validateEmail(email)) {
    return res.status(400).json({ error: '유효한 이메일을 입력하세요' });
  }

  if (!validatePassword(password)) {
    return res
      .status(400)
      .json({
        error: '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다',
      });
  }

  try {
    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // DB에 저장
    db.run(
      'INSERT INTO users (email, passwordHash) VALUES (?, ?)',
      [email, passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: '이미 존재하는 이메일입니다' });
          }
          return res.status(500).json({ error: '회원가입 실패' });
        }

        res.status(201).json({
          data: { userId: this.lastID, email },
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: '회원가입 중 오류 발생' });
  }
});

// POST /api/auth/login - 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res
        .status(401)
        .json({ error: '이메일 또는 비밀번호를 확인하세요' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        return res
          .status(401)
          .json({ error: '이메일 또는 비밀번호를 확인하세요' });
      }

      // JWT 생성
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
      );

      res.json({ data: { token } });
    } catch (err) {
      res.status(500).json({ error: '로그인 중 오류 발생' });
    }
  });
});

// DELETE /api/auth/me - 회원탈퇴
router.delete('/me', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.run('DELETE FROM users WHERE userId = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: '회원탈퇴 실패' });
    }

    res.json({ data: { message: '탈퇴가 완료되었습니다' } });
  });
});

module.exports = router;
