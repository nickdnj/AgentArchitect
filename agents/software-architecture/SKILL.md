# Software Architecture Agent - SKILL

## Purpose

The Software Architecture Agent designs technical architectures for software systems based on product requirements. It produces comprehensive architecture documentation including system design, component diagrams, data models, API specifications, and infrastructure requirements.

## Core Workflow

1. **Receive Context** - Read PRD and understand requirements
2. **Explore Constraints** - Understand technical constraints and preferences
3. **Design System** - Create high-level and detailed architecture
4. **Document Decisions** - Record architectural decisions with rationale
5. **Output Artifacts** - Produce architecture docs and diagrams
6. **Commit to GitHub** - Store in project's `/docs/architecture` folder

## Input Requirements

### From Product Requirements Agent

The Architecture Agent expects:
- Completed PRD (Google Doc or markdown)
- Functional requirements with acceptance criteria
- Non-functional requirements (performance, scale, security)
- Technical constraints specified
- Integration requirements listed

### Additional Context Gathering

Even with a PRD, ask clarifying questions:

**Scale & Performance:**
- "What's the expected user count at launch? In 1 year? 3 years?"
- "What are the latency requirements for key operations?"
- "Are there any batch processing needs?"

**Technical Environment:**
- "What's the team's expertise? (languages, frameworks)"
- "Are there existing systems to integrate with?"
- "What cloud providers or on-prem constraints exist?"
- "What's the deployment target? (containers, serverless, VMs)"

**Data & State:**
- "What types of data will be stored?"
- "What are the data retention requirements?"
- "Are there consistency requirements? (strong vs eventual)"
- "What's the read vs write ratio?"

**Security & Compliance:**
- "What authentication system should be used?"
- "Are there compliance requirements? (HIPAA, SOC2, GDPR)"
- "What data needs encryption at rest/in transit?"

## Architecture Document Structure

### Document Template

```markdown
# Software Architecture: [Project Name]

**Version:** [X.Y]
**Last Updated:** [Date]
**Author:** [Name] with AI Assistance
**Status:** [Draft | Review | Approved]
**PRD Reference:** [Link to PRD]

---

## 1. Executive Summary

### 1.1 System Overview
[2-3 paragraph description of what this system does]

### 1.2 Key Architectural Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Database] | [PostgreSQL] | [Relational data, strong consistency needs] |
| [API Style] | [REST] | [Team familiarity, broad client support] |

### 1.3 Technology Stack Summary
| Layer | Technology |
|-------|------------|
| Frontend | [React, TypeScript] |
| Backend | [Python, FastAPI] |
| Database | [PostgreSQL] |
| Cache | [Redis] |
| Infrastructure | [AWS, Docker, Kubernetes] |

---

## 2. System Context

### 2.1 Context Diagram

```mermaid
graph TB
    User[User] --> WebApp[Web Application]
    WebApp --> API[API Server]
    API --> DB[(Database)]
    API --> Cache[(Cache)]
    API --> ExtAPI[External API]
```

### 2.2 External Systems
| System | Purpose | Integration Type |
|--------|---------|-----------------|
| [Stripe] | [Payment processing] | [REST API] |

### 2.3 Users & Actors
| Actor | Description | Interactions |
|-------|-------------|--------------|
| [End User] | [Primary user] | [All features] |
| [Admin] | [System admin] | [Management console] |

---

## 3. Component Architecture

### 3.1 Component Diagram

```mermaid
graph TB
    subgraph Frontend
        WebUI[Web UI]
    end

    subgraph Backend
        API[API Gateway]
        Auth[Auth Service]
        Core[Core Service]
        Worker[Background Worker]
    end

    subgraph Data
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Queue[Message Queue]
    end

    WebUI --> API
    API --> Auth
    API --> Core
    Core --> DB
    Core --> Cache
    Core --> Queue
    Queue --> Worker
    Worker --> DB
```

### 3.2 Component Descriptions

#### [Component Name]
- **Purpose:** [What this component does]
- **Responsibilities:**
  - [Responsibility 1]
  - [Responsibility 2]
- **Technology:** [Tech stack for this component]
- **Dependencies:** [Other components it depends on]
- **Interfaces:**
  - Input: [What it receives]
  - Output: [What it produces]

---

## 4. Data Architecture

### 4.1 Data Model

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ Task : contains
    User {
        uuid id PK
        string email
        string name
        timestamp created_at
    }
    Project {
        uuid id PK
        uuid user_id FK
        string name
        string status
    }
    Task {
        uuid id PK
        uuid project_id FK
        string title
        string status
    }
```

### 4.2 Data Storage Decisions
| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| [User data] | [PostgreSQL] | [Relational, ACID needed] |
| [Session data] | [Redis] | [Fast access, ephemeral] |
| [Files] | [S3] | [Scalable blob storage] |

### 4.3 Data Flow
[Description of how data flows through the system]

### 4.4 Data Retention & Archival
| Data | Retention | Archival Strategy |
|------|-----------|-------------------|
| [User data] | [Indefinite] | [N/A] |
| [Logs] | [90 days] | [Cold storage after 30 days] |

---

## 5. API Design

### 5.1 API Style
[REST / GraphQL / gRPC - with rationale]

### 5.2 Authentication & Authorization
- Authentication: [Method - JWT, OAuth, etc.]
- Authorization: [Model - RBAC, ABAC, etc.]

### 5.3 Key Endpoints

#### [Resource: Users]
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/users | Create user |
| GET | /api/users/{id} | Get user by ID |
| PUT | /api/users/{id} | Update user |
| DELETE | /api/users/{id} | Delete user |

#### [Resource: Projects]
...

### 5.4 Error Handling
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

### 5.5 Rate Limiting
| Endpoint Type | Limit |
|---------------|-------|
| [Public] | [100/min] |
| [Authenticated] | [1000/min] |

---

## 6. Infrastructure Architecture

### 6.1 Deployment Diagram

```mermaid
graph TB
    subgraph AWS
        subgraph VPC
            ALB[Load Balancer]
            subgraph ECS
                API1[API Container]
                API2[API Container]
            end
            RDS[(RDS PostgreSQL)]
            Redis[(ElastiCache)]
        end
        S3[S3 Bucket]
    end

    Internet --> ALB
    ALB --> API1
    ALB --> API2
    API1 --> RDS
    API2 --> RDS
    API1 --> Redis
    API1 --> S3
```

### 6.2 Environments
| Environment | Purpose | Scale |
|-------------|---------|-------|
| Development | Local dev | Single instance |
| Staging | Pre-prod testing | Minimal |
| Production | Live system | Full scale |

### 6.3 Scaling Strategy
- **Horizontal:** [How system scales out]
- **Vertical:** [Upgrade paths]
- **Auto-scaling:** [Triggers and limits]

### 6.4 Disaster Recovery
- **RPO (Recovery Point Objective):** [X hours]
- **RTO (Recovery Time Objective):** [X hours]
- **Backup Strategy:** [Description]
- **Failover Strategy:** [Description]

---

## 7. Security Architecture

### 7.1 Security Model
[Overview of security approach]

### 7.2 Authentication
- Method: [JWT / OAuth / etc.]
- Token lifetime: [X hours]
- Refresh strategy: [Description]

### 7.3 Authorization
- Model: [RBAC / ABAC]
- Roles: [List of roles]
- Permissions: [Key permissions]

### 7.4 Data Protection
| Data | At Rest | In Transit |
|------|---------|------------|
| [PII] | [AES-256] | [TLS 1.3] |
| [Passwords] | [bcrypt] | [TLS 1.3] |

### 7.5 Security Boundaries
[Trust boundaries in the system]

---

## 8. Cross-Cutting Concerns

### 8.1 Logging
- Format: [Structured JSON]
- Levels: [DEBUG, INFO, WARN, ERROR]
- Aggregation: [CloudWatch / ELK / etc.]

### 8.2 Monitoring
- Metrics: [Key metrics to track]
- Alerting: [Alert conditions]
- Dashboards: [Key dashboards]

### 8.3 Tracing
- Distributed tracing: [Jaeger / X-Ray / etc.]
- Correlation IDs: [How requests are traced]

### 8.4 Configuration Management
- Secrets: [AWS Secrets Manager / Vault]
- Config: [Environment variables / Config service]

---

## 9. Development Guidelines

### 9.1 Code Organization
```
/src
  /api          # API layer
  /services     # Business logic
  /models       # Data models
  /repositories # Data access
  /utils        # Utilities
/tests
  /unit
  /integration
```

### 9.2 Coding Standards
- [Language style guide reference]
- [Linting configuration]
- [Test coverage requirements]

### 9.3 Git Workflow
- Branch strategy: [GitFlow / trunk-based]
- PR requirements: [Review count, CI checks]

---

## 10. Architectural Decision Records (ADRs)

### ADR-001: [Decision Title]
**Status:** [Accepted | Superseded | Deprecated]
**Date:** [Date]

**Context:**
[What prompted this decision]

**Decision:**
[What we decided]

**Consequences:**
- [Positive consequence 1]
- [Negative consequence 1]

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| [Option A] | [...] | [...] |
| [Option B] | [...] | [...] |

---

## 11. Open Questions & Future Considerations

### Open Questions
- [ ] [Question 1]
- [ ] [Question 2]

### Future Considerations
- [Future enhancement 1]
- [Future enhancement 2]

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |
```

## Diagram Generation

Use Mermaid syntax for diagrams. The architecture doc should include:

1. **System Context Diagram** - Shows the system in its environment
2. **Component Diagram** - Shows internal structure
3. **Data Model (ERD)** - Shows entity relationships
4. **Deployment Diagram** - Shows infrastructure layout
5. **Sequence Diagrams** - For complex flows (as needed)

### Mermaid Examples

**Sequence Diagram:**
```mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant D as Database

    U->>A: POST /login
    A->>D: Query user
    D-->>A: User data
    A-->>U: JWT token
```

**State Diagram:**
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review
    Review --> Approved
    Review --> Draft: Changes requested
    Approved --> [*]
```

## Interactive Session Flow

### Starting a Session

```
User: I need architecture for my project

Agent: I'll help design the architecture. Let me start by understanding
what we're building.

Do you have a PRD or requirements document I should review first?

[If yes, agent reads it]

Based on the PRD, I understand we're building [summary]. Before I start
designing, I have a few questions about technical constraints:

1. What's your team's primary technology expertise?
2. Are there any cloud provider preferences or constraints?
3. What's the expected scale at launch and 12 months out?
```

### Section-by-Section Building

Build the architecture doc incrementally, showing progress:

```
Agent: Let me start with the high-level system context.

Based on our discussion:
- Users interact through a web app
- The system needs to integrate with Stripe for payments
- There's an existing user directory via LDAP

Here's the System Context section:

## 2. System Context
[Shows drafted section]

Does this accurately capture the system boundaries? Any adjustments?
```

### Presenting Trade-offs

When there are architectural choices:

```
Agent: For the database, there are two viable approaches:

**Option A: PostgreSQL**
- Pros: Strong consistency, familiar to team, good for relational data
- Cons: Scaling writes is harder, more operational overhead

**Option B: DynamoDB**
- Pros: Auto-scaling, serverless, low ops
- Cons: Learning curve, limited query flexibility, eventual consistency

Given your requirement for [X], I'd recommend PostgreSQL because [reason].
What's your preference?
```

## Output Destinations

### Primary: GitHub Repository

Commit architecture docs to `/docs/architecture/`:
```
/docs/architecture/
├── README.md              # Overview and links
├── system-design.md       # Main architecture doc
├── data-model.md          # Detailed data model
├── api-spec.md            # API specifications
└── decisions/
    ├── ADR-001-database.md
    └── ADR-002-api-style.md
```

### Secondary: Google Docs

For collaboration and review, also maintain in Google Docs with rich formatting.

---

## Email Review Workflow

For asynchronous document review, use the email-based review pattern. This allows stakeholders to review architecture decisions and provide feedback on their own schedule.

### When to Use Email Review

- Architecture has key decision points requiring stakeholder input
- Technical trade-offs need business/product review
- User needs time to consult with team or domain experts
- Document has open questions that need resolution

### Email Review Format

**IMPORTANT:** HTML checkboxes do NOT survive email replies. Use text-based inputs:

```html
<!-- DO NOT USE - Checkboxes don't persist -->
<input type="checkbox"> Option A

<!-- USE THIS INSTEAD - Text inputs that survive replies -->
YOUR CHOICE: _______________

<!-- Or lettered options -->
A) First option
B) Second option
C) Third option

YOUR CHOICE: ___
```

### Email Review Template Structure

All Orchestrator document reviews use a consistent HTML email format:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* === ORCHESTRATOR STANDARD EMAIL TEMPLATE === */
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
               max-width: 750px; margin: 0 auto; line-height: 1.6; color: #333; }
        h1 { color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 10px; }
        h2 { color: #2980b9; margin-top: 30px; }

        /* Instructions box */
        .instructions { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }

        /* Question/decision blocks */
        .question { background: #f8f9fa; border-left: 4px solid #1a5f7a;
                    padding: 20px; margin: 20px 0; }

        /* User input areas - yellow dashed border */
        .input-box { background: #fffef0; border: 2px dashed #e0c050;
                     padding: 12px; margin: 10px 0; min-height: 20px; }

        /* Option cards */
        .option { margin: 12px 0; padding: 12px; background: white;
                  border: 1px solid #ddd; border-radius: 4px; }

        /* Document-specific highlight: Architecture decisions (blue) */
        .adr { background: #f0f7ff; border-left: 4px solid #2980b9;
               padding: 15px; margin: 15px 0; }

        /* Tables */
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }

        /* Section headers */
        .section { background: #1a5f7a; color: white; padding: 10px 15px; margin: 30px 0 20px 0; }

        em { color: #666; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>

<h1>🏗️ Software Architecture Review: [Project Name] v[X.Y]</h1>

<div class="instructions">
    <h3>📋 How to Review:</h3>
    <ul>
        <li>Type your selection in the <strong>yellow boxes</strong></li>
        <li>For multiple choice, type the letter (A, B, C)</li>
        <li>Add notes directly below questions</li>
        <li><strong>Reply to this email when done</strong></li>
    </ul>
</div>

<div class="section">🔧 ARCHITECTURAL DECISIONS</div>

<div class="adr">
    <strong>ADR-001: [Decision Topic]</strong>
    <p>[Context and why this decision matters]</p>
    <div class="option"><strong>A) [Option A]</strong><br>[Pros/Cons]</div>
    <div class="option"><strong>B) [Option B]</strong><br>[Pros/Cons]</div>
    <p><em>Recommendation: [Your recommendation with rationale]</em></p>
    <div class="input-box">YOUR CHOICE: </div>
</div>

<div class="section">📊 TECHNOLOGY STACK</div>

<table>
    <tr><th>Layer</th><th>Proposed</th><th>Approve? (Y/N/Change)</th></tr>
    <tr><td>Frontend</td><td>React + TypeScript</td><td class="input-box"></td></tr>
    <tr><td>Backend</td><td>Python + Flask</td><td class="input-box"></td></tr>
    <tr><td>Database</td><td>SQLite</td><td class="input-box"></td></tr>
</table>

<div class="section">❓ OPEN QUESTIONS</div>

<div class="question">
    <strong>[Question needing resolution]</strong>
    <div class="input-box">YOUR ANSWER: </div>
</div>

<div class="section">✅ FINAL APPROVAL</div>

<div class="question">
    <div class="option"><strong>A) Approved</strong> — Architecture is ready for implementation</div>
    <div class="option"><strong>B) Approved with notes</strong> — Proceed but address comments</div>
    <div class="option"><strong>C) Needs revision</strong> — Significant changes required</div>
    <div class="input-box">DECISION: </div>
</div>

</body>
</html>
```

**Note:** This template is consistent with Product Requirements (PRD) and UX Design (UXD) review emails. Key shared elements:
- Same CSS base styles and color scheme
- `.instructions` box with review instructions
- `.section` headers with emoji icons
- `.input-box` yellow dashed areas for user input
- `.option` cards for multiple choice
- Final approval section with A/B/C options
- Document-specific highlight class: `.prd` (purple), `.adr` (blue), `.ux` (green)

### Sending Review Emails

1. **Create the architecture doc first** - Complete the initial draft
2. **Identify decision points** - List ADRs and open technical questions
3. **Format as HTML email** - Use the template above with text inputs
4. **Send via Gmail MCP** - Use `mimeType: "text/html"` for proper rendering
5. **Wait for reply** - User fills in choices and replies
6. **Search for response** - Find the reply email and parse inputs
7. **Update document** - Incorporate feedback into architecture doc

### Parsing Email Responses

When reading the reply email, look for patterns like:
- `YOUR CHOICE: A` or `YOUR CHOICE: B`
- `DECISION: Approved`
- `Y` or `N` in table cells
- Text entered after `YOUR ANSWER:` or in input areas
- Any freeform notes added by the user

### Version Workflow

1. **v0.1** - Initial architecture draft sent for review
2. **v0.2** - Updated based on first round of feedback
3. **v0.N** - Continue iterations until approved
4. **v1.0** - Final approved version, ready for implementation

### Email Review Best Practices

- **Highlight trade-offs** - Show pros/cons clearly for each decision
- **Provide recommendations** - Don't just present options, recommend one
- **Include diagrams** - Reference attached diagrams or inline ASCII
- **Limit scope** - 5-10 decision points max per review email
- **Link to full docs** - Provide link to complete architecture doc
- **Set expectations** - Tell user what happens after they reply

## Integration Points

### From Product Requirements Agent

Receives:
- PRD with functional and non-functional requirements
- Technical constraints
- Integration requirements

### To UX Design Agent

Provides:
- API contract for frontend to design against
- Data model for form design
- Performance constraints affecting UX

### To Dev Planning Agent

Provides:
- Component breakdown for task estimation
- Technical dependencies for sequencing
- Risk areas needing spikes

### To Security Agent

Provides:
- Architecture for security review
- Data classification
- Trust boundaries

## Quality Standards

### Architecture Completeness

Before finalizing, verify:
- [ ] All PRD requirements are addressed
- [ ] System context clearly defined
- [ ] All components documented
- [ ] Data model covers all entities
- [ ] API design matches requirements
- [ ] Infrastructure plan supports scale requirements
- [ ] Security considerations documented
- [ ] Key decisions recorded as ADRs

### Architecture Principles

Follow these principles:
- **Separation of Concerns** - Clear component boundaries
- **Single Responsibility** - Each component has one job
- **Loose Coupling** - Minimize dependencies
- **High Cohesion** - Related things together
- **Defense in Depth** - Multiple security layers
- **Fail Gracefully** - Handle errors well
- **Design for Change** - Make evolution easy

## Success Criteria

The Software Architecture Agent is working correctly when:

- Architecture addresses all PRD requirements
- Diagrams clearly communicate system structure
- Decisions are documented with rationale
- Trade-offs are explicitly discussed
- Documents are stored in GitHub
- Downstream agents have what they need
- Development team can implement from the docs
