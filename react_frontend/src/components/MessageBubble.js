import React from 'react';
import '../App.css';

// PUBLIC_INTERFACE
export default function MessageBubble({ role = 'assistant', content = '' }) {
  /** Renders a single message bubble with role label and styled bubble. */
  const label = role === 'user' ? 'You' : 'Assistant';
  return (
    <div className="msg" role="group" aria-label={`${label} message`}>
      <div className="role">{label}</div>
      <div className={`bubble ${role}`}>{content}</div>
    </div>
  );
}
