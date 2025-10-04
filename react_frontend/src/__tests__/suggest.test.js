import { getSuggestions } from '../api/suggest';

// Mock getApiBase to a fixed URL for tests
jest.mock('../config', () => ({
  getApiBase: () => 'http://test.local',
}));

describe('api/suggest', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns array from /api/suggest', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => (['a', 'b']),
    });
    const list = await getSuggestions();
    expect(fetch).toHaveBeenCalledWith('http://test.local/api/suggest', { method: 'GET' });
    expect(list).toEqual(['a', 'b']);
  });

  test('returns [] on non-200', async () => {
    fetch.mockResolvedValueOnce({ ok: false, headers: { get: () => 'text/plain' } });
    const list = await getSuggestions();
    expect(list).toEqual([]);
  });

  test('returns [] on network error', async () => {
    fetch.mockRejectedValueOnce(new Error('network'));
    const list = await getSuggestions();
    expect(list).toEqual([]);
  });
});
