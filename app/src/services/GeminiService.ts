import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PortfolioItem, FinancialRecord } from "../types";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeFinancials(portfolio: PortfolioItem[], financials: FinancialRecord[]): Promise<string> {
    const prompt = `
      You are a financial advisor. Analyze the following financial data and provide insights on:
      1. Asset Allocation & Risk
      2. Spending Habits & Burn Rate
      3. Net Worth Trend
      4. Recommendations for rebalancing or saving.

      Portfolio Summary:
      ${JSON.stringify(portfolio.slice(0, 20))}
      (Top 20 items only for brevity if large)

      Recent Financial History (Last 3 months):
      ${JSON.stringify(financials.slice(-3))}

      Provide a concise markdown report.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async chat(message: string, contextData: any): Promise<string> {
    const prompt = `
      Context Data: ${JSON.stringify(contextData)}

      User Question: ${message}

      Answer as a helpful financial assistant.
    `;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async estimateParameters(portfolio: PortfolioItem[]): Promise<{ return: number, volatility: number }> {
    const prompt = `
        Based on this portfolio, estimate the weighted average annualized expected return and annualized volatility (risk).
        Return ONLY a JSON object with keys "return" and "volatility" as decimals (e.g. {"return": 0.08, "volatility": 0.15}).
        Do not include markdown formatting.

        Portfolio:
        ${JSON.stringify(portfolio)}
    `;

    try {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        const json = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to estimate parameters", e);
        return { return: 0.07, volatility: 0.15 }; // Fallback
    }
  }
}
