import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { supabase } from "./db.mjs";
import { buildDocumentChecklist } from "./visaDocuments.mjs";
import {
  enrichApplication,
  buildProgressUpdate,
  maybeAutoRunPipeline,
  runPipelineForApplication,
  submitHumanReview,
  triggerApplicantCall,
} from "./applicationService.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const app = express();
const PORT = Number(process.env.API_PORT) || Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_MODE = JWT_SECRET ? "jwt" : "insecure";

// ─── CORS ────────────────────────────────────────────────────────────────────
function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app")) return true;

    const allowed = process.env.ALLOWED_ORIGINS;
    if (allowed) {
      const origins = allowed.split(",").map(o => o.trim());
      if (origins.includes(origin) || origins.some(o => origin.startsWith(o))) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use((req, _res, next) => {
  console.log(`[Express API] ${req.method} ${req.url}`);
  next();
});
app.use("/uploads/calls", express.static(path.join(__dirname, "uploads", "calls")));

// ─── Constants ────────────────────────────────────────────────────────────────
const APPLICANT_VISA_TYPES = ["F-1", "O-1", "B-1/B-2"];
const ATTORNEY_VISA_TYPES = ["F-1", "O-1", "B-1/B-2"];

const SEED_APPLICATIONS = [
  { slug: "amelia-chen", applicantName: "Amelia Chen", visaType: "F-1", status: "approved", score: 96, updatedLabel: "2m ago" },
  { slug: "rohan-patel", applicantName: "Rohan Patel", visaType: "O-1", status: "processing", score: 88, updatedLabel: "3m ago" },
  { slug: "sofia-marquez", applicantName: "Sofia Marquez", visaType: "B-2", status: "needs_info", score: 71, updatedLabel: "8m ago" },
  { slug: "daniel-okafor", applicantName: "Daniel Okafor", visaType: "F-1", status: "approved", score: 92, updatedLabel: "12m ago" },
  { slug: "yuki-tanaka", applicantName: "Yuki Tanaka", visaType: "O-1", status: "rejected", score: 42, updatedLabel: "18m ago" },
  { slug: "liam-oconnor", applicantName: "Liam O'Connor", visaType: "B-1", status: "approved", score: 89, updatedLabel: "24m ago" },
  { slug: "isabela-rocha", applicantName: "Isabela Rocha", visaType: "F-1", status: "processing", score: 81, updatedLabel: "31m ago" },
  { slug: "noor-al-sayed", applicantName: "Noor Al-Sayed", visaType: "O-1", status: "needs_info", score: 67, updatedLabel: "1h ago" },
  { slug: "wei-zhang", applicantName: "Wei Zhang", visaType: "B-2", status: "approved", score: 94, updatedLabel: "1h ago" },
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function signToken(userId) {
  if (AUTH_MODE === "jwt") {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
  }
  return userId;
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("visaiq_token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("visaiq_token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
}

// ─── Row → response mappers ───────────────────────────────────────────────────
function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    attorneyVisaTypes: user.role === "attorney" ? (user.attorney_visa_types || []) : [],
  };
}

/** Fetch user row by ID from Supabase */
async function getUserById(id) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}

async function getUserFromRequest(req) {
  const token = req.cookies?.visaiq_token;
  if (!token) return null;
  try {
    if (AUTH_MODE === "jwt") {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.sub) return await getUserById(payload.sub);
      return null;
    }
    // Insecure mode: token is raw UUID
    return await getUserById(token);
  } catch {
    return null;
  }
}

// ─── Visa type normalisation ──────────────────────────────────────────────────
function normalizeAttorneyVisaType(visaType) {
  if (visaType === "B-1" || visaType === "B-2") return "B-1/B-2";
  return ATTORNEY_VISA_TYPES.includes(visaType) ? visaType : null;
}

function normalizeAttorneyVisaTypes(input) {
  if (!Array.isArray(input)) return [];
  const normalized = input.map((t) => normalizeAttorneyVisaType(String(t))).filter(Boolean);
  return Array.from(new Set(normalized));
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

// ─── Application helpers ──────────────────────────────────────────────────────
function slugForApplicant(user, visaType) {
  const base =
    user.email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ||
    `user-${user.id.slice(-8)}`;
  const visa = visaType.replace(/\//g, "-").toLowerCase();
  return `${base}-${visa}-${user.id.slice(-6)}`;
}

/**
 * Convert a raw Supabase applications row into the shape the frontend expects.
 * Handles the snake_case → camelCase mapping.
 */
function rowToApp(row) {
  return {
    id: row.id,
    slug: row.slug,
    applicantName: row.applicant_name,
    visaType: row.visa_type,
    status: row.status,
    score: row.score,
    updatedLabel: row.updated_label,
    phoneNumber: row.phone_number,
    progress: row.progress,
    documents: row.documents,
    pipeline: row.pipeline,
    humanReview: row.human_review,
    callLog: row.call_log,
    applicantUserId: row.applicant_user_id,
    attorneyUserId: row.attorney_user_id,
    attorneyName: row.attorney_name ?? null,
    submittedToAttorney: row.submitted_to_attorney,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    // Keep raw columns so applicationService helpers work
    attorney_name: row.attorney_name ?? null,
    attorney_user_id: row.attorney_user_id,
    phone_number: row.phone_number,
    applicant_name: row.applicant_name,
    human_review: row.human_review,
    call_log: row.call_log,
  };
}

/** Query application by slug or UUID */
async function findApplication(slugOrId) {
  // Try slug first
  let { data, error } = await supabase
    .from("applications")
    .select("*, users!applications_attorney_user_id_fkey(full_name)")
    .eq("slug", slugOrId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;

  // Fall back to UUID lookup
  if (!data) {
    const res = await supabase
      .from("applications")
      .select("*, users!applications_attorney_user_id_fkey(full_name)")
      .eq("id", slugOrId)
      .maybeSingle();
    if (res.error) throw res.error;
    data = res.data;
  }

  if (!data) return null;

  // Flatten attorney name from joined relation
  const attorney_name = data.users?.full_name ?? null;
  const { users: _dropped, ...rest } = data;
  return rowToApp({ ...rest, attorney_name });
}

/** Build application response for the API */
function toApplicationResponse(app) {
  return enrichApplication(app);
}

async function resolveVerifiedAttorney(attorneyId) {
  if (!attorneyId) return null;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", attorneyId)
    .eq("role", "attorney")
    .eq("attorney_verified", true)
    .maybeSingle();
  return data || null;
}

async function createApplicantApplication(user, visaType, phoneNumber, attorneyId) {
  const documents = buildDocumentChecklist(visaType, []);



  const slug = slugForApplicant(user, visaType);
  const baseApp = {
    slug,
    applicantName: user.full_name,
    visaType,
    documents,
    pipeline: { status: "idle" },
    humanReview: { status: "pending" },
  };
  const { progress, score } = buildProgressUpdate(baseApp);

  const { data: created, error } = await supabase
    .from("applications")
    .insert({
      slug,
      applicant_name: user.full_name,
      visa_type: visaType,
      phone_number: phoneNumber,
      attorney_user_id: attorneyId,
      status: "processing",
      score,
      updated_label: "just now",
      progress,
      documents,
      pipeline: { status: "idle" },
      human_review: { status: "pending", reviewedBy: null, reviewedAt: null, attorneyNotes: "" },
      call_log: [],
      applicant_user_id: user.id,
      submitted_to_attorney: false,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Fetch attorney name
  const attorney = await resolveVerifiedAttorney(attorneyId);
  return rowToApp({ ...created, attorney_name: attorney?.full_name ?? null });
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────
async function seedVerifiedAttorneysIfEmpty() {
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "attorney")
    .eq("attorney_verified", true);

  const { data: hasBalla } = await supabase
    .from("users")
    .select("id")
    .eq("email", "balla@visaiq.demo")
    .maybeSingle();

  if ((count ?? 0) > 0 && hasBalla) return;

  const passwordHash = await bcrypt.hash("attorney123", 10);
  const attorneys = [
    { email: "balla@visaiq.demo", fullName: "Balla", specialty: "O-1 & tech visas", visaTypes: ["O-1"] },
    { email: "jordan.davis@visaiq.demo", fullName: "Jordan Davis", specialty: "F-1 & O-1 visas", visaTypes: ["F-1", "O-1"] },
    { email: "hannah.jones@visaiq.demo", fullName: "Hannah Jones", specialty: "B-1/B-2 & family immigration", visaTypes: ["B-1/B-2"] },
    { email: "priya.iyer@visaiq.demo", fullName: "Priya Iyer", specialty: "Employment-based visas", visaTypes: ["O-1", "F-1"] },
  ];

  for (const a of attorneys) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", a.email)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("users")
        .update({
          full_name: a.fullName,
          role: "attorney",
          attorney_verified: true,
          attorney_specialty: a.specialty,
          attorney_visa_types: a.visaTypes,
          password_hash: passwordHash,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("users").insert({
        email: a.email,
        full_name: a.fullName,
        role: "attorney",
        attorney_verified: true,
        attorney_specialty: a.specialty,
        attorney_visa_types: a.visaTypes,
        password_hash: passwordHash,
      });
    }
  }
  console.log(`Seeded ${attorneys.length} verified attorneys (demo password: attorney123)`);
}

async function seedApplicationsIfEmpty() {
  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) return;

  const rows = SEED_APPLICATIONS.map((a) => ({
    slug: a.slug,
    applicant_name: a.applicantName,
    visa_type: a.visaType,
    status: a.status,
    score: a.score,
    updated_label: a.updatedLabel,
    phone_number: "",
    progress: { documentsReceived: 0, identityVerification: 0, financialReview: 0, finalDecision: 0 },
    documents: [],
    pipeline: { status: "idle" },
    human_review: { status: "pending", reviewedBy: null, reviewedAt: null, attorneyNotes: "" },
    call_log: [],
    submitted_to_attorney: false,
  }));

  const { error } = await supabase.from("applications").insert(rows);
  if (error) console.error("Seed applications failed:", error);
  else console.log(`Seeded ${rows.length} applications in Supabase`);
}

async function verifyAllAttorneys() {
  await supabase
    .from("users")
    .update({ attorney_verified: true })
    .eq("role", "attorney");
}

async function consolidateBallaAttorneys() {
  const { data: attorneys } = await supabase
    .from("users")
    .select("*")
    .eq("role", "attorney")
    .ilike("full_name", "%balla%");

  if (!attorneys || attorneys.length <= 1) return;

  console.log(`[Consolidation] Found ${attorneys.length} duplicate Balla attorneys. Consolidating...`);
  const mainBalla =
    attorneys.find((a) => a.email === "b@g.com") ||
    attorneys.find((a) => a.email === "balla@visaiq.demo") ||
    attorneys[0];

  for (const dup of attorneys) {
    if (dup.id === mainBalla.id) continue;
    await supabase
      .from("applications")
      .update({ attorney_user_id: mainBalla.id })
      .eq("attorney_user_id", dup.id);
    await supabase.from("users").delete().eq("id", dup.id);
    console.log(`[Consolidation] Deleted duplicate attorney: ${dup.email}`);
  }
}

async function seedApplicantAyushAndCase() {
  const { data: balla } = await supabase
    .from("users")
    .select("*")
    .or('email.eq."b@g.com",email.eq."balla@visaiq.demo"')
    .limit(1)
    .maybeSingle();

  if (!balla) {
    console.log("Warning: Balla not found, cannot seed Ayush case yet.");
    return;
  }

  // Upsert Ayush user
  let { data: ayushUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", "ayush@visaiq.demo")
    .maybeSingle();

  if (!ayushUser) {
    const passwordHash = await bcrypt.hash("user123", 10);
    const { data } = await supabase
      .from("users")
      .insert({
        email: "ayush@visaiq.demo",
        full_name: "Ayush",
        role: "user",
        password_hash: passwordHash,
      })
      .select("*")
      .single();
    ayushUser = data;
    console.log("Seeded applicant user Ayush (email: ayush@visaiq.demo, password: user123)");
  }

  let { data: ayushApp } = await supabase
    .from("applications")
    .select("*")
    .or(`applicant_user_id.eq.${ayushUser.id},slug.eq.ayush`)
    .eq("visa_type", "O-1")
    .maybeSingle();

  if (!ayushApp) {
    const documents = buildDocumentChecklist("O-1", []);
    documents.forEach((doc, idx) => {
      if (idx < 2) {
        doc.fileName = `${doc.docId}-doc.pdf`;
        doc.status = "uploaded";
        doc.notes = "Extracted passport / resume text showing applicant credentials.";
      }
    });

    const { error } = await supabase.from("applications").insert({
      slug: "ayush",
      applicant_name: "Ayush",
      visa_type: "O-1",
      phone_number: "+15550199",
      attorney_user_id: balla.id,
      status: "needs_info",
      score: 42,
      updated_label: "just now",
      progress: { documentsReceived: 40, identityVerification: 42, financialReview: 45, finalDecision: 50 },
      documents,
      pipeline: {
        status: "awaiting_human",
        ranAt: new Date().toISOString(),
        validator: {
          agent: "Validator", score: 42,
          summary: "O-1 extraordinary ability criteria missing or weak.",
          findings: [{ type: "warning", message: "Passport validity expires in 3 months." }],
          recommendation: "needs_info", confidence: 85,
        },
        consistency: {
          agent: "Consistency Check", score: 45,
          summary: "Resume timeline conflicts with educational degree graduation date.",
          findings: [{ type: "error", message: "Resume shows work starting prior to degree graduation date." }],
          recommendation: "needs_info", confidence: 90,
        },
        decider: {
          agent: "Decider", score: 42,
          summary: "AI recommends review or requesting additional evidence due to insufficient proof of national recognition.",
          recommendation: "needs_info",
          reasons: ["Gaps in extraordinary achievement documentation", "Low verification score"],
          confidence: 88,
        },
      },
      human_review: { status: "pending", reviewedBy: null, reviewedAt: null, attorneyNotes: "" },
      call_log: [],
      applicant_user_id: ayushUser.id,
      submitted_to_attorney: true,
      submitted_at: new Date().toISOString(),
    });
    if (error) console.error("Failed to seed Ayush application:", error);
    else console.log("Seeded O-1 visa application for Ayush with AI score of 42 assigned to Balla.");
  } else {
    const updates = {};
    if (ayushApp.score !== 42) updates.score = 42;
    if (ayushApp.attorney_user_id !== balla.id) updates.attorney_user_id = balla.id;
    if (Object.keys(updates).length) {
      await supabase.from("applications").update(updates).eq("id", ayushApp.id);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, fullName, role, attorneyVisaTypes } = req.body || {};
    const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const safeName = typeof fullName === "string" ? fullName.trim() : "";
    const safeRole = role === "attorney" || role === "user" ? role : "user";
    const normalizedVisaTypes = normalizeAttorneyVisaTypes(attorneyVisaTypes);

    if (!safeEmail || !password || !safeName) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", safeEmail)
      .maybeSingle();

    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: safeEmail,
        password_hash: passwordHash,
        full_name: safeName,
        role: safeRole,
        attorney_verified: safeRole === "attorney",
        attorney_visa_types: safeRole === "attorney"
          ? (normalizedVisaTypes.length ? normalizedVisaTypes : ATTORNEY_VISA_TYPES)
          : [],
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ message: "Email already in use" });
      throw error;
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    return res.status(201).json({ user: toUserResponse(user) });
  } catch (error) {
    console.error("Signup failed:", error);
    return res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!safeEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", safeEmail)
      .maybeSingle();

    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user.id);
    setAuthCookie(res, token);
    return res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error("Signin failed:", error);
    return res.status(500).json({ message: "Signin failed" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token: googleToken, role, attorneyVisaTypes } = req.body || {};
    if (!googleToken) return res.status(400).json({ message: "Google token is required" });

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    if (!googleRes.ok) return res.status(401).json({ message: "Invalid Google token" });

    const payload = await googleRes.json();
    const expectedClientId = (
      process.env.GOOGLE_CLIENT_ID ||
      "984146651145-dega19k07fismgo5r7eb69lni68jcfo1.apps.googleusercontent.com"
    ).replace(/^['"]|['"]$/g, "");
    const aud = String(payload.aud || "").replace(/^['"]|['"]$/g, "");
    if (aud !== expectedClientId) return res.status(401).json({ message: "Unauthorized client application" });

    const email = payload.email?.toLowerCase();
    const fullName = payload.name || payload.given_name || "Google User";
    if (!email) return res.status(400).json({ message: "Google account does not provide an email" });

    let { data: user } = await supabase.from("users").select("*").eq("email", email).maybeSingle();

    if (!user) {
      const safeRole = role === "attorney" || role === "user" ? role : "user";
      const normalizedVisaTypes = normalizeAttorneyVisaTypes(attorneyVisaTypes);
      const dummyPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const passwordHash = await bcrypt.hash(dummyPassword, 10);

      const { data: created, error } = await supabase
        .from("users")
        .insert({
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role: safeRole,
          attorney_verified: safeRole === "attorney",
          attorney_visa_types: safeRole === "attorney"
            ? (normalizedVisaTypes.length ? normalizedVisaTypes : ATTORNEY_VISA_TYPES)
            : [],
        })
        .select("*")
        .single();

      if (error) throw error;
      user = created;
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    return res.status(200).json({ user: toUserResponse(user) });
  } catch (error) {
    console.error("Google authentication failed:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
});

app.post("/api/auth/signout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  return res.json({ user: toUserResponse(user) });
});

// ─── Attorneys ────────────────────────────────────────────────────────────────

app.get("/api/attorneys", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { search, visaType } = req.query;
    let query = supabase
      .from("users")
      .select("id, full_name, attorney_specialty, attorney_visa_types")
      .eq("role", "attorney")
      .eq("attorney_verified", true);

    const normalizedVisa = normalizeAttorneyVisaType(String(visaType || "").trim());
    if (normalizedVisa) {
      query = query.contains("attorney_visa_types", [normalizedVisa]);
    }
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,attorney_specialty.ilike.%${search}%`
      );
    }

    const { data: attorneys, error } = await query.order("full_name");
    if (error) throw error;

    return res.json({
      attorneys: (attorneys || []).map((a) => ({
        id: a.id,
        fullName: a.full_name,
        specialty: a.attorney_specialty || "Immigration law",
        visaTypes: Array.isArray(a.attorney_visa_types) && a.attorney_visa_types.length
          ? a.attorney_visa_types
          : ATTORNEY_VISA_TYPES,
      })),
    });
  } catch (error) {
    console.error("List attorneys failed:", error);
    return res.status(500).json({ message: "Failed to load attorneys" });
  }
});

// ─── Applications ─────────────────────────────────────────────────────────────

app.get("/api/applications", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "attorney") return res.status(403).json({ message: "Attorney access required" });

    const { data: rows, error } = await supabase
      .from("applications")
      .select("*, users!applications_attorney_user_id_fkey(full_name)")
      .eq("attorney_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const apps = (rows || []).map((r) => {
      const { users: u, ...rest } = r;
      return toApplicationResponse(rowToApp({ ...rest, attorney_name: u?.full_name ?? null }));
    });
    return res.json({ applications: apps });
  } catch (error) {
    console.error("List applications failed:", error);
    return res.status(500).json({ message: "Failed to load applications" });
  }
});

app.get("/api/applications/me", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "user") return res.status(403).json({ message: "Applicant access required" });

    const { data: rows, error } = await supabase
      .from("applications")
      .select("*, users!applications_attorney_user_id_fkey(full_name)")
      .eq("applicant_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const apps = (rows || []).map((r) => {
      const { users: u, ...rest } = r;
      return toApplicationResponse(rowToApp({ ...rest, attorney_name: u?.full_name ?? null }));
    });
    return res.json({ applications: apps });
  } catch (error) {
    console.error("Applicant applications failed:", error);
    return res.status(500).json({ message: "Failed to load your applications" });
  }
});

app.post("/api/applications/start", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.role !== "user") return res.status(403).json({ message: "Applicant access required" });

  const { visaType, phoneNumber, attorneyUserId } = req.body || {};
  const phone = normalizePhone(phoneNumber);

  try {
    if (!APPLICANT_VISA_TYPES.includes(visaType)) {
      return res.status(400).json({ message: "Choose a valid visa type: F-1, O-1, or B-1/B-2" });
    }
    if (!phone) {
      return res.status(400).json({ message: "A valid phone number is required for status call notifications" });
    }

    // Check for existing application
    const { data: existingRow } = await supabase
      .from("applications")
      .select("*, users!applications_attorney_user_id_fkey(full_name)")
      .eq("applicant_user_id", user.id)
      .eq("visa_type", visaType)
      .maybeSingle();

    if (existingRow) {
      const existing = rowToApp({ ...existingRow, attorney_name: existingRow.users?.full_name ?? null });
      const updates = {};
      const oldPhone = existing.phoneNumber;

      if (phone) updates.phone_number = phone;

      if (attorneyUserId) {
        const attorney = await resolveVerifiedAttorney(attorneyUserId);
        if (!attorney) return res.status(400).json({ message: "Select a valid verified attorney" });
        updates.attorney_user_id = attorney.id;
        updates.submitted_to_attorney = true;
        updates.submitted_at = new Date().toISOString();
        updates.status = "processing";
      }


      if (Object.keys(updates).length) {
        await supabase.from("applications").update(updates).eq("id", existing.id);
      }

      const refreshed = await findApplication(existing.id);

      if (phone && oldPhone !== phone && process.env.AUTO_CALL_ON_START === "true") {
        try {
          const callResult = await (await import("./calls.mjs")).notifyApplicantByPhone(
            { ...refreshed, applicantName: refreshed.applicantName, phoneNumber: refreshed.phoneNumber },
            "started"
          );
          await supabase
            .from("applications")
            .update({ call_log: [...(refreshed.callLog || []), callResult] })
            .eq("id", existing.id);
          refreshed.callLog = [...(refreshed.callLog || []), callResult];
        } catch (callErr) {
          console.error("Confirmation call failed:", callErr);
        }
      }

      return res.json({ application: toApplicationResponse(refreshed) });
    }

    const attorney = await resolveVerifiedAttorney(attorneyUserId);
    if (!attorney) {
      return res.status(400).json({ message: "Select a verified immigration attorney to forward your case" });
    }

    const application = await createApplicantApplication(user, visaType, phone, attorney.id);

    if (phone && process.env.AUTO_CALL_ON_START === "true") {
      try {
        const callResult = await (await import("./calls.mjs")).notifyApplicantByPhone(
          { ...application, applicantName: application.applicantName, phoneNumber: application.phoneNumber },
          "started"
        );
        await supabase
          .from("applications")
          .update({ call_log: [...(application.callLog || []), callResult] })
          .eq("id", application.id);
        application.callLog = [...(application.callLog || []), callResult];
      } catch (callErr) {
        console.error("Confirmation call failed:", callErr);
      }
    }

    return res.status(201).json({ application: toApplicationResponse(application) });
  } catch (error) {
    if (error?.code === "23505") {
      const { data: fallback } = await supabase
        .from("applications")
        .select("*, users!applications_attorney_user_id_fkey(full_name)")
        .eq("applicant_user_id", user.id)
        .eq("visa_type", visaType)
        .maybeSingle();
      if (fallback) {
        return res.json({
          application: toApplicationResponse(rowToApp({ ...fallback, attorney_name: fallback.users?.full_name ?? null })),
        });
      }
    }
    console.error("Start application failed:", error);
    return res.status(500).json({ message: "Failed to start application" });
  }
});

function generateServerMockOcrText(docId, applicantName, visaType) {
  const firstName = applicantName.split(" ")[0] || "Applicant";
  const lastName = applicantName.split(" ").slice(1).join(" ") || "Name";
  
  switch (docId) {
    case "passport":
      return `PASSPORT\nType: P\nCountry Code: USA\nPassport No: ${Math.floor(100000000 + Math.random() * 900000000)}\nSurname: ${lastName.toUpperCase()}\nGiven Names: ${firstName.toUpperCase()}\nNationality: UNITED STATES OF AMERICA\nDate of Birth: 12 OCT 1995\nSex: M\nPlace of Birth: CALIFORNIA, USA\nDate of Issue: 18 APR 2021\nDate of Expiration: 17 APR 2031\nAuthority: United States Department of State`;
      
    case "petition_support":
      return `PETITION FOR ${visaType} NONIMMIGRANT WORKER\nPetitioner: TechCorp Inc.\nBeneficiary: ${applicantName}\nClassification: ${visaType} Alien of Extraordinary Ability\nItinerary: June 2026 to June 2029\nDetailed achievements in agentic workflows and AI software development. Standard extraordinary credentials criteria met.`;
      
    case "financial_proof":
      return `CHASE BANK STATEMENT\nAccount Holder: ${applicantName}\nStatement Period: May 1 to May 31, 2026\nBeginning Balance: $84,102.50\nEnding Balance: $92,450.00\nDeposits: $12,400.00\nWithdrawals: $4,052.50\nMonthly average balance is steady and demonstrates sufficient financial support.`;
      
    case "awards_press":
      return `CERTIFICATE OF ACHIEVEMENT\nPresented to: ${applicantName}\nAward: National AI Innovation Award 2025\nFor outstanding contributions to AI agent architectures and automation pipelines.\nSilicon Valley AI Coalition.`;
      
    case "expert_letters":
      return `RECOMMENDATION LETTER\nTo: U.S. Citizenship and Immigration Services\nSubject: Expert support letter for ${applicantName} (${visaType} Visa)\nFrom: Dr. Sarah Jenkins, Director of AI Research at Stanford\nI am writing to express my strongest support for Mr./Ms. ${lastName}'s extraordinary ability petition. His/Her work on agentic code reasoning is of international significance.`;
      
    case "contract":
      return `EMPLOYMENT AGREEMENT\nEmployer: TechCorp Inc., 100 Innovation Way, San Francisco, CA\nEmployee: ${applicantName}\nPosition: Principal AI Software Engineer\nSalary: $185,000 per annum\nTerm: Full-time starting June 15, 2026\nSigned by both parties.`;
      
    case "resume":
      return `${applicantName.toUpperCase()}\nEmail: ${firstName.toLowerCase()}@visaiq.demo\nExperience:\n- Principal AI Software Engineer, TechCorp (2024-Present)\n- Senior Software Engineer, Google (2021-2024)\nEducation:\n- Master of Science in Computer Science, Stanford University (Graduation: June 2021)`;
      
    case "i20":
      return `Form I-20\nCertificate of Eligibility for Nonimmigrant Student Status\nSEVIS ID: N000123456\nSurname: ${lastName}\nGiven Name: ${firstName}\nSchool Name: Stanford University\nProgram of Study: Computer Science\nLevel of Education: Master's\nStart Date: September 20, 2021\nEstimated average Program costs: $75,000/year`;

    case "ds160":
      return `DS-160 confirmation page\nConfirmation No: AA00892716\nApplicant: ${applicantName}\nVisa Class: B-1/B-2\nBarcoded receipt page scan. Travel authorized.`;

    case "sevis_fee":
      return `I-901 SEVIS FEE PAYMENT RECEIPT\nSEVIS ID: N000123456\nAmount Paid: $350.00\nBeneficiary: ${applicantName}\nSchool Code: SFR214F00618000\nPayment Status: Confirmed`;

    case "transcripts":
      return `ACADEMIC TRANSCRIPT\nInstitution: Stanford University\nStudent: ${applicantName}\nDegree: Master of Science in Computer Science\nGPA: 3.92 / 4.00\nCourses completed in AI, algorithms, and deep learning. Official seal present.`;

    case "travel_itinerary":
      return `TRAVEL ITINERARY\nPassenger: ${applicantName}\nFlight: UA 889 SFO to NRT\nDate: June 15, 2026\nReturn: July 15, 2026\nHotel booking confirmation at Tokyo Hyatt.`;

    case "ties_home":
      return `EVIDENCE OF HOME TIES\nLand Registry Deed\nOwner: ${applicantName}\nProperty: Apartment 4B, MG Road, Bangalore, India\nValuation statement and property tax receipt.`;

    case "photo":
      return `PASSPORT PHOTO SPECIFICATION VALIDATION\nDimensions: 2x2 inches\nResolution: 600x600 pixels\nBackground: Plain white\nHead size and position verify against US Department of State criteria.`;
      
    default:
      return `DOCUMENT TYPE: ${docId.toUpperCase()}\nApplicant: ${applicantName}\nVisa Category: ${visaType}\nVerified document metadata scan. All security features present and verified.`;
  }
}

app.post("/api/applications/:slug/documents", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!application.attorneyUserId) {
      return res.status(400).json({ message: "Select an attorney on your dashboard before uploading documents" });
    }

    const { docId, fileName, notes, extractedText } = req.body || {};
    if (!docId || !fileName) return res.status(400).json({ message: "docId and fileName are required" });

    const documents = buildDocumentChecklist(application.visaType, application.documents);
    const doc = documents.find((d) => d.docId === docId);
    if (!doc) return res.status(400).json({ message: "Unknown document type for this visa" });

    let finalNotes = typeof notes === "string" ? notes.trim() : "";
    let finalExtractedText = typeof extractedText === "string" ? extractedText.trim() : "";

    if (!finalNotes || !finalExtractedText) {
      const fallbackMock = generateServerMockOcrText(docId, application.applicantName, application.visaType);
      if (!finalNotes) finalNotes = fallbackMock;
      if (!finalExtractedText) finalExtractedText = fallbackMock;
    }

    doc.fileName = String(fileName).trim();
    doc.notes = finalNotes;
    doc.extractedText = finalExtractedText;
    doc.status = "uploaded";
    doc.uploadedAt = new Date().toISOString();

    const updates = { documents };
    if (!application.submittedToAttorney) {
      updates.submitted_to_attorney = true;
      updates.submitted_at = new Date().toISOString();
      updates.status = "processing";
      updates.updated_label = "just now";
    }

    const fakeApp = { ...application, documents };
    const { progress, score } = buildProgressUpdate(fakeApp);
    updates.progress = progress;
    updates.score = score;
    updates.updated_label = "just now";

    await supabase.from("applications").update(updates).eq("id", application.id);

    const refreshed = await findApplication(application.id);
    const afterPipeline = await maybeAutoRunPipeline(refreshed, supabase);

    return res.json({ application: toApplicationResponse(afterPipeline) });
  } catch (error) {
    console.error("Document upload failed:", error);
    return res.status(500).json({ message: "Failed to save document" });
  }
});

app.post("/api/applications/:slug/submit", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await supabase
      .from("applications")
      .update({
        submitted_to_attorney: true,
        submitted_at: new Date().toISOString(),
        status: "processing",
        updated_label: "just now",
      })
      .eq("id", application.id);

    const refreshed = await findApplication(application.id);
    return res.json({ application: toApplicationResponse(refreshed) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed";
    console.error("Submission failed:", error);
    return res.status(400).json({ message });
  }
});

app.post("/api/applications/:slug/pipeline/run", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await runPipelineForApplication(application, supabase);
    return res.json({ application: toApplicationResponse(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    console.error("Pipeline run failed:", error);
    return res.status(400).json({ message });
  }
});

app.post("/api/applications/:slug/human-review", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "attorney") return res.status(403).json({ message: "Attorney access required" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (!application.attorneyUserId || application.attorneyUserId !== user.id) {
      return res.status(403).json({ message: "This case is not assigned to you" });
    }

    const { approved, attorneyNotes } = req.body || {};
    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved (boolean) is required" });
    }
    // Relax pipeline status constraint to allow manual review at any point
    // if (application.pipeline?.status !== "awaiting_human") {
    //   return res.status(400).json({ message: "AI pipeline must complete before human review" });
    // }

    const result = await submitHumanReview(
      application,
      { approved, attorneyNotes, attorneyUserId: user.id },
      supabase
    );

    return res.json({
      application: toApplicationResponse(result.application),
      call: result.callResult,
    });
  } catch (error) {
    console.error("Human review failed:", error);
    return res.status(500).json({ message: "Human review failed" });
  }
});

app.post("/api/applications/:slug/call", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "attorney") return res.status(403).json({ message: "Attorney access required" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (!application.attorneyUserId || application.attorneyUserId !== user.id) {
      return res.status(403).json({ message: "This case is not assigned to you" });
    }

    const { script, phoneNumber } = req.body || {};
    if (!script || typeof script !== "string" || !script.trim()) {
      return res.status(400).json({ message: "A valid script string is required to call" });
    }

    if (phoneNumber && typeof phoneNumber === "string" && phoneNumber.trim()) {
      const normalized = normalizePhone(phoneNumber.trim());
      if (normalized) {
        await supabase.from("applications").update({ phone_number: normalized }).eq("id", application.id);
        application.phoneNumber = normalized;
        application.phone_number = normalized;
      }
    }

    const updated = await triggerApplicantCall(application, script.trim(), supabase);

    if (updated.call_log?.length) {
      const last = updated.call_log[updated.call_log.length - 1];
      if (last?.skipped) return res.status(400).json({ message: last.reason || "Call skipped" });
      if (last?.error) return res.status(500).json({ message: last.error || "Call failed" });
    }

    return res.json({
      application: toApplicationResponse(updated),
      call: updated.call_log[updated.call_log.length - 1],
    });
  } catch (error) {
    console.error("Outbound custom call failed:", error);
    return res.status(500).json({ message: "Outbound custom call failed" });
  }
});

app.get("/api/applications/:slug", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await findApplication(req.params.slug);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user") {
      const owns =
        application.applicantUserId === user.id ||
        application.applicantName === user.full_name;
      if (!owns) return res.status(403).json({ message: "Forbidden" });
    }

    if (user.role === "attorney") {
      if (!application.attorneyUserId || application.attorneyUserId !== user.id) {
        return res.status(403).json({ message: "This case is not assigned to you" });
      }
    }

    return res.json({ application: toApplicationResponse(application) });
  } catch (error) {
    console.error("Get application failed:", error);
    return res.status(500).json({ message: "Failed to load application" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════════════

async function start() {
  if (AUTH_MODE === "insecure") {
    console.warn("JWT_SECRET not set. Using insecure cookie auth for development.");
  }

  // Quick connectivity check
  const { error: pingError } = await supabase.from("users").select("id").limit(1);
  if (pingError) {
    console.error("Supabase connection failed:", pingError.message);
    console.error(
      "Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env, " +
        "and you have run the schema SQL in your Supabase project."
    );
    process.exit(1);
  }
  console.log("Supabase connected ✓");

  await verifyAllAttorneys();
  await seedVerifiedAttorneysIfEmpty();
  await seedApplicationsIfEmpty();
  await consolidateBallaAttorneys();
  await seedApplicantAyushAndCase();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
