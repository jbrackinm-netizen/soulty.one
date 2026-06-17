import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import type { ClaudeMessage, ClaudeContentBlock, ClaudeImageMediaType } from "@/lib/claude";
import {
  DIY_VISION_SYSTEM_PROMPT,
  DIY_VISION_MODEL,
  DIY_VISION_MAX_TOKENS,
} from "@/prompts/diy-vision-system-prompt";

export const dynamic = "force-dynamic";

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const body = await req.json();
  const {
    message = "",
    imageBase64,
    imageMimeType = "image/jpeg",
    skillLevel = "intermediate",
    history = [] as HistoryItem[],
  } = body;

  if (!String(message).trim() && !imageBase64) {
    return NextResponse.json({ error: "A message or image is required." }, { status: 400 });
  }

  // History carries text context from prior turns (no image blobs — too large)
  const historyMessages: ClaudeMessage[] = (history as HistoryItem[])
    .slice(-8)
    .map((h) => ({ role: h.role, content: h.content }));

  // Build current user content with optional image block
  const userContent: ClaudeContentBlock[] = [];

  if (imageBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMimeType as ClaudeImageMediaType,
        data: imageBase64,
      },
    });
  }

  userContent.push({
    type: "text",
    text: String(message).trim() || "Analyze the image above and provide your expert assessment.",
  });

  const messages: ClaudeMessage[] = [
    ...historyMessages,
    { role: "user", content: userContent },
  ];

  const skillContext = `User's self-identified skill level: ${skillLevel}. Calibrate vocabulary, depth, and assumed knowledge accordingly.`;

  try {
    const response = await askClaude({
      model: DIY_VISION_MODEL,
      maxTokens: DIY_VISION_MAX_TOKENS.fullAnalysis,
      system: `${DIY_VISION_SYSTEM_PROMPT}\n\n---\n\n${skillContext}`,
      messages,
    });

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "DIY Vision request failed." },
      { status: 502 }
    );
  }
}
