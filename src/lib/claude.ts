// Shared helper for calling the Anthropic Claude API via native fetch.
// The @anthropic-ai/sdk's bundled node-fetch can hit DNS/routing issues
// in certain environments, so we use the built-in fetch instead.

import { requireEnv } from '@/config/env';

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
  messages: ClaudeMessage[];
}

interface ClaudeTextBlock {
  type: "text";
  text: string;
}

interface ClaudeResponse {
  content: ClaudeTextBlock[];
  model: string;
  stop_reason: string;
}

export async function askClaude(opts: ClaudeOptions): Promise<string> {
  const apiKey = requireEnv('ANTHROPIC_API_KEY');

  const body: Record<string, unknown> = {
    model: opts.model ?? "claude-sonnet-4-20250514",
    max_tokens: opts.maxTokens ?? 500,
    messages: opts.messages,
  };
  if (opts.system) {
    body.system = opts.system;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errorText}`);
  }

  const data: ClaudeResponse = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}
