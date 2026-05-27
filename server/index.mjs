import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { buildDocumentChecklist } from "./visaDocuments.mjs";
import {
  enrichApplication,
  syncApplicationProgress,
  maybeAutoRunPipeline,
  runPipelineForApplication,
  submitHumanReview,
} from "./applicationService.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const app = express();
const PORT = Number(process.env.API_PORT) || 4000;
function normalizeMongoUrl(url) {
  return url.replace(/(mongodb(?:\+srv)?:\/\/[^/]+)\/\//g, "$1/");
}

const MONGO_URL = normalizeMongoUrl(
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/medico",
);
const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_MODE = JWT_SECRET ? "jwt" : "insecure";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    // Vite may run on 5173, 8080, 8081, etc. — allow any local dev port
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads/calls", express.static(path.join(__dirname, "uploads", "calls")));

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["attorney", "user"], default: "user" },
    attorneyVerified: { type: Boolean, default: false },
    attorneySpecialty: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const User = mongoose.model("User", userSchema);

const applicationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    visaType: {
      type: String,
      enum: ["F-1", "O-1", "B-1", "B-2", "B-1/B-2"],
      required: true,
    },
    status: {
      type: String,
      enum: ["approved", "processing", "needs_info", "rejected"],
      default: "processing",
    },
    score: { type: Number, min: 0, max: 100, default: 0 },
    updatedLabel: { type: String, default: "just now" },
    phoneNumber: { type: String, trim: true, default: "" },
    progress: {
      documentsReceived: { type: Number, default: 0, min: 0, max: 100 },
      identityVerification: { type: Number, default: 0, min: 0, max: 100 },
      financialReview: { type: Number, default: 0, min: 0, max: 100 },
      finalDecision: { type: Number, default: 0, min: 0, max: 100 },
    },
    documents: [
      {
        docId: String,
        label: String,
        required: Boolean,
        fileName: String,
        notes: String,
        extractedText: String,
        status: {
          type: String,
          enum: ["missing", "uploaded", "validated", "flagged"],
          default: "missing",
        },
        uploadedAt: Date,
      },
    ],
    pipeline: {
      status: {
        type: String,
        enum: ["idle", "running", "awaiting_human", "completed", "failed"],
        default: "idle",
      },
      ranAt: Date,
      validator: { type: mongoose.Schema.Types.Mixed, default: null },
      consistency: { type: mongoose.Schema.Types.Mixed, default: null },
      decider: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    humanReview: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: Date,
      attorneyNotes: { type: String, default: "" },
      aiRecommendation: String,
    },
    callLog: [{ type: mongoose.Schema.Types.Mixed }],
    applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    attorneyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { versionKey: false, timestamps: true },
);

applicationSchema.index(
  { applicantUserId: 1, visaType: 1 },
  {
    unique: true,
    partialFilterExpression: { applicantUserId: { $exists: true, $ne: null } },
  },
);

const APPLICANT_VISA_TYPES = ["F-1", "O-1", "B-1/B-2"];

const Application = mongoose.model("Application", applicationSchema);

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

function signToken(userId) {
  if (AUTH_MODE === "jwt") {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
  }
  return userId;
}

function setAuthCookie(res, token) {
  res.cookie("visaiq_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  res.clearCookie("visaiq_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function toUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

function attorneyFromRef(attorneyRef) {
  if (!attorneyRef) return { attorneyUserId: null, attorneyName: null };
  if (typeof attorneyRef === "object" && attorneyRef.fullName) {
    return {
      attorneyUserId: attorneyRef._id?.toString() ?? null,
      attorneyName: attorneyRef.fullName,
    };
  }
  return { attorneyUserId: String(attorneyRef), attorneyName: null };
}

function toApplicationResponse(app) {
  const base = enrichApplication(app);
  const { attorneyUserId, attorneyName } = attorneyFromRef(app.attorneyUserId);
  return {
    ...base,
    attorneyUserId,
    attorneyName,
    forwardedToAttorney: Boolean(attorneyUserId),
  };
}

async function resolveVerifiedAttorney(attorneyUserId) {
  if (!attorneyUserId) return null;
  const attorney = await User.findOne({
    _id: attorneyUserId,
    role: "attorney",
    attorneyVerified: true,
  });
  return attorney;
}

async function seedVerifiedAttorneysIfEmpty() {
  const count = await User.countDocuments({ role: "attorney", attorneyVerified: true });
  if (count > 0) return;

  const passwordHash = await bcrypt.hash("attorney123", 10);
  const attorneys = [
    {
      email: "jordan.davis@visaiq.demo",
      fullName: "Jordan Davis",
      attorneySpecialty: "F-1 & O-1 visas",
    },
    {
      email: "hannah.jones@visaiq.demo",
      fullName: "Hannah Jones",
      attorneySpecialty: "B-1/B-2 & family immigration",
    },
    {
      email: "priya.iyer@visaiq.demo",
      fullName: "Priya Iyer",
      attorneySpecialty: "Employment-based visas",
    },
  ];

  for (const a of attorneys) {
    await User.updateOne(
      { email: a.email },
      {
        $set: {
          fullName: a.fullName,
          role: "attorney",
          attorneyVerified: true,
          attorneySpecialty: a.attorneySpecialty,
          passwordHash,
        },
      },
      { upsert: true },
    );
  }
  console.log(`Seeded ${attorneys.length} verified attorneys (demo password: attorney123)`);
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

async function seedApplicationsIfEmpty() {
  const count = await Application.countDocuments();
  if (count > 0) return;
  await Application.insertMany(SEED_APPLICATIONS);
  console.log(`Seeded ${SEED_APPLICATIONS.length} applications in MongoDB`);
}

function slugForApplicant(user, visaType) {
  const base =
    user.email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || `user-${user._id}`;
  const visa = visaType.replace(/\//g, "-").toLowerCase();
  return `${base}-${visa}-${user._id.toString().slice(-6)}`;
}

async function createApplicantApplication(user, visaType, phoneNumber, attorneyUserId) {
  const documents = buildDocumentChecklist(visaType, []);

  return Application.create({
    slug: slugForApplicant(user, visaType),
    applicantName: user.fullName,
    visaType,
    phoneNumber,
    attorneyUserId,
    status: "processing",
    score: 0,
    updatedLabel: "just now",
    progress: {
      documentsReceived: 0,
      identityVerification: 0,
      financialReview: 0,
      finalDecision: 0,
    },
    documents,
    pipeline: { status: "idle" },
    humanReview: { status: "pending" },
    callLog: [],
    applicantUserId: user._id,
  });
}

async function getUserFromRequest(req) {
  const token = req.cookies?.visaiq_token;
  if (!token) return null;
  try {
    if (AUTH_MODE === "jwt") {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.sub);
      return user || null;
    }
    const user = await User.findById(token);
    return user || null;
  } catch {
    return null;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body || {};
    const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const safeName = typeof fullName === "string" ? fullName.trim() : "";
    const safeRole = role === "attorney" || role === "user" ? role : "user";

    if (!safeEmail || !password || !safeName) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: safeEmail,
      passwordHash,
      fullName: safeName,
      role: safeRole,
      attorneyVerified: false,
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(201).json({ user: toUserResponse(user) });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
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

    const user = await User.findOne({ email: safeEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    return res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error("Signin failed:", error);
    return res.status(500).json({ message: "Signin failed" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token: googleToken, role } = req.body || {};
    if (!googleToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify token with Google's tokeninfo API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    if (!googleRes.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const payload = await googleRes.json();
    
    // Validate client ID to prevent spoofing
    const expectedClientId = process.env.GOOGLE_CLIENT_ID || "984146651145-dega19k07fismgo5r7eb69lni68jcfo1.apps.googleusercontent.com";
    if (payload.aud !== expectedClientId) {
      return res.status(401).json({ message: "Unauthorized client application" });
    }

    const email = payload.email?.toLowerCase();
    const fullName = payload.name || payload.given_name || "Google User";
    
    if (!email) {
      return res.status(400).json({ message: "Google account does not provide an email" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Register new user
      const safeRole = role === "attorney" || role === "user" ? role : "user";
      
      // Generate a random password hash since passwordHash is required
      const dummyPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const passwordHash = await bcrypt.hash(dummyPassword, 10);
      
      user = await User.create({
        email,
        passwordHash,
        fullName,
        role: safeRole,
        attorneyVerified: false,
      });
    }

    const token = signToken(user._id.toString());
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
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ user: toUserResponse(user) });
});

app.get("/api/attorneys", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const attorneys = await User.find({ role: "attorney", attorneyVerified: true })
      .select("fullName attorneySpecialty")
      .sort({ fullName: 1 });

    return res.json({
      attorneys: attorneys.map((a) => ({
        id: a._id.toString(),
        fullName: a.fullName,
        specialty: a.attorneySpecialty || "Immigration law",
      })),
    });
  } catch (error) {
    console.error("List attorneys failed:", error);
    return res.status(500).json({ message: "Failed to load attorneys" });
  }
});

app.get("/api/applications", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "attorney") {
      return res.status(403).json({ message: "Attorney access required" });
    }

    const applications = await Application.find({ attorneyUserId: user._id })
      .populate("attorneyUserId", "fullName")
      .sort({ updatedAt: -1 })
      .limit(100);
    return res.json({ applications: applications.map(toApplicationResponse) });
  } catch (error) {
    console.error("List applications failed:", error);
    return res.status(500).json({ message: "Failed to load applications" });
  }
});

app.get("/api/applications/me", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== "user") {
      return res.status(403).json({ message: "Applicant access required" });
    }

    const applications = await Application.find({ applicantUserId: user._id })
      .populate("attorneyUserId", "fullName")
      .sort({ updatedAt: -1 });
    return res.json({ applications: applications.map(toApplicationResponse) });
  } catch (error) {
    console.error("Applicant applications failed:", error);
    return res.status(500).json({ message: "Failed to load your applications" });
  }
});

app.post("/api/applications/start", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (user.role !== "user") {
    return res.status(403).json({ message: "Applicant access required" });
  }

  const { visaType, phoneNumber, attorneyUserId } = req.body || {};
  const phone = normalizePhone(phoneNumber);

  try {
    if (!APPLICANT_VISA_TYPES.includes(visaType)) {
      return res.status(400).json({
        message: "Choose a valid visa type: F-1, O-1, or B-1/B-2",
      });
    }
    if (!phone) {
      return res.status(400).json({
        message: "A valid phone number is required for status call notifications",
      });
    }

    const existing = await Application.findOne({
      applicantUserId: user._id,
      visaType,
    }).populate("attorneyUserId", "fullName");

    if (existing) {
      if (!existing.phoneNumber && phone) {
        existing.phoneNumber = phone;
      }
      if (!existing.attorneyUserId && attorneyUserId) {
        const attorney = await resolveVerifiedAttorney(attorneyUserId);
        if (!attorney) {
          return res.status(400).json({ message: "Select a valid verified attorney" });
        }
        existing.attorneyUserId = attorney._id;
      }
      await existing.save();
      await existing.populate("attorneyUserId", "fullName");
      return res.json({ application: toApplicationResponse(existing) });
    }

    const attorney = await resolveVerifiedAttorney(attorneyUserId);
    if (!attorney) {
      return res.status(400).json({
        message: "Select a verified immigration attorney to forward your case",
      });
    }

    const application = await createApplicantApplication(user, visaType, phone, attorney._id);
    await application.populate("attorneyUserId", "fullName");
    return res.status(201).json({ application: toApplicationResponse(application) });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const { visaType } = req.body || {};
      const existing = await Application.findOne({ applicantUserId: user._id, visaType });
      if (existing) {
        return res.json({ application: toApplicationResponse(existing) });
      }
    }
    console.error("Start application failed:", error);
    return res.status(500).json({ message: "Failed to start application" });
  }
});

app.post("/api/applications/:slug/documents", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await Application.findOne({ slug: req.params.slug }).populate(
      "attorneyUserId",
      "fullName",
    );
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!application.attorneyUserId) {
      return res.status(400).json({
        message: "Select an attorney on your dashboard before uploading documents",
      });
    }

    const { docId, fileName, notes, extractedText } = req.body || {};
    if (!docId || !fileName) {
      return res.status(400).json({ message: "docId and fileName are required" });
    }

    const documents = buildDocumentChecklist(application.visaType, application.documents);
    const doc = documents.find((d) => d.docId === docId);
    if (!doc) return res.status(400).json({ message: "Unknown document type for this visa" });

    doc.fileName = String(fileName).trim();
    doc.notes = typeof notes === "string" ? notes.trim() : "";
    doc.extractedText = typeof extractedText === "string" ? extractedText.trim() : "";
    doc.status = "uploaded";
    doc.uploadedAt = new Date();

    application.documents = documents;
    await syncApplicationProgress(application);
    const afterPipeline = await maybeAutoRunPipeline(application);

    return res.json({ application: toApplicationResponse(afterPipeline) });
  } catch (error) {
    console.error("Document upload failed:", error);
    return res.status(500).json({ message: "Failed to save document" });
  }
});

app.post("/api/applications/:slug/pipeline/run", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const application = await Application.findOne({ slug: req.params.slug });
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await runPipelineForApplication(application);
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
    if (user.role !== "attorney") {
      return res.status(403).json({ message: "Attorney access required" });
    }

    const application = await Application.findOne({ slug: req.params.slug }).populate(
      "attorneyUserId",
      "fullName",
    );
    if (!application) return res.status(404).json({ message: "Application not found" });

    const assignedId =
      typeof application.attorneyUserId === "object" && application.attorneyUserId?._id
        ? application.attorneyUserId._id.toString()
        : application.attorneyUserId?.toString();

    if (!assignedId || assignedId !== user._id.toString()) {
      return res.status(403).json({ message: "This case is not assigned to you" });
    }

    const { approved, attorneyNotes } = req.body || {};
    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved (boolean) is required" });
    }

    if (application.pipeline?.status !== "awaiting_human") {
      return res.status(400).json({ message: "AI pipeline must complete before human review" });
    }

    const result = await submitHumanReview(application, {
      approved,
      attorneyNotes,
      attorneyUserId: user._id,
    });

    return res.json({
      application: toApplicationResponse(result.application),
      call: result.callResult,
    });
  } catch (error) {
    console.error("Human review failed:", error);
    return res.status(500).json({ message: "Human review failed" });
  }
});

app.get("/api/applications/:slug", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const application = await Application.findOne({ slug: req.params.slug }).populate(
      "attorneyUserId",
      "fullName",
    );
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (user.role === "user") {
      const owns =
        application.applicantUserId?.toString() === user._id.toString() ||
        application.applicantName === user.fullName;
      if (!owns) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (user.role === "attorney") {
      const assignedId =
        typeof application.attorneyUserId === "object" && application.attorneyUserId?._id
          ? application.attorneyUserId._id.toString()
          : application.attorneyUserId?.toString();
      if (!assignedId || assignedId !== user._id.toString()) {
        return res.status(403).json({ message: "This case is not assigned to you" });
      }
    }

    return res.json({ application: toApplicationResponse(application) });
  } catch (error) {
    console.error("Get application failed:", error);
    return res.status(500).json({ message: "Failed to load application" });
  }
});

async function start() {
  if (AUTH_MODE === "insecure") {
    console.warn("JWT_SECRET not set. Using insecure cookie auth for development.");
  }
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
  await mongoose.connect(MONGO_URL);
  console.log(`MongoDB connected: ${MONGO_URL}`);
  await seedVerifiedAttorneysIfEmpty();
  await seedApplicationsIfEmpty();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
