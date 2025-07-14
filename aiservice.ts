import crypto from 'crypto';
import LRUCache from 'lru-cache';
import { OpenAI } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing required environment variable OPENAI_API_KEY");
}

const openai = new OpenAI({ apiKey });

const MAX_RESPONSE_LENGTH = Number(process.env.MAX_AI_RESPONSE_LENGTH) || 100000; // max characters per response
const PROMPT_HASH_ALGORITHM = "sha256";

type PendingMap = Map<string, Promise<string>>;

class AiService {
  private cache: LRUCache<string, string>;
  private pending: PendingMap;

  constructor() {
    this.cache = new LRUCache<string, string>({
      max: 500,
      ttl: 1000 * 60 * 60, // 1 hour
    });
    this.pending = new Map();
  }

  private getCacheKey(prompt: string): string {
    return crypto.createHash(PROMPT_HASH_ALGORITHM).update(prompt).digest("hex");
  }

  async generate(prompt: string): Promise<string> {
    const key = this.getCacheKey(prompt);
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    const promise = this.callOpenAI(prompt)
      .then((response) => {
        this.cache.set(key, response);
        this.pending.delete(key);
        return response;
      })
      .catch((err) => {
        this.pending.delete(key);
        throw err;
      });
    this.pending.set(key, promise);
    return promise;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    let result = "";
    for await (const chunk of response) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        result += delta;
        if (result.length >= MAX_RESPONSE_LENGTH) {
          console.warn("AI response truncated due to length limit.");
          break;
        }
      }
    }
    return result;
  }
}

export const aiService = new AiService();