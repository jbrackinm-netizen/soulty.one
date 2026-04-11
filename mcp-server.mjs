#!/usr/bin/env node
/**
 * SoulT MCP Proxy Server
 *
 * Bridges Claude Code (or any MCP client) to the upstream SoulT operator
 * MCP server running at SOULTY_API_URL.
 *
 * The upstream speaks the standard MCP SSE protocol:
 *   GET  /sse          → opens the server-sent event stream
 *   POST /message?sessionId=<id>  → sends a JSON-RPC message
 *
 * This proxy listens locally on PORT and transparently forwards both
 * directions, so Claude Code can point at http://localhost:<PORT>/sse
 * while all actual MCP work happens on the remote server.
 *
 * Usage:
 *   PORT=3100 SOULTY_API_URL=https://Soultyoperator.replit.app/sse npm run mcp
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3100", 10);
const SOULTY_API_URL = process.env.SOULTY_API_URL;

if (!SOULTY_API_URL) {
  console.error("[mcp] Fatal: SOULTY_API_URL environment variable is required");
  process.exit(1);
}

const upstream = new URL(SOULTY_API_URL);
const upstreamLib = upstream.protocol === "https:" ? https : http;
const upstreamPort = upstream.port
  ? parseInt(upstream.port, 10)
  : upstream.protocol === "https:"
    ? 443
    : 80;

// ── Helpers ───────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function upstreamRequest(path, method, extraHeaders = {}) {
  return {
    hostname: upstream.hostname,
    port: upstreamPort,
    path,
    method,
    headers: extraHeaders,
  };
}

// ── SSE proxy ─────────────────────────────────────────────────────────────────
// Opens a persistent SSE connection to the upstream server and pipes the event
// stream back to the local client verbatim.  Because the upstream sends a
// *relative* endpoint URL (e.g. /message?sessionId=abc), the MCP client will
// POST to our local proxy, which we then forward to the upstream (see below).

function proxySSE(req, res) {
  const opts = upstreamRequest(
    upstream.pathname + upstream.search,
    "GET",
    {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    }
  );

  console.log(`[mcp] New SSE connection → ${SOULTY_API_URL}`);

  const upstreamReq = upstreamLib.request(opts, (upstreamRes) => {
    if (upstreamRes.statusCode !== 200) {
      console.error(`[mcp] Upstream SSE responded ${upstreamRes.statusCode}`);
      if (!res.headersSent) res.writeHead(upstreamRes.statusCode ?? 502);
      res.end();
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...corsHeaders(),
    });

    // Pipe the raw SSE byte stream – no parsing needed since we forward as-is.
    upstreamRes.pipe(res, { end: true });

    upstreamRes.on("error", (err) => {
      console.error("[mcp] Upstream SSE stream error:", err.message);
      res.end();
    });
  });

  upstreamReq.on("error", (err) => {
    console.error("[mcp] Could not reach upstream SSE:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("Upstream unreachable");
  });

  upstreamReq.end();

  // Clean up the upstream connection when the client disconnects.
  req.on("close", () => {
    console.log("[mcp] Client disconnected — closing upstream SSE");
    upstreamReq.destroy();
  });
}

// ── Message proxy ─────────────────────────────────────────────────────────────
// Forwards POST /message?sessionId=<id> bodies to the upstream, preserving the
// session ID so the upstream can route the message to the correct SSE channel.

function proxyMessage(req, res, url) {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const upstreamPath = "/message" + (url.search || "");
    const opts = upstreamRequest(upstreamPath, "POST", {
      "Content-Type": "application/json",
      "Content-Length": String(body.length),
    });

    const upstreamReq = upstreamLib.request(opts, (upstreamRes) => {
      const statusCode = upstreamRes.statusCode ?? 200;
      const headers = { ...corsHeaders() };
      if (upstreamRes.headers["content-type"]) {
        headers["Content-Type"] = upstreamRes.headers["content-type"];
      }
      res.writeHead(statusCode, headers);
      upstreamRes.pipe(res, { end: true });
    });

    upstreamReq.on("error", (err) => {
      console.error("[mcp] Message forward error:", err.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain" });
      }
      res.end("Message forwarding failed");
    });

    upstreamReq.write(body);
    upstreamReq.end();
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/sse") {
    proxySSE(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/message") {
    proxyMessage(req, res, url);
    return;
  }

  // Health check / discovery
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json", ...corsHeaders() });
    res.end(
      JSON.stringify({
        name: "soulty-mcp-proxy",
        version: "1.0.0",
        upstream: SOULTY_API_URL,
        endpoints: { sse: "/sse", message: "/message" },
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.on("error", (err) => {
  console.error("[mcp] Server error:", err.message);
});

server.listen(PORT, () => {
  console.log("");
  console.log("  SoulT MCP Proxy");
  console.log("  ───────────────────────────────────────");
  console.log(`  Local SSE endpoint : http://localhost:${PORT}/sse`);
  console.log(`  Upstream           : ${SOULTY_API_URL}`);
  console.log("");
  console.log("  Add to .claude/settings.json:");
  console.log("  {");
  console.log('    "mcpServers": {');
  console.log('      "soulty": {');
  console.log('        "type": "sse",');
  console.log(`        "url": "http://localhost:${PORT}/sse"`);
  console.log("      }");
  console.log("    }");
  console.log("  }");
  console.log("");
});
