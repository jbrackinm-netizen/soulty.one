/**
 * SoulT Council MCP Server
 *
 * Exposes the soulty.one council platform as MCP tools so ChatGPT,
 * Claude Desktop, and any other MCP-compatible client can interact
 * with real council data.
 *
 * Usage:
 *   npm run mcp                           # local (port 3100)
 *   PORT=8080 SOULTY_API_URL=https://council.soulty.one npm run mcp
 *
 * SSE endpoint:  http://localhost:<PORT>/sse
 * Messages POST: http://localhost:<PORT>/messages?sessionId=<id>
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import * as http from "http";
import * as url from "url";

// ─── Config ────────────────────────────────────────────────────────────────
const SOULTY_API = (process.env.SOULTY_API_URL ?? "https://council.soulty.one").replace(/\/$/, "");
const PORT = Number(process.env.PORT ?? 3100);

// ─── MCP Server ────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "soulty-council",
  version: "1.0.0",
});

// Helper: fetch from the soulty.one REST API
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${SOULTY_API}${path}`, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`soulty.one API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Tool: get_council_members ─────────────────────────────────────────────
server.tool(
  "get_council_members",
  "Returns the current SoulT Council projects (the active domains the council governs). Each project acts as a council seat.",
  {},
  async () => {
    const projects = await apiFetch("/api/projects");

    const summary = projects
      .map((p: any) =>
        `• [${p.id}] ${p.name} — ${p.status} (${p.progress ?? 0}% complete)` +
        (p.description ? `\n  ${p.description}` : "")
      )
      .join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: projects.length === 0
            ? "No council projects found."
            : `SoulT Council — ${projects.length} active seat(s):\n\n${summary}`,
        },
      ],
    };
  }
);

// ─── Tool: submit_to_council ───────────────────────────────────────────────
server.tool(
  "submit_to_council",
  "Submit a proposal, question, or petition to the SoulT AI Council for review and deliberation.",
  {
    proposal_text: z
      .string()
      .min(10)
      .describe("The full text of the proposal or question to submit"),
    project_id: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Optional — associate with a specific council project by ID"),
  },
  async ({ proposal_text, project_id }) => {
    const title =
      proposal_text.length > 120
        ? proposal_text.slice(0, 117).trimEnd() + "..."
        : proposal_text;

    const body: Record<string, unknown> = {
      title,
      content: proposal_text,
      status: "open",
    };
    if (project_id) body.projectId = project_id;

    const result = await apiFetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: [
            "Proposal submitted to the SoulT Council.",
            `  ID     : ${result.id}`,
            `  Title  : "${result.title}"`,
            `  Status : ${result.status}`,
            `  Project: ${result.projectId ?? "none"}`,
            "",
            "The council will deliberate and record a response.",
          ].join("\n"),
        },
      ],
    };
  }
);

// ─── Tool: list_open_questions ─────────────────────────────────────────────
server.tool(
  "list_open_questions",
  "List all open proposals and questions currently before the SoulT Council.",
  {},
  async () => {
    const questions = await apiFetch("/api/questions");
    const open = questions.filter(
      (q: any) => q.status === "open" || q.status === "in_progress" || q.status === "reviewing"
    );

    if (open.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No open questions before the council." }],
      };
    }

    const lines = open.map(
      (q: any) =>
        `[${q.id}] ${q.title} (${q.status})` +
        (q.content && q.content !== q.title ? `\n  ${q.content.slice(0, 200)}` : "")
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `${open.length} open question(s) before the council:\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ─── Tool: get_recent_decisions ────────────────────────────────────────────
server.tool(
  "get_recent_decisions",
  "Retrieve recent meeting decisions and next steps from the SoulT Council.",
  {
    limit: z
      .number()
      .int()
      .positive()
      .max(20)
      .default(5)
      .describe("Number of recent meetings to return (default 5, max 20)"),
  },
  async ({ limit }) => {
    const meetings = await apiFetch("/api/meetings");
    const recent = meetings.slice(0, limit);

    if (recent.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No meeting records found." }],
      };
    }

    const lines = recent.map((m: any) => {
      const decisions = m.decisions
        ? (JSON.parse(m.decisions) as string[]).map((d) => `  - ${d}`).join("\n")
        : "  (none recorded)";
      const nextSteps = m.nextSteps
        ? (JSON.parse(m.nextSteps) as string[]).map((s) => `  → ${s}`).join("\n")
        : "";
      return [
        `## ${m.title} (${m.date ?? "undated"})`,
        m.summary ? `Summary: ${m.summary}` : "",
        `Decisions:\n${decisions}`,
        nextSteps ? `Next steps:\n${nextSteps}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });

    return {
      content: [
        {
          type: "text" as const,
          text: lines.join("\n\n---\n\n"),
        },
      ],
    };
  }
);

// ─── SSE Transport & HTTP Server ───────────────────────────────────────────
const transports = new Map<string, SSEServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url ?? "/", true);
  const pathname = parsed.pathname ?? "/";

  try {
    // Health / info
    if (req.method === "GET" && pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(
        [
          "SoulT Council MCP Server",
          `Version  : 1.0.0`,
          `API base : ${SOULTY_API}`,
          `SSE      : /sse`,
          `Messages : POST /messages?sessionId=<id>`,
          "",
          "Tools: get_council_members, submit_to_council, list_open_questions, get_recent_decisions",
        ].join("\n")
      );
      return;
    }

    // SSE connection
    if (req.method === "GET" && pathname === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);

      res.on("close", () => {
        transports.delete(transport.sessionId);
      });

      await server.connect(transport);
      return;
    }

    // Message handler
    if (req.method === "POST" && pathname === "/messages") {
      const sessionId = parsed.query["sessionId"] as string | undefined;
      if (!sessionId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing sessionId query parameter" }));
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }

      await transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error("[MCP] Request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`\nSoulT Council MCP Server`);
  console.log(`  SSE endpoint : http://localhost:${PORT}/sse`);
  console.log(`  API base     : ${SOULTY_API}`);
  console.log(`  Tools        : get_council_members, submit_to_council, list_open_questions, get_recent_decisions\n`);
});
