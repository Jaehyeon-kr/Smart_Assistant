import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F5F5',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #E0E0E0',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2C5F9E',
    textAlign: 'center',
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: '12px',
    marginTop: '-12px',
    marginBottom: '12px',
    display: 'block',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#2C5F9E',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: '#666',
  },
  link: {
    color: '#2C5F9E',
    textDecoration: 'none',
    fontWeight: '500',
  },
  globalError: {
    background: '#fff5f5',
    border: '1px solid #fed7d7',
    color: '#c53030',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
  },
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!validateEmail(email)) newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    if (!validatePassword(password)) newErrors.password = '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.';
    if (password !== confirm) newErrors.confirm = '비밀번호가 일치하지 않습니다.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register(email, password);
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || '회원가입에 실패했습니다.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>SmartQ</div>
        {globalError && <div style={styles.globalError}>{globalError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label style={styles.label}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
          />
          {errors.email && <span style={styles.errorText}>{errors.email}</span>}

          <label style={styles.label}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 영문+숫자"
            style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
          />
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}

          <label style={styles.label}>비밀번호 확인</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="비밀번호 재입력"
            style={{ ...styles.input, ...(errors.confirm ? styles.inputError : {}) }}
          />
          {errors.confirm && <span style={styles.errorText}>{errors.confirm}</span>}

          <button
            type="submit"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>
        <div style={styles.footer}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={styles.link}>로그인</Link>
        </div>
      </div>
    </div>
  );
}
