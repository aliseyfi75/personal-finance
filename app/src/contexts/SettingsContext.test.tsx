import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';
import React from 'react';
import userEvent from '@testing-library/user-event';

// Helper component to test the hook
const TestComponent = () => {
  const { settings, saveSettings, clearSettings } = useSettings();
  return (
    <div>
      <div data-testid="settings">{settings ? JSON.stringify(settings) : 'null'}</div>
      <button onClick={() => saveSettings({ googleClientId: 'abc', financialSheetId: '123', portfolioSheetId: '456', geminiApiKey: 'key' })}>
        Save
      </button>
      <button onClick={clearSettings}>Clear</button>
    </div>
  );
};

function renderWithUser(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

describe('SettingsContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide initial null settings', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    expect(screen.getByTestId('settings')).toHaveTextContent('null');
  });

  it('should load settings from sessionStorage', () => {
    const mockSettings = { googleClientId: 'existing', financialSheetId: '1', portfolioSheetId: '2', geminiApiKey: '3' };
    sessionStorage.setItem('fin_app_settings', JSON.stringify(mockSettings));

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('settings')).toHaveTextContent(JSON.stringify(mockSettings));
  });

  it('should update settings and sessionStorage on save', async () => {
        const { user } = renderWithUser(
            <SettingsProvider>
              <TestComponent />
            </SettingsProvider>
          );

        await user.click(screen.getByText('Save'));

        expect(screen.getByTestId('settings')).toHaveTextContent('abc');
        expect(sessionStorage.getItem('fin_app_settings')).toContain('abc');
    });

     it('should clear settings and sessionStorage', async () => {
         const mockSettings = { googleClientId: 'abc', financialSheetId: '123', portfolioSheetId: '456', geminiApiKey: 'key' };
         sessionStorage.setItem('fin_app_settings', JSON.stringify(mockSettings));

        const { user } = renderWithUser(
            <SettingsProvider>
              <TestComponent />
            </SettingsProvider>
          );

        expect(screen.getByTestId('settings')).toHaveTextContent('abc');

        await user.click(screen.getByText('Clear'));

        expect(screen.getByTestId('settings')).toHaveTextContent('null');
        expect(sessionStorage.getItem('fin_app_settings')).toBeNull();
     });
});
