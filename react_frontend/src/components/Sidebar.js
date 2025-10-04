import React from 'react';
import '../App.css';

// PUBLIC_INTERFACE
export default function Sidebar({ open = true }) {
  /** Sidebar nav with simple placeholder items. */
  if (!open) {
    return null;
  }
  return (
    <aside className="sidebar card" aria-label="Sidebar navigation">
      <div className="sidebar-header">
        <strong>Navigation</strong>
      </div>
      <nav className="nav" aria-label="Primary">
        <button className="nav-item" aria-current="page" aria-label="Go to Chat">
          <span role="img" aria-hidden="true">💬</span>
          <span>Chat</span>
        </button>
        <button className="nav-item" aria-label="Go to History">
          <span role="img" aria-hidden="true">🕘</span>
          <span>History</span>
        </button>
        <button className="nav-item" aria-label="Go to Settings">
          <span role="img" aria-hidden="true">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}
