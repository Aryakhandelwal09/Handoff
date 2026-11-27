const { SYSTEM_PROMPT, buildUserMessage } = require("./geminiClient");

/**
 * Same schema, same prompt, different provider — OpenRouter proxies many
 * models behind one OpenAI-compatible chat completions API, so switching
 * which underlying model this uses later is just a string change here,
 * not a new integration.
 */
async function analyzeWithOpenRouter(repoName, tree, files) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Server is missing OPENROUTER_API_KEY — set it in .env.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      // Free-tier model — check openrouter.ai/models if this stops working,
      // free model availability on OpenRouter changes over time.
      model: "meta-llama/llama-3.3-70b-instruct:free",
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(repoName, tree, files) }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error("Analysis failed — OpenRouter's response could not be parsed as JSON.");
  }
}

module.exports = { analyzeWithOpenRouter };