import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDocuments, uploadPDF, deleteDocument } from '../api/documents';

const styles = {
  page: { minHeight: '100vh', background: '#F5F5F5' },
  content: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  card: {
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '10px',
    padding: '20px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fileIcon: { fontSize: '32px', marginBottom: '4px' },
  fileName: {
    fontWeight: '600',
    fontSize: '14px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.4',
  },
  uploadDate: { fontSize: '12px', color: '#888' },
  badge: {
    display: 'inline-block',
    fontSize: '12px',
    padding: '2px 10px',
    borderRadius: '999px',
    fontWeight: '500',
  },
  deleteBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#ccc',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.15s, background 0.15s',
    opacity: 0,
  },
  fab: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    background: '#2C5F9E',
    color: '#fff',
    border: 'none',
    borderRadius: '28px',
    padding: '14px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(44,95,158,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 200,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '16px',
    color: '#888',
  },
  emptyBtn: {
    padding: '10px 24px',
    background: '#2C5F9E',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
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
    maxWidth: '360px',
    width: '90%',
    textAlign: 'center',
  },
  modalTitle: { fontWeight: '700', fontSize: '16px', marginBottom: '12px' },
  modalText: { color: '#555', fontSize: '14px', marginBottom: '24px' },
  modalBtns: { display: 'flex', gap: '12px', justifyContent: 'center' },
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

const spinnerKeyframes = `
@keyframes spin { to { transform: rotate(360deg); } }
.doc-card:hover .doc-delete-btn { opacity: 1 !important; }
.doc-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
`;

function badgeStyle(status) {
  if (status === 'processing') return { ...styles.badge, background: '#fef3c7', color: '#d97706' };
  if (status === 'done') return { ...styles.badge, background: '#d1fae5', color: '#065f46' };
  if (status === 'failed') return { ...styles.badge, background: '#fee2e2', color: '#b91c1c' };
  return { ...styles.badge, background: '#f3f4f6', color: '#6b7280' };
}

function badgeLabel(status) {
  if (status === 'processing') return '처리 중';
  if (status === 'done') return '완료';
  if (status === 'failed') return '실패';
  return status;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('20MB 이하의 파일만 업로드할 수 있습니다.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadPDF(file);
      const pdfId = res.data?.data?.pdfId || res.data?.pdfId;
      if (pdfId) {
        navigate(`/study/${pdfId}`);
      } else {
        fetchDocs();
      }
    } catch (err) {
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget);
      setDocuments((prev) => prev.filter((d) => (d.pdfId || d.id) !== deleteTarget));
    } catch (e) {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFabClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={styles.page}>
      <style>{spinnerKeyframes}</style>
      <Navbar showDocuments showSettings showLogout />
      <div style={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>불러오는 중...</div>
        ) : documents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px' }}>📂</div>
            <div>아직 업로드한 문서가 없습니다</div>
            <button style={styles.emptyBtn} onClick={handleFabClick}>PDF 업로드</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {documents.map((doc) => {
              const id = doc.pdfId || doc.id;
              return (
                <div
                  key={id}
                  className="doc-card"
                  style={styles.card}
                  onClick={() => navigate(`/study/${id}`)}
                >
                  <button
                    className="doc-delete-btn"
                    style={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(id);
                    }}
                    title="삭제"
                  >
                    ✕
                  </button>
                  <div style={styles.fileIcon}>📄</div>
                  <div style={styles.fileName}>{doc.originalName || doc.filename || doc.name || '파일명 없음'}</div>
                  <div style={styles.uploadDate}>{formatDate(doc.createdAt || doc.uploadedAt)}</div>
                  <span style={badgeStyle(doc.summaryStatus)}>{badgeLabel(doc.summaryStatus)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button style={styles.fab} onClick={handleFabClick} disabled={uploading}>
        {uploading ? <span style={styles.spinner} /> : null}
        {uploading ? '업로드 중...' : 'PDF 업로드 +'}
      </button>

      {deleteTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalTitle}>문서 삭제</div>
            <div style={styles.modalText}>이 문서를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.</div>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>취소</button>
              <button style={styles.confirmBtn} onClick={handleDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
