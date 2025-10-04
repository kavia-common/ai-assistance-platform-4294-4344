import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChat } from './hooks/useChat';

// PUBLIC_INTERFACE
function App() {
  /** Root application layout with Header, Sidebar, and ChatWindow. */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { messages, loading, error, health, suggestions, sendMessage } = useChat();

  return (
    <div className="app-shell">
      <Header
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        isSidebarOpen={sidebarOpen}
      />
      <main className="app-main" role="main">
        <Sidebar open={sidebarOpen} />
        <ChatWindow
          messages={messages}
          onSend={sendMessage}
          loading={loading}
          error={error}
          health={health}
          suggestions={suggestions}
        />
      </main>
    </div>
  );
}

export default App;
