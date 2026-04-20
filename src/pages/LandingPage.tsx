import { ArrowRight, Bot, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Automated Document Parsing",
    description: "Upload case files and instantly extract key fields, entities, and missing items.",
    icon: FileSearch
  },
  {
    title: "Rule-based Visa Validation",
    description: "Apply visa specific checklists with AI and deterministic policy checks.",
    icon: ShieldCheck
  },
  {
    title: "Attorney Decision Support",
    description: "Receive confidence scores and recommended next actions before final review.",
    icon: Bot
  }
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero">
        <p className="eyebrow">Legal Operations Reimagined</p>
        <h1>AI-powered dashboard for faster visa case decisions.</h1>
        <p>
          Help attorneys reduce manual verification time, catch missing evidence early, and move cases
          forward with confidence.
        </p>
        <div className="hero-actions">
          <Link to="/app/dashboard" className="btn primary">
            Open Dashboard <ArrowRight size={16} />
          </Link>
          <a href="#workflow" className="btn ghost">
            View Workflow
          </a>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="feature-card">
              <Icon size={22} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section className="workflow" id="workflow">
        <h2>Workflow Snapshot</h2>
        <div className="flow-steps">
          <div>
            <span>1</span>{" "}
            Applicant uploads documents
          </div>
          <div>
            <span>2</span>{" "}
            AI parses, validates, and flags gaps
          </div>
          <div>
            <span>3</span>{" "}
            Attorney reviews recommendations
          </div>
          <div>
            <span>4</span>{" "}
            Case status and notifications sent
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <p>
          <CheckCircle2 size={18} /> Built for legal teams handling high-volume immigration workflows.
        </p>
      </section>
    </div>
  );
}
