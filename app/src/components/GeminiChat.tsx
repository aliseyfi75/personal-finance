import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/GeminiService';
import type { PortfolioItem, FinancialRecord } from '../types';
import { Send, Sparkles, Loader } from 'lucide-react';

interface GeminiChatProps {
  apiKey: string;
  portfolio: PortfolioItem[];
  financials: FinancialRecord[];
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({ apiKey, portfolio, financials }) => {
  const [service] = useState(() => new GeminiService(apiKey));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleAnalysis = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: 'Please generate a financial analysis report.' }]);
    try {
      const response = await service.analyzeFinancials(portfolio, financials);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error generating analysis. Please check your API key.' }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    try {
      // Pass summary data as context to avoid token limits
      const context = {
        portfolioTotal: portfolio.reduce((sum, i) => sum + i.valueCAD, 0),
        topHoldings: portfolio.slice(0, 5),
        recentFinancials: financials.slice(-1)
      };
      const response = await service.chat(msg, context);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error getting response.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h2 className="font-bold text-gray-700 flex items-center gap-2">
          <Sparkles className="text-purple-600" size={20} />
          Gemini Financial Assistant
        </h2>
        {messages.length === 0 && (
          <button
            onClick={handleAnalysis}
            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition"
          >
            Generate Report
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
                <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                <p>Ready to analyze your finances.</p>
                <p className="text-sm">Click "Generate Report" or ask a question.</p>
            </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none prose prose-sm'
            }`}>
               {m.role === 'ai' ? (
                   <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
               ) : (
                   m.content
               )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 rounded-lg p-3 rounded-bl-none">
                <Loader className="animate-spin text-gray-500" size={16} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your portfolio..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
