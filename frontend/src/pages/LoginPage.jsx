import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { AuthContext } from '../context/AuthContext';

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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
  errorBox: {
    background: '#fff5f5',
    border: '1px solid #fed7d7',
    color: '#c53030',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

const spinnerKeyframes = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const token = res.data.data?.token || res.data.token;
      if (token) {
        login(token);
        navigate('/documents');
      } else {
        setError('로그인 응답에서 토큰을 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('이메일 또는 비밀번호를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{spinnerKeyframes}</style>
      <div style={styles.card}>
        <div style={styles.logo}>SmartQ</div>
        {error && <div style={styles.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            style={styles.input}
            required
          />
          <label style={styles.label}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            style={styles.input}
            required
          />
          <button
            type="submit"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading && <span style={styles.spinner} />}
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div style={styles.footer}>
          계정이 없으신가요?{' '}
          <Link to="/register" style={styles.link}>회원가입</Link>
        </div>
      </div>
    </div>
  );
}
