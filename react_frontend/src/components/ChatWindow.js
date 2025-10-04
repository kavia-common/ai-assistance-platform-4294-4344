import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import PromptBar from './PromptBar';
import '../App.css';

// PUBLIC_INTERFACE
export default function ChatWindow({
  messages,
  onSend,
  loading,
  error,
  health,
  suggestions = [],
}) {
  /** ChatWindow shows messages, optional banners, and the PromptBar. */
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <section className="chat-surface" aria-label="Chat window">
      <div className="chat-scroll" ref={scrollRef}>
        {health && (
          <div className="banner success" role="status" aria-live="polite">
            Backend reachable: {typeof health === 'string' ? health : 'OK'}
          </div>
        )}
        {error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}
        {messages.map((m, idx) => (
          <MessageBubble key={idx} role={m.role} content={m.content} />
        ))}
        {messages.length === 0 && suggestions?.length > 0 && (
          <div className="card" style={{ padding: 12 }}>
            <div className="text-muted" style={{ marginBottom: 8 }}>Suggestions</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="btn"
                  onClick={() => onSend(s)}
                  aria-label={`Use suggestion: ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <PromptBar onSend={onSend} disabled={loading} />
    </section>
  );
}
