# MediCodio (Agent-Visa-Flow) Project Documentation

This repository contains the source code for the **MediCodio (Agent-Visa-Flow)** system. The project is an automated visa document processing and AI-driven vetting pipeline designed to streamline the visa application process. It provides dual-role access:
1. **Applicants** can start visa applications (F-1, O-1, B-1/B-2), upload required documents, extract document text using OCR (`Tesseract.js`), and track their vetting progress.
2. **Attorneys** can review the application details, inspect AI pipeline vetting results (Validator, Consistency, Decider scores), record manual review outcomes (Approval/Rejection), and invoke custom outbound phone calls to applicants.

---

## 📂 Project Folder Structure & Descriptions

* **[server/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server)**: Contains the backend service layer, database configurations, and AI agent pipeline.
  * **[server/index.mjs](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server/index.mjs)**: The main entry point for the Express API. It initializes the database connection, seeds demo data, handles authentication (JWT/Google Auth), manages document upload routing, and communicates with Supabase.
  * **[server/applicationService.mjs](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server/applicationService.mjs)**: Business logic layer managing application states, recalculating overall progress metrics, handling attorney assignments, and orchestrating workflow transitions.
  * **[server/pipeline.mjs](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server/pipeline.mjs)**: AI Agent Pipeline. Orchestrates three sequential LLM agents (Validator → Consistency → Decider) using the Gemini API (defaulting to OpenAI or structured heuristics if credentials are absent) to vet uploaded documents.
  * **[server/calls.mjs](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server/calls.mjs)**: Status call triggers. Uses Twilio Voice and ElevenLabs Conversational AI to place automated outbound phone updates to the applicant upon milestones.
  * **[server/visaDocuments.mjs](file:///Users/ayushbhandari/medi-new/agent-visa-flow/server/visaDocuments.mjs)**: Configuration module establishing the exact checklist of mandatory files for each visa type (F-1, O-1, B-1/B-2).
* **[src/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src)**: The React frontend application utilizing TanStack Start for server-side rendering (SSR) and routing.
  * **[src/routes/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/routes)**: Contains all file-based router pages:
    * **`portal.index.tsx`**, **`portal.documents.tsx`**, **`portal.application.tsx`**, **`portal.messages.tsx`**: Formulate the Applicant Portal layout where users configure their profile, complete uploads, and see call logs.
    * **`app.index.tsx`**, **`app.applications.tsx`**, **`app.documents.tsx`**, **`app.decisions.tsx`**, **`app.notifications.tsx`**: Formulate the Attorney Portal for examining applicant files, reading OCR outputs, tracking AI scores, and committing review decisions.
    * **`sign-in.tsx`**, **`login.tsx`**: Role-based access portals.
  * **[src/components/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/components)**: Responsive UI modules styled via Tailwind CSS v4 and Radix UI elements.
  * **[src/contexts/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/contexts)** / **[src/providers/](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/providers)**: App state providers, React Query setups, and theme wrappers.
  * **[src/server.ts](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/server.ts)** / **[src/start.ts](file:///Users/ayushbhandari/medi-new/agent-visa-flow/src/start.ts)**: Configured server-entry and client-entry scripts for SSR bundling.
* **Root Files**:
  * **[package.json](file:///Users/ayushbhandari/medi-new/agent-visa-flow/package.json)**: Scripts (`dev`, `build`, `dev:all`, `format`, `lint`) and lockfiles.
  * **[vite.config.ts](file:///Users/ayushbhandari/medi-new/agent-visa-flow/vite.config.ts)**: Bundling rules and plugins.
  * **[wrangler.jsonc](file:///Users/ayushbhandari/medi-new/agent-visa-flow/wrangler.jsonc)**: Cloudflare Worker serverless build profile.

---

# 📖 SYSTEM DESIGN DOCUMENT (LaTeX Draft)

The following sections contain the content structured for your **LaTeX document** under **Chapter: System Design**. It includes direct LaTeX blocks for your architecture, class details, sequence, database schema, state transition, and dataset descriptions.

---

```latex
\chapter{SYSTEM DESIGN}

This chapter gives a brief description about the implementation details of the MediCodio (Agent-Visa-Flow) system by describing each component along with its core algorithmic structures and sequence diagrams.

% =========================================================================
\section {Architecture of the system (explanation)}

The system is designed around a three-tier architecture:
\begin{enumerate}
    \item \textbf{Presentation Tier}: Built using React and TanStack Start, providing dynamic interfaces for applicants (document checklists, upload handlers, notifications) and attorneys (AI diagnostic dashboard, document viewer, manual overrides).
    \item \textbf{Application Tier (API \& AI Agents)}: Express server coordinating file OCR extraction (\texttt{Tesseract.js}) and a Multi-Agent LLM Vetting Pipeline. The pipeline triggers sequentially:
    \begin{itemize}
        \item \textbf{Validator Agent}: Assesses the presence and compliance of mandatory visa files.
        \item \textbf{Consistency Agent}: Cross-references critical parameters (Full Name, Date of Birth, Passport Numbers, SEVIS IDs) across all document texts to locate errors.
        \item \textbf{Decider Agent}: Formulates a recommendation (\textit{Approve}, \textit{Deny}, \textit{Needs Info}) along with a confidence rating.
    \end{itemize}
    Additionally, the Twilio/ElevenLabs integration coordinates status notification calls.
    \item \textbf{Data Tier}: Supabase cloud database hosting a PostgreSQL engine. It stores relational user profiles and handles semi-structured application metrics using JSONB documents.
\end{enumerate}

Algorithm \ref{vetting} shows the implementation details for the Multi-Agent Document Vetting and Decision Pipeline.

\begin{algorithm}
\caption{Multi-Agent Document Vetting and Decision Pipeline} \label{vetting}
\begin{algorithmic}[1]
\Require Application record $A$, set of uploaded documents $D$, visa checklist $C_V$
\Ensure Validation score $S_{val}$, consistency score $S_{cons}$, and AI recommendation $R_{rec}$
\State Let $D_{req} \subseteq D$ be the set of required documents for visa type $A.visaType$
\State Let $S_{val} \gets 100$, $S_{cons} \gets 100$, $Issues \gets \emptyset$
\For {each required document $d \in D_{req}$}
    \If {$d.fileName$ is null or empty}
        \State Mark $d.status \gets \text{"missing"}$
        \State $S_{val} \gets S_{val} - (100 / |D_{req}|)$
    \Else
        \State Extract text $T_d \gets \text{Run-OCR}(d)$
        \If {$T_d$ is empty}
            \State Flag warning: "OCR missing"
            \State $S_{val} \gets S_{val} - 80$
        \Else
            \State Verify key terms $K \gets \text{AnalyzeKeywords}(T_d, A.visaType)$
            \If {$K$ matches expected criteria}
                \State Mark $d.status \gets \text{"validated"}$
            \Else
                \State Mark $d.status \gets \text{"flagged"}$
                \State $S_{val} \gets S_{val} - 40$
            \EndIf
        \EndIf
    \EndIf
\EndFor
\For {each uploaded document $d \in D_{uploaded}$}
    \State Let $T_d$ be the extracted OCR text
    \If {$A.applicantName$ not referenced in $T_d$}
        \State Add (medium, "Name mismatch") to $Issues$
        \State $S_{cons} \gets S_{cons} - 10$
    \EndIf
    \If {$\text{DOB}(T_d) \neq \text{DOB}(T_{passport})$}
        \State Add (high, "DOB mismatch") to $Issues$
        \State $S_{cons} \gets S_{cons} - 20$
    \EndIf
    \If {$\text{PassportNo}(T_d) \neq \text{PassportNo}(T_{passport})$}
        \State Add (high, "Passport number mismatch") to $Issues$
        \State $S_{cons} \gets S_{cons} - 20$
    \EndIf
\EndFor
\State Let $AvgScore \gets \frac{S_{val} + S_{cons}}{2}$
\If {$S_{val} < 80$ \textbf{or} $S_{cons} < 80$ \textbf{or} $\exists$ high-severity issue in $Issues$}
    \State $R_{rec} \gets \text{"needs\_info"}$
\Else
    \State $R_{rec} \gets \text{"approve"}$
\EndIf
\State \Return $(S_{val}, S_{cons}, R_{rec})$
\end{algorithmic}
\end{algorithm}

% =========================================================================
\section {Class Diagram (with brief explanation)}

The system's database schema relies on relational database tables managed under PostgreSQL in Supabase. The model design consists of two main tables: \texttt{users} (handling profiles and authentication roles) and \texttt{applications} (encompassing visa type, scores, status, and JSONB columns for checklists, agent metrics, review records, and call logs).

Figure \ref{fig:class_diagram} illustrates the database tables and their mathematical model relationships:

\begin{figure}[h!]
\centering
% Insert class diagram graphic/TikZ code here
\includegraphics[width=0.85\textwidth]{class_diagram.png}
\caption{Database Schema Diagram of the MediCodio Supabase Tables}
\label{fig:class_diagram}
\end{figure}

Below is the brief explanation of the schema tables:
\begin{enumerate}
    \item \textbf{users}: Represents any registered user.
    \begin{itemize}
        \item \texttt{id} (UUID): Primary key.
        \item \texttt{email} (Text): Unique lowercase key.
        \item \texttt{password\_hash} (Text): Encrypted credential string.
        \item \texttt{role} (Text): Enforces \texttt{"attorney"} or \texttt{"user"}.
        \item \texttt{attorney\_verified} (Boolean): Verification status for attorney controls.
        \item \texttt{attorney\_specialty} (Text): Primary legal focus area.
        \item \texttt{attorney\_visa\_types} (Text[]): Array of allowed visa types the attorney can evaluate (e.g. F-1, O-1).
    \end{itemize}
    \item \textbf{applications}: Represents a visa application instance.
    \begin{itemize}
        \item \texttt{id} (UUID): Primary key.
        \item \texttt{slug} (Text): Unique URL-safe application locator.
        \item \texttt{applicant\_name} (Text): Full name of the applicant.
        \item \texttt{visa\_type} (Text): Visa categories: F-1, O-1, or B-1/B-2.
        \item \texttt{status} (Text): Vetting state: approved, processing, needs\_info, or rejected.
        \item \texttt{score} (Integer): Calculated aggregate pipeline quality score (0 to 100).
        \item \texttt{documents} (JSONB): List of document sub-objects representing uploaded files and OCR texts.
        \item \texttt{pipeline} (JSONB): Contains the diagnostic results from Validator, Consistency, and Decider agents.
        \item \texttt{human\_review} (JSONB): Stores manual review actions and overrides made by attorneys.
        \item \texttt{call\_log} (JSONB): Array of outbound Twilio/ElevenLabs call status and scripts.
    \end{itemize}
\end{enumerate}

% =========================================================================
\section {Sequence diagram (if applicable with brief explanation)}

The sequence diagram illustrates the lifecycle of a visa vetting process:
\begin{enumerate}
    \item \textbf{Initialization}: The applicant creates a new profile and triggers the application. The backend generates a checklist and dispatches a welcome status call.
    \item \textbf{Upload \& Extraction}: The applicant uploads files. The server parses text in the background via OCR.
    \item \textbf{Agent Analysis}: When the final required file is uploaded, the server invokes the Multi-Agent pipeline (Validator rules, Consistency details, Decider suggestions).
    \item \textbf{Attorney Assessment}: The attorney checks the pipeline dashboard, studies document scans, and overrides or confirms the recommendations.
    \item \textbf{Resolution Call}: The server notifies the applicant via Twilio/ElevenLabs outbound voice with attorney reasoning.
\end{enumerate}

Figure \ref{fig:seq_diagram} shows the sequence diagram of the processing steps.

\begin{figure}[h!]
\centering
\includegraphics[width=0.95\textwidth]{sequence_diagram.png}
\caption{System Vetting and Verification Sequence Diagram}
\label{fig:seq_diagram}
\end{figure}

% =========================================================================
\section {ER diagram and schema (if applicable with brief explanation)}

The Entity-Relationship diagram maps out the relational database schema under the PostgreSQL/Supabase environment. Although PostgreSQL is a relational database, components like checklists, pipeline stages, and call logs are embedded as JSONB columns within the \texttt{applications} table to leverage dynamic schemas while maintaining clear foreign key links for user relationships.

Figure \ref{fig:er_diagram} showcases the ER entities:
\begin{itemize}
    \item \textbf{users (1) to applications (N)}: A user of role \texttt{"user"} links via the foreign key \texttt{applicant_user_id} for multiple applications over time (constrained to one active application per visa category).
    \item \textbf{users (1) to applications (N)}: An attorney user links via the foreign key \texttt{attorney_user_id} as the assigned reviewer for multiple applicant workflows.
    \item \textbf{applications (1) to documents (JSONB)}: References the checklist documents array stored as structured JSONB.
    \item \textbf{applications (1) to call\_log (JSONB)}: Tracks outbound status calls within a JSONB array.
\end{itemize}

\begin{figure}[h!]
\centering
\includegraphics[width=0.85\textwidth]{er_diagram.png}
\caption{Entity-Relationship Model of the System}
\label{fig:er_diagram}
\end{figure}

% =========================================================================
\section {State transition diagram (if applicable)}

The application transitions through various states based on document upload status, AI execution outcome, and attorney reviews.

\begin{figure}[h!]
\centering
\includegraphics[width=0.85\textwidth]{state_diagram.png}
\caption{State Transition Model of Visa Application Object}
\label{fig:state_diagram}
\end{figure}

The state transition events are governed by the following actions:
\begin{enumerate}
    \item \textbf{Initiated}: Application is created (Status: \texttt{processing}). It stays in this state as long as some mandatory documents remain in the \texttt{"missing"} status.
    \item \textbf{Pipeline Running}: Triggered automatically when the last mandatory file is uploaded. The status remains \texttt{processing} while the three agents process OCR data.
    \item \textbf{Awaiting Review (Needs Info)}: Transitioned if the Decider Agent flags high-severity mismatches or issues (Status: \texttt{needs_info}).
    \item \textbf{Awaiting Review (Ready)}: Transitioned if the Decider Agent yields an approval recommendation (Status: \texttt{processing}).
    \item \textbf{Approved / Rejected}: Final terminal states triggered by the attorney submitting their manual review response.
\end{enumerate}

% =========================================================================
\section {Data Set Description (if applicable)}

The system relies on structured and unstructured datasets to feed the decision engine:
\begin{enumerate}
    \item \textbf{System Configurations}: A checklist repository matching visa types with mandatory items (e.g. F-1 academic visas demand SEVIS I-901 receipts and transcripts, while O-1 visas require extraordinary ability credentials and employment contracts).
    \item \textbf{Applicant Metadata}: JSON profiles including phone numbers, full names, visa types, and unique application slugs.
    \item \textbf{OCR Corpus (Document Text)}: Noisy text strings extracted via local OCR engine execution on uploaded PDF/PNG files. Contains candidate name patterns, date formats (DOB), and specific visa identifier patterns (SEVIS IDs like \texttt{"N0004705512"}, passport numbers).
    \item \textbf{Voice Synthesis Dataset}: Text scripts synthesized into verbal streams by the ElevenLabs API for simulated/live outbound calls.
\end{enumerate}

```
