import {
  EXTRACTION_PROMPT,
  MAX_OPENAI_TOKENS_PER_IMAGE,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_EFFORT_LEVEL_MAX,
  OPENAI_MODEL,
} from "@/lib/constants";
import { translate } from "@/lib/i18n";
import { parseExtractedJSON } from "@/lib/parser";
import type { ExtractInvoiceResponse } from "@/lib/types";

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
  const endpoint = `${OPENAI_BASE_URL}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000);

  console.log("debug - start callChatCompletions");
  console.log("debug - request endpoint", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: MAX_OPENAI_TOKENS_PER_IMAGE,
      reasoning_effort: OPENAI_EFFORT_LEVEL_MAX,
      temperature: 0,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    }),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  //console.log("debug - response status", await response.text());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      translate("scan.openAiApiError", {
        status: response.status,
        details: errorText,
      }),
    );
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const text = extractMessageText(data);

  if (!text) {
    throw new Error(translate("scan.openAiEmptyResponse"));
  }

  return text;
}

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
): Promise<ExtractInvoiceResponse> {
  const text = await callChatCompletions([
    {
      type: "text",
      text: EXTRACTION_PROMPT,
      // response_format: { type: "json_object" }, // TODO: uncomment this when we have a way to estimate the number of tokens
    },
    {
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${imageBase64}`,
      },
    },
  ]);

  console.log("debug - extracted text length", text.length);

  const parsed = parseExtractedJSON(text);

  return {
    extracted: parsed.extracted,
    invoiceTitle: parsed.invoiceTitle,
    rawText: text,
  };
}

// export async function checkAPIHealth(): Promise<boolean> {
//   try {
//     const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: OPENAI_MODEL,
//         max_tokens: MAX_OPENAI_TOKENS,
//         reasoning_effort: OPENAI_EFFORT_LEVEL_LOW,
//         temperature: 0,
//         messages: [
//           {
//             role: "user",
//             content: "Reply with ok.",
//           },
//         ],
//       }),
//       signal: AbortSignal.timeout(5000),
//     });

//     return response.ok;
//   } catch {
//     return false;
//   }
// }

export async function listModels(): Promise<string[]> {
  return [OPENAI_MODEL];
}
