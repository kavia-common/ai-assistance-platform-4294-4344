import React from 'react';

/**
 * MessageList renders a simple list of chat bubbles.
 * Expects items like: [{ role: 'user'|'assistant'|'system', content: '...' }, ...]
 */
// PUBLIC_INTERFACE
export default function MessageList({ messages = [] }) {
  /** Render chat message bubbles grouped with role labels. */
  if (!messages || messages.length === 0) {
    return <div className="text-muted">No messages yet.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {messages.map((m, i) => (
        <div key={i} className="msg">
          <div className="role" style={{ fontSize: 12, color: '#6B7280' }}>{m.role || 'assistant'}</div>
          <div className={`bubble ${m.role || 'assistant'}`}>{m.content}</div>
        </div>
      ))}
    </div>
  );
}
