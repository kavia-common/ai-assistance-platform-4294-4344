import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHealth, getSuggestions, postChat } from '../api/client';

// PUBLIC_INTERFACE
export function useChat() {
  /** Manage chat messages, loading, health, and suggestions lifecycle. */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // preload health and suggestions
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const h = await getHealth().catch(() => null);
        if (!cancelled) setHealth(h || 'unavailable');
      } catch {
        if (!cancelled) setHealth('unavailable');
      }

      try {
        const s = await getSuggestions();
        if (!cancelled) {
          const arr = Array.isArray(s) ? s : (s?.suggestions || []);
          setSuggestions(arr.filter(Boolean).slice(0, 6));
        }
      } catch {
        // ignore suggestion errors
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const sendMessage = useCallback(async (text) => {
    setError('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await postChat(text, next);
      // Expecting { reply: string } or { role, content }
      let assistantMsg = null;
      if (res && typeof res === 'object') {
        if (typeof res.reply === 'string') {
          assistantMsg = { role: 'assistant', content: res.reply };
        } else if (res.role && res.content) {
          assistantMsg = { role: res.role, content: res.content };
        }
      }
      if (!assistantMsg) {
        assistantMsg = { role: 'assistant', content: String(res ?? '') || '(no response)' };
      }
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setError(e?.message || 'Failed to send message.');
      // keep user message in history even on error
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const state = useMemo(() => ({
    messages, loading, health, error, suggestions,
  }), [messages, loading, health, error, suggestions]);

  return { ...state, sendMessage, setMessages, setError };
}
