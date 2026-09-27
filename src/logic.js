// QVAC Team Retro Question Generator — core logic.
// Given a team/sprint context, generates 4-5 real retrospective discussion
// questions. The count requirement (4-5) is enforced deterministically in
// code, not left to the model's prompt-following alone.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 3) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have",
    "i'm sorry", "i am sorry", "please provide more", "please try again",
    "i'd be happy to help", "could you provide", "can you provide",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function parseQuestions(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const questions = [];
  for (const line of lines) {
    const match = line.match(/^(?:\d+[.)]|-|\*)\s*(.+)$/);
    if (match) {
      let q = match[1].trim();
      q = q.replace(/^["“]|["”]$/g, "").trim();
      if (q.length > 2) questions.push(q);
    }
  }
  // Fallback: if the model didn't use list formatting at all, split on
  // question marks as a last resort.
  if (questions.length === 0) {
    const bySentence = text
      .split(/(?<=\?)\s+/)
      .map((s) => s.trim().replace(/^(?:\d+[.)]|-|\*)\s*/, "")) // strip any stray leading bullet/number
      .filter((s) => s.length > 5);
    questions.push(...bySentence);
  }
  return questions;
}

const GENERIC_FILLERS = (context) => [
  `What's one thing from this sprint's work on "${context}" that we should keep doing?`,
  `What slowed us down this sprint, and what's one concrete change we could try next time?`,
  `Was there a moment this sprint where communication broke down — what happened?`,
  `What's one thing we learned about "${context}" that we didn't expect going in?`,
  `Is there anything blocking us right now that we haven't said out loud yet?`,
];

export async function generate(modelId, context) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write sprint retrospective discussion questions for agile teams. Given the team/sprint context, write 5 real, specific discussion questions grounded in that context — not generic filler like 'what went well?' with nothing else attached. " +
          "Reply as a numbered list 1-5, one question per line, nothing else.",
      },
      { role: "user", content: "Context: a 4-person team just shipped a rushed migration to a new database with two production incidents along the way" },
      {
        role: "assistant",
        content:
          "1. What early warning signs did we see before the two production incidents, and did we act on them?\n" +
          "2. Was the migration timeline realistic, or were we set up to rush from the start?\n" +
          "3. How did the team communicate during the incidents — what worked and what didn't?\n" +
          "4. What would we do differently if we had to migrate another database next sprint?\n" +
          "5. Did anyone feel unable to raise a concern about the timeline before it became a problem?",
      },
      { role: "user", content: `Context: ${context}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.7, maxTokens: 400 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  let questions = looksUnusable(text) ? [] : parseQuestions(text);

  // Deterministically enforce the 4-5 count requirement rather than trusting
  // the prompt alone — pad with context-grounded fillers if short.
  const fillers = GENERIC_FILLERS(context);
  let fillerIdx = 0;
  while (questions.length < 4 && fillerIdx < fillers.length) {
    const candidate = fillers[fillerIdx++];
    if (!questions.includes(candidate)) questions.push(candidate);
  }
  if (questions.length > 5) questions = questions.slice(0, 5);

  return { questions };
}
