import React from 'react';
import '../App.css';

// PUBLIC_INTERFACE
export default function Header({ onToggleSidebar, isSidebarOpen }) {
  /** Header renders the brand and primary actions. */
  return (
    <header className="app-header" role="banner">
      <div className="header-inner" aria-label="Application header">
        <div className="brand" aria-label="Brand">
          <span className="brand-accent" aria-hidden="true" />
          <span>AI Copilot</span>
        </div>
        <div className="header-actions">
          <button
            className="btn"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
        </div>
      </div>
    </header>
  );
}
