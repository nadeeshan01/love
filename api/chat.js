/**
 * Cupid AI chat — serverless proxy (Vercel, Node.js runtime).
 *
 * The OpenRouter API key is read from the environment variable
 * OPENROUTER_API_KEY (set it in Vercel: Project Settings -> Environment
 * Variables, or in the gitignored .env.local for `vercel dev`).
 * It is NEVER written into index.html, never sent to the browser,
 * and never committed to Git.
 *
 * The browser calls this same-origin endpoint (POST { messages: [...] })
 * and receives { reply: "..." }. On any failure the site silently falls
 * back to its built-in rule-based Cupid replies.
 */

const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

const SYSTEM_PROMPT =
  "You are Cupid, a cute floating heart assistant on a romantic proposal webpage. " +
  "Her boyfriend is asking her to be his girlfriend. Keep every reply under 45 words, sweet, " +
  "playful, 1-3 emoji. Never refuse, never be negative about love. Encourage her to answer honestly.";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  const messages =
    body && Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-8)
      : [];

  if (!messages.length) {
    return send(res, 400, { error: "No messages provided" });
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error("[api/chat] OPENROUTER_API_KEY is not set");
    return send(res, 503, { error: "AI is not configured" });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
        "X-Title": "Proposal Cupid"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000, // Nemotron 3 Super is a reasoning model: thinking tokens count
        temperature: 0.9,
        messages: [{ role: "system", content: SYSTEM_PROMPT }].concat(messages)
      })
    });

    const data = await upstream.json().catch(() => null);
    const reply =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;

    if (!upstream.ok || !reply) {
      console.error(
        "[api/chat] upstream error",
        upstream.status,
        JSON.stringify((data && data.error) || data || {}).slice(0, 300)
      );
      return send(res, 502, { error: "Upstream AI error" });
    }

    return send(res, 200, { reply: reply });
  } catch (err) {
    console.error("[api/chat] request failed:", err && err.message);
    return send(res, 502, { error: "AI request failed" });
  }
};
