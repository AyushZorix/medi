/**
 * LLM agent pipeline: Validator → Consistency → Decider
 * Uses Gemini when GEMINI_API_KEY is set, then OpenAI; otherwise structured heuristics.
 */

function parseJsonResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only, no markdown.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", err);
    return null;
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseJsonResponse(content);
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI error:", err);
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return parseJsonResponse(content);
}

async function callLLM(systemPrompt, userPrompt) {
  return (await callGemini(systemPrompt, userPrompt)) || (await callOpenAI(systemPrompt, userPrompt));
}

function heuristicValidator(application, documents) {
  const findings = [];
  let score = 0;
  const uploaded = documents.filter((d) => d.required && d.fileName);

  for (const doc of uploaded) {
    const hasContent = Boolean(doc.notes?.trim() || doc.extractedText?.trim() || doc.fileName.length > 3);
    if (hasContent) {
      findings.push({ type: "pass", docId: doc.docId, message: `${doc.label} present and readable.` });
      score += 1;
    } else {
      findings.push({ type: "warn", docId: doc.docId, message: `${doc.label} uploaded but needs review.` });
    }
  }

  const missing = documents.filter((d) => d.required && !d.fileName);
  for (const doc of missing) {
    findings.push({ type: "fail", docId: doc.docId, message: `Missing required: ${doc.label}` });
  }

  const maxScore = documents.filter((d) => d.required).length || 1;
  return {
    agent: "validator",
    score: Math.round((score / maxScore) * 100),
    summary: `Validated ${uploaded.length} of ${maxScore} mandatory documents.`,
    findings,
  };
}

function heuristicConsistency(application, documents) {
  const issues = [];
  const names = new Set();
  const applicant = application.applicantName?.toLowerCase() || "";

  for (const doc of documents.filter((d) => d.fileName)) {
    const text = `${doc.notes} ${doc.extractedText} ${doc.fileName}`.toLowerCase();
    if (applicant && text.includes(applicant.split(" ")[0])) {
      names.add("applicant_match");
    }
    if (doc.docId === "financial_proof" && !text.includes("bank") && !text.includes("statement")) {
      issues.push({
        severity: "medium",
        message: "Financial document may not clearly identify as bank statement.",
        docId: doc.docId,
      });
    }
  }

  if (!names.has("applicant_match") && applicant) {
    issues.push({
      severity: "high",
      message: `Applicant name "${application.applicantName}" not clearly referenced across uploads.`,
    });
  }

  const score = Math.max(0, 100 - issues.length * 25);
  return {
    agent: "consistency",
    score,
    summary:
      issues.length === 0
        ? "No major cross-document inconsistencies detected."
        : `${issues.length} consistency issue(s) flagged for review.`,
    issues,
  };
}

function heuristicDecider(application, validator, consistency) {
  const reasons = [];
  const avg = Math.round((validator.score + consistency.score) / 2);

  if (validator.score < 70) {
    reasons.push("Mandatory document validation score is below threshold (70%).");
  }
  if (consistency.score < 70) {
    reasons.push("Cross-document consistency checks raised concerns.");
  }
  if (consistency.issues?.some((i) => i.severity === "high")) {
    reasons.push("High-severity inconsistency requires attorney review.");
  }

  let recommendation = "approve";
  if (reasons.length >= 2) recommendation = "deny";
  else if (reasons.length === 1) recommendation = "needs_info";

  if (avg >= 85 && reasons.length === 0) {
    recommendation = "approve";
    reasons.push("All automated checks passed with strong confidence.");
  }

  return {
    agent: "decider",
    recommendation,
    confidence: avg,
    summary: `AI recommends ${recommendation.replace("_", " ")} with ${avg}% confidence.`,
    reasons,
  };
}

export async function runAgentPipeline(application) {
  const documents = application.documents || [];

  const validatorPrompt = `You are a visa document validator. Return JSON: { "score": number 0-100, "summary": string, "findings": [{ "type": "pass"|"warn"|"fail", "docId": string, "message": string }] }`;
  const validatorInput = JSON.stringify({
    visaType: application.visaType,
    applicantName: application.applicantName,
    documents: documents.map((d) => ({
      docId: d.docId,
      label: d.label,
      fileName: d.fileName,
      notes: d.notes,
      status: d.status,
    })),
  });

  let validator =
    (await callLLM(validatorPrompt, validatorInput)) || heuristicValidator(application, documents);

  const consistencyPrompt = `You are a visa consistency analyst. Return JSON: { "score": number 0-100, "summary": string, "issues": [{ "severity": "low"|"medium"|"high", "message": string, "docId"?: string }] }`;
  const consistencyInput = JSON.stringify({ applicantName: application.applicantName, validator, documents });

  let consistency =
    (await callLLM(consistencyPrompt, consistencyInput)) ||
    heuristicConsistency(application, documents);

  const deciderPrompt = `You are a visa decider agent. Never grant final legal approval—only recommend. Return JSON: { "recommendation": "approve"|"deny"|"needs_info", "confidence": number 0-100, "summary": string, "reasons": string[] }`;
  const deciderInput = JSON.stringify({
    visaType: application.visaType,
    validator,
    consistency,
  });

  let decider =
    (await callLLM(deciderPrompt, deciderInput)) || heuristicDecider(application, validator, consistency);

  validator.agent = "validator";
  consistency.agent = "consistency";
  decider.agent = "decider";

  return {
    status: "awaiting_human",
    ranAt: new Date(),
    validator,
    consistency,
    decider,
  };
}
