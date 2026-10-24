const businessConfig = require("../config/businessConfig");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const LEAD_TAG_START = "<<LEAD_JSON>>";
const LEAD_TAG_END = "<<END_LEAD_JSON>>";

function buildSystemPrompt() {
  const serviceLines = businessConfig.services
    .map((s) => `- ${s.name}: ${s.description}`)
    .join("\n");

  const faqLines = businessConfig.faq
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  return `LANGUAGE RULE:
Always communicate strictly in clear, professional, friendly English. Do not use Hindi, Hinglish, or any other language, regardless of what the user inputs. No translation or language conversion is required.

You are a ${businessConfig.role} for "${businessConfig.companyName}" (${businessConfig.businessType}).
You are speaking in a live voice web chat, so keep every reply concise (1-3 short sentences), natural, conversational, and easy to understand when spoken aloud. Never use markdown, asterisks, bullet points, or numbered lists in your replies.

Company phone: ${businessConfig.phone}
Company email: ${businessConfig.email}
Address: ${businessConfig.address}
Working hours: ${businessConfig.workingHours}

Services offered:
${serviceLines}

Frequently asked questions:
${faqLines}

Additional instructions:
${businessConfig.customInstructions}

Your job:
1. Greet the visitor and ask how you can assist them today.
2. Answer questions about services, approach, and contact details using only the verified information above.
3. If the visitor wants a quote, consultation, or callback, collect: their name, contact phone or email, and what they need built. Ask for one missing detail at a time.
4. Once you have their details, read them back briefly to confirm.
5. After confirmation, output the hidden lead JSON block:
${LEAD_TAG_START}{"name":"...","phone":"...","email":"...","message":"..."}${LEAD_TAG_END}
   Followed immediately by a short sentence assuring them our team will follow up shortly.
6. If asked about something outside your scope, politely provide the company phone or email.
7. Stay strictly in your role as an AI assistant.`;
}

/**
 * Calls Groq's free-tier LLM (OpenAI-compatible chat completions endpoint).
 * messages: array of { role: 'user' | 'assistant', content: string }
 */
async function getAIReply(messages) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      temperature: 0.3,
      max_tokens: 400,
      messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/**
 * Splits a raw AI reply into: what to actually SAY, and an optional parsed
 * lead object if the model emitted the hidden lead block.
 */
function extractLead(rawReply) {
  const startIdx = rawReply.indexOf(LEAD_TAG_START);
  const endIdx = rawReply.indexOf(LEAD_TAG_END);

  if (startIdx === -1 || endIdx === -1) {
    return { speech: rawReply, lead: null };
  }

  const jsonStr = rawReply.slice(startIdx + LEAD_TAG_START.length, endIdx).trim();
  const speech = (
    rawReply.slice(0, startIdx) + rawReply.slice(endIdx + LEAD_TAG_END.length)
  ).trim();

  let lead = null;
  try {
    lead = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[aiService] Failed to parse lead JSON:", e.message);
  }

  return {
    speech: speech || "Thank you! The Deific Digital team will get in touch with you shortly.",
    lead,
  };
}

module.exports = { getAIReply, extractLead, buildSystemPrompt };
