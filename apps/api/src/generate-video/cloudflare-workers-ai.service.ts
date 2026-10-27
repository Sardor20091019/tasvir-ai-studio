import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudflareWorkersAiService {
  private readonly logger = new Logger(CloudflareWorkersAiService.name);

  getCredentials(): { accountId: string; apiToken: string } {
    let accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    let apiToken = (process.env.CLOUDFLARE_WORKERS_API_TOKEN || '').trim();

    if (!accountId || !apiToken) {
      const candidates = [
        path.resolve(process.cwd(), 'apps/api/.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../../.env'),
        path.resolve(__dirname, '../../.env'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!accountId && trimmed.startsWith('CLOUDFLARE_ACCOUNT_ID=')) {
              accountId = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
              process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
            }
            if (!apiToken && trimmed.startsWith('CLOUDFLARE_WORKERS_API_TOKEN=')) {
              apiToken = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
              process.env.CLOUDFLARE_WORKERS_API_TOKEN = apiToken;
            }
          }
        }
        if (accountId && apiToken) break;
      }
    }

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare Workers AI credentials missing. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_WORKERS_API_TOKEN in your environment variables or .env file.');
    }

    return { accountId, apiToken };
  }

  isAvailable(): boolean {
    const creds = this.getCredentials();
    return Boolean(creds && creds.accountId && creds.apiToken);
  }

  async run<T = any>(model: string, input: any): Promise<T> {
    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('Cloudflare Workers AI credentials missing');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/ai/run/${model}`,
      {
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(input),
      },
    );

    const result = await response.json();
    return result as T;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const preferredModel = process.env.CLOUDFLARE_AI_TEXT_MODEL || '@cf/meta/llama-3.1-70b-instruct';
    const fallbackModel = '@cf/meta/llama-3.1-8b-instruct';

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const randomSeed = Math.floor(Math.random() * 2147483647);
    const inputPayload = {
      messages,
      max_tokens: 3500,
      temperature: 0.95,
      top_p: 0.95,
      seed: randomSeed,
    };

    try {
      const res: any = await this.run(preferredModel, inputPayload);
      if (res?.success !== false && !res?.errors?.length) {
        const text = res?.result?.response || res?.result?.choices?.[0]?.message?.content;
        if (text) return text;
      }
      this.logger.warn(`Model ${preferredModel} notice: ${JSON.stringify(res?.errors || res)}. Falling back to ${fallbackModel}`);
    } catch (err: any) {
      this.logger.warn(`Model ${preferredModel} failed: ${err.message}. Falling back to ${fallbackModel}`);
    }

    const fallbackRes: any = await this.run(fallbackModel, inputPayload);
    const text = fallbackRes?.result?.response || fallbackRes?.result?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`Cloudflare AI text generation failed: ${JSON.stringify(fallbackRes?.errors || fallbackRes)}`);
    }
    return text;
  }

  async generateImage(prompt: string, steps: number = 4): Promise<Buffer | null> {
    try {
      const model = process.env.CLOUDFLARE_AI_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';
      this.logger.log(`Invoking Cloudflare Workers AI (${model}) for prompt: "${prompt.slice(0, 60)}"...`);
      const res: any = await this.run(model, {
        prompt: prompt.slice(0, 1000),
        steps,
      });

      const base64 = res?.result?.image;
      if (base64) {
        const buf = Buffer.from(base64, 'base64');
        if (buf.length > 5000) {
          return buf;
        }
      }
      return null;
    } catch (err: any) {
      this.logger.warn(`Cloudflare Workers AI image error: ${err.message}`);
      return null;
    }
  }
}

