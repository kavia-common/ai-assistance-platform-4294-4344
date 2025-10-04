import React from 'react';
import { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom/client';
import App from '../App';

// Mock getApiBase
jest.mock('../config', () => ({
  getApiBase: () => 'http://test.local',
}));

describe('App integration UI', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    global.fetch = jest.fn();
  });
  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    jest.resetAllMocks();
  });

  test('renders health banner and shows ok', async () => {
    // health call
    fetch.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      const root = ReactDOM.createRoot(container);
      root.render(<App />);
      // allow effect to run
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Service status: ok');
    expect(container.textContent).toContain('API: http://test.local');
  });

  test('sends a chat message and shows assistant reply', async () => {
    // health ok
    fetch.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      const root = ReactDOM.createRoot(container);
      root.render(<App />);
      await Promise.resolve();
    });

    // chat response
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: { role: 'assistant', content: 'Pong' } }),
    });

    const textarea = container.querySelector('textarea');
    const sendBtn = container.querySelector('button.btn-primary');

    await act(async () => {
      textarea.value = 'Ping';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // flush promises
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Ping');
    expect(container.textContent).toContain('Pong');
  });

  test('renders error banner when backend returns error', async () => {
    // health ok
    fetch.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      const root = ReactDOM.createRoot(container);
      root.render(<App />);
      await Promise.resolve();
    });

    // chat error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Internal error' }),
      statusText: 'Server Error',
    });

    const textarea = container.querySelector('textarea');
    const sendBtn = container.querySelector('button.btn-primary');

    await act(async () => {
      textarea.value = 'Hi';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Internal error');
    expect(container.textContent).toContain('service is unavailable');
  });
});
