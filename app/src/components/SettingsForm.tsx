import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { AppSettings } from '../types';
import { Key, Save } from 'lucide-react';

export const SettingsForm: React.FC = () => {
  const { saveSettings, settings } = useSettings();
  const [formData, setFormData] = useState<AppSettings>(settings || {
    googleClientId: '',
    geminiApiKey: '',
    portfolioSheetId: '',
    financialSheetId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <div className="flex items-center gap-2 mb-6">
        <Key className="text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">API Configuration</h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">
        Your keys are stored in your browser's temporary session storage and are never saved to any server.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Client ID</label>
          <input
            type="text"
            name="googleClientId"
            value={formData.googleClientId}
            onChange={handleChange}
            placeholder="xxxx.apps.googleusercontent.com"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
          <input
            type="password"
            name="geminiApiKey"
            value={formData.geminiApiKey}
            onChange={handleChange}
            placeholder="AIza..."
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Sheet ID</label>
          <input
            type="text"
            name="portfolioSheetId"
            value={formData.portfolioSheetId}
            onChange={handleChange}
            placeholder="Spreadsheet ID from URL"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Financial Planning Sheet ID</label>
          <input
            type="text"
            name="financialSheetId"
            value={formData.financialSheetId}
            onChange={handleChange}
            placeholder="Spreadsheet ID from URL"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save & Continue
        </button>
      </form>
    </div>
  );
};
