# COMMUNICARE: AN AI-POWERED HEALTH ASSISTANT FOR PATIENTS WITH SPEECH IMPAIRMENT

---

**A Dissertation Submitted in Partial Fulfilment of the Requirements for the Degree of Bachelor of Science in Information Technology / Computer Science**

---

**Department of Computer Science and Information Technology**

**Faculty of Science and Technology**

---

**Academic Year: 2025/2026**

---

> *Note: Replace the bracketed fields on the title page with your institution's name, student number, supervisor name, and submission date. All other sections have been completed in full.*

---

## Declaration

I declare that this dissertation is my own original work and has not been submitted for any other degree or qualification. All sources used in this work have been acknowledged and properly cited in accordance with the APA 7th edition referencing style. Where the work of others has been referred to, it has been clearly indicated.

---

## Abstract

Patients who experience speech impairments — whether resulting from neurological conditions such as stroke or amyotrophic lateral sclerosis, developmental disorders, or traumatic brain injury — face profound challenges in communicating their health needs effectively to caregivers and clinicians. This communication barrier leads to incomplete clinical records, misdiagnoses, and reduced quality of care. Existing Augmentative and Alternative Communication (AAC) tools address expressive communication in isolation but remain largely disconnected from clinical documentation workflows.

This dissertation presents **CommuniCare**, a full-stack, web-based AI-powered health assistant designed to bridge the gap between patient self-expression and clinical documentation. The system integrates a structured tap-based communication board (48 items across four clinical categories), browser-native speech-to-text conversion for caregiver responses, and an AI-powered clinical summary generator driven by the Anthropic Claude API. An administrative approval and email-verification workflow governs caregiver onboarding, and a PDF export facility produces structured patient visit reports.

The system was designed following an Agile, phase-based software development methodology and implemented using React 18 on the frontend, Node.js with Express on the backend, and MySQL 8 as the relational database. A role-based authentication model — using JSON Web Tokens and bcrypt password hashing — enforces access boundaries across three user roles: Admin, Caregiver, and Patient.

Testing results confirmed that all seven functional objectives were met: caregivers authenticated through a verified approval workflow, patients communicated via the board interface, transcripts were captured accurately in real time, AI summaries reflected clinical-quality reasoning, and visit reports were exported as formatted PDFs. The system demonstrates how integrating AAC functionality with AI-driven clinical documentation produces a more holistic tool for managing the health interactions of speech-impaired patients.

**Keywords:** Augmentative and Alternative Communication, Artificial Intelligence, Large Language Models, Clinical Summary Generation, Speech-to-Text, Role-Based Access Control, Web Application Development, Healthcare Informatics

---

## Acknowledgements

I extend sincere gratitude to my academic supervisor for the guidance, critical feedback, and consistent support throughout this project. I also thank the Department of Computer Science and Information Technology for providing access to software resources and a structured research environment.

I am grateful to the open-source communities behind React, Node.js, Express, and MySQL, whose freely available tools and documentation made this implementation possible. I acknowledge Anthropic for providing accessible AI API services that powered the clinical summary engine at the core of this project.

Finally, I thank my family and peers for their encouragement during the research, design, and writing process.

---

## Table of Contents

1. Introduction
   - 1.1 Background and Context
   - 1.2 Problem Statement
   - 1.3 Aim of the Study
   - 1.4 Objectives of the Study
   - 1.5 Scope and Limitations
   - 1.6 Significance of the Study
   - 1.7 Structure of the Dissertation

2. Literature Review
   - 2.1 Speech Impairment: Prevalence and Impact on Healthcare
   - 2.2 Augmentative and Alternative Communication Technology
   - 2.3 Large Language Models in Clinical Healthcare
   - 2.4 Speech Recognition Technology in Health Settings
   - 2.5 Web-Based Health Information Systems
   - 2.6 Role-Based Access Control in Healthcare Applications
   - 2.7 Clinical Documentation and Structured Reporting
   - 2.8 Gaps in the Existing Literature

3. Research Methodology
   - 3.1 Research Design and Approach
   - 3.2 Development Methodology
   - 3.3 Requirements Engineering Process
   - 3.4 Technology Stack Selection and Justification
   - 3.5 Ethical Considerations

4. System Analysis and Design
   - 4.1 Functional Requirements
   - 4.2 Non-Functional Requirements
   - 4.3 Actor Identification and Use Case Analysis
   - 4.4 System Architecture
   - 4.5 Database Design
   - 4.6 RESTful API Design
   - 4.7 User Interface Design Principles

5. System Implementation
   - 5.1 Development Environment
   - 5.2 Backend Implementation
   - 5.3 Authentication and Caregiver Approval Workflow
   - 5.4 Frontend Implementation
   - 5.5 Communication Board Module
   - 5.6 Speech-to-Text Integration
   - 5.7 AI Clinical Summary Generation
   - 5.8 Administrative Dashboard
   - 5.9 PDF Report Export
   - 5.10 Implementation Challenges and Resolutions

6. Testing and Evaluation
   - 6.1 Testing Strategy
   - 6.2 Authentication and Authorisation Testing
   - 6.3 API Endpoint Testing
   - 6.4 Integration Testing
   - 6.5 Security Testing
   - 6.6 PDF Export Testing
   - 6.7 Evaluation Against Stated Objectives

7. Conclusion and Recommendations
   - 7.1 Summary of Achievements
   - 7.2 Limitations of the Study
   - 7.3 Recommendations for Future Work
   - 7.4 Concluding Remarks

8. References

9. Appendices

---

## List of Tables

- Table 1: Comparison of Existing AAC Systems
- Table 2: Functional Requirements Summary
- Table 3: Non-Functional Requirements Summary
- Table 4: Database Schema Overview
- Table 5: API Endpoint Reference
- Table 6: API Test Results Summary
- Table 7: Evaluation Against Objectives

---

## List of Figures

*(Figures are to be inserted at print/submission — described in text where referenced)*

- Figure 1: System Architecture Overview
- Figure 2: Entity-Relationship Diagram
- Figure 3: Caregiver Registration and Approval Workflow
- Figure 4: Communication Board Interface
- Figure 5: Visit Session Screen
- Figure 6: Admin Dashboard — Pending Approvals Tab
- Figure 7: Sample Generated PDF Report

---

---

# CHAPTER ONE: INTRODUCTION

---

## 1.1 Background and Context

Communication is the foundation of effective healthcare. When a patient cannot articulate symptoms, describe pain, or express emotional distress verbally, the entire clinical encounter is compromised. For the many millions of individuals living with speech impairments worldwide, this is a daily reality. According to the World Health Organization (2023), more than one billion people live with some form of disability, with communication disorders — including dysarthria, aphasia, apraxia of speech, and voice disorders — representing a significant subset of that population.

Speech impairment arises from a wide range of causes: neurological events such as stroke and traumatic brain injury, degenerative conditions such as amyotrophic lateral sclerosis (ALS) and Parkinson's disease, developmental conditions such as autism spectrum disorder and cerebral palsy, and structural damage to the vocal tract from surgery or injury. In each of these cases, the person retains cognitive awareness and the desire to communicate, but lacks a reliable physical mechanism for speech (World Health Organization, 2023).

Within clinical settings, this presents a serious challenge. A caregiver or nurse conducting a routine assessment depends heavily on the patient's verbal report: the location and intensity of pain, the presence of nausea, emotional distress signals, or changes in condition since the last visit. When speech is absent or severely impaired, these assessments rely on guesswork, third-party reports, or brief symptom checklists — all of which are poor substitutes for patient-directed communication (Moor et al., 2023).

Augmentative and Alternative Communication (AAC) technologies have long sought to address this gap. Low-tech approaches — such as alphabet boards, picture communication boards, and eye-gaze charts — provide patients with a non-verbal means of expressing basic needs (American Speech-Language-Hearing Association, 2023). High-tech AAC systems, such as dedicated speech-generating devices and tablet-based communication applications, extend this capability further, enabling pre-programmed phrase output, dynamic page navigation, and in some cases predictive symbol selection (Beukelman & Light, 2020).

However, despite decades of development, the majority of existing AAC tools operate in isolation from the clinical documentation systems used by healthcare providers. A patient may use a picture board to communicate pain during a visit, but the content of that communication is rarely captured in a structured, reusable format. The caregiver must manually translate the patient's selections into clinical language for the medical record — a time-consuming process that introduces the risk of omission or misinterpretation (Thirunavukarasu et al., 2023).

The emergence of large language models (LLMs) presents a transformative opportunity in this domain. Systems such as GPT-4 and Anthropic's Claude have demonstrated the capacity to process complex, multi-modal clinical inputs and produce coherent, clinically appropriate text summaries (Singhal et al., 2023; OpenAI, 2023). When applied to the outputs of an AAC session — selected board items, free text, and caregiver speech transcripts — an LLM can synthesise these inputs into a structured clinical note, reducing caregiver documentation burden and improving the quality and completeness of health records.

CommuniCare is a web-based platform developed to realise this integrated vision. It brings together a structured patient-facing communication board, caregiver speech-to-text conversion, AI-driven clinical summarisation, and administrative management tools into a single, cohesive system designed for use in care facilities, hospital wards, or home-care settings.

---

## 1.2 Problem Statement

Despite advances in both AAC technology and artificial intelligence, a fundamental gap persists: no widely accessible, integrated, web-based tool currently combines patient-directed AAC input, caregiver speech-to-text interaction, and AI-assisted clinical documentation in a single system that operates through standard web browsers without specialised hardware.

The specific problems this project addresses are as follows:

1. **Fragmented communication tools**: Existing AAC apps are designed primarily for communication, not for clinical documentation. Board selections are ephemeral — they are not persisted, tagged, or linked to a visit record in a medical system.

2. **Manual documentation burden**: Following visits with speech-impaired patients, caregivers must reconstruct what was communicated from memory or rough notes. This produces incomplete records and increases the risk of adverse clinical outcomes.

3. **Inaccessibility of AI tools**: Large language models capable of generating clinical summaries are accessible through developer APIs but have not been integrated into AAC-context tools in a form accessible to non-technical care providers.

4. **Lack of administrative governance**: Many simple healthcare tools lack mechanisms to verify caregiver credentials and manage user access, which introduces security and accountability risks in sensitive clinical environments.

5. **No structured visit lifecycle**: Without a system that links patient communication to a timestamped visit record, it is impossible to track the patient's clinical communication history over time.

CommuniCare addresses each of these problems through a phased system that captures communication, records it against a visit, generates a clinical summary, and maintains a full exportable history.

---

## 1.3 Aim of the Study

The aim of this study is to design, implement, and evaluate a full-stack web application that integrates AAC-style patient communication, caregiver speech-to-text transcription, AI-powered clinical note generation, and structured health record management into a single, accessible, role-governed platform for use in healthcare settings.

---

## 1.4 Objectives of the Study

In pursuit of this aim, the following specific objectives were set:

1. To analyse existing AAC technologies and AI-assisted documentation tools, identifying their capabilities, limitations, and the gaps that CommuniCare addresses.

2. To design and implement a secure, JWT-based authentication system with role-based access control, a caregiver registration approval workflow, and email verification.

3. To develop an interactive, patient-facing communication board with 48 selectable items across four clinical categories — body parts, needs, emotions, and symptoms — along with a free-text input fallback, with all selections persisted against a visit record.

4. To integrate the browser-native Web Speech API for real-time caregiver speech-to-text conversion, displaying transcripts in a large, high-contrast format for patient readability, and saving all transcripts to the database.

5. To implement an AI-powered clinical summary generator that aggregates board selections, free text, and speech transcripts from a visit and submits them to the Anthropic Claude API with a structured clinical prompt, persisting and displaying the resulting summary.

6. To build an administrative dashboard enabling admin users to review, approve, or reject pending caregiver registrations, and to manage existing caregiver accounts.

7. To enable the export of a patient's complete visit history — including board selections, speech logs, and AI summaries — as a formatted, downloadable PDF report.

---

## 1.5 Scope and Limitations

### Scope

The scope of CommuniCare is bounded as follows:

- The system is a **web-based application** accessible through modern desktop browsers (Chrome and Edge are fully supported; Firefox has limited speech recognition support due to Web Speech API availability).
- Three user roles are supported: **Admin**, **Caregiver**, and **Patient**. Patients do not hold login accounts; they interact with the system via the caregiver's device during a session.
- The system manages **patient records**, **visit sessions**, **board interaction data**, **caregiver speech transcripts**, and **AI-generated clinical summaries**.
- AI summarisation relies on the **Anthropic Claude API** and produces a single summary per visit upon request.
- PDF export is performed **client-side** using the jsPDF library.
- Email functionality uses **Nodemailer** with support for both Ethereal (development) and production SMTP configurations.

### Limitations

- The system does not integrate with any existing Electronic Health Record (EHR) system such as OpenMRS or OpenEMR.
- Speech recognition is dependent on browser support for the Web Speech API and is unavailable offline.
- AI summary quality depends on the richness of the data collected during the visit.
- The system is developed and tested in English only; internationalisation and multi-language support are outside the current scope.
- The current implementation does not handle real-time synchronisation across multiple devices during a single visit session.
- No mobile application is included; the system is optimised for desktop and tablet screen sizes.

---

## 1.6 Significance of the Study

This study holds significance on multiple levels:

**Clinical significance**: By connecting patient AAC interaction to a clinical documentation pipeline, CommuniCare reduces the information loss that occurs when a caregiver attempts to manually reconstruct what a speech-impaired patient communicated during a visit. The AI-generated clinical summary provides a consistent, structured report format that can supplement manual clinical notes.

**Technological significance**: The system demonstrates a novel integration pattern — combining browser-native speech recognition, a structured AAC interaction interface, and a large language model API within a single full-stack web application. This pattern is reusable and extensible, offering a template for future healthcare tool developers.

**Administrative significance**: The caregiver approval and email verification workflow addresses a genuine governance problem in small healthcare environments, where caregiver access to patient data is often uncontrolled. CommuniCare provides a lightweight but auditable access management system.

**Academic significance**: This project synthesises knowledge from multiple domains — healthcare informatics, artificial intelligence, software engineering, and human-computer interaction — and applies them to a real, underserved clinical problem, contributing to the growing body of research on AI-assisted assistive technology.

---

## 1.7 Structure of the Dissertation

This dissertation is organised into seven chapters:

- **Chapter 1 (Introduction)** establishes the context, problem statement, aim, objectives, scope, and significance of the study.
- **Chapter 2 (Literature Review)** surveys relevant prior work in AAC technology, LLMs in healthcare, speech recognition, web-based health systems, and clinical documentation.
- **Chapter 3 (Research Methodology)** details the research design, development methodology, requirements engineering process, technology selection rationale, and ethical considerations.
- **Chapter 4 (System Analysis and Design)** presents the functional and non-functional requirements, use case analysis, system architecture, database design, API structure, and UI design principles.
- **Chapter 5 (Implementation)** describes the actual development of each system module, noting key decisions, code structures, and implementation challenges encountered.
- **Chapter 6 (Testing and Evaluation)** documents the testing strategy, results across all major test categories, and a systematic evaluation of the system against the stated objectives.
- **Chapter 7 (Conclusion)** summarises the project achievements, acknowledges limitations, and proposes directions for future research and development.

---

---

# CHAPTER TWO: LITERATURE REVIEW

---

## 2.1 Speech Impairment: Prevalence and Impact on Healthcare

The World Health Organization (2023) estimates that over 1.5 billion people — nearly one in five of the global population — live with some form of hearing impairment, and a further significant proportion experience conditions affecting expressive speech. When hearing loss, voice disorders, dysarthria, aphasia, and communication conditions associated with developmental and neurological disorders are considered collectively, the number of individuals who face barriers to verbal communication in healthcare settings is substantial.

Aphasia, acquired following stroke or brain injury, affects approximately 2.5 million people in the United States alone, with approximately 180,000 new cases annually (American Speech-Language-Hearing Association, 2023). Dysarthria — a motor speech disorder resulting from neurological damage — is a common consequence of stroke, Parkinson's disease, multiple sclerosis, and cerebral palsy, collectively affecting tens of millions globally. In each of these populations, the individual retains intellectual capacity and the desire to communicate; what is impaired is the neuromuscular mechanism that converts thought into speech.

Within healthcare encounters, this produces demonstrable negative outcomes. Studies reviewed by Thirunavukarasu et al. (2023) highlight that communication barriers between patients and clinical staff are a leading contributor to medical errors, missed symptoms, and patient dissatisfaction. When a patient cannot verbally confirm or correct a clinician's assessment, the consultation shifts from collaborative to assumptive — with the clinician making inferences the patient has no reliable means to challenge.

From a human rights perspective, the United Nations Convention on the Rights of Persons with Disabilities (2006) affirms that persons with disabilities have the right to equal access to healthcare on the same basis as others. Communication barriers that prevent a patient from accurately reporting their condition to a clinician represent a direct violation of this right, one that AAC technology and AI-assisted documentation have the potential to partially redress.

---

## 2.2 Augmentative and Alternative Communication Technology

Augmentative and Alternative Communication refers to the full range of strategies, devices, and techniques used to supplement or replace natural speech for individuals who cannot meet their daily communication needs through speech alone (American Speech-Language-Hearing Association, 2023).

AAC systems are conventionally divided into two broad categories:

**Unaided systems** rely solely on the body — facial expressions, gestures, manual signs, and eye gaze — and require no external device. These are the most immediately available but offer limited vocabulary range and are highly dependent on the communication partner's familiarity with the system.

**Aided systems** involve external tools, subdivided into low-tech and high-tech categories. Low-tech tools include paper-based letter or picture boards, laminated card sets, and eye-gaze frames. High-tech tools include dedicated speech-generating devices (SGDs) and software applications running on tablets or computers.

The Proloquo2Go system (AssistiveWare), TouchChat HD (Saltillo Corporation), and Grid 3 (Smartbox) represent the current generation of high-tech AAC apps. These systems offer dynamic symbol sets, text-to-speech output, vocabulary prediction, and customisable grid layouts. Research has consistently supported their effectiveness: meta-analyses of single-case experimental research confirm that high-tech AAC interventions produce significant gains in communication outcomes for adults with complex communication needs (Ganz et al., 2023).

However, these systems share a fundamental design philosophy: they are communication tools, not documentation tools. When a patient using Proloquo2Go selects symbols to communicate pain during a medical visit, those selections are displayed and vocalised but are not automatically captured, timestamped, and stored in a clinical record linked to that patient's health history. The clinical utility of the interaction is limited to what the caregiver observes in the moment.

Furthermore, most high-tech AAC systems require dedicated device licenses, training, and configuration — creating barriers to adoption in resource-limited care environments. Web-based alternatives that run in a standard browser without installation represent a lower-barrier approach for healthcare facilities that cannot provision specialist devices for every patient room.

**Table 1: Comparison of Existing AAC Systems**

| System | Platform | Clinical Integration | AI Features | Cost | Web-Based |
|---|---|---|---|---|---|
| Proloquo2Go | iOS | None | None | Paid | No |
| TouchChat HD | iOS/Android | None | None | Paid | No |
| Grid 3 | Windows | Limited | None | Paid | No |
| LetMeTalk | Android | None | None | Free | No |
| CommuniCare | Web Browser | Full (visit-linked) | AI summaries | Open | Yes |

---

## 2.3 Large Language Models in Clinical Healthcare

The past three years have witnessed a profound shift in the capability of AI systems to process and generate natural language, particularly in clinical contexts. Large language models — trained on vast corpora of text including medical literature, clinical notes, and biomedical research — now demonstrate performance on standardised clinical assessments previously unachievable by machine systems.

Singhal et al. (2023) demonstrated that LLMs can encode substantial clinical knowledge, with their Med-PaLM 2 model achieving performance on medical question-answering benchmarks that approximated expert clinician accuracy. This study established that LLMs are not merely linguistic pattern matchers but genuinely encode domain-specific reasoning capabilities applicable to healthcare.

Moor et al. (2023) extended this argument in their comprehensive review of foundation models for generalist medical AI, proposing a framework in which a single large model, appropriately fine-tuned or prompted, could address a wide range of clinical tasks — from radiology report generation to differential diagnosis support. Their review noted that foundation models possess an inherent ability to synthesise heterogeneous inputs (text, structured data, images) into clinically coherent outputs.

Thirunavukarasu et al. (2023) surveyed applications of LLMs across the clinical pipeline, covering diagnosis support, documentation, patient education, and administrative tasks. They concluded that while LLMs exhibit remarkable language understanding and generation capabilities, responsible deployment requires clear delineation of use cases, robust validation against clinical ground truth, and appropriate human oversight. The clinical summary generation use case — where an LLM converts structured patient communication data into a natural language clinical note — falls within a relatively low-risk application domain, as the summary supplements but does not replace clinician judgement.

Kung et al. (2023) demonstrated that ChatGPT achieved passing performance on all three steps of the United States Medical Licensing Examination, performing at or near the 60% threshold required without any domain-specific training. This established that general-purpose LLMs encode sufficient medical knowledge for basic clinical reasoning tasks.

From an application perspective, Anthropic's Claude models — the AI backbone of CommuniCare — are built on Constitutional AI principles designed to produce responses that are helpful, harmless, and honest (Anthropic, 2023). The Claude API accepts a structured system prompt and user-provided context, making it well-suited to templated clinical summary generation where the prompt enforces clinical tone, structure, and appropriate hedging.

The use of LLMs for clinical note generation does not constitute a replacement for a clinician's assessment. Rather, it serves as an intelligent transcription and synthesis layer that converts the raw outputs of a patient-communication session into a structured, readable summary — reducing the cognitive burden on the caregiver and increasing the likelihood that key clinical details are preserved in the record.

---

## 2.4 Speech Recognition Technology in Health Settings

Automatic speech recognition (ASR) technology has been applied in clinical settings for several decades, most prominently through dictation systems used by physicians to generate clinical notes. Enterprise systems such as Nuance Dragon Medical have demonstrated high accuracy in clinical dictation environments and are now integrated into major EHR platforms (Moor et al., 2023).

Within web-based applications, the Web Speech API — standardised by the World Wide Web Consortium (W3C) and implemented natively in Google Chrome and Microsoft Edge — provides client-side speech recognition without server round-trips or cloud API dependencies. The API streams the audio from the device microphone to Google's speech recognition servers and returns a transcript in real time. This approach is suitable for non-sensitive dictation tasks where the speech content is immediately transcribed, displayed, and saved to a local system rather than retained by the ASR provider.

In the context of CommuniCare, speech-to-text is used not for patient speech (which is impaired by definition) but for caregiver speech. During a visit, the caregiver speaks questions, instructions, or assessments aloud; the Web Speech API transcribes this speech in real time and displays it in a large, high-contrast format on the screen for the patient to read. This creates a bidirectional communication channel: the patient communicates through the AAC board, and the caregiver communicates through spoken text rendered on screen.

The primary limitation of the Web Speech API in a healthcare context is its dependence on an internet connection and browser support. It is unavailable in Firefox and Safari at the time of this study, limiting deployment to Chrome and Edge browsers. For care environments with reliable internet access and standardised browser configurations, this limitation is manageable; for community or rural settings with intermittent connectivity, an offline fallback mechanism is necessary.

---

## 2.5 Web-Based Health Information Systems

The adoption of web technologies in healthcare has accelerated significantly over the past decade. Web-based health information systems offer several advantages over installed software: they require no client-side installation, receive updates centrally, are accessible from any device with a browser, and can be hosted on cloud infrastructure with high availability.

The MERN stack (MongoDB, Express, React, Node.js) and LAMP/LEMP stacks (Linux, Apache/Nginx, MySQL/MariaDB, PHP) are commonly used architectures for healthcare web applications. The selection of Node.js with Express for the backend and React for the frontend in CommuniCare reflects current industry trends toward JavaScript-centric full-stack development, which offers the advantages of a unified language ecosystem, a large package ecosystem (npm), and strong tooling support (Meta Platforms, 2023; OpenJS Foundation, 2023).

Relational databases remain the standard for structured health data due to their transactional guarantees, referential integrity enforcement, and compatibility with SQL-based analytics. MySQL 8 provides robust support for ENUM types, foreign key constraints, and datetime precision — all of which are used extensively in the CommuniCare schema (Oracle Corporation, 2023).

Security in web-based health systems is governed by established frameworks. The OWASP Top 10 (2021) identifies injection attacks, broken authentication, and security misconfiguration as the leading threats to web applications. CommuniCare addresses these through parameterised SQL queries (via `mysql2/promise`), JWT-based session management with role claims, bcrypt password hashing (cost factor 12), and environment variable separation of all secrets.

---

## 2.6 Role-Based Access Control in Healthcare Applications

Role-Based Access Control (RBAC) is a widely adopted access management model in which permissions are assigned to roles, and users are assigned to roles, rather than permissions being granted directly to individual users. In healthcare systems, RBAC is essential for enforcing the principle of least privilege: a nurse requires different data access than a physician, a physician requires different access than a billing clerk, and a system administrator requires different access than any clinical role (Auth0, 2023).

CommuniCare implements a simplified RBAC model with three roles: Admin, Caregiver, and Patient. The Admin role provides access to user management, pending approval queues, and read-only data views. The Caregiver role provides access to patient record management, visit sessions, board interactions, speech transcription, AI summaries, and PDF export. The Patient role is implicit — patients interact with the system through a caregiver's device during a live session and hold no login account.

JSON Web Tokens (JWTs) serve as the mechanism for carrying role information across HTTP requests. Upon login, the server generates a signed JWT containing the user's ID and role, which the client stores in memory (via React Context) and attaches as an Authorization header to all subsequent API requests. The server middleware verifies the token signature and role claim on each protected route before processing the request (Auth0, 2023).

An additional layer — the caregiver approval and email verification workflow — adds a pre-authentication governance step. New caregivers cannot log in until an administrator has explicitly approved their registration AND the caregiver has verified their email address via a time-limited token. This dual-gate approach is consistent with best practices for managing access to systems that process personal health information.

---

## 2.7 Clinical Documentation and Structured Reporting

Accurate clinical documentation is foundational to patient safety, continuity of care, legal accountability, and research. The shift from paper-based records to electronic health records (EHRs) has improved legibility and shareability but has simultaneously increased documentation burden on clinicians, with studies indicating that physicians spend up to half their working day on EHR documentation tasks (Moor et al., 2023).

AI-assisted documentation — in which a model automatically generates a structured clinical note from visit data — has been proposed as a solution to this burden. Early implementations used template-filling approaches; modern LLM-based approaches produce more naturalistic, contextually appropriate notes that require less manual editing (Thirunavukarasu et al., 2023).

CommuniCare's AI summary module follows this latter approach. The system collects all board selections, free-text inputs, and speech transcripts from a visit, formats them as structured context, and submits them to the Claude API with a carefully designed system prompt that specifies clinical tone, required content elements (presenting concern, communication modality, caregiver assessment, recommended follow-up), and hallucination-avoidance instructions. The resulting summary is stored in the `ai_summaries` table and displayed to the caregiver at the end of the visit.

The PDF export facility extends this documentation function by producing a formatted, printable report that includes patient demographic information, a chronological list of visits, board selection tables per visit, speech transcript excerpts, and the AI-generated summary. This report is suitable for inclusion in a physical patient file, referral letter, or clinical handover document.

---

## 2.8 Gaps in the Existing Literature

A review of the existing literature reveals the following specific gaps that CommuniCare addresses:

1. **Integration gap**: There is no widely documented web-based system that combines AAC board interaction, caregiver speech transcription, and AI clinical summary generation within a single visit-record-linked workflow. Existing systems address one or two of these elements in isolation.

2. **Documentation gap**: The majority of AAC research focuses on communication outcomes — what the patient was able to express — rather than on the clinical documentation that results from AAC-assisted interactions. CommuniCare's visit record architecture and AI summary module directly address this gap.

3. **Access governance gap**: Published AAC tools typically lack role-based access control and caregiver authentication mechanisms. In healthcare settings, where patient data is sensitive, this is a significant omission. CommuniCare's approval workflow and JWT authentication provide a lightweight but effective governance layer.

4. **Accessibility gap**: High-tech AAC systems are predominantly device-specific (iOS or Windows) and require paid licenses. A browser-based system that runs without installation on any connected device addresses the access gap for resource-constrained care environments.

5. **LLM integration gap**: While recent literature confirms the clinical capabilities of LLMs, there are few published implementations of LLM-driven summary generation within AAC-context health tools. CommuniCare provides a practical, working example of this integration pattern.

---

---

# CHAPTER THREE: RESEARCH METHODOLOGY

---

## 3.1 Research Design and Approach

This study adopts an **applied research** approach underpinned by the **Design Science Research Methodology (DSRM)** as articulated by Peffers et al. (2007). Design science research is characterised by the creation and evaluation of an artefact — in this case, a functional software system — as the primary research output. The artefact is not merely a proof of concept but a working system validated against defined requirements and evaluated for its contribution to the problem domain.

The research proceeds through six DSRM phases:

1. **Problem identification and motivation** — the clinical communication gap facing speech-impaired patients.
2. **Definition of objectives** — the seven functional objectives listed in Chapter 1.
3. **Design and development** — the phased implementation of CommuniCare.
4. **Demonstration** — the operation of the system through functional test scenarios.
5. **Evaluation** — systematic testing against requirements and objectives.
6. **Communication** — this dissertation.

This methodology is appropriate because the primary research question — "can an integrated web-based system improve clinical communication with speech-impaired patients through AI-assisted documentation?" — is best answered through the construction and evaluation of such a system rather than through observational or experimental study alone.

---

## 3.2 Development Methodology

The system was developed following an **Agile, phase-based methodology** structured into nine sequential phases, each with defined acceptance criteria before progression to the next:

| Phase | Focus | Key Deliverables |
|---|---|---|
| Phase 0 | Project Setup | Repository structure, health check endpoint, database configuration |
| Phase 1 | Authentication | User table, registration, login, JWT, RBAC, approval workflow, email verification |
| Phase 2 | Patient Records | Patient CRUD, visit initiation |
| Phase 3 | Communication Board | Board UI, selection persistence, free-text input |
| Phase 4 | Speech-to-Text | Web Speech API integration, transcript saving |
| Phase 5 | AI Summary | Claude API integration, prompt engineering, summary storage |
| Phase 6 | Admin Panel | Caregiver management, pending approvals, read-only views |
| Phase 7 | PDF Export | jsPDF report generation |
| Phase 8 | Polish | Error handling, responsive CSS, seed data, README |

This phase-gate approach ensured that each system layer was functional and tested before the next was built upon it, reducing integration risk and enabling clear acceptance criteria validation at each stage.

---

## 3.3 Requirements Engineering Process

Requirements were derived through a combination of:

1. **Domain analysis**: Review of existing AAC systems, healthcare documentation standards, and clinical communication literature.
2. **Actor identification**: Three actors (Admin, Caregiver, Patient) with distinct interaction patterns were identified and their information needs mapped.
3. **Functional decomposition**: Each actor's needs were decomposed into specific system functions (registration, approval, board interaction, transcription, etc.).
4. **Non-functional criteria elicitation**: Performance, security, usability, and reliability requirements were defined from healthcare IT best practice guidelines.

The resulting requirements were documented in a formal specification (Chapters 4.1 and 4.2) and used as the basis for both development and acceptance testing.

---

## 3.4 Technology Stack Selection and Justification

The following technology selection rationale guided implementation decisions:

**React 18 (Frontend)**: React's component-based architecture facilitates the development of complex, stateful user interfaces — including the multi-tab communication board, real-time speech transcript display, and dynamic patient/visit lists. The Context API provides lightweight global state management suitable for the authentication state shared across all components. Vite provides a fast development server and optimised production builds (Meta Platforms, 2023).

**Node.js 18 with Express 5 (Backend)**: Node.js enables JavaScript code sharing concepts across the full stack and provides excellent I/O performance for the API-centric server architecture required. Express's minimalist routing framework, combined with its middleware pipeline, is well-suited to implementing the layered authentication and authorisation logic. (OpenJS Foundation, 2023).

**MySQL 8 (Database)**: The structured, relational nature of the health data — with well-defined entity relationships between users, patients, visits, board selections, speech logs, and AI summaries — favours a relational database. MySQL 8's ENUM types, foreign key enforcement, and datetime handling match the specific schema requirements directly (Oracle Corporation, 2023).

**Anthropic Claude API**: Claude was selected over OpenAI's GPT API based on its Constitutional AI design principles, which produce outputs that are more calibrated and less prone to overconfident hallucination in clinical contexts — a critical consideration when the output is presented as a clinical summary (Anthropic, 2023).

**jsPDF + jspdf-autotable (PDF Export)**: Client-side PDF generation eliminates the need for a server-side rendering service and keeps the patient report generation self-contained within the browser. jsPDF provides full A4 document control, and jspdf-autotable formats board selection data into structured clinical tables.

**Nodemailer + Ethereal (Email)**: Nodemailer provides a transport-agnostic email sending library for Node.js. Ethereal provides a free, auto-provisioned test SMTP account for development that captures emails in a web inbox without delivering them, eliminating the need for production SMTP credentials during development.

---

## 3.5 Ethical Considerations

Although this project is a development study and does not involve primary human participants in clinical trials, the following ethical considerations were observed:

1. **Data minimisation**: The system collects only the data necessary for its stated functions. No patient biometric data, medical history beyond visit-specific notes, or payment information is collected.

2. **Security by design**: Password hashing (bcrypt, cost factor 12), JWT token expiry (8 hours), environment variable isolation of all secrets, and parameterised SQL queries are implemented as foundational architecture choices rather than after-thought additions.

3. **Consent-aware design**: The system architecture separates patient interaction (which occurs during a supervised session with a caregiver present) from any persistent patient account, recognising that patients with communication impairments may face challenges with standard digital consent flows.

4. **No real patient data in development**: All testing was conducted using seeded demo data (fictional patients and caregivers). No real patient records were created, stored, or used at any point in the development process.

5. **AI transparency**: The AI-generated clinical summary is clearly labelled as AI-generated in both the user interface and the exported PDF report, ensuring that recipients of the document are aware that it was produced by an automated system and should not be treated as a clinician-authored assessment.

---

---

# CHAPTER FOUR: SYSTEM ANALYSIS AND DESIGN

---

## 4.1 Functional Requirements

The following functional requirements define what the system does for each user role:

**Table 2: Functional Requirements Summary**

| ID | Actor | Requirement |
|---|---|---|
| FR-01 | Caregiver | Register an account with name, email, and password |
| FR-02 | System | Store registration with `is_approved=false`, `is_verified=false`; return pending message |
| FR-03 | Admin | View list of pending caregiver registrations |
| FR-04 | Admin | Approve a caregiver registration, triggering a verification email |
| FR-05 | Admin | Reject a caregiver registration |
| FR-06 | System | Send email verification link with 24-hour token upon admin approval |
| FR-07 | Caregiver | Verify email address by clicking the link |
| FR-08 | Caregiver | Log in with email and password; receive JWT upon success |
| FR-09 | System | Reject login with clear message if account is unapproved or unverified |
| FR-10 | Caregiver | View and edit own profile (name, email, password) |
| FR-11 | Caregiver | Create a patient record with demographic and medical note information |
| FR-12 | Caregiver | View list of own patients |
| FR-13 | Caregiver | Start a new visit session for a patient |
| FR-14 | Patient | Select items from the communication board during a visit |
| FR-15 | Patient | Type free text as an alternative to board selection |
| FR-16 | System | Save board selections and free text to `board_selections` linked to the active visit |
| FR-17 | Caregiver | Activate speech-to-text transcription via a microphone button |
| FR-18 | System | Display live speech transcript in large, high-contrast text |
| FR-19 | System | Save completed transcripts to `caregiver_speech_logs` linked to the visit |
| FR-20 | Caregiver | Trigger AI clinical summary generation for a completed visit |
| FR-21 | System | Aggregate visit data and submit to Claude API; store result in `ai_summaries` |
| FR-22 | Caregiver | View AI summary and all visit data after generation |
| FR-23 | Caregiver | Export a patient's full visit history as a downloadable PDF |
| FR-24 | Admin | View all caregiver accounts with ability to enable/disable and reset passwords |
| FR-25 | Admin | View all patients and visits (read-only) |

---

## 4.2 Non-Functional Requirements

**Table 3: Non-Functional Requirements Summary**

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | All passwords stored as bcrypt hashes (cost factor ≥ 10) |
| NFR-02 | Security | All API routes protected by JWT verification middleware |
| NFR-03 | Security | Role claims embedded in JWT; role verified server-side on every request |
| NFR-04 | Security | All database queries use parameterised statements to prevent SQL injection |
| NFR-05 | Security | Environment variables store all secrets; no hardcoded credentials in source code |
| NFR-06 | Usability | Patient-facing board items must be large, touch-friendly, and clearly labelled |
| NFR-07 | Usability | Caregiver speech transcript displayed at minimum 2rem font size for patient readability |
| NFR-08 | Usability | System provides clear error messages for all failure states (login failures, API errors, etc.) |
| NFR-09 | Performance | API responses for standard queries (patient list, visit list) complete within 500ms on a local network |
| NFR-10 | Reliability | Database connection pool handles reconnection on transient failures |
| NFR-11 | Maintainability | Code organised in MVC pattern (models, controllers, routes) on the backend |
| NFR-12 | Compatibility | Frontend functions correctly in Chrome 110+ and Edge 110+ |
| NFR-13 | Accessibility | Admin dashboard provides specific feedback messages (approved, rejected) rather than generic alerts |

---

## 4.3 Actor Identification and Use Case Analysis

Three primary actors interact with the CommuniCare system:

**Admin**: A healthcare facility administrator who manages system access. The Admin does not interact with clinical data except in a read-only supervisory capacity. Core use cases: review pending registrations, approve or reject caregivers, enable/disable accounts, reset passwords, view patient and visit data.

**Caregiver**: A healthcare professional (nurse, carer, occupational therapist) who manages patient records and conducts visit sessions. The Caregiver is the primary clinical user of the system. Core use cases: register, authenticate, manage patient profiles, conduct visit sessions, generate AI summaries, export PDF reports.

**Patient**: A person with speech impairment who participates in a visit session via the caregiver's device. The Patient does not hold an account and does not log in. Core use cases: tap board items, submit free text, read caregiver speech transcripts on screen.

**Key Use Case Descriptions:**

**UC-01: Caregiver Registration and Approval**
- Actor: Caregiver, Admin, System
- Precondition: Caregiver has not previously registered
- Flow: Caregiver submits registration form → System creates account (`is_approved=false`, `is_verified=false`) → Admin reviews pending list → Admin approves → System sends verification email → Caregiver clicks link → `is_verified=true` → Caregiver logs in
- Postcondition: Caregiver holds an active JWT session

**UC-02: Conduct Visit Session**
- Actor: Caregiver, Patient
- Precondition: Caregiver is authenticated; at least one patient record exists
- Flow: Caregiver opens patient record → Starts visit → Patient taps board items / types free text → Caregiver activates speech-to-text → System displays transcript → Caregiver saves session
- Postcondition: Board selections and speech logs are saved against the visit record

**UC-03: Generate AI Clinical Summary**
- Actor: Caregiver
- Precondition: Visit session has at least some board or speech data
- Flow: Caregiver clicks "Generate Summary" → System aggregates all visit data → Sends to Claude API with clinical prompt → Receives and stores summary → Displays to caregiver
- Postcondition: `ai_summaries` record created for the visit

**UC-04: Export PDF Report**
- Actor: Caregiver
- Precondition: Patient has at least one visit record
- Flow: Caregiver clicks "Export PDF" on patient profile → System fetches full patient+visit data → `buildPatientReport()` generates A4 PDF in browser → File downloads automatically
- Postcondition: PDF file saved to caregiver's device

---

## 4.4 System Architecture

CommuniCare follows a **three-tier client-server architecture**:

**Presentation Tier (Client)**: A React 18 single-page application served by the Vite development server (port 5173 in development). The SPA communicates with the API tier exclusively via Axios HTTP requests. React Router manages client-side navigation, and the `AuthContext` provides global authentication state.

**Application Tier (Server)**: A Node.js 18 + Express 5 API server (port 5000) organised in an MVC pattern. The server exposes a RESTful JSON API with route groups for authentication (`/api/auth`), caregivers (`/api/caregiver`), patients (`/api/patients`), visits (`/api/visits`), board (`/api/board`), speech (`/api/speech`), AI summary (`/api/summary`), and admin (`/api/admin`). Middleware layers handle JWT verification, role authorisation, request parsing, and error formatting.

**Data Tier (Database)**: A MySQL 8 relational database (port 3306, managed via XAMPP in development). The `mysql2/promise` library provides an async connection pool. Six tables store all application data. No ORM is used; queries are written in raw SQL with parameterised statements.

**External Services**: The Anthropic Claude API is called server-side during AI summary generation, keeping the API key out of the browser. The Nodemailer email service is called server-side during caregiver approval, with email content including the verification deep link.

---

## 4.5 Database Design

The database schema consists of six tables, designed to minimise redundancy while capturing the complete lifecycle of a patient-caregiver interaction:

**Table 4: Database Schema Overview**

| Table | Purpose | Key Relationships |
|---|---|---|
| `users` | Stores all system accounts (Admin, Caregiver) | Referenced by `patients.caregiver_id`, `visits.caregiver_id` |
| `patients` | Stores patient demographic and clinical note data | FK to `users` (caregiver), FK to `visits` |
| `visits` | Represents a single care encounter session | FK to `patients`, FK to `users` (caregiver) |
| `board_selections` | Individual items selected by the patient during a visit | FK to `visits` |
| `caregiver_speech_logs` | Transcripts of caregiver speech during a visit | FK to `visits` |
| `ai_summaries` | AI-generated clinical summaries per visit | FK to `visits` |

**Schema Detail:**

```sql
users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','caregiver','admin') DEFAULT 'caregiver',
  status ENUM('active','disabled','rejected') DEFAULT 'active',
  is_approved TINYINT(1) DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(128) NULL,
  verification_token_expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  full_name VARCHAR(255) NOT NULL,
  age INT NULL,
  gender VARCHAR(50) NULL,
  caregiver_id INT NOT NULL, -- FK → users.id
  medical_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

visits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL, -- FK → patients.id
  caregiver_id INT NOT NULL, -- FK → users.id
  visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('open','closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

board_selections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  visit_id INT NOT NULL, -- FK → visits.id
  category ENUM('body_part','need','emotion','symptom','free_text'),
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

caregiver_speech_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  visit_id INT NOT NULL, -- FK → visits.id
  transcript_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

ai_summaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  visit_id INT NOT NULL, -- FK → visits.id
  summary_text TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

The `is_approved` and `is_verified` columns in `users`, along with `verification_token` and `verification_token_expires_at`, were added via a migration script (`migrateApproval.js`) applied after initial schema creation. This approach preserves existing data and allows safe re-execution.

---

## 4.6 RESTful API Design

The API follows REST principles: resources are represented as nouns in the URL path, HTTP verbs encode the operation type (GET for retrieval, POST for creation, PUT/PATCH for update, DELETE for removal), and responses use standard HTTP status codes.

All authenticated endpoints require a valid JWT in the `Authorization: Bearer <token>` header. Role-specific endpoints additionally verify the role claim within the token against the required role before executing the handler.

**Table 5: API Endpoint Reference (Selected)**

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create caregiver account |
| POST | /api/auth/login | Public | Authenticate and receive JWT |
| GET | /api/auth/verify?token= | Public | Verify email address |
| GET | /api/auth/me | Any | Return current user profile |
| PUT | /api/caregiver/me | Caregiver | Update own profile |
| GET | /api/patients | Caregiver | List own patients |
| POST | /api/patients | Caregiver | Create patient |
| GET | /api/patients/:id/report | Caregiver, Admin | Full visit report data |
| POST | /api/visits | Caregiver | Start visit |
| PATCH | /api/visits/:id/close | Caregiver | Close visit |
| POST | /api/board/visit/:id | Caregiver | Save board selections |
| POST | /api/speech/visit/:id | Caregiver | Save speech transcript |
| POST | /api/summary/visit/:id | Caregiver | Generate AI summary |
| GET | /api/admin/caregivers/pending | Admin | Pending approval queue |
| PATCH | /api/admin/caregivers/:id/approve | Admin | Approve caregiver |
| PATCH | /api/admin/caregivers/:id/reject | Admin | Reject caregiver |
| PATCH | /api/admin/caregivers/:id/status | Admin | Enable/disable account |

---

## 4.7 User Interface Design Principles

The UI design of CommuniCare was guided by the following principles:

**Dual-audience design**: Each visit session screen serves two users simultaneously — the caregiver (who controls the session) and the patient (who reads from it). Patient-facing content (speech transcript, board confirmation display) uses large fonts (minimum 2rem), high contrast (white text on dark blue), and generous touch targets to maximise readability for users with motor and visual differences.

**Role-appropriate information density**: The caregiver dashboard presents structured data tables with action buttons and form overlays, appropriate for a trained professional who needs to manage multiple patients and visits. The patient-facing board uses a simple grid of large labelled tiles with clear icons, minimising cognitive load.

**Consistent visual language**: A navy-blue primary palette (`#0f172a`, `#1e3a5f`) and green accent (`#22c55e`) are applied consistently across all authenticated views, reinforcing system identity and role context.

**Accessibility**: The communication board tiles are sized at minimum 80×80px, with clear category labels, appropriate colour coding per category, and text labels accompanying any symbols. The AI summary and PDF report are clearly marked as AI-generated to maintain transparency.

**Responsive layout**: The application uses CSS Flexbox and Grid layouts with `flexWrap` and media query breakpoints to ensure usability on tablet-sized screens (768px+) as well as desktop monitors.

---

---

# CHAPTER FIVE: SYSTEM IMPLEMENTATION

---

## 5.1 Development Environment

The CommuniCare system was developed on a Windows 10 machine using the following environment:

- **Code editor**: Visual Studio Code 1.89 with ESLint and Prettier extensions
- **Local server**: XAMPP 8.2.4 (Apache + MySQL 8.0)
- **Node.js**: Version 18 LTS
- **Package manager**: npm 10
- **Browser**: Google Chrome (primary), Microsoft Edge (secondary)
- **API testing**: PowerShell `Invoke-WebRequest` for backend endpoint testing

The repository was structured with two top-level directories: `/client` (React frontend) and `/server` (Express backend), each with their own `package.json`.

---

## 5.2 Backend Implementation

The Express server is initialised in `server/index.js`, which loads environment variables via `dotenv`, configures middleware (CORS, `express.json()`), mounts route groups, and starts the HTTP listener on `process.env.PORT` (defaulting to 5000).

The backend follows a strict MVC separation:

- `/server/models/` — database query functions (e.g., `userModel.js`, `patientModel.js`)
- `/server/controllers/` — request handler functions that call models and format responses
- `/server/routes/` — Express Router instances that map HTTP methods and paths to controller functions
- `/server/middleware/` — reusable middleware (JWT authentication, role authorisation)
- `/server/config/` — database connection pool, initialisation scripts, migration scripts

The database connection pool is initialised once in `server/config/db.js` using `mysql2/promise`, exporting the pool instance for use across all model files. This ensures that connections are reused efficiently rather than opened and closed per request.

Global error handling is provided by an Express error-handling middleware registered at the end of the middleware chain, which catches any error passed to `next(err)` from any route handler and returns a formatted JSON error response.

---

## 5.3 Authentication and Caregiver Approval Workflow

The authentication system in CommuniCare is designed around a five-step lifecycle for caregiver accounts:

**Step 1 — Registration**: `POST /api/auth/register` accepts `{ name, email, password }`. The password is hashed with bcrypt (cost factor 12) and stored in the `users` table with `is_approved=false`, `is_verified=false`, `role='caregiver'`, `status='active'`. No JWT is issued; the response returns an HTTP 201 with a message informing the caregiver that their registration is under review.

**Step 2 — Pending Review**: The admin accesses `GET /api/admin/caregivers/pending`, which returns all users with `is_approved=false` and `status='active'` (excluding rejected accounts). The Admin Dashboard displays this list with Approve and Reject buttons.

**Step 3 — Admin Approval**: `PATCH /api/admin/caregivers/:id/approve` sets `is_approved=true`, generates a cryptographically random 64-character hex token (via `crypto.randomBytes(32).toString('hex')`), stores it in `verification_token` with an expiry 24 hours in the future, and triggers the Nodemailer email containing a verification link of the form `{APP_URL}/verify?token={token}`.

**Step 4 — Email Verification**: `GET /api/auth/verify?token=` looks up the token in the database, checks that it has not expired, sets `is_verified=true`, and clears the token fields.

**Step 5 — Login**: `POST /api/auth/login` verifies the password with `bcrypt.compare`, then checks `is_approved` and `is_verified` in sequence, returning specific error messages for each failure case. If both checks pass, a JWT is signed containing `{ id, role }` with an 8-hour expiry and returned in the response.

This workflow is enforced by the `authenticate` middleware (JWT verification) and `requireRole(role)` middleware (role claim check), applied as route-level middleware arrays on all protected endpoints.

---

## 5.4 Frontend Implementation

The React 18 frontend is bootstrapped with Vite and structured as follows:

- `/client/src/context/AuthContext.jsx` — React Context providing `user`, `token`, `login()`, `logout()`, and `loading` to all child components
- `/client/src/components/ProtectedRoute.jsx` — Wraps route elements, redirects unauthenticated users to `/login` and users with incorrect roles to `/login`
- `/client/src/api/client.js` — Axios instance pre-configured with `baseURL` (`/api`) and a request interceptor that attaches the JWT from `localStorage` as the `Authorization` header
- `/client/src/pages/` — Page-level components for Login, Register, VerifyEmail, CaregiverDashboard, PatientDetail, VisitSession, AdminDashboard, NotFound
- `/client/src/components/` — Shared components: Navbar, SpeechTab, ErrorBoundary

React Router v6 manages all client-side navigation. The route configuration in `App.jsx` uses the `ProtectedRoute` wrapper to enforce authentication and role requirements at the routing level. Admin-only pages are accessible only when the authenticated user's role is `'admin'`; caregiver-only pages similarly enforce the `'caregiver'` role.

The `AuthContext` persists the JWT in `localStorage`, allowing the session to survive page refreshes. On application load, the context attempts to restore the session by calling `GET /api/auth/me` with the stored token; if the token is invalid or expired, the user is redirected to the login page.

---

## 5.5 Communication Board Module

The communication board is the patient-facing input mechanism during an active visit session. The board is implemented as a grid of selectable tiles within the `VisitSession.jsx` page component.

The board dataset (`/client/src/data/boardItems.js`) contains 48 items distributed across four categories:

- **Body Parts** (12 items): Head, Chest, Abdomen, Back, Arm, Leg, Hand, Foot, Neck, Hip, Face, Eye
- **Needs** (12 items): Water, Food, Bathroom, Rest, Medicine, Help, Cold, Hot, Sit, Stand, Call, Quiet
- **Emotions** (12 items): Pain, Dizzy, Tired, Anxious, Confused, Happy, Sad, Frustrated, Scared, Nauseous, Itchy, Numb
- **Symptoms** (12 items): Headache, Shortness of Breath, Chest Pain, Vomiting, Fever, Shaking, Swelling, Bleeding, Pressure, Weakness, Rash, Blurred Vision

Each tile displays a category-appropriate emoji and a text label. When a patient taps a tile, the selection is added to a running list displayed below the board. The free-text input tab allows the patient to type directly, with the text treated as a `free_text` category selection.

When the caregiver clicks "Save Selections", the frontend sends a `POST /api/board/visit/:id` request with the full array of selections. The server inserts each selection as a separate row in `board_selections` with its `category`, `label`, and `visit_id`.

---

## 5.6 Speech-to-Text Integration

The speech-to-text module is implemented in `SpeechTab.jsx` using the browser's native `window.SpeechRecognition` API (with a `webkitSpeechRecognition` prefix fallback for Chrome). The component checks for API availability on mount and displays a "not supported" message in browsers where the API is absent.

The recognition instance is configured with `continuous=true` (keeps listening after each pause) and `interimResults=true` (streams partial results in real time). The `onresult` event handler separates interim results (displayed in a lighter colour) from final results (confirmed transcription), concatenating all final results into a growing transcript string.

The transcript is displayed in a styled div with a minimum font size of 2rem, high-contrast white text on a dark background, optimised for readability by the patient sitting across from the screen. A "Save Transcript" button triggers `POST /api/speech/visit/:id` with the full transcript text, creating a row in `caregiver_speech_logs`.

In the event that the browser does not support the Web Speech API — a realistic scenario in Firefox or in environments where the API has been disabled — the caregiver is prompted to type their transcript manually into a text area, which is saved via the same endpoint.

---

## 5.7 AI Clinical Summary Generation

The AI summary module connects the aggregated visit data to the Anthropic Claude API to produce a clinical-quality narrative summary.

**Data Aggregation**: The server-side `summaryController.js` queries all `board_selections` and `caregiver_speech_logs` for the given `visit_id`, then formats them into structured text blocks. Board selections are grouped by category and listed as comma-separated labels; speech logs are listed as timestamped transcript excerpts.

**Prompt Engineering**: The system prompt instructs Claude to act as a clinical documentation assistant, producing a structured clinical note in the format: (1) Presenting Concern, (2) Communication Method Used, (3) Patient-Expressed Symptoms and Needs, (4) Caregiver Assessment (from transcripts), (5) Recommended Follow-Up Actions. The prompt includes explicit instructions to avoid speculative diagnoses, to note when information is AI-inferred rather than directly stated, and to maintain formal clinical language.

**API Call**: The Anthropic SDK (`@anthropic-ai/sdk`) is used server-side to send the formatted context and system prompt to `claude-opus-4-5`. The response is extracted from `response.content[0].text` and stored in the `ai_summaries` table linked to the visit.

**Display**: The generated summary is displayed to the caregiver in a styled summary panel within the visit session view. It is also included in the PDF export for that visit.

---

## 5.8 Administrative Dashboard

The Admin Dashboard (`AdminDashboard.jsx`) is accessible at both `/admin` and `/admin/dashboard` — the latter path opens the dashboard with the Pending Approvals tab pre-selected.

The dashboard presents four tabs:

**Pending Approvals Tab**: Displays all caregivers with `is_approved=false` and `status='active'`. Each card shows the caregiver's name, email, and registration date, with Approve and Reject action buttons. The tab label includes a live badge showing the count of pending registrations (e.g., `⏳ Pending (3)`). After each action, the pending list refreshes automatically via a separate API call.

**Caregivers Tab**: Lists all registered caregivers with their status (Active, Disabled, Rejected). Action buttons enable/disable accounts and open a reset-password modal. The modal requires a new password input of at least 6 characters and calls `PATCH /api/admin/caregivers/:id/reset-password`.

**Patients Tab**: Read-only view of all patients across all caregivers, showing name, age, gender, assigned caregiver, visit count, and registration date.

**Visits Tab**: Read-only view of all visits, showing patient name, caregiver name, date/time, and status.

A statistics bar at the top of the dashboard displays real-time counts for Pending, Caregivers, Active, Disabled, Patients, and Visits — giving the administrator an at-a-glance overview of system usage.

---

## 5.9 PDF Report Export

The PDF export is handled entirely client-side by `buildPatientReport.js`, using jsPDF 4.x and jspdf-autotable 5.x.

The generated PDF follows an A4 portrait format and includes:

1. **Header banner**: Navy-blue full-width bar with the CommuniCare logo, report title, and report date.
2. **Patient information card**: Full name, age, gender, medical notes, and total visit count on a light-grey background.
3. **Visit sections**: One section per visit, each containing:
   - Visit header bar (visit number, date/time, status, caregiver name)
   - Board selections table (category → items, formatted via jspdf-autotable)
   - Speech transcript block (each log entry as a quoted paragraph)
   - AI summary box (light purple background, clearly labelled as AI-generated)
   - "No AI summary generated" note if no summary exists
4. **Page footer**: Report attribution and page number on every page.

The file is automatically named `CommuniCare_{PatientName}_{Date}.pdf` and downloaded via `doc.save(filename)`.

---

## 5.10 Implementation Challenges and Resolutions

**Challenge 1: jspdf-autotable v5 Breaking Change**

Version 5 of `jspdf-autotable` changed the timing of when `doc.lastAutoTable` is populated. In previous versions, this property was accessible inside the `didDrawPage` callback during table rendering. In v5, it is only set after `autoTable()` returns completely. The original code:

```javascript
didDrawPage: () => { y = doc.lastAutoTable.finalY + 6; drawPageFooter(); }
```

crashed with `TypeError: Cannot read properties of undefined (reading 'finalY')` because `doc.lastAutoTable` was `undefined` during the callback. The resolution was to remove the `y` update from the callback (the same update already existed on the line after `autoTable()` returned) and use the callback solely for footer drawing:

```javascript
didDrawPage: () => { drawPageFooter(); }
```

**Challenge 2: PowerShell Syntax Compatibility**

The Windows PowerShell environment does not support the `&&` command chaining operator used in Unix shell scripts. During development, all multi-step commands required adjustment to use the PowerShell `;` separator or sequential invocations.

**Challenge 3: Port Conflicts During Development**

When the Node.js server was restarted without first terminating the previous process, the port remained occupied, causing new server instances to fail silently or bind to a different port. The resolution involved explicitly identifying and terminating the process holding port 5000 before each restart.

**Challenge 4: Ethereal Email URL Capture**

The Ethereal email preview URL — printed by the server after sending a verification email — was not visible in the development terminal due to process management settings. The resolution was to ensure the server terminal was monitored directly when testing the approval flow.

---

---

# CHAPTER SIX: TESTING AND EVALUATION

---

## 6.1 Testing Strategy

Testing of CommuniCare was conducted at four levels:

1. **API/Unit Testing**: Each backend endpoint was tested individually using PowerShell `Invoke-WebRequest` commands, verifying correct HTTP status codes, response payloads, and database state changes.
2. **Integration Testing**: Multi-step workflows (registration → approval → verification → login; visit → board → speech → AI summary → PDF) were tested end-to-end.
3. **Security Testing**: Boundary cases for authentication and authorisation were tested — including unauthenticated access to protected routes, cross-role access attempts, expired token handling, and SQL injection probing.
4. **UI/Acceptance Testing**: The frontend was manually exercised through all user flows in Chrome, verifying that each page renders correctly, form validations behave as expected, and success/error states are communicated clearly.

---

## 6.2 Authentication and Authorisation Testing

**Table 6: API Test Results Summary**

| Test Case | Method + Route | Input | Expected | Result |
|---|---|---|---|---|
| Register new caregiver | POST /api/auth/register | Valid name/email/password | 201, pending message | PASS |
| Register with duplicate email | POST /api/auth/register | Existing email | 409, "Email already registered" | PASS |
| Login before approval | POST /api/auth/login | Registered but unapproved | 403, "pending admin approval" | PASS |
| Login before verification | POST /api/auth/login | Approved but unverified | 403, "Please verify your email" | PASS |
| Login with wrong password | POST /api/auth/login | Wrong password | 401, "Invalid credentials" | PASS |
| Login approved and verified | POST /api/auth/login | Correct credentials | 200, JWT returned | PASS |
| Access caregiver route as admin | GET /api/patients | Admin JWT | 403, access denied | PASS |
| Access admin route as caregiver | GET /api/admin/caregivers | Caregiver JWT | 403, access denied | PASS |
| Access protected route no token | GET /api/patients | No header | 401, "No token provided" | PASS |
| Access protected route expired token | GET /api/patients | Expired JWT | 401, "Invalid token" | PASS |

All ten authentication and authorisation test cases returned the expected HTTP status codes and response bodies. The dual-layered middleware (token verification followed by role verification) consistently enforced access boundaries.

---

## 6.3 API Endpoint Testing

All 25 functional requirements mapping to API endpoints were tested. Key results:

- `POST /api/patients` — created patient records correctly with caregiver ownership; rejected missing `full_name` with 400 status.
- `POST /api/visits` — created visit records linked to correct patient and caregiver; returned 404 for non-existent patient ID.
- `POST /api/board/visit/:id` — persisted all board selections; returned 403 when caregiver attempted to save to another caregiver's visit.
- `POST /api/speech/visit/:id` — persisted speech transcript; rejected empty transcript with 400 status.
- `POST /api/summary/visit/:id` — successfully called the Anthropic Claude API, received a formatted clinical summary, and stored it in `ai_summaries`.
- `GET /api/patients/:id/report` — returned enriched patient object with all visits, each visit containing its board selections, speech logs, and AI summary.
- `PATCH /api/admin/caregivers/:id/approve` — set `is_approved=true`, generated token, sent Ethereal preview email.
- `PATCH /api/admin/caregivers/:id/reject` — set `status='rejected'`; subsequent login attempt returned appropriate rejection message.

---

## 6.4 Integration Testing

**Full Caregiver Onboarding Flow:**

The complete flow from registration to first login was executed in a single test session:
1. Caregiver submitted registration → 201 received, pending message displayed in React UI.
2. Admin logged in, opened `/admin/dashboard` → Pending tab showed the new caregiver with correct name, email, and timestamp.
3. Admin clicked Approve → Green toast confirmed approval; pending list refreshed and was empty.
4. Server terminal showed Ethereal preview URL; URL opened in browser, revealing the verification email with the correct verification link.
5. Verification link opened in browser → `VerifyEmail.jsx` component showed "Email verified successfully."
6. Caregiver logged in → JWT issued, caregiver redirected to dashboard.

Total flow time: under 3 minutes in a development environment.

**Full Visit Session Flow:**

1. Caregiver created a patient record with medical notes.
2. Started a new visit → `visit_id` returned from API.
3. Patient tapped 6 board items across 3 categories.
4. Caregiver activated speech recognition, spoke 2 sentences → transcript appeared in real time.
5. Transcript saved → confirmed in database.
6. Caregiver clicked "Generate Summary" → Claude API called; summary displayed within 4 seconds.
7. Caregiver clicked "Export PDF" → PDF downloaded, opened correctly in browser PDF viewer.
8. PDF contained all expected sections: patient info, visit header, board selections table, speech transcript, and AI summary box.

---

## 6.5 Security Testing

The following security boundary cases were tested:

- **SQL injection**: Input `' OR 1=1 --` was submitted in login email and password fields. The parameterised query (`mysql2/promise` prepared statements) safely rejected this input; no unauthorised login occurred.
- **JWT tampering**: A valid JWT was manually decoded, the role field changed from `'caregiver'` to `'admin'`, and the token re-encoded without the correct secret. The server correctly rejected this token with a 401 response.
- **IDOR (Insecure Direct Object Reference)**: A caregiver authenticated as User A attempted to access patient records, visits, and board data belonging to User B by substituting IDs in API URLs. All controller functions verified ownership before returning data; 403 responses were returned for all unauthorised cross-user access attempts.
- **Token expiry**: A JWT with a manually set `exp` claim in the past was submitted to a protected route. The `jsonwebtoken` library's `verify()` function correctly identified the token as expired and returned a 401.

---

## 6.6 PDF Export Testing

Following the resolution of the jspdf-autotable v5 breaking change (described in Section 5.10), the PDF export was tested with the following data conditions:

| Condition | Expectation | Result |
|---|---|---|
| Patient with one visit, full board + speech + AI summary | Complete 1-page PDF with all sections | PASS |
| Patient with multiple visits across categories | Multi-visit PDF with visit separator bars | PASS |
| Visit with no board selections | Section shows "No board selections recorded" | PASS |
| Visit with no AI summary | Section shows italic note; no crash | PASS |
| Patient with zero visits | Export pre-flight check returns "No visits yet" alert | PASS |
| Filename format | `CommuniCare_{Name}_{Date}.pdf` | PASS |

---

## 6.7 Evaluation Against Stated Objectives

**Table 7: Evaluation Against Objectives**

| Objective | Status | Evidence |
|---|---|---|
| 1. Analyse AAC and AI documentation tools, identify gaps | Met | Chapter 2 literature review; gap analysis section |
| 2. JWT auth, RBAC, approval workflow, email verification | Met | Auth tests; integration test of full approval flow |
| 3. Communication board (48 items, 4 categories, free text, persistent) | Met | UI testing; database records confirmed after sessions |
| 4. Web Speech API integration, high-contrast display, transcript saving | Met | Real-time transcription verified in Chrome; logs confirmed in DB |
| 5. Claude AI summary generator with clinical prompt and persistence | Met | AI summary displayed and confirmed in `ai_summaries` table |
| 6. Admin dashboard with pending approvals management | Met | Approval/rejection flow tested; caregiver management verified |
| 7. PDF export with patient info, visits, board data, AI summaries | Met | PDF downloaded and contents verified across multiple data conditions |

All seven objectives were confirmed as met through functional testing. The system satisfies the acceptance criteria defined for each development phase.

---

---

# CHAPTER SEVEN: CONCLUSION AND RECOMMENDATIONS

---

## 7.1 Summary of Achievements

CommuniCare was successfully designed, implemented, and tested as a full-stack web application that addresses a clearly defined gap in healthcare communication technology for patients with speech impairments. The system integrates five distinct functional modules — AAC board interaction, caregiver speech-to-text, AI clinical summary generation, administrative account governance, and PDF report export — into a single, cohesive, role-based platform.

The development followed a disciplined Agile phase-gate methodology across nine phases, each validated against defined acceptance criteria before proceeding. The resulting system demonstrates that the combination of browser-native speech recognition (Web Speech API), a structured communication board, and a large language model API (Anthropic Claude) can produce a clinically meaningful and practically deployable health communication tool.

The caregiver approval and email verification workflow addresses the governance gap present in most existing AAC tools, bringing a degree of accountability and access control appropriate for environments handling personal health information. The administrative dashboard provides real-time visibility into the pending registration queue, enabling healthcare facility administrators to manage system access without technical expertise.

The AI clinical summary module represents the most technically sophisticated component. By aggregating heterogeneous visit inputs — structured board selections, free-text entries, and speech transcripts — and applying a carefully engineered clinical prompt, the system produces summaries that, while requiring clinician review before formal clinical use, represent a substantially more complete and consistent record than what a caregiver could typically produce manually in the same time.

---

## 7.2 Limitations of the Study

The following limitations of the current implementation are acknowledged:

1. **No EHR integration**: CommuniCare operates as a standalone system. The absence of integration with existing Electronic Health Records (Epic, OpenMRS, DHIS2) limits its clinical utility in facilities that have established digital health infrastructure.

2. **Browser dependency for speech recognition**: The Web Speech API is restricted to Chrome and Edge browsers. This constrains deployment in environments standardised on Firefox or Safari, and excludes offline use cases.

3. **AI summary reliability**: The clinical summaries generated by Claude are dependent on the richness of the visit data and the consistency of the API. They may occasionally misrepresent emphasis or omit context-specific nuance. All generated summaries require clinical review before formal use.

4. **Single-language support**: The system currently supports English only. In multilingual care environments — which represent the majority of care settings in South Africa and other multilingual nations — this is a significant limitation.

5. **No real patient validation**: Testing was conducted with fictional demo data. Formal clinical validation involving real patients with speech impairments and their caregivers — following appropriate ethical approval — would be required before the system is deployed in a clinical setting.

6. **No mobile application**: The system is optimised for desktop and tablet browsers. Dedicated iOS and Android applications would improve accessibility in home-care settings where smartphones are the primary connected device.

---

## 7.3 Recommendations for Future Work

Based on the limitations identified and the system's demonstrated capabilities, the following development directions are recommended:

1. **FHIR API Integration**: Implementing a HL7 FHIR (Fast Healthcare Interoperability Resources) interface would allow CommuniCare visit data to be exported to compliant EHR systems in a standardised format, significantly extending clinical utility.

2. **Offline capability via Progressive Web App (PWA)**: Implementing service workers and a local IndexedDB cache would enable core functionality — particularly the communication board — to operate without an internet connection, with data synchronising to the server when connectivity is restored.

3. **Multi-language board and AI prompts**: Extending the board dataset and AI prompt templates to support isiZulu, Afrikaans, Sesotho, and other South African languages would address the multilingual reality of local healthcare settings.

4. **Patient login and consent management**: Developing a simplified, accessible patient login system — potentially using biometric authentication — would enable patients to review their own visit records and provide digital consent for data use, strengthening the system's rights-respecting design.

5. **Real-time session synchronisation**: Implementing WebSocket-based real-time updates would allow a patient using one device and a caregiver on another to participate in a synchronised session, enabling telehealth use cases where the caregiver is not physically co-located with the patient.

6. **Clinical validation study**: A formal usability study involving speech-language pathologists, nursing staff, and patients with dysarthria or aphasia would generate evidence-based insights into the system's practical utility and identify refinements to the board item set, UI layout, and AI summary quality.

7. **Symbol augmentation**: Adding ARASAAC or PCS symbol imagery to board items would improve accessibility for patients with limited literacy, aligning CommuniCare more closely with established AAC best practice.

8. **Audit logging**: Implementing a comprehensive audit trail — recording which admin approved which caregiver, which caregiver accessed which patient, and which AI summaries were generated — would strengthen accountability and support governance audits.

---

## 7.4 Concluding Remarks

This dissertation has demonstrated that the convergence of browser-based AAC technology, caregiver speech recognition, and large language model AI can produce a practically functional, clinically meaningful health communication tool at a fraction of the cost and complexity of dedicated AAC hardware and enterprise EHR systems.

CommuniCare addresses a problem that affects millions of patients globally — the inability to express health needs clearly in a clinical encounter — and does so through a web-based system that runs on any connected device without installation, specialised hardware, or ongoing license fees. The system's approval workflow and role-based access control ensure that clinical data access is governed and auditable, while the AI summary module reduces the documentation burden on caregivers and increases the informational value of each visit record.

The limitations of the current implementation are real but surmountable; the recommendations above chart a clear path toward a more capable, integrated, and clinically validated system. The foundational architecture — REST API, React SPA, relational database, LLM integration — is established, tested, and extensible.

As large language models become more clinically specialised, as browser-based speech recognition improves in accuracy and offline capability, and as healthcare facilities increasingly embrace web-based tools, the integration pattern demonstrated by CommuniCare becomes more relevant, not less. The patients who stand to benefit most — those with ALS, post-stroke aphasia, cerebral palsy, and other conditions that silence the voice — deserve healthcare technology that treats their communication needs as primary rather than peripheral.

---

---

# REFERENCES

American Speech-Language-Hearing Association. (2023). *Augmentative and alternative communication (AAC)*. https://www.asha.org/public/speech/disorders/aac/

Anthropic. (2023). *Claude's model card*. Anthropic. https://www.anthropic.com/model-card

Auth0 by Okta. (2023). *JSON Web Tokens introduction*. https://jwt.io/introduction

Ganz, J. B., Hong, E. R., Neely, L., Gerow, S., & Ninci, J. (2023). A meta-analysis of aided augmentative and alternative communication interventions for adults with complex communication needs. *Augmentative and Alternative Communication*, *39*(3), 171–186. https://doi.org/10.1080/07434618.2023.2168425

Kung, T. H., Cheatham, M., Medenilla, A., Sillos, C., De Leon, L., Elepaño, C., Madriaga, M., Aggabao, R., Diaz-Candido, G., Maningo, J., & Tseng, V. (2023). Performance of ChatGPT on USMLE: Potential for AI-assisted medical education using large language models. *PLOS Digital Health*, *2*(2), e0000198. https://doi.org/10.1371/journal.pdig.0000198

Meta Platforms. (2023). *React: The library for web and native user interfaces* [Documentation]. https://react.dev

Moor, M., Banerjee, O., Abad, Z. S. H., Krumholz, H. M., Leskovec, J., Topol, E. J., & Rajpurkar, P. (2023). Foundation models for generalist medical artificial intelligence. *Nature*, *616*, 259–265. https://doi.org/10.1038/s41586-023-05881-4

OpenAI. (2023). *GPT-4 technical report*. arXiv. https://arxiv.org/abs/2303.08774

OpenJS Foundation. (2023). *Node.js documentation*. https://nodejs.org/en/docs/

Oracle Corporation. (2023). *MySQL 8.0 reference manual*. https://dev.mysql.com/doc/refman/8.0/en/

OWASP Foundation. (2023). *OWASP Top 10 — 2021: The ten most critical web application security risks*. https://owasp.org/Top10/

Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, *24*(3), 45–77. https://doi.org/10.2753/MIS0742-1222240302

Singhal, K., Azizi, S., Tu, T., Mahdavi, S. S., Wei, J., Chung, H. W., Scales, N., Tanwani, A., Cole-Lewis, H., Pfohl, S., Payne, P., Seneviratne, M., Gamble, P., Kelly, C., Babiker, A., Schärli, N., Chowdhery, A., Mansfield, P., Demner-Fushman, D., … Natarajan, V. (2023). Large language models encode clinical knowledge. *Nature*, *620*, 172–180. https://doi.org/10.1038/s41586-023-06291-2

Thirunavukarasu, A. J., Ting, D. S. J., Elangovan, K., Gutierrez, L., Tan, T. F., & Ting, D. S. W. (2023). Large language models in medicine. *Nature Medicine*, *29*, 1930–1940. https://doi.org/10.1038/s41591-023-02448-8

World Health Organization. (2023a). *Deafness and hearing loss: Key facts*. https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss

World Health Organization. (2023b). *Disability and health: Key facts*. https://www.who.int/news-room/fact-sheets/detail/disability-and-health

---

---

# APPENDICES

---

## Appendix A: Database Initialisation Script

The complete database initialisation script (`server/config/initDb.js`) creates all six tables and inserts the seeded admin account. It is executed once during initial system setup with `node config/initDb.js`.

## Appendix B: Environment Variables Reference

Full environment variable reference is documented in `server/.env.example` and in the `README.md` Environment Variables table. Key variables include `DB_*` (database connection), `JWT_SECRET`, `APP_URL`, `SMTP_*` (optional email configuration), and `ANTHROPIC_API_KEY`.

## Appendix C: Demo Seed Data

The seed script (`server/config/seedDemo.js`) creates the following demo dataset for live demonstration purposes:

- **2 demo caregivers**: `caregiver1@demo.com` and `caregiver2@demo.com` (password: `Demo1234`)
- **3 patients**: John Smith (assigned to caregiver1), Priya Patel (assigned to caregiver1), Carlos Rivera (assigned to caregiver2)
- **5 visits** across the three patients, each with realistic board selections, caregiver speech logs, and pre-written AI summaries

All demo accounts are pre-approved and pre-verified, bypassing the approval workflow to allow immediate demonstration.

## Appendix D: API Testing Commands

All API endpoints were tested using PowerShell `Invoke-WebRequest` commands in the development environment. Sample commands:

```powershell
# Register a caregiver
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Test User","email":"test@example.com","password":"Test1234"}'

# Login
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"wadenerd6@gmail.com","password":"Admin123"}'

# Approve a caregiver (replace TOKEN and ID)
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/caregivers/3/approve" `
  -Method PATCH `
  -Headers @{Authorization="Bearer TOKEN"}
```

## Appendix E: System Screenshots

*(Insert the following screenshots in this section for the final submission:)*

- E1: Login Page
- E2: Caregiver Registration Form with pending approval message
- E3: Admin Dashboard — Pending Approvals Tab
- E4: Caregiver Dashboard — Patient List
- E5: Visit Session — Communication Board
- E6: Visit Session — Speech-to-Text Panel
- E7: Visit Session — AI Clinical Summary
- E8: Sample Exported PDF Report (first page)

---

*End of Dissertation*

---

**Word count (body text, excluding front matter, references, and appendices): approximately 12,400 words**
