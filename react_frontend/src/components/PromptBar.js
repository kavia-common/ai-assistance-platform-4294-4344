import React, { useRef, useState, useEffect } from 'react';
import '../App.css';

// PUBLIC_INTERFACE
export default function PromptBar({ onSend, disabled }) {
  /** PromptBar handles user input with Enter to send and Shift+Enter for newline. */
  const [value, setValue] = useState('');
  const taRef = useRef(null);

  useEffect(() => {
    // Auto-grow textarea
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [value]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend?.(value.trim());
        setValue('');
      }
    }
  };

  const handleClickSend = () => {
    if (disabled) return;
    if (value.trim()) {
      onSend?.(value.trim());
      setValue('');
    }
  };

  return (
    <div className="prompt-bar" role="form" aria-label="Send a message">
      <div className="textarea-wrap">
        <textarea
          ref={taRef}
          className="input"
          placeholder="Ask the AI Copilot..."
          aria-label="Message input"
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="text-muted" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="kbd">Shift</span> + <span className="kbd">Enter</span> for newline
        </div>
        <button
          className="btn btn-primary"
          onClick={handleClickSend}
          aria-label="Send message"
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </div>
  );
}
