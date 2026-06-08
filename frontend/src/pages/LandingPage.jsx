import { useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '40px 20px',
    background: '#F5F5F5',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2C5F9E',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '200px',
    padding: '12px 0',
    background: '#2C5F9E',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  outlineBtn: {
    width: '200px',
    padding: '12px 0',
    background: 'transparent',
    color: '#2C5F9E',
    border: '1.5px solid #2C5F9E',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default function LandingPage() {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  if (isLoggedIn) {
    return <Navigate to="/documents" replace />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>LecQ</div>
      <div style={styles.subtitle}>
        PDF 한 번 올리면, 요약·문제·노트가 완성됩니다
      </div>
      <div style={styles.buttonGroup}>
        <button style={styles.primaryBtn} onClick={() => navigate('/register')}>
          회원가입
        </button>
        <button style={styles.outlineBtn} onClick={() => navigate('/login')}>
          로그인
        </button>
      </div>
    </div>
  );
}
