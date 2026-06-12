import twilio from "twilio";

function hasElevenLabsAgentConfig() {
  return Boolean(
    process.env.ELEVENLABS_API_KEY &&
      process.env.ELEVENLABS_AGENT_ID &&
      process.env.ELEVENLABS_PHONE_NUMBER_ID,
  );
}

function buildCallScript(application, finalDecision, reasons = []) {
  const name = application.applicantName?.split(" ")[0] || "there";
  const visa = application.visaType;

  if (finalDecision === "started") {
    return `Hello ${name}, this is VisaIQ confirming that your application for a ${visa} visa has been successfully initiated. We have registered this phone number for your outbound status updates. Please log in to your portal and upload the mandatory documents to proceed. Thank you.`;
  }

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

/** ElevenLabs Conversational AI agent call for applicant status updates. */
async function placeElevenLabsAgentCall(phoneNumber, application, finalDecision, reasons = []) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const agentPhoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  if (!apiKey || !agentId || !agentPhoneNumberId) {
    return { skipped: true, reason: "ElevenLabs agent is not configured" };
  }

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
    const errText = await res.text();
    console.error("ElevenLabs outbound call failed, attempting Twilio fallback. Error:", errText);

    // Attempt Twilio TTS fallback
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const script = buildCallScript(application, finalDecision, reasons);
      const twilioCall = await placeTwilioTtsCall(phoneNumber, script);
      if (!twilioCall.error) {
        return twilioCall;
      }
    }

    let friendlyMessage = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.detail?.code === "document_not_found" || parsed.detail?.status === "document_not_found") {
        friendlyMessage = `ElevenLabs error: Phone Number ID "${agentPhoneNumberId}" was not found or has expired in your ElevenLabs account. Please check your ELEVENLABS_PHONE_NUMBER_ID.`;
      } else if (parsed.detail?.message) {
        friendlyMessage = `ElevenLabs error: ${parsed.detail.message}`;
      }
    } catch {
      // Keep original text
    }
    return { error: friendlyMessage || "ElevenLabs outbound call failed" };
  }

  const data = await res.json();
  return {
    provider: "elevenlabs_agent",
    conversationId: data.conversation_id,
    callSid: data.call_sid,
    status: data.status,
  };
}

function getTwilioClient() {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
}

async function placeTwilioTtsCall(phoneNumber, script) {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
  if (!client || !fromNumber) {
    return { error: "Twilio credentials not configured" };
  }

  try {
    const call = await client.calls.create({
      twiml: `<Response><Pause length="1"/><Say voice="alice">${script}</Say></Response>`,
      to: phoneNumber,
      from: fromNumber,
    });
    return {
      provider: "twilio_tts",
      callSid: call.sid,
      status: call.status,
    };
  } catch (err) {
    console.error("Twilio TTS call failed:", err);
    return { error: err.message || "Twilio TTS call failed" };
  }
}

export async function notifyApplicantByPhone(application, finalDecision, reasons = []) {
  const phone = application.phoneNumber;
  if (!phone) {
    return { skipped: true, reason: "No phone number on file" };
  }

  if (!hasElevenLabsAgentConfig()) {
    return { skipped: true, reason: "ElevenLabs agent is not configured" };
  }

  const script = buildCallScript(application, finalDecision, reasons);

  try {
    const agentCall = await placeElevenLabsAgentCall(phone, application, finalDecision, reasons);
    return {
      at: new Date(),
      decision: finalDecision,
      phone,
      script,
      ...agentCall,
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

export async function callApplicantWithCustomScript(application, script) {
  const phone = application.phoneNumber;
  if (!phone) {
    return { skipped: true, reason: "No phone number on file" };
  }

  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

    if (!apiKey || !agentId || !agentPhoneNumberId) {
      return { skipped: true, reason: "ElevenLabs agent is not configured" };
    }

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
        to_number: phone,
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
            decision: "custom_call",
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs outbound call failed, attempting Twilio fallback. Error:", errText);

      // Attempt Twilio TTS fallback
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilioCall = await placeTwilioTtsCall(phone, script);
        if (!twilioCall.error) {
          return {
            at: new Date(),
            decision: "custom_call",
            phone,
            script,
            ...twilioCall,
          };
        }
      }

      let friendlyMessage = errText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail?.code === "document_not_found" || parsed.detail?.status === "document_not_found") {
          friendlyMessage = `ElevenLabs error: Phone Number ID "${agentPhoneNumberId}" was not found or has expired in your ElevenLabs account. Please check your ELEVENLABS_PHONE_NUMBER_ID.`;
        } else if (parsed.detail?.message) {
          friendlyMessage = `ElevenLabs error: ${parsed.detail.message}`;
        }
      } catch {
        // Keep original text
      }
      return { error: friendlyMessage || "ElevenLabs outbound call failed" };
    }

    const data = await res.json();
    return {
      at: new Date(),
      decision: "custom_call",
      phone,
      script,
      provider: "elevenlabs_agent",
      conversationId: data.conversation_id,
      callSid: data.call_sid,
      status: data.status,
    };
  } catch (error) {
    console.error("Outbound call failed:", error);
    return {
      at: new Date(),
      decision: "custom_call",
      phone,
      script,
      error: error instanceof Error ? error.message : "Call failed",
      mock: true,
    };
  }
}

