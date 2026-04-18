import {
  ANTHROPIC_API_URL,
  ANTHROPIC_MODEL,
  ANTHROPIC_VERSION,
  EXTRACTION_PROMPT,
  MAX_ANTHROPIC_TOKENS,
} from '@/lib/constants';
import { parseExtractedJSON } from '@/lib/parser';
import type { ExtractedInvoice } from '@/lib/types';

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
): Promise<{ extracted: ExtractedInvoice; rawText: string }> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_ANTHROPIC_TOKENS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = data.content?.[0]?.text ?? '';

  if (!text) {
    throw new Error('Anthropic API returned an empty response.');
  }

  return {
    extracted: parseExtractedJSON(text),
    rawText: text,
  };
}

export async function testAnthropicConnection(apiKey: string): Promise<void> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Reply with the word ok.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
}
