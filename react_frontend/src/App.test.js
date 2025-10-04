import { render } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
test('App renders without crashing (smoke test)', () => {
  /**
   * Minimal smoke test to ensure App mounts without runtime errors.
   * Avoids brittle text queries that can break with UI copy changes.
   */
  const { unmount } = render(<App />);
  // If render succeeds, the smoke test passes. Clean up to be explicit.
  unmount();
});
