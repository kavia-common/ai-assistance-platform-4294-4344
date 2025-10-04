import { getHealth, postChat } from '../api/client';

// Mock getApiBase to a fixed URL for tests
jest.mock('../config', () => ({
  getApiBase: () => 'http://test.local',
}));

describe('api/client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getHealth returns ok when /api/health responds 200', async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    const status = await getHealth();
    expect(fetch).toHaveBeenCalledWith('http://test.local/api/health', { method: 'GET' });
    expect(status).toBe('ok');
  });

  test('getHealth returns unavailable on network error', async () => {
    fetch.mockRejectedValueOnce(new Error('network'));
    const status = await getHealth();
    expect(status).toBe('unavailable');
  });

  test('postChat normalizes ChatResponse.message', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: { role: 'assistant', content: 'Hello!' } }),
    });
    const result = await postChat({ messages: [{ role: 'user', content: 'Hi' }], prompt: '' });
    expect(result).toEqual({ role: 'assistant', content: 'Hello!' });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toEqual({ messages: [{ role: 'user', content: 'Hi' }], prompt: '' });
  });

  test('postChat surfaces backend error detail', async () => {
    // First attempt returns 400 with ErrorResponse.detail
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Bad Request: missing messages' }),
      statusText: 'Bad Request'
    });
    await expect(postChat({})).rejects.toThrow('Bad Request: missing messages');
  });
});
