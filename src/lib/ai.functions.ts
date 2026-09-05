import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { callAI, extractJson } from "./ai.server";

const BASE_SYSTEM =
  "You are a workplace productivity assistant for professionals. Write clearly, concisely and in a business-appropriate register. Never invent facts, names, dates or figures that were not supplied by the user.";

/* ---------------------------------- email --------------------------------- */

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        recipient: z.string().min(1).max(2000),
        keyPoints: z.string().min(1).max(4000),
        tone: z.enum(["Formal", "Friendly", "Persuasive", "Apologetic"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const text = await callAI([
      { role: "system", content: BASE_SYSTEM },
      {
        role: "user",
        content: `Write a complete email in a ${data.tone.toLowerCase()} tone.

Recipient context:
${data.recipient}

Key points that must be covered:
${data.keyPoints}

Return only the email itself: a "Subject:" line, then a blank line, then the body with a sign-off placeholder [Your name]. No commentary, no markdown fences.`,
      },
    ]);
    return { text };
  });

/* ---------------------------------- notes --------------------------------- */

export const summariseNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ transcript: z.string().min(20).max(40000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const raw = await callAI([
      { role: "system", content: BASE_SYSTEM },
      {
        role: "user",
        content: `Summarise this meeting transcript.

Return ONLY valid JSON with this exact shape:
{"summary": "2-4 sentence executive summary", "decisions": ["decision", ...], "actions": [{"task": "...", "owner": "name or Unassigned", "due": "date or Not set"}]}

Transcript:
${data.transcript}`,
      },
    ]);
    return extractJson<{
      summary: string;
      decisions: string[];
      actions: Array<{ task: string; owner: string; due: string }>;
    }>(raw);
  });

/* --------------------------------- planner -------------------------------- */

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ braindump: z.string().min(5).max(20000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const raw = await callAI([
      { role: "system", content: BASE_SYSTEM },
      {
        role: "user",
        content: `Organise this chaotic list of weekly work tasks using the Eisenhower matrix.

Return ONLY valid JSON with this exact shape:
{"tasks": [{"title": "...", "quadrant": "do" | "schedule" | "delegate" | "eliminate", "day": "Monday".."Friday", "estimate": "e.g. 45 min", "why": "one short sentence"}]}

"do" = urgent + important, "schedule" = important not urgent, "delegate" = urgent not important, "eliminate" = neither.
Spread the work sensibly across the week. Keep titles short and actionable.

Tasks:
${data.braindump}`,
      },
    ]);
    return extractJson<{
      tasks: Array<{
        title: string;
        quadrant: "do" | "schedule" | "delegate" | "eliminate";
        day: string;
        estimate: string;
        why: string;
      }>;
    }>(raw);
  });

/* ---------------------------------- chat ---------------------------------- */

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(8000),
            }),
          )
          .min(1)
          .max(60),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const text = await callAI([
      {
        role: "system",
        content: `${BASE_SYSTEM} You are the in-app assistant of a workplace productivity suite. Answer with short paragraphs or tight bullet lists. Remind the user to verify anything consequential.`,
      },
      ...data.messages,
    ]);
    return { text };
  });
