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
  notifyApplicantByPhone,
  triggerApplicantCall,
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
app.use((req, res, next) => {
  console.log(`[Express API] ${req.method} ${req.url}`);
  next();
});
app.use("/uploads/calls", express.static(path.join(__dirname, "uploads", "calls")));

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["attorney", "user"], default: "user" },
    attorneyVerified: { type: Boolean, default: false },
    attorneySpecialty: { type: String, trim: true, default: "" },
    attorneyVisaTypes: {
      type: [String],
      default: [],
    },
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
    submittedToAttorney: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
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
const ATTORNEY_VISA_TYPES = ["F-1", "O-1", "B-1/B-2"];

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
    attorneyVisaTypes: user.role === "attorney" ? (user.attorneyVisaTypes || []) : [],
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

function normalizeAttorneyVisaType(visaType) {
  if (visaType === "B-1" || visaType === "B-2") return "B-1/B-2";
  return ATTORNEY_VISA_TYPES.includes(visaType) ? visaType : null;
}

function normalizeAttorneyVisaTypes(input) {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .map((t) => normalizeAttorneyVisaType(String(t)))
    .filter(Boolean);
  return Array.from(new Set(normalized));
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
  const hasBalla = await User.findOne({ email: "balla@visaiq.demo" });
  if (count > 0 && hasBalla) return;

  const passwordHash = await bcrypt.hash("attorney123", 10);
  const attorneys = [
    {
      email: "balla@visaiq.demo",
      fullName: "Balla",
      attorneySpecialty: "O-1 & tech visas",
      attorneyVisaTypes: ["O-1"],
    },
    {
      email: "jordan.davis@visaiq.demo",
      fullName: "Jordan Davis",
      attorneySpecialty: "F-1 & O-1 visas",
      attorneyVisaTypes: ["F-1", "O-1"],
    },
    {
      email: "hannah.jones@visaiq.demo",
      fullName: "Hannah Jones",
      attorneySpecialty: "B-1/B-2 & family immigration",
      attorneyVisaTypes: ["B-1/B-2"],
    },
    {
      email: "priya.iyer@visaiq.demo",
      fullName: "Priya Iyer",
      attorneySpecialty: "Employment-based visas",
      attorneyVisaTypes: ["O-1", "F-1"],
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
          attorneyVisaTypes: a.attorneyVisaTypes,
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

function findApplicationQuery(slugOrId) {
  return mongoose.Types.ObjectId.isValid(slugOrId)
    ? { $or: [{ _id: slugOrId }, { slug: slugOrId }] }
    : { slug: slugOrId };
}

async function createApplicantApplication(user, visaType, phoneNumber, attorneyUserId) {
  const documents = buildDocumentChecklist(visaType, []);

  // Copy matching uploaded documents from user's other applications
  try {
    const otherApps = await Application.find({ applicantUserId: user._id });
    for (const otherApp of otherApps) {
      for (const otherDoc of otherApp.documents) {
        if (otherDoc.fileName && otherDoc.status !== "missing") {
          const match = documents.find(d => d.docId === otherDoc.docId);
          if (match && !match.fileName) {
            match.fileName = otherDoc.fileName;
            match.notes = otherDoc.notes;
            match.extractedText = otherDoc.extractedText;
            match.status = otherDoc.status;
            match.uploadedAt = otherDoc.uploadedAt;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to copy documents from other applications:", err);
  }

  const appObj = await Application.create({
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

  // Sync application progress to reflect copied documents in the overall progress score
  await syncApplicationProgress(appObj);
  return appObj;
}

async function getUserFromRequest(req) {
  const token = req.cookies?.visaiq_token;
  if (!token) return null;
  try {
    if (AUTH_MODE === "jwt") {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.sub && mongoose.Types.ObjectId.isValid(payload.sub)) {
        const user = await User.findById(payload.sub);
        return user || null;
      }
      return null;
    }
    if (mongoose.Types.ObjectId.isValid(token)) {
      const user = await User.findById(token);
      return user || null;
    }
    return null;
  } catch {
    return null;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

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
      attorneyVerified: safeRole === "attorney",
      attorneyVisaTypes: safeRole === "attorney"
        ? (normalizedVisaTypes.length ? normalizedVisaTypes : ATTORNEY_VISA_TYPES)
        : [],
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
    const { token: googleToken, role, attorneyVisaTypes } = req.body || {};
    if (!googleToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify token with Google's tokeninfo API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    if (!googleRes.ok) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const payload = await googleRes.json();
    
    // Validate client ID to prevent spoofing (strip single or double quotes if any)
    const expectedClientId = (process.env.GOOGLE_CLIENT_ID || "984146651145-dega19k07fismgo5r7eb69lni68jcfo1.apps.googleusercontent.com").replace(/^['"]|['"]$/g, "");
    const aud = String(payload.aud || "").replace(/^['"]|['"]$/g, "");
    if (aud !== expectedClientId) {
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
      const normalizedVisaTypes = normalizeAttorneyVisaTypes(attorneyVisaTypes);
      
      // Generate a random password hash since passwordHash is required
      const dummyPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const passwordHash = await bcrypt.hash(dummyPassword, 10);
      
      user = await User.create({
        email,
        passwordHash,
        fullName,
        role: safeRole,
        attorneyVerified: safeRole === "attorney",
        attorneyVisaTypes: safeRole === "attorney"
          ? (normalizedVisaTypes.length ? normalizedVisaTypes : ATTORNEY_VISA_TYPES)
          : [],
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

    const { search, visaType } = req.query;
    const query = { role: "attorney", attorneyVerified: true };
    const normalizedVisa = normalizeAttorneyVisaType(String(visaType || "").trim());
    if (normalizedVisa) {
      query.attorneyVisaTypes = normalizedVisa;
    }
    if (search) {
      const escapedSearch = String(search).replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: "i" } },
        { attorneySpecialty: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    const attorneys = await User.find(query)
      .select("fullName attorneySpecialty attorneyVisaTypes")
      .sort({ fullName: 1 });

    return res.json({
      attorneys: attorneys.map((a) => ({
        id: a._id.toString(),
        fullName: a.fullName,
        specialty: a.attorneySpecialty || "Immigration law",
        visaTypes: Array.isArray(a.attorneyVisaTypes) && a.attorneyVisaTypes.length
          ? a.attorneyVisaTypes
          : ATTORNEY_VISA_TYPES,
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
      const oldPhone = existing.phoneNumber;
      if (phone) {
        existing.phoneNumber = phone;
      }
      if (attorneyUserId) {
        const attorney = await resolveVerifiedAttorney(attorneyUserId);
        if (!attorney) {
          return res.status(400).json({ message: "Select a valid verified attorney" });
        }
        existing.attorneyUserId = attorney._id;
        existing.submittedToAttorney = true;
        existing.submittedAt = new Date();
        existing.status = "processing";
      }

      // Copy matching uploaded documents from user's other applications if missing here
      try {
        const otherApps = await Application.find({
          applicantUserId: user._id,
          _id: { $ne: existing._id }
        });
        const updatedDocs = [...existing.documents];
        let modified = false;
        for (const otherApp of otherApps) {
          for (const otherDoc of otherApp.documents) {
            if (otherDoc.fileName && otherDoc.status !== "missing") {
              const match = updatedDocs.find(d => d.docId === otherDoc.docId);
              if (match && (!match.fileName || match.status === "missing")) {
                match.fileName = otherDoc.fileName;
                match.notes = otherDoc.notes;
                match.extractedText = otherDoc.extractedText;
                match.status = otherDoc.status;
                match.uploadedAt = otherDoc.uploadedAt;
                modified = true;
              }
            }
          }
        }
        if (modified) {
          existing.documents = updatedDocs;
        }
      } catch (err) {
        console.error("Failed to copy documents to existing application:", err);
      }

      await existing.save();
      await syncApplicationProgress(existing);
      await existing.populate("attorneyUserId", "fullName");

      if (phone && oldPhone !== phone) {
        try {
          const callResult = await notifyApplicantByPhone(existing, "started");
          existing.callLog = [...(existing.callLog || []), callResult];
          await existing.save();
        } catch (callErr) {
          console.error("Confirmation call failed:", callErr);
        }
      }

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

    if (phone) {
      try {
        const callResult = await notifyApplicantByPhone(application, "started");
        application.callLog = [...(application.callLog || []), callResult];
        await application.save();
      } catch (callErr) {
        console.error("Confirmation call failed:", callErr);
      }
    }

    return res.status(201).json({ application: toApplicationResponse(application) });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const { visaType } = req.body || {};
      const existing = await Application.findOne({ applicantUserId: user._id, visaType }).populate("attorneyUserId", "fullName");
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

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate(
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

    if (!application.submittedToAttorney) {
      application.submittedToAttorney = true;
      application.submittedAt = new Date();
      application.status = "processing";
      application.updatedLabel = "just now";
    }
    await syncApplicationProgress(application);
    const afterPipeline = await maybeAutoRunPipeline(application);

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

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate("attorneyUserId", "fullName");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    application.submittedToAttorney = true;
    application.submittedAt = new Date();
    application.status = "processing";
    application.updatedLabel = "just now";
    await application.save();
    await application.populate("attorneyUserId", "fullName");

    return res.json({ application: toApplicationResponse(application) });
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

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate("attorneyUserId", "fullName");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (user.role === "user" && application.applicantUserId?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await runPipelineForApplication(application);
    await updated.populate("attorneyUserId", "fullName");
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

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate(
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

app.post("/api/applications/:slug/call", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "attorney") {
      return res.status(403).json({ message: "Attorney access required" });
    }

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate(
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

    const { script, phoneNumber } = req.body || {};
    if (!script || typeof script !== "string" || !script.trim()) {
      return res.status(400).json({ message: "A valid script string is required to call" });
    }

    if (phoneNumber && typeof phoneNumber === "string" && phoneNumber.trim()) {
      const normalized = normalizePhone(phoneNumber.trim());
      if (normalized) {
        application.phoneNumber = normalized;
        await application.save();
      }
    }

    const updated = await triggerApplicantCall(application, script.trim());
    if (updated.callLog?.length) {
      const last = updated.callLog[updated.callLog.length - 1];
      if (last?.skipped) {
        return res.status(400).json({ message: last.reason || "Call skipped" });
      }
      if (last?.error) {
        return res.status(500).json({ message: last.error || "Call failed" });
      }
    }
    return res.json({
      application: toApplicationResponse(updated),
      call: updated.callLog[updated.callLog.length - 1],
    });
  } catch (error) {
    console.error("Outbound custom call failed:", error);
    return res.status(500).json({ message: "Outbound custom call failed" });
  }
});

async function consolidateBallaAttorneys() {
  const attorneys = await User.find({ role: "attorney", fullName: /balla/i });
  if (attorneys.length <= 1) return;

  console.log(`[Consolidation] Found ${attorneys.length} duplicate Balla attorney accounts. Consolidating...`);
  // Let's pick b@g.com as the main one if it exists, otherwise balla@visaiq.demo, otherwise the first one
  const mainBalla = attorneys.find(a => a.email === "b@g.com") || attorneys.find(a => a.email === "balla@visaiq.demo") || attorneys[0];

  for (const duplicate of attorneys) {
    if (duplicate._id.toString() === mainBalla._id.toString()) continue;
    
    console.log(`[Consolidation] Transferring cases from duplicate Balla (${duplicate.email}) to main Balla (${mainBalla.email})...`);
    await Application.updateMany(
      { attorneyUserId: duplicate._id },
      { $set: { attorneyUserId: mainBalla._id } }
    );
    // Delete duplicate user
    await User.deleteOne({ _id: duplicate._id });
    console.log(`[Consolidation] Deleted duplicate attorney user: ${duplicate.email}`);
  }
}

async function seedApplicantAyushAndCase() {
  const balla = await User.findOne({ email: "b@g.com" }) || await User.findOne({ email: "balla@visaiq.demo" });
  if (!balla) {
    console.log("Warning: Balla not found, cannot seed Ayush case yet.");
    return;
  }

  let ayushUser = await User.findOne({ email: "ayush@visaiq.demo" });
  if (!ayushUser) {
    const passwordHash = await bcrypt.hash("user123", 10);
    ayushUser = await User.create({
      email: "ayush@visaiq.demo",
      fullName: "Ayush",
      role: "user",
      passwordHash,
    });
    console.log("Seeded applicant user Ayush (email: ayush@visaiq.demo, password: user123)");
  }

  let ayushApp = await Application.findOne({ applicantUserId: ayushUser._id, visaType: "O-1" });
  if (!ayushApp) {
    ayushApp = await Application.findOne({ slug: "ayush" });
  }

  if (!ayushApp) {
    const documents = buildDocumentChecklist("O-1", []);
    documents.forEach((doc, idx) => {
      if (idx < 2) {
        doc.fileName = `${doc.docId}-doc.pdf`;
        doc.status = "uploaded";
        doc.notes = "Extracted passport / resume text showing applicant credentials.";
      }
    });

    ayushApp = await Application.create({
      slug: "ayush",
      applicantName: "Ayush",
      visaType: "O-1",
      phoneNumber: "+15550199",
      attorneyUserId: balla._id,
      status: "needs_info",
      score: 42,
      updatedLabel: "just now",
      progress: {
        documentsReceived: 40,
        identityVerification: 42,
        financialReview: 45,
        finalDecision: 50,
      },
      documents,
      pipeline: {
        status: "awaiting_human",
        ranAt: new Date(),
        validator: {
          agent: "Validator",
          score: 42,
          summary: "O-1 extraordinary ability criteria missing or weak.",
          findings: [
            { type: "warning", message: "Passport validity expires in 3 months." }
          ],
          recommendation: "needs_info",
          confidence: 85,
        },
        consistency: {
          agent: "Consistency Check",
          score: 45,
          summary: "Resume timeline conflicts with educational degree graduation date.",
          findings: [
            { type: "error", message: "Resume shows work starting prior to degree graduation date." }
          ],
          recommendation: "needs_info",
          confidence: 90,
        },
        decider: {
          agent: "Decider",
          score: 42,
          summary: "AI recommends review or requesting additional evidence due to insufficient proof of national recognition.",
          recommendation: "needs_info",
          reasons: ["Gaps in extraordinary achievement documentation", "Low verification score"],
          confidence: 88,
        }
      },
      humanReview: {
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        attorneyNotes: "",
      },
      callLog: [],
      applicantUserId: ayushUser._id,
      submittedToAttorney: true,
      submittedAt: new Date(),
    });
    console.log("Seeded O-1 visa application for Ayush with AI score of 42 assigned to Balla.");
  } else {
    let changed = false;
    if (ayushApp.score !== 42) {
      ayushApp.score = 42;
      changed = true;
    }
    if (String(ayushApp.attorneyUserId || "") !== String(balla._id)) {
      ayushApp.attorneyUserId = balla._id;
      changed = true;
    }
    if (changed) {
      await ayushApp.save();
    }
  }
}

app.get("/api/applications/:slug", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const application = await Application.findOne(findApplicationQuery(req.params.slug)).populate(
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
  // Auto-verify all attorney accounts (e.g. registered ones)
  await User.updateMany({ role: "attorney" }, { $set: { attorneyVerified: true } });
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
