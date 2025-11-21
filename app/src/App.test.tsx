import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the SettingsContext
const mockIsConfigured = vi.fn();
const mockSettings = { googleClientId: 'test-client-id', portfolioSheetId: '1', financialSheetId: '2' };

vi.mock('./contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    isConfigured: mockIsConfigured(),
    clearSettings: vi.fn(),
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock GoogleAuth
const mockInitGoogleClient = vi.fn().mockResolvedValue(undefined);
const mockSignInGoogle = vi.fn().mockResolvedValue({});
const mockGetAuthInstance = vi.fn();
const mockIsSignedInGet = vi.fn().mockReturnValue(false);
const mockIsSignedInListen = vi.fn();

vi.mock('./services/GoogleAuth', () => ({
  initGoogleClient: (...args: any[]) => mockInitGoogleClient(...args),
  signInGoogle: () => mockSignInGoogle(),
  getAuthInstance: () => mockGetAuthInstance(),
  signOutGoogle: vi.fn(),
  fetchSpreadsheetData: vi.fn(),
  parsePortfolioData: vi.fn(),
  parseFinancialData: vi.fn(),
  aggregateMonthlyData: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true); // Default to configured
    mockIsSignedInGet.mockReturnValue(false); // Default to not signed in

    // Setup getAuthInstance mock chain
    mockGetAuthInstance.mockReturnValue({
      isSignedIn: {
        get: mockIsSignedInGet,
        listen: mockIsSignedInListen,
      },
    });
  });

  it('renders setup screen if not configured', () => {
    mockIsConfigured.mockReturnValue(false);
    render(<App />);
    expect(screen.getByText('Financial Planner Setup')).toBeInTheDocument();
  });

  it('renders sign-in screen if configured but not signed in', async () => {
    render(<App />);
    await waitFor(() => expect(mockInitGoogleClient).toHaveBeenCalledWith('test-client-id'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('handles sign-in success and navigates to dashboard', async () => {
    render(<App />);
    await waitFor(() => expect(mockInitGoogleClient).toHaveBeenCalled());

    const signInButton = screen.getByText('Sign in with Google');

    // Mock successful sign-in behavior
    mockSignInGoogle.mockImplementation(async () => {
       // When sign in completes, the next getAuthInstance call should return true
       mockIsSignedInGet.mockReturnValue(true);
       return {};
    });

    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInGoogle).toHaveBeenCalled();
    });

    // Should now see the dashboard (Financial Planner header)
    await waitFor(() => {
      expect(screen.getByText('Financial Planner')).toBeInTheDocument();
    });
  });

  it('handles sign-in failure and shows alert', async () => {
    render(<App />);
    await waitFor(() => expect(mockInitGoogleClient).toHaveBeenCalled());

    const signInButton = screen.getByText('Sign in with Google');

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockSignInGoogle.mockRejectedValue(new Error('Popup closed'));

    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInGoogle).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Sign in failed'));
    });

    alertMock.mockRestore();
  });
});
