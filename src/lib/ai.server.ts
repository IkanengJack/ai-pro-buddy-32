const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export class AIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function callAI(messages: AIMessage[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AIError(500, "AI is not configured for this app.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.error?.message ?? parsed?.message ?? text;
    } catch {
      /* keep raw text */
    }
    if (res.status === 429)
      throw new AIError(429, "The assistant is busy right now. Please try again in a moment.");
    if (res.status === 402)
      throw new AIError(402, message || "AI credits have run out. Please top up to continue.");
    if (res.status === 403)
      throw new AIError(403, message || "AI access is currently blocked for this workspace.");
    throw new AIError(res.status, message || "The assistant could not complete this request.");
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  const slice = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(slice) as T;
}
