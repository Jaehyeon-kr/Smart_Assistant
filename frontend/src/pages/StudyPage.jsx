import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Navbar from '../components/Navbar';
import { getSummary, retrySummary, getQuestions, retryQuestions, getNote, saveNote } from '../api/study';
import api from '../api/api';

pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

const PRIMARY = '#2C5F9E';

const styles = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  pdfPanel: {
    width: '60%',
    display: 'flex',
    flexDirection: 'column',
    background: '#e8e8e8',
    borderRight: '1px solid #E0E0E0',
  },
  pdfToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    background: '#fff',
    borderBottom: '1px solid #E0E0E0',
    flexShrink: 0,
  },
  pdfViewer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px',
  },
  toolbarBtn: {
    padding: '4px 10px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  toolbarText: { fontSize: '13px', color: '#555' },
  tabPanel: {
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #E0E0E0',
    flexShrink: 0,
  },
  tabBtn: (active) => ({
    flex: 1,
    padding: '14px 0',
    fontSize: '13px',
    fontWeight: active ? '700' : '400',
    color: active ? PRIMARY : '#888',
    background: 'none',
    border: 'none',
    borderBottom: active ? `2px solid ${PRIMARY}` : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  spinnerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px',
    color: '#888',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #E0E0E0',
    borderTop: `3px solid ${PRIMARY}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  retryBtn: {
    padding: '8px 20px',
    background: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  summaryText: {
    lineHeight: '1.7',
    fontSize: '14px',
    color: '#1A1A1A',
    whiteSpace: 'pre-wrap',
  },
  questionCard: {
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    background: '#fafafa',
  },
  questionNum: { fontWeight: '700', color: PRIMARY, marginBottom: '8px' },
  questionText: { marginBottom: '12px', fontSize: '14px' },
  choiceList: { listStyle: 'none', padding: 0 },
  choiceItem: (selected, correct) => ({
    padding: '8px 12px',
    marginBottom: '6px',
    borderRadius: '6px',
    border: '1px solid #E0E0E0',
    cursor: 'pointer',
    fontSize: '14px',
    background: correct ? '#d1fae5' : selected ? '#fee2e2' : '#fff',
    color: correct ? '#065f46' : selected ? '#b91c1c' : '#1A1A1A',
    transition: 'background 0.15s',
  }),
  noteArea: {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#1A1A1A',
    resize: 'none',
    fontFamily: 'inherit',
    background: 'transparent',
  },
  saveStatus: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'right',
    padding: '4px 20px 8px',
    flexShrink: 0,
  },
  tutorBtn: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    background: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '52px',
    height: '52px',
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(44,95,158,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  tutorPopup: {
    position: 'fixed',
    bottom: '96px',
    right: '32px',
    width: '360px',
    height: '480px',
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 200,
    overflow: 'hidden',
  },
  tutorHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid #E0E0E0',
    fontWeight: '700',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tutorMessages: {
    flex: 1,
    overflow: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tutorInputRow: {
    display: 'flex',
    borderTop: '1px solid #E0E0E0',
    padding: '10px',
    gap: '8px',
  },
  tutorInput: {
    flex: 1,
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
  },
  tutorSendBtn: {
    background: PRIMARY,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  msgUser: {
    alignSelf: 'flex-end',
    background: PRIMARY,
    color: '#fff',
    borderRadius: '10px 10px 2px 10px',
    padding: '8px 12px',
    fontSize: '13px',
    maxWidth: '80%',
  },
  msgAssistant: {
    alignSelf: 'flex-start',
    background: '#F5F5F5',
    color: '#1A1A1A',
    borderRadius: '10px 10px 10px 2px',
    padding: '8px 12px',
    fontSize: '13px',
    maxWidth: '80%',
    whiteSpace: 'pre-wrap',
  },
};

const globalCSS = `@keyframes spin { to { transform: rotate(360deg); } }`;

// ---- Summary Tab ----
function SummaryTab({ pdfId }) {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState('');
  const pollRef = useRef(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSummary(pdfId);
      const s = res.data?.data?.status || res.data?.status;
      const content = res.data?.data?.content || res.data?.content || '';
      if (s === 'done' || (!s && content)) {
        setStatus('done');
        setData(content);
        clearInterval(pollRef.current);
      } else if (s === 'failed') {
        setStatus('failed');
        clearInterval(pollRef.current);
      } else {
        setStatus('processing');
      }
    } catch {
      setStatus('failed');
    }
  }, [pdfId]);

  useEffect(() => {
    fetchSummary();
    pollRef.current = setInterval(fetchSummary, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchSummary]);

  const handleRetry = async () => {
    setStatus('processing');
    try {
      await retrySummary(pdfId);
      fetchSummary();
      pollRef.current = setInterval(fetchSummary, 3000);
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'loading' || status === 'processing') {
    return (
      <div style={styles.spinnerWrap}>
        <div style={styles.spinner} />
        <div>요약을 생성하고 있습니다...</div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div style={styles.spinnerWrap}>
        <div>요약 생성에 실패했습니다.</div>
        <button style={styles.retryBtn} onClick={handleRetry}>재시도</button>
      </div>
    );
  }
  return <div style={styles.summaryText}>{data}</div>;
}

// ---- Questions Tab ----
function QuestionsTab({ pdfId }) {
  const [status, setStatus] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const pollRef = useRef(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await getQuestions(pdfId);
      const s = res.data?.data?.status || res.data?.status;
      const qs = res.data?.data?.content || res.data?.data || [];
      if (s === 'done' || (!s && qs.length > 0)) {
        setStatus('done');
        setQuestions(qs);
        clearInterval(pollRef.current);
      } else if (s === 'failed') {
        setStatus('failed');
        clearInterval(pollRef.current);
      } else {
        setStatus('processing');
      }
    } catch {
      setStatus('failed');
    }
  }, [pdfId]);

  useEffect(() => {
    fetchQuestions();
    pollRef.current = setInterval(fetchQuestions, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchQuestions]);

  const handleRetry = async () => {
    setStatus('processing');
    try {
      await retryQuestions(pdfId);
      fetchQuestions();
      pollRef.current = setInterval(fetchQuestions, 3000);
    } catch {
      setStatus('failed');
    }
  };

  const handleChoice = (qIdx, choiceIdx) => {
    setSelected((prev) => ({ ...prev, [qIdx]: choiceIdx }));
  };

  if (status === 'loading' || status === 'processing') {
    return (
      <div style={styles.spinnerWrap}>
        <div style={styles.spinner} />
        <div>문제를 생성하고 있습니다...</div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div style={styles.spinnerWrap}>
        <div>문제 생성에 실패했습니다.</div>
        <button style={styles.retryBtn} onClick={handleRetry}>재시도</button>
      </div>
    );
  }
  return (
    <div>
      {questions.map((q, qi) => {
        const choices = q.choices || q.options || [];
        const answer = q.answer ?? q.correctIndex ?? -1;
        const sel = selected[qi];
        return (
          <div key={qi} style={styles.questionCard}>
            <div style={styles.questionNum}>Q{qi + 1}</div>
            <div style={styles.questionText}>{q.question || q.text}</div>
            <ul style={styles.choiceList}>
              {choices.map((c, ci) => {
                const isSelected = sel === ci;
                const isCorrect = sel !== undefined && ci === answer;
                const isWrong = isSelected && ci !== answer;
                return (
                  <li
                    key={ci}
                    style={styles.choiceItem(isWrong, isCorrect)}
                    onClick={() => sel === undefined && handleChoice(qi, ci)}
                  >
                    {ci + 1}. {typeof c === 'string' ? c : c.text}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ---- Note Tab ----
function NoteTab({ pdfId }) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    getNote(pdfId)
      .then((res) => setContent(res.data?.data?.content || res.data?.content || ''))
      .catch(() => {});
  }, [pdfId]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('저장 중...');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await saveNote(pdfId, val);
        setSaveStatus('저장됨');
      } catch {
        setSaveStatus('저장 실패');
      }
    }, 2000);
  };

  return (
    <>
      <div style={styles.saveStatus}>{saveStatus}</div>
      <textarea
        style={styles.noteArea}
        value={content}
        onChange={handleChange}
        placeholder="여기에 노트를 작성하세요..."
      />
    </>
  );
}

// ---- AI Tutor Popup ----
function TutorPopup({ pdfId, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! PDF에 대해 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setStreaming(true);
    const token = localStorage.getItem('token');

    try {
      const backendUrl = 'https://smartassistant-production.up.railway.app';
      const res = await fetch(`${backendUrl}/api/pdfs/${pdfId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(1) // skip initial greeting
            .slice(-10) // last 10 messages for context
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('요청 실패');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            try {
              const parsed = JSON.parse(raw);
              if (parsed.chunk === '[DONE]') { done = true; break; }
              if (parsed.chunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: updated[updated.length - 1].content + parsed.chunk,
                  };
                  return updated;
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.tutorPopup}>
      <div style={styles.tutorHeader}>
        <span>AI 튜터</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={styles.tutorMessages}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.msgUser : styles.msgAssistant}>
            {m.content}
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.role === 'user' && (
          <div style={styles.msgAssistant}>...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.tutorInputRow}>
        <input
          style={styles.tutorInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="질문을 입력하세요..."
          disabled={streaming}
        />
        <button style={styles.tutorSendBtn} onClick={handleSend} disabled={streaming}>
          전송
        </button>
      </div>
    </div>
  );
}

// ---- Main StudyPage ----
export default function StudyPage() {
  const { pdfId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [tutorOpen, setTutorOpen] = useState(false);

  useEffect(() => {
    api.get(`/pdfs/${pdfId}/file`, { responseType: 'blob' })
      .then(async (res) => {
        const disposition = res.headers['content-disposition'] || '';
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) setFileName(decodeURIComponent(match[1].replace(/['"]/g, '')));
        const blob = res.data;
        setPdfBlob(URL.createObjectURL(blob));
      })
      .catch((err) => console.error(err))
      .finally(() => setPdfLoading(false));
  }, [pdfId]);

  const goPage = (delta) => {
    setCurrentPage((p) => Math.min(Math.max(1, p + delta), numPages || 1));
  };

  const changeScale = (delta) => {
    setScale((s) => Math.min(2.0, Math.max(0.5, parseFloat((s + delta).toFixed(1)))));
  };

  return (
    <div style={styles.page}>
      <style>{globalCSS}</style>
      <Navbar
        title={fileName}
        showDocuments
        showSettings
        showLogout
      />
      <div style={styles.body}>
        {/* PDF Viewer */}
        <div style={styles.pdfPanel}>
          <div style={styles.pdfToolbar}>
            <button style={styles.toolbarBtn} onClick={() => goPage(-1)} disabled={currentPage <= 1}>←</button>
            <button style={styles.toolbarBtn} onClick={() => goPage(1)} disabled={currentPage >= (numPages || 1)}>→</button>
            <span style={styles.toolbarText}>{currentPage} / {numPages || '?'}</span>
            <span style={{ flex: 1 }} />
            <button style={styles.toolbarBtn} onClick={() => changeScale(-0.1)}>-</button>
            <span style={styles.toolbarText}>{Math.round(scale * 100)}%</span>
            <button style={styles.toolbarBtn} onClick={() => changeScale(0.1)}>+</button>
          </div>
          <div style={styles.pdfViewer}>
            {pdfLoading ? (
              <div style={styles.spinnerWrap}>
                <div style={styles.spinner} />
                <div>PDF를 불러오는 중...</div>
              </div>
            ) : pdfBlob ? (
              <Document
                file={pdfBlob}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div style={styles.spinnerWrap}><div style={styles.spinner} /></div>}
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            ) : (
              <div style={{ color: '#888', padding: '40px' }}>PDF를 불러올 수 없습니다.</div>
            )}
          </div>
        </div>

        {/* Tab Panel */}
        <div style={styles.tabPanel}>
          <div style={styles.tabBar}>
            {['summary', 'questions', 'note'].map((tab) => (
              <button
                key={tab}
                style={styles.tabBtn(activeTab === tab)}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'summary' ? '요약' : tab === 'questions' ? '문제' : '노트'}
              </button>
            ))}
          </div>
          <div style={activeTab === 'note' ? { ...styles.tabContent, display: 'flex', flexDirection: 'column', padding: 0 } : styles.tabContent}>
            {activeTab === 'summary' && <SummaryTab pdfId={pdfId} />}
            {activeTab === 'questions' && <QuestionsTab pdfId={pdfId} />}
            {activeTab === 'note' && <NoteTab pdfId={pdfId} />}
          </div>
        </div>
      </div>

      {/* AI Tutor */}
      {tutorOpen && <TutorPopup pdfId={pdfId} onClose={() => setTutorOpen(false)} />}
      <button style={styles.tutorBtn} onClick={() => setTutorOpen((v) => !v)} title="AI 튜터">
        🤖
      </button>
    </div>
  );
}
