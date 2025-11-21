import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from './GeminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define mock functions
const generateContentMock = vi.fn();
const getGenerativeModelMock = vi.fn(() => ({
  generateContent: generateContentMock,
}));

// Mock the module
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn(function(this: any) {
        this.getGenerativeModel = getGenerativeModelMock;
    }),
  };
});

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GeminiService('fake-api-key');
  });

  it('should analyze financials', async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => 'Analysis Report' }
    });

    const result = await service.analyzeFinancials([], []);
    expect(result).toBe('Analysis Report');
    expect(generateContentMock).toHaveBeenCalled();
  });

  it('should handle chat interaction', async () => {
    generateContentMock.mockResolvedValue({
        response: { text: () => 'Chat Response' }
    });

    const result = await service.chat('Hello', {});
    expect(result).toBe('Chat Response');
  });

  it('should estimate parameters correctly', async () => {
      const mockJson = JSON.stringify({ return: 0.08, volatility: 0.12 });
      generateContentMock.mockResolvedValue({
          response: { text: () => `\`\`\`json\n${mockJson}\n\`\`\`` }
      });

      const result = await service.estimateParameters([]);
      expect(result).toEqual({ return: 0.08, volatility: 0.12 });
  });

  it('should return fallback parameters on failure', async () => {
      generateContentMock.mockRejectedValue(new Error('API Error'));

      const result = await service.estimateParameters([]);
      expect(result).toEqual({ return: 0.07, volatility: 0.15 });
  });
});
