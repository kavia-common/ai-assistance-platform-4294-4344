import React, { useEffect, useState } from 'react';
import './index.css';
import { getHealth, postChat } from './api/client';
import { getApiBase } from './config';
import MessageList from './components/MessageList';

// PUBLIC_INTERFACE
export default function App() {
  /** Minimal App with health banner and a simple chat input stub. */
  const [health, setHealth] = useState(null); // 'ok' | 'unavailable' | null (initial)
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // in-memory chat history
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await getHealth();
      if (!cancelled) setHealth(status === 'ok' ? 'ok' : 'unavailable');
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setInput('');
    setError('');
    setMessages(nextMessages);
    setLoading(true);
    try {
      const reply = await postChat({ messages: nextMessages, prompt: '' });
      // Ensure normalized assistant message
      const normalized = reply && reply.role && reply.content
        ? reply
        : { role: 'assistant', content: String(reply ?? '') };
      setMessages(prev => [...prev, normalized]);
    } catch (e) {
      // Surface backend ErrorResponse.detail when present via thrown message
      const detail = e?.message || 'Failed to send message.';
      setError(detail);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'The service is unavailable or /api/chat is not implemented yet.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const bannerClass = health === 'ok' ? 'banner success' : 'banner error';
  const apiInfo = getApiBase();

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
      <h1 style={{ margin: '8px 0' }}>AI Copilot</h1>
      <div
        className={health ? bannerClass : 'banner'}
        role="status"
        aria-live="polite"
        style={{ marginBottom: 16 }}
      >
        Service status: {health || 'checking...'} • API: {apiInfo}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ marginBottom: 8, color: '#6B7280' }}>
          Enter a prompt below. This sends a POST to /api/chat at the configured API base.
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea
            rows={3}
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Chat input"
            disabled={loading}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
            <button className="btn" onClick={() => { setMessages([]); setError(''); }} disabled={loading}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="banner error" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 16 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>Messages</strong>
        <MessageList messages={messages} />
      </div>
    </div>
  );
}
