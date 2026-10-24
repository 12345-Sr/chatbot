/**
 * Server-side text-to-speech for Deific Digital AI Receptionist.
 * Strictly English voice, no translation or language conversion required.
 *
 * Provider order:
 *  1. ElevenLabs (ultra-realistic neural voice) — used if ELEVENLABS_API_KEY is set.
 *  2. Azure Speech (en-IN / en-US) — used if AZURE_SPEECH_KEY is set.
 *  3. Edge TTS (en-IN-NeerjaNeural).
 */

const VOICE_EN = process.env.TTS_VOICE_EN || "en-IN-NeerjaNeural";

const cache = new Map();
const CACHE_MAX = 100;

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function azureSynthesize(text, voice) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const ssml =
    `<speak version='1.0' xml:lang='en-US'>` +
    `<voice xml:lang='en-US' name='${voice}'>${escapeXml(text)}</voice></speak>`;

  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "deific-digital-receptionist",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function edgeSynthesize(text, voice) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const result = await tts.toStream(text);
  const stream = result && result.audioStream ? result.audioStream : result;

  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const audio = Buffer.concat(chunks);
  if (!audio.length) throw new Error("Edge TTS returned empty audio");
  return audio;
}

async function elevenLabsSynthesize(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const voiceId = process.env.ELEVENLABS_VOICE_EN || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
  const modelId = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * @param {string} text  what to speak in English
 * @returns {Promise<{audio: Buffer, voice: string}>}
 */
async function synthesize(text) {
  const voice = VOICE_EN;
  const cacheKey = `en|${text}`;

  if (cache.has(cacheKey)) return { audio: cache.get(cacheKey), voice: "cache" };

  let audio;
  let voiceName = voice;

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      audio = await elevenLabsSynthesize(text);
      voiceName = "ElevenLabs-English";
    } catch (e) {
      console.warn("[ttsService] ElevenLabs failed, trying fallbacks:", e.message);
    }
  }

  if (!audio && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
    try {
      audio = await azureSynthesize(text, voice);
      voiceName = "Azure-English";
    } catch (e) {
      console.warn("[ttsService] Azure TTS failed, trying fallbacks:", e.message);
    }
  }

  if (!audio) {
    audio = await edgeSynthesize(text, voice);
    voiceName = "Edge-English";
  }

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(cacheKey, audio);
  return { audio, voice: voiceName };
}

module.exports = { synthesize };
