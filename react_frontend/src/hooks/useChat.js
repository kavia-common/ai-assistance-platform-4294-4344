import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHealth, getSuggestions, postChat } from '../api/client';
import { getApiBase } from '../config';

// PUBLIC_INTERFACE
export function useChat() {
  /** Manage chat messages, loading, health, and suggestions lifecycle. */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null); // normalized string 'ok' | 'unavailable'
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // preload health and suggestions
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const base = getApiBase();
        try { console.debug('[hook] useChat health check base:', base, 'url:', `${base}/api/health`); } catch {}
        const h = await getHealth();
        if (!cancelled) setHealth(h === 'ok' ? 'ok' : 'unavailable');
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
    if (!text || !text.trim()) return;
    setError('');

    const cleaned = text.trim();
    // Prepare new user message
    const userMsg = { role: 'user', content: cleaned };

    // Optimistically update UI
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build outgoing context to include the just-added user message
      const outgoing = [...messages, userMsg];

      // Send only messages to backend to avoid duplication; omit prompt
      const responseMsg = await postChat({ messages: outgoing, prompt: '' });

      // Ensure normalized object { role, content }
      const assistantMsg = responseMsg && responseMsg.role && responseMsg.content
        ? responseMsg
        : { role: 'assistant', content: String(responseMsg ?? '') || '(no response)' };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setError(e?.message || 'Failed to send message.');
      // Append an assistant error message for visibility
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an error processing that request.' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const state = useMemo(() => ({
    messages, loading, health, error, suggestions,
  }), [messages, loading, health, error, suggestions]);

  return { ...state, sendMessage, setMessages, setError };
}
