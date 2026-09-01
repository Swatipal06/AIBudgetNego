import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import logger from '../config/logger.js';

class LLMClient {
  constructor() {
    this.provider = process.env.LLM_PROVIDER?.toLowerCase() || 'groq';
    this.groqKey = process.env.GROQ_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openrouterKey = process.env.OPENROUTER_API_KEY;

    // Initialize SDK clients if keys exist
    if (this.groqKey) {
      this.groqClient = new Groq({ apiKey: this.groqKey });
    }
    if (this.geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(this.geminiKey);
    }
  }

  /**
   * Cleans and extracts pure JSON from an LLM response string
   */
  static cleanJsonString(raw) {
    if (!raw || typeof raw !== 'string') return '{}';
    let cleaned = raw.trim();
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
    }
    // Find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
  }

  /**
   * Main completion method that calls the configured provider and validates with Zod
   * 
   * @param {string} prompt - Prompt string
   * @param {import('zod').ZodSchema} schema - Zod schema to validate against
   * @param {Object} fallbackData - Safe deterministic fallback in case of total provider failure
   * @returns {Promise<any>} Parsed and validated object
   */
  async generateStructuredOutput(prompt, schema, fallbackData) {
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let rawResponseText = '';

        if (this.provider === 'groq' && this.groqKey) {
          rawResponseText = await this.callGroq(prompt);
        } else if (this.provider === 'gemini' && this.geminiKey) {
          rawResponseText = await this.callGemini(prompt);
        } else if (this.provider === 'openrouter' && this.openrouterKey) {
          rawResponseText = await this.callOpenRouter(prompt);
        } else {
          // Provider key missing or provider set to mock/heuristic
          logger.info(`Using heuristic AI engine for negotiation (Provider: ${this.provider})`);
          return schema.parse(fallbackData);
        }

        const jsonStr = LLMClient.cleanJsonString(rawResponseText);
        const parsed = JSON.parse(jsonStr);
        const validated = schema.parse(parsed);
        return validated;
      } catch (error) {
        lastError = error;
        logger.warn(`LLM completion attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          // Brief backoff before retry
          await new Promise((res) => setTimeout(res, 500));
        }
      }
    }

    logger.error(`All LLM completion attempts failed. Falling back to deterministic agent logic. Error: ${lastError?.message}`);
    return schema.parse(fallbackData);
  }

  async callGroq(prompt) {
    const completion = await this.groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an enterprise AI agent in a multi-agent negotiation system. You always respond in valid, unadorned JSON format matching the requested schema exactly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content || '';
  }

  async callGemini(prompt) {
    const model = this.geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async callOpenRouter(prompt) {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are an enterprise AI negotiation agent. You output only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openrouterKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return response.data?.choices[0]?.message?.content || '';
  }
}

// Export singleton instance
export const llmClient = new LLMClient();
export default LLMClient;
