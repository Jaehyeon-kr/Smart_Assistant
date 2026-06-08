import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { deleteAccount } from '../api/auth';

const styles = {
  page: { minHeight: '100vh', background: '#F5F5F5' },
  content: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  card: {
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    padding: '28px 28px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: '15px',
    marginBottom: '16px',
    color: '#1A1A1A',
  },
  emailRow: {
    fontSize: '14px',
    color: '#555',
    padding: '10px 0',
    borderBottom: '1px solid #F5F5F5',
  },
  dangerCard: {
    background: '#fff',
    border: '1.5px solid #e53e3e',
    borderRadius: '12px',
    padding: '28px',
  },
  dangerTitle: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#e53e3e',
    marginBottom: '8px',
  },
  dangerDesc: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '18px',
  },
  dangerBtn: {
    padding: '10px 24px',
    background: '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  modalBox: {
    background: '#fff',
    borderRadius: '10px',
    padding: '28px 32px',
    maxWidth: '380px',
    width: '90%',
  },
  modalTitle: { fontWeight: '700', fontSize: '16px', marginBottom: '12px' },
  modalText: { color: '#555', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' },
  modalBtns: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '8px 20px',
    border: '1px solid #E0E0E0',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  confirmBtn: {
    padding: '8px 20px',
    border: 'none',
    background: '#e53e3e',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, token } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Decode email from JWT token if available
  let email = '';
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      email = payload.email || payload.sub || '';
    }
  } catch {}

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar showDocuments showSettings showLogout />
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>계정 정보</div>
          <div style={styles.emailRow}>
            <span style={{ color: '#888', marginRight: '8px' }}>이메일</span>
            <span>{email || '(이메일 정보 없음)'}</span>
          </div>
        </div>

        <div style={styles.dangerCard}>
          <div style={styles.dangerTitle}>위험 구역</div>
          <div style={styles.dangerDesc}>탈퇴 시 모든 데이터가 영구 삭제됩니다.</div>
          <button style={styles.dangerBtn} onClick={() => setShowModal(true)}>
            탈퇴하기
          </button>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalTitle}>정말 탈퇴하시겠습니까?</div>
            <div style={styles.modalText}>
              탈퇴하면 업로드한 모든 PDF, 요약, 문제, 노트가 영구적으로 삭제되며 복구할 수 없습니다.
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={loading}>
                취소
              </button>
              <button style={styles.confirmBtn} onClick={handleDelete} disabled={loading}>
                {loading ? '처리 중...' : '탈퇴 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
