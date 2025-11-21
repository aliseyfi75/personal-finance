import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock GoogleAuth to avoid gapi errors
vi.mock('./services/GoogleAuth', () => ({
    initGoogleClient: vi.fn().mockResolvedValue(undefined),
    isSignedIn: vi.fn().mockReturnValue(false),
    signInGoogle: vi.fn(),
    signOutGoogle: vi.fn(),
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Should show Setup screen initially because no settings are configured in the fresh context
    expect(screen.getByText('Financial Planner Setup')).toBeInTheDocument();
  });
});
