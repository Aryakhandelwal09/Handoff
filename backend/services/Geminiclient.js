const SYSTEM_PROMPT = `You are helping a developer create an onboarding guide for a codebase, so a new teammate can get up to speed quickly.

You will be given a repository's file tree and the contents of its most important files. Analyze the code and respond with ONLY a JSON object — no preamble, no markdown code fences, no explanation outside the JSON.

The JSON must match this exact shape:

{
  "summary": "2-3 sentence plain-English overview of what this project does and how it's structured",
  "nodes": [
    {
      "id": "short-unique-slug",
      "name": "display file name, e.g. server.js",
      "path": "full path from repo root, e.g. /server.js",
      "category": "one of: entry | core | data | config",
      "role": ["one or more of: fullstack, frontend, backend, pm"],
      "readingOrderStep": <integer 1-8, or null if not part of the core onboarding path>,
      "connections": ["ids of other nodes this file directly depends on or is closely related to"],
      "explanation": "2-4 sentence plain-English explanation of what this file does and why a newcomer should care",
      "flags": ["short warning strings, e.g. 'no comments — ask a teammate'. Empty array if none."]
    }
  ],
  "checklist": [
    {
      "text": "a concrete, actionable onboarding step",
      "warning": "optional short caution note, omit this field entirely if there is none"
    }
  ]
}

Rules:
- Select at most 15 files for "nodes" — the most important ones for understanding the project.
- Assign "readingOrderStep" only to files in the core suggested reading path (typically 5-8 files). Leave it null otherwise.
- "role" should reflect who actually needs to understand this file.
- "connections" should only list direct, meaningful relationships.
- Flag files with "flags" when they have no comments, look risky to modify, or are unusually dense.
- The checklist should have 4-6 items, ordered logically.
- Respond with valid JSON only. Do not wrap it in \`\`\`json or any other text.`;

function buildUserMessage(repoName, tree, files) {
  const treeText = tree.slice(0, 300).join("\n");
  const filesText = files
    .map(f => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return `Repository: ${repoName}

File tree:
${treeText}

Contents of key files:
${filesText}`;
}

/**
 * Calls the Gemini API and returns the parsed schema object.
 */
async function analyzeWithGemini(repoName, tree, files) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Server is missing GEMINI_API_KEY — set it in .env.");
  }

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        { role: "user", parts: [{ text: buildUserMessage(repoName, tree, files) }] }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4000,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error("Analysis failed — the model response could not be parsed as JSON.");
  }
}

/**
 * Regenerates just the summary at a different length/technical level.
 * Deliberately does NOT re-fetch repo files — reuses the node explanations
 * already produced by the first analysis as context, so this stays a small,
 * cheap request instead of a full re-analysis.
 */
async function personalizeSummary(repoName, baseSummary, nodes, length, technicalLevel) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Server is missing GEMINI_API_KEY — set it in .env.");
  }

  const nodesContext = nodes
    .map(n => `- ${n.name}: ${n.explanation}`)
    .join("\n");

  const lengthInstruction = length === "detailed"
    ? "Write a full paragraph (4-6 sentences)."
    : "Write 1-2 sentences only — the gist, nothing more.";
  const levelInstruction = technicalLevel === "technical"
    ? "Use precise technical terminology (frameworks, patterns, architecture terms) — assume the reader is an experienced developer."
    : "Use plain, jargon-free English — assume the reader is new to this kind of project.";

  const prompt = `Repository: ${repoName}

Existing summary: ${baseSummary}

Key files and what they do:
${nodesContext}

Rewrite the summary above to match these requirements:
${lengthInstruction}
${levelInstruction}

Respond with ONLY the rewritten summary text — no preamble, no quotes, no JSON, just the plain text.`;

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Personalized summary came back empty — try again.");
  return text;
}

/**
 * Sends a prompt and returns the parsed JSON object. Used by the error explainer.
 */
async function askGeminiJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Server is missing GEMINI_API_KEY — set it in .env.");
  }

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error("The error explanation could not be parsed as JSON.");
  }
}

module.exports = { analyzeWithGemini, personalizeSummary, askGeminiJSON, buildUserMessage, SYSTEM_PROMPT };