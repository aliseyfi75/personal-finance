import React, { useState, useEffect } from 'react';
import { useSettings, SettingsProvider } from './contexts/SettingsContext';
import { SettingsForm } from './components/SettingsForm';
import { Dashboard } from './components/Dashboard';
import { Simulation } from './components/Simulation';
import { GeminiChat } from './components/GeminiChat';
import { initGoogleClient, signInGoogle, signOutGoogle, getAuthInstance } from './services/GoogleAuth';
import { fetchSpreadsheetData, parsePortfolioData, parseFinancialData, aggregateMonthlyData } from './services/SheetsService';
import type { PortfolioItem, FinancialRecord } from './types';
import { LogOut, RefreshCw, LayoutDashboard, TrendingUp, MessageSquare } from 'lucide-react';

const MainApp: React.FC = () => {
  const { settings, clearSettings, isConfigured } = useSettings();
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulation' | 'ai'>('dashboard');

  useEffect(() => {
    if (isConfigured && settings?.googleClientId) {
      initGoogleClient(settings.googleClientId).then(() => {
        const authInstance = getAuthInstance();
        setGoogleUser(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          setGoogleUser(isSignedIn);
        });
      }).catch(err => {
        console.error("GAPI Init Error", err);
        alert("Failed to initialize Google API. Check Client ID.");
      });
    }
  }, [isConfigured, settings]);

  const loadData = React.useCallback(async () => {
    if (!settings) return;
    setLoading(true);
    try {
        // Portfolio Sheet
        // Assuming data is in Sheet1!A1:Z1000 or similar.
        // Or specific tab name "Portfolio"? User said "Portfolio sheet Structure".
        // Usually default is 'Sheet1' or the first one. Let's try to fetch ranges.
        // User didn't specify sheet Name, just Structure.
        // We'll assume the first sheet is the relevant one, or ask for Sheet Name in settings?
        // Simpler: Fetch 'A:Z' which usually hits the first sheet.
        const portfolioRaw = await fetchSpreadsheetData(settings.portfolioSheetId, 'A:H'); // Cols A-H based on description
        const portfolioParsed = parsePortfolioData(portfolioRaw);
        setPortfolio(portfolioParsed);

        // Financial Sheet
        // A:Z
        const finRaw = await fetchSpreadsheetData(settings.financialSheetId, 'A:Z');
        const finParsed = parseFinancialData(finRaw);
        const finAggregated = aggregateMonthlyData(finParsed);
        setFinancials(finAggregated);

    } catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data from sheets. Ensure you have permission and the IDs are correct.");
    }
    setLoading(false);
  }, [settings]);

  useEffect(() => {
    if (googleUser) {
      loadData();
    }
  }, [googleUser, loadData]);

  const handleSignIn = async () => {
    try {
      await signInGoogle();
      const authInstance = getAuthInstance();
      setGoogleUser(authInstance.isSignedIn.get());
    } catch (e) {
      console.error("Sign in failed", e);
      alert("Sign in failed. Please check your credentials and try again.");
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setGoogleUser(false);
    setPortfolio([]);
    setFinancials([]);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <header className="max-w-7xl mx-auto py-6">
          <h1 className="text-3xl font-bold text-gray-900">Financial Planner Setup</h1>
        </header>
        <SettingsForm />
      </div>
    );
  }

  if (!googleUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">Welcome Back</h1>
            <p className="text-gray-600 mb-6">Please sign in with Google to access your financial sheets securely.</p>
            <button
                onClick={handleSignIn}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Sign in with Google
            </button>
            <button
                onClick={clearSettings}
                className="mt-4 text-sm text-gray-500 underline"
            >
                Reset API Keys
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" />
                Financial Planner
            </h1>
            <div className="flex items-center gap-4">
                <button onClick={loadData} disabled={loading} className="text-gray-600 hover:text-blue-600">
                    <RefreshCw className={loading ? "animate-spin" : ""} />
                </button>
                <button onClick={handleSignOut} className="text-gray-600 hover:text-red-600 flex items-center gap-1 text-sm">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 border-t">
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
                onClick={() => setActiveTab('simulation')}
                className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'simulation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <TrendingUp size={18} /> Monte Carlo
            </button>
            <button
                onClick={() => setActiveTab('ai')}
                className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'ai' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <MessageSquare size={18} /> Gemini AI
            </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && portfolio.length === 0 ? (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
                <span className="ml-2 text-gray-500">Loading data from sheets...</span>
            </div>
        ) : (
            <>
                {activeTab === 'dashboard' && <Dashboard portfolio={portfolio} financials={financials} />}
                {activeTab === 'simulation' && <Simulation initialPortfolioValue={portfolio.reduce((sum, i) => sum + i.valueCAD, 0)} />}
                {activeTab === 'ai' && <GeminiChat apiKey={settings?.geminiApiKey || ''} portfolio={portfolio} financials={financials} />}
            </>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}

export default App;
