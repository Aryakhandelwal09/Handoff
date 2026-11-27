// frontend/components/ErrorDrawer.jsx
import { useEffect, useRef, useState } from 'react';
import './ErrorDrawer.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// Turns `backticks` in AI text into <code>. React escapes everything else.
function Rich({ text }) {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

function Chips({ matched }) {
  return matched.map(m => (
    <span className="ed-chip" key={m.path}>{m.path}{m.line ? `:${m.line}` : ''}</span>
  ));
}

function Result({ data, view }) {
  const ex = data.explanation;
  const tag = data.general && <span className="ed-gen">General explanation, not tied to a file</span>;

  if (!ex) {
    return (
      <div className="ed-card">
        <h4>Couldn't write an explanation right now</h4>
        <p>The AI service didn't respond. {data.matched.length ? 'These files from your error are highlighted on the graph:' : 'No files from the analyzed set matched this error.'}</p>
        <Chips matched={data.matched} />
      </div>
    );
  }

  if (view === 'summarized') {
    return (
      <div className="ed-card">
        {tag}
        <h4>Quick answer</h4>
        <p><b>Cause:</b> <Rich text={ex.summary.cause || ex.what} /></p>
        <p><b>Fix:</b> <Rich text={ex.summary.fix || ex.fixSteps[0] || ''} /></p>
        {data.matched.length > 0 && <><p className="ed-sub">Look at</p><Chips matched={data.matched} /></>}
      </div>
    );
  }

  return (
    <>
      <div className="ed-card">{tag}<h4>What happened</h4><p><Rich text={ex.what} /></p></div>
      {data.matched.length > 0 && (
        <div className="ed-card">
          <h4>Where to look</h4>
          <Chips matched={data.matched} />
          {data.hiddenFrames > 0 && <p className="ed-sub">{data.hiddenFrames} framework lines hidden</p>}
        </div>
      )}
      {ex.causes.length > 0 && (
        <div className="ed-card">
          <h4>Likely causes</h4>
          <ol>{ex.causes.map((c, i) => (
            <li key={i}><Rich text={c.text} /><span className={`ed-tag ${c.confidence}`}>{c.confidence === 'likely' ? 'most likely' : 'possible'}</span></li>
          ))}</ol>
        </div>
      )}
      {ex.fixSteps.length > 0 && (
        <div className="ed-card">
          <h4>Fix steps</h4>
          <ol>{ex.fixSteps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>
        </div>
      )}
    </>
  );
}

export default function ErrorDrawer({ open, onClose, repoName, onTrace }) {
  const [text, setText] = useState('');
  const [view, setView] = useState('summarized'); // 'summarized' | 'detailed'
  const [state, setState] = useState({ status: 'idle', data: null, error: '' });
  const areaRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => areaRef.current && areaRef.current.focus(), 260);
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  async function explain() {
    if (!text.trim() || state.status === 'loading') return;
    setState({ status: 'loading', data: null, error: '' });
    onTrace([]);
    try {
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, errorText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      setState({ status: 'done', data, error: '' });
      onTrace(data.matched.map(m => m.path));
    } catch (e) {
      setState({ status: 'error', data: null, error: e.message });
    }
  }

  function clear() {
    setText('');
    setState({ status: 'idle', data: null, error: '' });
    onTrace([]);
  }

  return (
    <aside className={`err-drawer${open ? ' open' : ''}`} role="dialog" aria-label="Paste an error" aria-hidden={!open}>
      <div className="ed-head">
        <h2>Paste an error</h2>
        <button className="ed-x" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="ed-body">
        <p className="ed-sub">Paste what your terminal or browser printed.</p>
        <div className="ed-seg" role="group" aria-label="Explanation style">
          {['summarized', 'detailed'].map(v => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v === 'summarized' ? 'Summarized' : 'Detailed'}
            </button>
          ))}
        </div>
        <textarea ref={areaRef} value={text} onChange={e => setText(e.target.value)} spellCheck={false} aria-label="Error text" />
        <div className="ed-actions">
          <button className="ed-go" onClick={explain} disabled={!text.trim() || state.status === 'loading'}>
            {state.status === 'loading' ? 'Explaining…' : 'Explain this error'}
          </button>
          <button className="ed-ghost" onClick={clear}>Clear</button>
        </div>
        {state.status === 'error' && <div className="ed-card ed-err">{state.error}</div>}
        {state.status === 'done' && <Result data={state.data} view={view} />}
      </div>
    </aside>
  );
}