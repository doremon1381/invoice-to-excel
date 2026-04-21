import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_MODEL,
  EXTRACTION_PROMPT,
  MAX_ANTHROPIC_TOKENS,
} from "@/lib/constants";
import { parseExtractedJSON } from "@/lib/parser";
import type { ExtractedInvoice } from "@/lib/types";

interface OpenAIChatCompletionResponse {
  choices?: {
    message?: {
      content?: string | { type?: string; text?: string }[];
    };
  }[];
}

function extractMessageText(data: OpenAIChatCompletionResponse): string {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n");
  }

  return "";
}

async function callChatCompletions(content: unknown): Promise<string> {
  const endpoint = `${ANTHROPIC_BASE_URL}/v1/chat/completions`;

  console.log("debug - start callChatCompletions");
  console.log("debug - request endpoint", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANTHROPIC_API_KEY}`,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_ANTHROPIC_TOKENS,
      temperature: 0,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });

  console.log("debug - response status", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI-style API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const text = extractMessageText(data);

  if (!text) {
    throw new Error("OpenAI-style API returned an empty response.");
  }

  return text;
}

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
): Promise<{ extracted: ExtractedInvoice; rawText: string }> {
  const text = await callChatCompletions([
    {
      type: "text",
      text: EXTRACTION_PROMPT,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${imageBase64}`,
      },
    },
  ]);

  console.log("debug - extracted text length", text.length);

  return {
    extracted: parseExtractedJSON(text),
    rawText: text,
  };
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANTHROPIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 16,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: "Reply with ok.",
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<string[]> {
  return [ANTHROPIC_MODEL];
}
