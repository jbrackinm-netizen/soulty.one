"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Hammer,
  Send,
  Upload,
  X,
  Loader2,
  HardHat,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

type SkillLevel = "beginner" | "intermediate" | "experienced" | "professional";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner",      label: "Beginner"      },
  { value: "intermediate",  label: "Intermediate"  },
  { value: "experienced",   label: "Experienced"   },
  { value: "professional",  label: "Pro"            },
];

// ── Inline markdown renderer ──────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="font-mono text-xs bg-gray-100 rounded px-1 py-0.5 text-gray-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  const bulletBuf: string[] = [];
  const numBuf: string[] = [];
  let k = 0;

  const flushBullets = () => {
    if (!bulletBuf.length) return;
    elements.push(
      <ul key={k++} className="list-disc pl-5 space-y-1 my-2">
        {bulletBuf.map((b, i) => (
          <li key={i} className="text-sm text-gray-800 leading-relaxed">
            {renderInline(b)}
          </li>
        ))}
      </ul>
    );
    bulletBuf.length = 0;
  };

  const flushNums = () => {
    if (!numBuf.length) return;
    elements.push(
      <ol key={k++} className="list-decimal pl-5 space-y-1 my-2">
        {numBuf.map((n, i) => (
          <li key={i} className="text-sm text-gray-800 leading-relaxed">
            {renderInline(n)}
          </li>
        ))}
      </ol>
    );
    numBuf.length = 0;
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushBullets(); flushNums();
      elements.push(
        <h2 key={k++} className="font-bold text-sm text-gray-900 mt-4 mb-1.5 pb-1 border-b border-gray-100">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushBullets(); flushNums();
      elements.push(
        <h3 key={k++} className="font-semibold text-sm text-gray-800 mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (/^[-*] /.test(line)) {
      flushNums();
      bulletBuf.push(line.slice(2));
    } else if (/^\d+\. /.test(line)) {
      flushBullets();
      numBuf.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim() === "---") {
      flushBullets(); flushNums();
      elements.push(<hr key={k++} className="border-gray-100 my-3" />);
    } else if (line.startsWith("[STOP")) {
      flushBullets(); flushNums();
      elements.push(
        <div key={k++} className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 my-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <span className="text-sm font-semibold text-red-700">{line}</span>
        </div>
      );
    } else if (line.startsWith("[CODE ISSUE]")) {
      flushBullets(); flushNums();
      elements.push(
        <div key={k++} className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 my-2">
          {line}
        </div>
      );
    } else if (line.startsWith("[CAUTION]")) {
      flushBullets(); flushNums();
      elements.push(
        <div key={k++} className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 my-2">
          {line}
        </div>
      );
    } else if (line.startsWith("[NOTE]")) {
      flushBullets(); flushNums();
      elements.push(
        <div key={k++} className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700 my-2">
          {line}
        </div>
      );
    } else if (line === "") {
      flushBullets(); flushNums();
      if (elements.length) elements.push(<div key={k++} className="h-1.5" />);
    } else {
      flushBullets(); flushNums();
      elements.push(
        <p key={k++} className="text-sm text-gray-800 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushBullets();
  flushNums();

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function DiyVisionClient() {
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [input, setInput]                 = useState("");
  const [skillLevel, setSkillLevel]       = useState<SkillLevel>("intermediate");
  const [pendingImage, setPendingImage]   = useState<{ base64: string; url: string; mimeType: string } | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const idCounter      = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64  = dataUrl.split(",")[1];
      setPendingImage({ base64, url: dataUrl, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function submit() {
    if (loading) return;
    const text = input.trim();
    if (!text && !pendingImage) return;

    setError(null);

    const userMsg: ChatMessage = {
      id:       idCounter.current++,
      role:     "user",
      content:  text || "(image submitted for analysis)",
      imageUrl: pendingImage?.url,
    };

    const history = messages
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const img = pendingImage;
    setPendingImage(null);
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/diy-vision", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:       text,
          imageBase64:   img?.base64,
          imageMimeType: img?.mimeType,
          skillLevel,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: idCounter.current++, role: "assistant", content: data.response },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem - 3rem)" }}>

      {/* Banner */}
      <div className="rounded-xl bg-amber-600 px-6 py-5 text-white mb-4 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Hammer className="h-5 w-5 text-amber-200" />
          <h2 className="font-bold text-lg">DIY Vision</h2>
        </div>
        <p className="text-amber-100 text-sm">
          Upload a photo of your project, site, damage, or materials — or just ask.
          Expert structural, code, materials, tools, and safety analysis.
        </p>
      </div>

      {/* Skill level + clear */}
      <div className="flex items-center gap-2 mb-4 shrink-0 flex-wrap">
        <span className="text-xs font-medium text-gray-500">Skill level:</span>
        {SKILL_LEVELS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSkillLevel(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              skillLevel === value
                ? "bg-amber-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(null); }}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear conversation
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 pr-1">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 mb-3">
              <HardHat className="h-7 w-7 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Start with a photo or a question</p>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Upload a site photo, describe what you&apos;re building, or ask about materials,
              tools, code compliance, or structural issues.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm w-full">
              {[
                "What's the load capacity of a 2×10 joist spanning 14 ft?",
                "Is this concrete crack structural or cosmetic?",
                "What type of fastener do I need for pressure-treated lumber?",
                "Walk me through framing a non-load-bearing wall.",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="text-left rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-amber-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] space-y-1.5">
                {msg.imageUrl && (
                  <div className="flex justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      className="max-h-48 max-w-xs rounded-xl border border-amber-200 shadow-sm object-contain"
                    />
                  </div>
                )}
                {msg.content !== "(image submitted for analysis)" && (
                  <div className="rounded-2xl rounded-tr-sm bg-amber-600 px-4 py-2.5 text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm px-5 py-4">
                {renderMarkdown(msg.content)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span className="text-sm text-gray-500">Analyzing…</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {pendingImage && (
          <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.url}
              alt="Preview"
              className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0"
            />
            <p className="flex-1 text-xs text-gray-500">Image ready — add a question or just send</p>
            <button
              onClick={() => setPendingImage(null)}
              className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload image (or drag & drop)"
            className={`shrink-0 flex items-center justify-center h-9 w-9 rounded-lg border transition-colors ${
              pendingImage
                ? "border-amber-300 text-amber-500 bg-amber-50"
                : "border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            {pendingImage ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pendingImage
                ? "Add a question about this image… (Enter to send)"
                : "Describe your project, ask a question, or drop a photo… (Enter to send)"
            }
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent leading-relaxed"
            style={{ minHeight: "36px", maxHeight: "128px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />

          <button
            onClick={submit}
            disabled={loading || (!input.trim() && !pendingImage)}
            title="Send (Enter)"
            className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <p className="text-center text-xs text-gray-400 mt-2 shrink-0">
        DIY Vision · Claude Opus · Not a substitute for licensed professionals
      </p>
    </div>
  );
}
