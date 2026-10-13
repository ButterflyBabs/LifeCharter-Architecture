import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

// ONE door for every AI call in the Command Suite.
//
// Each account connects its own key in Settings → AI Assistant, and that key can be either an
// Anthropic (Claude) key or an OpenAI key. The provider is read from the key itself — Claude keys
// start with "sk-ant-" — so there is nothing else to configure: paste a Claude key and every AI
// feature runs on Claude; paste an OpenAI key and it runs on OpenAI.
//
// Callers keep writing OpenAI-style chat completions (messages, tools, response_format). For a Claude
// key this adapter translates the request to Claude's native Messages API and the answer back into the
// same shape, so no feature needs to know which AI is answering. The assistant's memory (conversation
// history, assessments, plans) lives in Supabase and is sent with every request, so it is identical
// on either provider.

export type AiProvider = "anthropic" | "openai";

export function providerForKey(key: string | null | undefined): AiProvider {
  return (key || "").trim().startsWith("sk-ant-") ? "anthropic" : "openai";
}

export const PROVIDER_LABEL: Record<AiProvider, string> = { anthropic: "Claude (Anthropic)", openai: "OpenAI" };

// Which Claude model stands in for each OpenAI model the app asks for. Fast/inexpensive by default,
// matching gpt-4o-mini's role; set CLAUDE_MODEL / CLAUDE_MODEL_LARGE on Vercel to change it everywhere.
function claudeModelFor(openAiModel: string): string {
  const small = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
  const large = process.env.CLAUDE_MODEL_LARGE || "claude-sonnet-5-5";
  if (openAiModel.startsWith("claude-")) return openAiModel;
  return /mini|nano/.test(openAiModel) ? small : /gpt-4|gpt-5|o\d/.test(openAiModel) ? large : small;
}

export interface AiClient {
  provider: AiProvider;
  chat: { completions: { create(params: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion> } };
}

export interface AiClientOptions {
  timeout?: number;
  maxRetries?: number;
}

export function aiClient(key: string, opts: AiClientOptions = {}): AiClient {
  if (providerForKey(key) === "openai") {
    const openai = new OpenAI({ apiKey: key, ...opts });
    return { provider: "openai", chat: { completions: { create: (p) => openai.chat.completions.create(p) } } };
  }
  return new ClaudeChat(key.trim(), opts);
}

// ---------------------------------------------------------------------------------------------------
// Claude adapter

type Block = Anthropic.Messages.ContentBlockParam;

const JSON_ONLY = "Respond with only one valid JSON object — no prose before or after it, and no code fences.";

class ClaudeChat implements AiClient {
  provider = "anthropic" as const;
  private client: Anthropic;
  // Claude may think before calling a tool; those thinking blocks have to go back unchanged with the tool
  // call on the next round of a tool loop. Callers only hand back the OpenAI-shaped tool_calls, so the
  // original blocks are kept here (one client per request) and restored by tool-call id.
  private turns = new Map<string, Anthropic.Messages.ContentBlock[]>();

  constructor(key: string, opts: AiClientOptions) {
    this.client = new Anthropic({ apiKey: key, timeout: opts.timeout, maxRetries: opts.maxRetries });
  }

  chat = { completions: { create: (p: ChatCompletionCreateParamsNonStreaming) => this.create(p) } };

  private async create(p: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion> {
    const wantsJson = !!p.response_format && p.response_format.type !== "text";
    const { system, messages } = this.toClaude(p.messages);
    const sys = [system, wantsJson ? JSON_ONLY : ""].filter(Boolean).join("\n\n");
    const requested = p.max_completion_tokens ?? p.max_tokens ?? 1024;
    const tools = (p.tools ?? [])
      .filter((t): t is Extract<typeof t, { type: "function" }> => t.type === "function")
      .map((t) => ({
        name: t.function.name,
        description: t.function.description ?? "",
        input_schema: (t.function.parameters ?? { type: "object", properties: {} }) as Anthropic.Messages.Tool.InputSchema,
      }));
    const toolChoice = p.tool_choice === "none" ? { type: "none" as const } : { type: "auto" as const };
    const stop = typeof p.stop === "string" ? [p.stop] : Array.isArray(p.stop) ? p.stop : undefined;

    const res = await this.client.messages.create({
      model: claudeModelFor(String(p.model || "")),
      // Room for Claude's thinking on top of the answer length the feature asked for; the prompt still sets the length.
      max_tokens: Math.max(requested, 1024) + 4096,
      ...(sys ? { system: sys } : {}),
      messages,
      ...(tools.length ? { tools, tool_choice: toolChoice } : {}),
      ...(stop?.length ? { stop_sequences: stop } : {}),
      // Temperature and top_p are left to Claude's defaults (current models reject custom values).
    });

    let text = res.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (wantsJson) text = extractJson(text);

    const calls: ChatCompletionMessageToolCall[] = res.content
      .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } }));
    for (const c of calls) this.turns.set(c.id, res.content);

    const finish = res.stop_reason === "tool_use" ? "tool_calls" : res.stop_reason === "max_tokens" ? "length" : "stop";
    return {
      id: res.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: res.model,
      choices: [
        {
          index: 0,
          finish_reason: finish,
          logprobs: null,
          message: { role: "assistant", content: text || (calls.length ? null : ""), refusal: null, ...(calls.length ? { tool_calls: calls } : {}) },
        },
      ],
      usage: {
        prompt_tokens: res.usage.input_tokens,
        completion_tokens: res.usage.output_tokens,
        total_tokens: res.usage.input_tokens + res.usage.output_tokens,
      },
    } as ChatCompletion;
  }

  // OpenAI chat messages → Claude system prompt + alternating user/assistant turns.
  private toClaude(input: ChatCompletionMessageParam[]): { system: string; messages: Anthropic.Messages.MessageParam[] } {
    const system: string[] = [];
    const out: { role: "user" | "assistant"; content: Block[] }[] = [];
    const push = (role: "user" | "assistant", blocks: Block[]) => {
      if (!blocks.length) return;
      const last = out[out.length - 1];
      if (last && last.role === role) last.content.push(...blocks);
      else out.push({ role, content: [...blocks] });
    };

    for (const m of input) {
      if (m.role === "system" || m.role === "developer") {
        const t = textOf(m.content);
        if (t) system.push(t);
      } else if (m.role === "user") {
        push("user", userBlocks(m.content));
      } else if (m.role === "assistant") {
        const calls = (m.tool_calls ?? []).filter((c) => c.type === "function");
        const kept = calls.length ? this.turns.get(calls[0].id) : undefined;
        if (kept) {
          push("assistant", kept as unknown as Block[]);
          continue;
        }
        const blocks: Block[] = [];
        const t = textOf(m.content);
        if (t) blocks.push({ type: "text", text: t });
        for (const c of calls) {
          blocks.push({ type: "tool_use", id: c.id, name: c.function.name, input: safeParse(c.function.arguments) });
        }
        push("assistant", blocks);
      } else if (m.role === "tool") {
        push("user", [{ type: "tool_result", tool_use_id: m.tool_call_id, content: textOf(m.content) || "(empty)" }]);
      }
    }

    // Claude's conversation must open with the person speaking.
    if (out.length && out[0].role !== "user") out.unshift({ role: "user", content: [{ type: "text", text: "(continuing our conversation)" }] });
    if (!out.length) out.push({ role: "user", content: [{ type: "text", text: "Go ahead." }] });
    return { system: system.join("\n\n"), messages: out };
  }
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && "text" in p && typeof (p as { text: unknown }).text === "string" ? (p as { text: string }).text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function userBlocks(content: unknown): Block[] {
  if (typeof content === "string") return content.trim() ? [{ type: "text", text: content }] : [];
  if (!Array.isArray(content)) return [];
  const blocks: Block[] = [];
  for (const part of content as { type: string; text?: string; image_url?: { url: string } }[]) {
    if (part.type === "text" && part.text?.trim()) blocks.push({ type: "text", text: part.text });
    if (part.type === "image_url" && part.image_url?.url) {
      const url = part.image_url.url;
      const data = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(url);
      if (data) blocks.push({ type: "image", source: { type: "base64", media_type: data[1] as "image/png", data: data[2] } });
      else blocks.push({ type: "image", source: { type: "url", url } });
    }
  }
  return blocks;
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

// The features that ask for JSON parse the reply directly, so hand them just the object.
export function extractJson(text: string): string {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (t.startsWith("{") || t.startsWith("[")) return t;
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  return start >= 0 && end > start ? t.slice(start, end + 1) : t;
}
