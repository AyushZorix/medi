import { ExternalLink, FileSearch, FileUp, FileWarning, Scale, Users } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Cases Today", value: "12", icon: Scale },
  { label: "Documents Processed", value: "37", icon: FileUp },
  { label: "Missing Evidence Alerts", value: "5", icon: FileWarning },
  { label: "Attorneys Active", value: "4", icon: Users }
];

const visaLinks = [
  { title: "USCIS - Forms", href: "https://www.uscis.gov/forms/all-forms" },
  { title: "US Department of State - Visa", href: "https://travel.state.gov/content/travel/en/us-visas.html" },
  { title: "USCIS Policy Manual", href: "https://www.uscis.gov/policy-manual" },
  { title: "Immigration Court Practice Manual", href: "https://www.justice.gov/eoir/reference-materials" }
];

const recentCases = [
  { id: "C-101", applicant: "Rohan Mehta", status: "Needs Info", visa: "B-2" },
  { id: "C-102", applicant: "Anika Sharma", status: "Under Review", visa: "F-1" },
  { id: "C-103", applicant: "Dev Patel", status: "Approved", visa: "O-1" },
  { id: "C-104", applicant: "Nina Verma", status: "Under Review", visa: "H-1B" }
];

export function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <h1>Dashboard</h1>
        <p>Automate document checks and keep attorney decisions focused on high-value review.</p>
      </section>

      <section className="card-grid four">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="card metric">
              <Icon size={18} />
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
            </article>
          );
        })}
      </section>

      <section className="card-grid two">
        <article className="card upload">
          <h2>Document OCR</h2>
          <p>Open the OCR workspace to auto-rotate scans and extract text for downstream review.</p>
          <Link to="/app/documents" className="btn action cta-link">
            <FileSearch size={18} />
            Open OCR workspace
          </Link>
          <small>Image scans work best. PDFs and DOCX should be converted before OCR.</small>
        </article>

        <article className="card">
          <h2>Visa Requirement Links</h2>
          <ul className="link-list">
            {visaLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  <span>{link.title}</span>
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="card">
        <h2>Recent Cases</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Applicant</th>
              <th>Visa</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentCases.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.applicant}</td>
                <td>{item.visa}</td>
                <td>
                  <span className={`status ${item.status.split(" ").join("-").toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
