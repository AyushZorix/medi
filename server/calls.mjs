import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "uploads", "calls");

function ensureAudioDir() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function twilioFromNumber() {
  return process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || "";
}

function buildCallScript(application, finalDecision, reasons = []) {
  const name = application.applicantName?.split(" ")[0] || "there";
  const visa = application.visaType;
  const status =
    finalDecision === "approved"
      ? "approved"
      : finalDecision === "rejected"
        ? "not approved at this time"
        : "requires additional information";

  const reasonText =
    reasons.length > 0
      ? ` Key points: ${reasons.slice(0, 3).join(". ")}.`
      : "";

  return `Hello ${name}, this is VisaIQ calling about your ${visa} visa application. Your case has been ${status} following review by our team.${reasonText} Please log in to your applicant portal for full details. Thank you.`;
}

/** ElevenLabs Conversational AI + Twilio — calls the applicant's number from visa apply. */
async function placeElevenLabsAgentCall(phoneNumber, application, finalDecision, reasons = []) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const agentPhoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  if (!apiKey || !agentId || !agentPhoneNumberId) return null;

  const script = buildCallScript(application, finalDecision, reasons);
  const name = application.applicantName?.split(" ")[0] || "there";

  const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: agentPhoneNumberId,
      to_number: phoneNumber,
      conversation_initiation_client_data: {
        conversation_config_override: {
          agent: {
            first_message: script,
            language: "en",
          },
        },
        dynamic_variables: {
          applicant_name: name,
          visa_type: application.visaType,
          decision: finalDecision,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("ElevenLabs outbound call failed:", err);
    return null;
  }

  const data = await res.json();
  return {
    provider: "elevenlabs_agent",
    conversationId: data.conversation_id,
    callSid: data.call_sid,
    status: data.status,
  };
}

async function generateElevenLabsSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  if (!apiKey) return null;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!res.ok) {
    console.error("ElevenLabs TTS failed:", await res.text());
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  ensureAudioDir();
  const filename = `call-${Date.now()}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return { filepath, filename };
}

async function placeTwilioCall(phoneNumber, text, audioFilename) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = twilioFromNumber();
  const publicBase = process.env.PUBLIC_API_URL || `http://localhost:${process.env.API_PORT || 4000}`;

  if (!accountSid || !authToken || !from) {
    return { mock: true, message: text };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  let twiml;
  if (audioFilename && process.env.ELEVENLABS_API_KEY) {
    const audioUrl = `${publicBase}/uploads/calls/${audioFilename}`;
    twiml = `<Response><Play>${audioUrl}</Play></Response>`;
  } else {
    const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    twiml = `<Response><Say voice="Polly.Joanna">${safe}</Say></Response>`;
  }

  const call = await client.calls.create({
    to: phoneNumber,
    from,
    twiml,
  });

  return { provider: "twilio_tts", sid: call.sid, status: call.status };
}

export async function notifyApplicantByPhone(application, finalDecision, reasons = []) {
  const phone = application.phoneNumber;
  if (!phone) {
    return { skipped: true, reason: "No phone number on file" };
  }

  const script = buildCallScript(application, finalDecision, reasons);

  try {
    const agentCall = await placeElevenLabsAgentCall(phone, application, finalDecision, reasons);
    if (agentCall) {
      return {
        at: new Date(),
        decision: finalDecision,
        phone,
        script,
        ...agentCall,
      };
    }

    let audio = null;
    if (process.env.ELEVENLABS_API_KEY) {
      audio = await generateElevenLabsSpeech(script);
    }

    const result = await placeTwilioCall(phone, script, audio?.filename);
    return {
      at: new Date(),
      decision: finalDecision,
      phone,
      script,
      ...result,
    };
  } catch (error) {
    console.error("Outbound call failed:", error);
    return {
      at: new Date(),
      decision: finalDecision,
      phone,
      script,
      error: error instanceof Error ? error.message : "Call failed",
      mock: true,
    };
  }
}
