import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const styles = {
  nav: {
    height: '56px',
    background: '#fff',
    borderBottom: '1px solid #E0E0E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#2C5F9E',
    textDecoration: 'none',
  },
  title: {
    fontSize: '14px',
    color: '#555',
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  link: {
    fontSize: '13px',
    color: '#555',
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.15s',
  },
  logoutBtn: {
    fontSize: '13px',
    color: '#555',
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

export default function Navbar({ showDocuments, showSettings, showLogout, title, children }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.logo}>SmartQ</Link>
        {title && <span style={styles.title}>{title}</span>}
      </div>
      <div style={styles.right}>
        {children}
        {showDocuments && (
          <Link to="/documents" style={styles.link}>문서함</Link>
        )}
        {showSettings && (
          <Link to="/settings" style={styles.link}>설정</Link>
        )}
        {showLogout && (
          <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
        )}
      </div>
    </nav>
  );
}
