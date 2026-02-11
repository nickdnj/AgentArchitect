# System Architecture: AI-Powered Enterprise Migration & Deployment Platform for Altium

**Version:** 0.1
**Date:** 2026-02-11
**Author:** Nick DeMarco with AI Assistance
**Status:** Draft - Vision Document

---

## 1. Executive Summary

### 1.1 The Vision

Enterprise migrations to Altium today are labor-intensive, consultant-heavy engagements that scale linearly with headcount. A 500-seat Boeing migration requires roughly the same per-seat effort as a 50-seat startup migration. The economics are brutal: experienced deployment engineers are scarce, engagements take months, and every migration starts nearly from scratch.

This document describes an architecture where AI agents do the heavy lifting across the entire customer lifecycle -- from identifying that Boeing's Huntsville division is running end-of-life Mentor Xpedition licenses, through converting 12,000 component libraries, to monitoring post-deployment health six months later. Humans supervise, guide, and validate. The system learns from every migration and compounds its effectiveness over time.

The core thesis is this: **the marginal cost of the next enterprise migration should approach the cost of compute and tokens, not the cost of another senior deployment engineer.**

### 1.2 What Exists Today

The Altium Solutions Team (defined in `teams/altium-solutions/`) already implements a 16-agent workflow spanning Discovery through Ongoing Support. These agents operate within Claude Code sessions, producing structured artifacts (account briefs, qualification scorecards, solution designs, deployment plans, migration reports) and coordinating through a stage-based handoff protocol.

CustomerNode (customernode.com) provides a customer journey orchestration platform with 50+ contextual AI agents, designed to align buyer and seller processes across complex B2B deals with 60-100 typical touchpoints.

This architecture proposes unifying these two systems -- Altium's agent team and CustomerNode's journey platform -- into a single, self-improving migration engine backed by a persistent knowledge graph.

### 1.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| System of Record | CustomerNode | Purpose-built for complex B2B journeys; 50+ agents already operational |
| Agent Runtime | Claude Code + Agent Architect | Existing 16-agent team already proven; extensible architecture |
| CRM Integration | Bidirectional Salesforce Sync | Salesforce remains the enterprise standard; can't replace it |
| Entity Resolution | Knowledge Graph (CustomerNode) | "Bosch" problem requires persistent entity resolution beyond CRM |
| Migration Engine | Headless Altium + Agent Orchestration | File conversion requires actual EDA tooling, not just LLM inference |
| Learning System | Migration Knowledge Base | Every migration enriches the corpus for future migrations |
| Human-in-the-Loop | Approval Gates at Critical Transitions | Full autonomy is neither achievable nor desirable for v1 |

### 1.4 Technology Stack Summary

| Layer | Technology | Notes |
|-------|------------|-------|
| Journey Orchestration | CustomerNode Platform | Central nervous system |
| Agent Runtime | Claude Code / Agent Architect | Agent definitions, SKILL.md + config.json |
| CRM | Salesforce | Existing enterprise CRM |
| EDA Tooling | Altium Designer (headless/scripted) | Actual file conversion engine |
| Knowledge Store | Graph Database (via CustomerNode) | Entity resolution, relationship mapping |
| Migration Data Store | Object Storage + Metadata DB | Legacy files, converted files, validation artifacts |
| Document Generation | Google Docs / MCP Servers | SOWs, reports, proposals |
| Monitoring | CustomerNode Health Signals + Custom Metrics | Post-deployment observability |

---

## 2. System Context

### 2.1 System Context Diagram

```
+------------------------------------------------------------------+
|                        EXTERNAL WORLD                             |
|                                                                   |
|  +-------------+  +-------------+  +-----------+  +------------+ |
|  | Enterprise  |  | Salesforce  |  | Legacy EDA|  | PLM / ERP  | |
|  | Customers   |  | CRM        |  | Platforms  |  | Systems    | |
|  | (Boeing,    |  | (Accounts, |  | (Cadence,  |  | (Windchill,| |
|  |  Tesla,     |  |  Opps,     |  |  Mentor,   |  |  Team-     | |
|  |  Ford...)   |  |  Contacts) |  |  EAGLE...) |  |  center)   | |
|  +------+------+  +------+-----+  +-----+-----+  +-----+------+ |
|         |                |               |               |        |
+---------|----------------|---------------|---------------|--------+
          |                |               |               |
          v                v               v               v
+------------------------------------------------------------------+
|                                                                    |
|              AI MIGRATION & DEPLOYMENT PLATFORM                    |
|                                                                    |
|  +------------------------------------------------------------+   |
|  |                  CUSTOMERNODE LAYER                          |   |
|  |  Journey Orchestration | Entity Resolution | Health Signals |   |
|  +----------------------------+-------------------------------+   |
|                               |                                    |
|  +----------------------------v-------------------------------+   |
|  |                   AGENT ORCHESTRATION                       |   |
|  |                                                             |   |
|  |  Pre-Sales Agents    | Migration Agents  | Post-Deploy     |   |
|  |  - Account Research  | - Library Trans.  | - Support       |   |
|  |  - Qualification     | - Design Convert  | - Training      |   |
|  |  - Solution Design   | - Validation      | - Health Mon.   |   |
|  |  - Deal Strategy     | - Env Setup       | - Expansion     |   |
|  +----------------------------+-------------------------------+   |
|                               |                                    |
|  +----------------------------v-------------------------------+   |
|  |                 MIGRATION ENGINE                            |   |
|  |  Headless Altium | File Processing | Validation Pipeline   |   |
|  +------------------------------------------------------------+   |
|                               |                                    |
|  +----------------------------v-------------------------------+   |
|  |              KNOWLEDGE & LEARNING LAYER                     |   |
|  |  Migration KB | Component Maps | Pattern Library | Metrics  |   |
|  +------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
          |                |               |               |
          v                v               v               v
+------------------------------------------------------------------+
|                     ALTIUM ECOSYSTEM                               |
|  +-------------+  +--------------+  +---------------------------+ |
|  | Altium      |  | Altium 365   |  | Enterprise Server         | |
|  | Designer    |  | Cloud        |  | (On-Prem)                 | |
|  +-------------+  +--------------+  +---------------------------+ |
+------------------------------------------------------------------+
```

### 2.2 External Systems

| System | Purpose | Integration Type | Data Direction |
|--------|---------|-----------------|----------------|
| Salesforce | CRM - accounts, opportunities, contacts | REST API (bidirectional) | Inbound: account data; Outbound: deal updates, notes |
| CustomerNode | Journey orchestration, entity resolution | Native Platform API | Bidirectional: journey state, agent outputs, health signals |
| Cadence (OrCAD, Allegro) | Legacy EDA source platform | File-based (OLB, BRD, DSN) | Inbound only: source design/library files |
| Mentor/Siemens (PADS, Xpedition) | Legacy EDA source platform | File-based (PCB, SCH, LIB) | Inbound only: source design/library files |
| EAGLE/Fusion 360 | Legacy EDA source platform | File-based (BRD, SCH, LBR) | Inbound only: source design/library files |
| KiCad | Legacy EDA source platform | File-based (KiCad_PCB, KiCad_SCH) | Inbound only: source design/library files |
| Windchill / Teamcenter | PLM systems | REST/SOAP connectors | Bidirectional: part data, lifecycle states |
| SAP / Oracle | ERP systems | REST/RFC connectors | Bidirectional: BOM data, part numbers |
| Altium 365 | Target cloud platform | REST API | Outbound: deployed workspaces, libraries, designs |
| Altium Enterprise Server | Target on-prem platform | REST API | Outbound: deployed configurations |
| Octopart / SiliconExpert | Component data enrichment | REST API | Inbound: pricing, availability, lifecycle data |

### 2.3 Users and Actors

| Actor | Description | Primary Interactions |
|-------|-------------|---------------------|
| Altium Sales Rep | Account executive managing enterprise deals | Triggers pipeline events, reviews agent outputs, approves strategies |
| Altium Solution Architect (Human) | Technical pre-sales resource | Validates solution designs, supervises complex migrations |
| Altium Deployment Engineer (Human) | Implementation resource | Supervises agent-driven deployments, handles escalations |
| Enterprise Customer Champion | Internal advocate at customer org | Provides access to legacy data, validates migration outputs |
| Enterprise IT Admin | Customer infrastructure contact | Provides environment details, configures access |
| Enterprise Design Engineer | End user of migrated Altium environment | Validates converted designs, receives training |
| System Administrator | Platform operator | Monitors system health, manages agent configurations |

---

## 3. Component Architecture

### 3.1 Component Diagram

```
+=========================================================================+
|                        PLATFORM COMPONENTS                               |
|                                                                          |
|  +---------------------------+    +----------------------------------+   |
|  |   CUSTOMERNODE GATEWAY    |    |     SALESFORCE CONNECTOR         |   |
|  |                           |<-->|                                  |   |
|  | - Journey State Mgmt     |    | - Account Sync                   |   |
|  | - Entity Resolution      |    | - Opportunity Updates            |   |
|  | - Agent Invocation API    |    | - Contact Resolution             |   |
|  | - Health Signal Ingestion |    | - Activity Logging               |   |
|  +------------+--------------+    +----------------+-----------------+   |
|               |                                    |                     |
|               v                                    v                     |
|  +-------------------------------------------------------------+       |
|  |              UNIFIED CUSTOMER KNOWLEDGE GRAPH                 |       |
|  |                                                               |       |
|  |  Entities: Companies, Divisions, Contacts, Deals, Projects    |       |
|  |  Relationships: reports-to, evaluates, champions, blocks      |       |
|  |  State: Journey stage, qualification score, migration status  |       |
|  |  History: All interactions, decisions, outcomes               |       |
|  +------------------------------+--------------------------------+       |
|                                 |                                        |
|                                 v                                        |
|  +-------------------------------------------------------------+       |
|  |                  AGENT ORCHESTRATOR                            |       |
|  |                                                               |       |
|  |  - Stage-based workflow engine                                |       |
|  |  - Agent selection and dispatch                               |       |
|  |  - Context assembly (SKILL + knowledge + customer data)       |       |
|  |  - Approval gate management                                   |       |
|  |  - Parallel execution coordination                            |       |
|  |  - Output routing and handoff                                 |       |
|  +-------+---------------+----------------+---------------------+       |
|          |               |                |                              |
|          v               v                v                              |
|  +---------------+ +---------------+ +------------------+               |
|  | PRE-SALES     | | MIGRATION     | | POST-DEPLOYMENT  |               |
|  | AGENT POOL    | | AGENT POOL    | | AGENT POOL       |               |
|  |               | |               | |                  |               |
|  | - Account     | | - Library     | | - Support        |               |
|  |   Researcher  | |   Translator  | | - Training       |               |
|  | - Qual.       | | - Design      | | - Health         |               |
|  |   Analyst     | |   Converter   | |   Monitor        |               |
|  | - Solution    | | - Validator   | | - Expansion      |               |
|  |   Architect   | | - Env Setup   | |   Scout          |               |
|  | - Value Eng.  | | - Deploy      | |                  |               |
|  | - Proposal    | |   Manager     | |                  |               |
|  | - Deal Strat. | |               | |                  |               |
|  +-------+-------+ +-------+-------+ +--------+---------+               |
|          |               |                     |                         |
|          v               v                     v                         |
|  +-------------------------------------------------------------+       |
|  |                MIGRATION ENGINE                               |       |
|  |                                                               |       |
|  | +------------------+ +-------------------+ +----------------+ |       |
|  | | File Ingestion   | | Conversion        | | Validation     | |       |
|  | | Service          | | Pipeline          | | Pipeline       | |       |
|  | |                  | |                   | |                | |       |
|  | | - Format detect  | | - Headless Altium | | - Netlist diff | |       |
|  | | - Inventory scan | | - Library convert | | - BOM compare  | |       |
|  | | - Dependency map | | - Design convert  | | - Visual diff  | |       |
|  | | - Staging        | | - Rule translate  | | - DRC check    | |       |
|  | +------------------+ +-------------------+ +----------------+ |       |
|  +-------------------------------------------------------------+       |
|                                 |                                        |
|                                 v                                        |
|  +-------------------------------------------------------------+       |
|  |              MIGRATION KNOWLEDGE BASE                         |       |
|  |                                                               |       |
|  |  - Component mapping corpus (legacy part X -> Altium part Y)  |       |
|  |  - Conversion pattern library (common issues and resolutions) |       |
|  |  - Customer-specific migration histories                      |       |
|  |  - Validation benchmark library                               |       |
|  |  - Effort estimation models (trained on actual migrations)    |       |
|  +-------------------------------------------------------------+       |
|                                                                          |
+=========================================================================+
```

### 3.2 Component Descriptions

#### 3.2.1 CustomerNode Gateway

- **Purpose:** Interface between the platform and CustomerNode's journey orchestration engine. This is the primary entry point for journey-driven agent invocation.
- **Responsibilities:**
  - Maintain journey state for each enterprise customer engagement
  - Resolve entity ambiguity (the "Bosch problem" -- mapping hundreds of Salesforce records to a unified enterprise entity with known divisions, sites, and buying centers)
  - Expose an API for CustomerNode's 50+ agents to trigger Altium-specific agent workflows
  - Ingest health signals from deployed customers and route them to appropriate agents
- **Technology:** CustomerNode Platform API, webhook receivers, event bus
- **Key Design Decision:** CustomerNode is the journey orchestrator; the Altium agent team is the domain-specific execution engine. CustomerNode decides "what needs to happen next"; Altium agents decide "how to do it."

#### 3.2.2 Salesforce Connector

- **Purpose:** Bidirectional sync between Salesforce CRM and the platform, ensuring sales reps continue working in their familiar CRM while agents operate with enriched data.
- **Responsibilities:**
  - Inbound: Pull account hierarchies, opportunity stages, contact roles, activity history
  - Outbound: Push agent-generated artifacts (qualification scorecards, deployment status, health reports) as Salesforce notes and custom object updates
  - Entity mapping: Maintain the crosswalk between Salesforce Account IDs and CustomerNode entity IDs
  - Trigger detection: Identify CRM events that should initiate agent workflows (e.g., opportunity stage change to "Technical Evaluation" triggers Solution Architect agent)
- **Technology:** Salesforce REST API, Change Data Capture (CDC), Platform Events
- **Dependencies:** CustomerNode Gateway (for entity resolution)

#### 3.2.3 Unified Customer Knowledge Graph

- **Purpose:** The single source of truth for everything known about an enterprise customer, resolving the fragmentation problem where a company like Bosch appears hundreds of times across systems as different divisions, subsidiaries, and contacts.
- **Responsibilities:**
  - Entity resolution: Merge fragmented records into a canonical enterprise hierarchy (Bosch GmbH -> Bosch Automotive Electronics -> Bosch AE Reutlingen Site -> Design Team Alpha)
  - Relationship mapping: Track organizational relationships, influence networks, champion/blocker dynamics
  - Journey state: Store current stage, qualification scores, migration progress per entity
  - Interaction history: Every agent output, customer response, and system event
  - Design inventory: Catalog of known legacy designs, libraries, and tools per division/site
- **Technology:** Graph database layer within CustomerNode, supplemented by vector embeddings for semantic search across historical interactions
- **Data Model:** See Section 4

#### 3.2.4 Agent Orchestrator

- **Purpose:** The workflow engine that selects, configures, and dispatches agents based on journey state and incoming events.
- **Responsibilities:**
  - Interpret journey stage transitions from CustomerNode and map them to agent workflows
  - Assemble agent context: combine SKILL.md instructions with relevant customer data from the knowledge graph
  - Manage approval gates: pause workflow when human review/approval is required
  - Coordinate parallel agent execution (e.g., Solution Architect and Value Engineer running simultaneously)
  - Route agent outputs to the correct destinations (knowledge graph, Salesforce, document generation, next agent)
- **Technology:** Agent Architect framework (SKILL.md + config.json), Claude Code runtime
- **Key Design Decision:** The orchestrator does not make strategic decisions -- it executes the workflow defined by CustomerNode journey stages and the team.json workflow definition. Strategic decisions (advance/develop/hold/disqualify) are made by specialized agents (Qualification Analyst, Deal Strategist) and approved by humans.

#### 3.2.5 Pre-Sales Agent Pool

- **Purpose:** The collection of agents that operate from initial lead identification through deal close.
- **Agents:**

| Agent | Function | Trigger | Key Output |
|-------|----------|---------|------------|
| Account Researcher | Company intelligence, tech stack analysis, stakeholder mapping | New lead or account assigned | Account Brief |
| Qualification Analyst | MEDDPICC scoring, ICP fit assessment, red flag identification | Account Brief complete | Qualification Scorecard |
| Solution Architect | Solution design, demo scripts, competitive differentiation | Qualification advances | Solution Design |
| Value Engineer | ROI models, TCO analysis, business case | Parallel with Solution Architect | Business Case |
| Competitive Intel | Battle cards, objection handling, competitive monitoring | On-demand throughout sales | Battle Cards, Objection Responses |
| Proposal Writer | Proposals, SOWs, RFP responses | Solution Design + Business Case complete | Proposal Document |
| Deal Strategist | Stakeholder mapping, negotiation playbooks, close plans | Proposal delivered | Deal Strategy, Close Plan |

- **Design Principle:** Each agent has a focused responsibility and produces a structured artifact. Agents communicate through these artifacts, not through shared state. This is the "briefing" pattern from the existing team architecture.

#### 3.2.6 Migration Agent Pool

- **Purpose:** The agents that plan and execute the actual technical migration from legacy EDA platforms to Altium.
- **Agents:**

| Agent | Function | Trigger | Key Output |
|-------|----------|---------|------------|
| Migration Planner | Inventory legacy assets, estimate effort, create migration roadmap | Deal closed, deployment initiated | Migration Plan |
| Library Translator | Convert legacy component libraries to Altium format | Migration Plan approved | Converted Libraries + Validation Report |
| Design Converter | Translate schematics and PCB layouts | Libraries validated | Converted Designs + Validation Report |
| Environment Configurator | Set up Altium 365/Enterprise Server workspace, users, permissions, standards | Parallel with migration | Deployment Guide, Configuration Spec |
| Validation Orchestrator | Coordinate netlist diffs, BOM compares, visual checks, DRC runs | After each conversion batch | Validation Report with pass/fail per design |
| Deployment Coordinator | Roll out to engineering teams, manage cutover, coordinate training | Validation complete | Go-Live Plan, Status Reports |

- **Key Innovation:** The Library Translator and Design Converter agents do not perform file conversion directly through LLM inference. They orchestrate headless Altium Designer instances (or Altium's import wizards running in scripted/batch mode) while using LLM intelligence to handle exceptions, map ambiguous components, and resolve conversion errors that would otherwise require human judgment.

#### 3.2.7 Post-Deployment Agent Pool

- **Purpose:** Agents that ensure long-term success after the initial deployment, driving adoption, resolving issues, and identifying expansion opportunities.
- **Agents:**

| Agent | Function | Trigger | Key Output |
|-------|----------|---------|------------|
| Support Agent | Issue triage, knowledge base search, escalation routing | Support ticket or user query | Resolution or Escalation |
| Training Agent | Personalized onboarding paths, skill assessment, learning recommendations | New user provisioned or skill gap detected | Training Plan, Progress Report |
| Health Monitor | Track adoption metrics, usage patterns, satisfaction signals | Scheduled (weekly) + event-driven | Health Report, Risk Alerts |
| Expansion Scout | Identify new divisions, use cases, or upsell opportunities | Health data, org chart changes, CRM triggers | Expansion Brief (feeds back to Account Researcher) |

- **Design Principle:** Post-deployment agents complete the feedback loop. Expansion Scout outputs feed back into the Pre-Sales Agent Pool, creating a self-reinforcing cycle. Every support interaction enriches the Migration Knowledge Base.

#### 3.2.8 Migration Engine

- **Purpose:** The non-LLM technical infrastructure that performs actual file processing, format conversion, and design validation.
- **Subcomponents:**

**File Ingestion Service:**
- Accepts legacy design files via secure upload, SFTP, or direct PLM connector pull
- Performs format detection (identifies exact tool version and file format variant)
- Runs inventory scan (counts components, nets, layers, sheets)
- Maps dependencies (which libraries does this design reference?)
- Stages files in normalized structure for processing

**Conversion Pipeline:**
- Drives headless Altium Designer instances with scripted import wizards
- Applies component mapping rules from the Migration Knowledge Base
- Handles batch processing with configurable parallelism
- Logs every conversion decision for audit trail
- Queues exceptions for agent-assisted resolution

**Validation Pipeline:**
- Netlist differencing (source vs. converted)
- BOM comparison (component-by-component matching)
- Visual overlay comparison (rendered PCB images)
- Design rule check execution
- Manufacturing output comparison (Gerber, drill files)
- Generates structured validation reports with pass/fail per criterion

- **Technology:** Altium Designer (scripted), containerized processing workers, object storage for design files, structured database for metadata and results
- **Scaling Model:** Conversion workers scale horizontally. A large enterprise migration (10,000+ components, 500+ designs) runs across a pool of workers. Estimated throughput: 50-200 library components/hour per worker, 5-20 design conversions/hour per worker (varies enormously by complexity).

#### 3.2.9 Migration Knowledge Base

- **Purpose:** The institutional memory of the platform. Every migration makes future migrations faster and more accurate.
- **Contents:**

| Knowledge Type | Description | How It Grows |
|----------------|-------------|-------------|
| Component Mapping Corpus | "Cadence part CDS_RES_0402 maps to Altium part RC0402" | Every library conversion adds mappings |
| Conversion Pattern Library | "When Mentor layer 'ROUTE_KEEPIN' is encountered, map to Altium 'Keep-In Layer'" | Every design conversion adds patterns |
| Issue-Resolution Pairs | "If OrCAD import produces orphaned nets, check for hidden power pins in source" | Every support interaction and error resolution |
| Effort Estimation Model | "Cadence library with N components and M custom footprints takes X hours" | Every completed migration provides training data |
| Customer Migration Histories | Full record of what was migrated, issues encountered, how they were resolved | Automatic capture from every engagement |
| Validation Benchmarks | Expected pass rates by source platform, design complexity, component types | Statistical accumulation over time |

- **Technology:** Vector database for semantic search (finding similar past issues), structured database for mapping tables, document store for full migration histories
- **Learning Mechanism:** After each migration completes and passes customer validation, the mappings, patterns, and resolutions from that migration are promoted to the "validated" tier of the knowledge base, increasing confidence scores for future use.

---

## 4. Data Architecture

### 4.1 Unified Customer Data Model

```
Enterprise (Canonical)
  |
  +-- Division / Business Unit (1..N)
  |     |
  |     +-- Site / Location (1..N)
  |     |     |
  |     |     +-- Design Team (1..N)
  |     |           |
  |     |           +-- Designer (Contact) (1..N)
  |     |           +-- Design Inventory
  |     |           |     +-- Libraries (legacy)
  |     |           |     +-- Schematics (legacy)
  |     |           |     +-- PCB Layouts (legacy)
  |     |           |     +-- Design Rules
  |     |           +-- Tool Environment
  |     |                 +-- EDA Tool (Cadence/Mentor/etc)
  |     |                 +-- PLM System
  |     |                 +-- ERP System
  |     |
  |     +-- Buying Center (1..N)
  |           +-- Economic Buyer (Contact)
  |           +-- Technical Buyer (Contact)
  |           +-- Champion (Contact)
  |           +-- Blocker (Contact)
  |
  +-- Salesforce Records (N..M mapping)
  |     +-- Account ID -> Division mapping
  |     +-- Opportunity ID -> Engagement mapping
  |     +-- Contact ID -> Contact mapping
  |
  +-- Journey State
  |     +-- Current Stage (per division/site)
  |     +-- Qualification Score
  |     +-- Migration Status
  |     +-- Health Score
  |
  +-- Engagement History
        +-- Agent Interactions
        +-- Human Interactions
        +-- Documents Produced
        +-- Decisions Made
```

### 4.2 The "Bosch Problem" -- Entity Resolution

This is one of the most critical data challenges. A company like Bosch might appear in Salesforce as:

- "Bosch" (parent)
- "Robert Bosch GmbH" (legal entity)
- "Bosch Automotive Electronics" (division)
- "Bosch Power Tools" (different division)
- "Bosch Rexroth" (subsidiary)
- "BSH Home Appliances" (joint venture)
- Plus dozens of site-specific records, old acquisition names, and duplicate entries

The Knowledge Graph must resolve these into a canonical hierarchy while preserving the distinct buying centers. The entity resolution logic:

1. **Salesforce Ingest:** Pull all Account records matching fuzzy name match + known subsidiaries
2. **Web Research Agent:** Confirm corporate structure from public sources (SEC filings, corporate websites, D&B)
3. **Hierarchy Construction:** Build canonical tree with confidence scores on each edge
4. **Salesforce Crosswalk:** Map each Salesforce Account ID to the correct node in the canonical tree
5. **Continuous Refinement:** As agents interact with contacts, they confirm or correct the hierarchy

### 4.3 Design Data Model

```
Migration Project
  |
  +-- Source Environment
  |     +-- Platform (Cadence/Mentor/EAGLE/KiCad)
  |     +-- Version
  |     +-- License Type
  |
  +-- Source Libraries
  |     +-- Library File (1..N)
  |           +-- File Path
  |           +-- Format
  |           +-- Component Count
  |           +-- Components (1..N)
  |                 +-- Name
  |                 +-- Type (Symbol/Footprint/3D)
  |                 +-- Parameters
  |                 +-- Conversion Status
  |                 +-- Mapped Altium Part (if converted)
  |                 +-- Conversion Notes
  |
  +-- Source Designs
  |     +-- Design Project (1..N)
  |           +-- Schematics (1..N)
  |           |     +-- Sheet Count
  |           |     +-- Component Count
  |           |     +-- Net Count
  |           +-- PCB Layouts (1..N)
  |           |     +-- Layer Count
  |           |     +-- Component Count
  |           |     +-- Via Count
  |           |     +-- Board Dimensions
  |           +-- Design Rules
  |           +-- Library References
  |           +-- Conversion Status
  |           +-- Validation Results
  |
  +-- Target Environment
  |     +-- Altium Version
  |     +-- Platform (365 / Enterprise Server)
  |     +-- Workspace URL
  |
  +-- Converted Artifacts
  |     +-- Libraries (Altium IntLib/DbLib)
  |     +-- Designs (Altium PrjPcb)
  |     +-- Templates
  |     +-- Design Rules
  |
  +-- Validation Results
        +-- Netlist Comparison (per design)
        +-- BOM Comparison (per design)
        +-- DRC Results (per design)
        +-- Visual Comparison (per design)
        +-- Overall Pass/Fail
```

### 4.4 Data Storage Strategy

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Customer entities and relationships | CustomerNode Graph DB | Purpose-built for entity resolution and journey state |
| CRM data (mirror) | Salesforce + local cache | Salesforce is the CRM of record; cache for agent access |
| Legacy design files | Object storage (S3/GCS) with encryption at rest | Large binary files, need versioning and retention |
| Converted Altium files | Object storage + Altium 365/Enterprise Server | Final destination is the Altium platform itself |
| Migration metadata | Relational database (PostgreSQL) | Structured data with complex queries (status dashboards, reporting) |
| Component mappings | Relational + Vector DB | Structured lookups + semantic search for fuzzy matching |
| Agent outputs (documents) | Document store + Google Docs | Structured artifacts need both programmatic and human access |
| Validation results | Relational database | Structured pass/fail data with drill-down capability |
| Interaction history | Event store (append-only) | Full audit trail, feeds learning system |

### 4.5 Data Flow: End-to-End Migration

```
1. LEAD IDENTIFICATION
   Salesforce (new opportunity) --> Salesforce Connector --> CustomerNode Gateway
   CustomerNode resolves entity --> Knowledge Graph updated
   Journey stage: "New Lead" --> triggers Account Researcher

2. PRE-SALES QUALIFICATION
   Account Researcher --> Account Brief --> Knowledge Graph
   Qualification Analyst reads Knowledge Graph --> Qualification Scorecard
   Scorecard --> Salesforce (custom fields) + CustomerNode (journey advance)
   If "Advance" --> triggers Solution Architect + Value Engineer (parallel)

3. SOLUTION DESIGN
   Solution Architect reads Knowledge Graph (tech stack, team size, pain points)
   Solution Architect --> Solution Design + Demo Script
   Value Engineer --> Business Case + ROI Model
   Both outputs --> Knowledge Graph + Proposal Writer trigger

4. DEAL PROGRESSION
   Proposal Writer --> Proposal --> CustomerNode (shared with customer)
   Deal Strategist --> Close Plan --> Salesforce (opportunity updates)
   Customer signs --> Deal Strategist --> Deal Summary --> Deployment trigger

5. MIGRATION PLANNING
   Migration Planner reads Knowledge Graph (design inventory from discovery)
   Migration Planner requests file upload from customer (via CustomerNode)
   Files uploaded --> File Ingestion Service --> Inventory scan
   Migration Planner --> Migration Plan (scope, timeline, risk)
   Human approval gate --> Migration Plan approved

6. LIBRARY CONVERSION
   Library Translator reads Migration Plan + Source Libraries
   Library Translator queries Migration KB for existing mappings
   For each library:
     - Check KB for known component mappings (cache hit = instant)
     - Submit unmapped components to Conversion Pipeline
     - Conversion Pipeline runs headless Altium import
     - Exceptions routed to Library Translator agent for resolution
     - Agent resolves using KB patterns + LLM reasoning
     - Resolved mappings written back to KB
   Library Translator --> Validation Pipeline
   Validation results --> Migration metadata DB
   Human review gate for flagged items

7. DESIGN CONVERSION
   Design Converter reads Migration Plan + Validated Libraries
   For each design project:
     - Submit to Conversion Pipeline with library references
     - Conversion Pipeline runs headless Altium import wizard
     - Exceptions routed to Design Converter agent
     - Agent resolves using KB patterns + LLM reasoning
   Design Converter --> Validation Pipeline
   Validation Pipeline runs full suite (netlist, BOM, visual, DRC)
   Results --> Migration metadata DB
   Human review gate for designs with validation failures

8. ENVIRONMENT DEPLOYMENT
   Environment Configurator reads Solution Design + Customer requirements
   Sets up Altium 365/Enterprise Server workspace (via API)
   Configures users, groups, permissions, design rules, templates
   Imports validated libraries and designs
   --> Deployment Guide + Configuration Spec

9. GO-LIVE
   Deployment Coordinator orchestrates cutover
   Training Agent initiates onboarding sequences
   Health Monitor begins tracking adoption metrics
   --> CustomerNode journey advances to "Deployed"

10. ONGOING
    Health Monitor --> weekly health reports --> CustomerNode
    Support Agent handles issues --> resolutions enrich KB
    Expansion Scout identifies new divisions --> feeds back to step 1
    Every resolved issue, every successful conversion --> KB grows
```

---

## 5. Agent Interaction Patterns

### 5.1 The Briefing Pattern (Existing)

Agents do not share raw context. Instead, each agent produces a structured artifact ("briefing") that is stored in the knowledge graph and available to downstream agents. This prevents context bleed and keeps each agent focused.

```
Account Researcher                  Qualification Analyst
+-------------------+              +---------------------+
| Reads: Web, CRM   |   Account   | Reads: Account Brief|
| Writes: Account   | --Brief-->  | Writes: Qualification|
|   Brief           |              |   Scorecard          |
+-------------------+              +---------------------+
```

### 5.2 The Escalation Pattern (New)

When an agent encounters a situation outside its competence, it escalates rather than guessing. Escalations follow a defined chain:

```
Agent encounters issue
  |
  +--> Can another agent resolve it?
  |      YES --> Route to specialist agent with context packet
  |      NO  --> Route to human supervisor with context + recommended actions
  |
  +--> Is this a known pattern?
         YES --> Apply KB resolution, log confirmation
         NO  --> Flag as novel, require human review, capture resolution for KB
```

### 5.3 The Parallel Fan-Out Pattern

Some stages require multiple agents working simultaneously on different aspects of the same customer:

```
Qualification Scorecard (Advance)
         |
         +------------+------------+
         |            |            |
         v            v            v
  Solution      Value         Competitive
  Architect     Engineer      Intel
         |            |            |
         +------------+------------+
         |
         v
   Proposal Writer (merges all inputs)
```

Similarly for migration:

```
Migration Plan (Approved)
         |
         +--------+--------+--------+--------+
         |        |        |        |        |
         v        v        v        v        v
  Library   ECAD     Infra    PLM      MCAD
  Trans.    Setup    Setup    Config   Config
         |        |        |        |        |
         +--------+--------+--------+--------+
         |
         v
  Deployment Coordinator (merges all status)
```

### 5.4 The Learning Loop Pattern (New)

After every completed migration phase, a learning extraction step runs:

```
Migration Phase Complete
  |
  v
Learning Extractor (automated)
  |
  +-- New component mappings --> KB (component mapping corpus)
  +-- New conversion patterns --> KB (pattern library)
  +-- Issue-resolution pairs --> KB (issue-resolution pairs)
  +-- Actual vs estimated effort --> KB (estimation model training data)
  +-- Customer-specific notes --> Knowledge Graph (engagement history)
```

This is the mechanism by which the system gets better over time. The 50th Cadence-to-Altium migration should be dramatically faster than the 5th.

### 5.5 The CustomerNode Handshake Pattern

CustomerNode's journey agents and Altium's domain agents coordinate through a well-defined handshake:

```
CustomerNode Journey Agent                 Altium Domain Agent
(e.g., "Discovery Guide")                 (e.g., Account Researcher)
                |                                    |
                |-- "Customer entered Discovery" --> |
                |                                    |-- Executes research
                |                                    |-- Produces Account Brief
                |<-- "Brief complete, findings:" --- |
                |                                    |
                |-- Advances journey to next stage   |
                |-- Presents findings to customer    |
```

CustomerNode handles the customer-facing journey experience. Altium agents handle the domain-specific execution. Neither needs to understand the other's internals.

---

## 6. Integration Architecture

### 6.1 Salesforce Integration

**Pattern:** Bidirectional sync with CustomerNode as the orchestration layer.

```
Salesforce          Salesforce           CustomerNode        Agent
  CRM               Connector            Gateway            Orchestrator
   |                    |                    |                   |
   |-- CDC Event ------>|                    |                   |
   |  (Opp stage        |-- Normalized   --->|                   |
   |   changed)         |   event            |-- Journey     --->|
   |                    |                    |   stage change     |
   |                    |                    |                   |-- Agent
   |                    |                    |                   |   executes
   |                    |                    |                   |
   |                    |<-- Agent output ---|<-- Artifact ------|
   |<-- Update ---------|   (SF format)      |   (stored)        |
   |  (Notes, custom    |                    |                   |
   |   fields)          |                    |                   |
```

**Specific Integrations:**
- Account hierarchy sync (inbound, daily batch + real-time CDC)
- Opportunity stage changes (inbound, real-time CDC triggers agent workflows)
- Contact roles and relationships (inbound, enriches knowledge graph)
- Agent output artifacts pushed as Salesforce Notes, ContentDocument, or Custom Object records (outbound)
- Qualification scores written to custom fields on Opportunity (outbound)
- Deployment status tracked in custom object with milestones (outbound)

### 6.2 CustomerNode Integration

**Pattern:** CustomerNode is the journey orchestration layer; Altium agents are registered as domain-specific executors.

**Registration Model:** Each Altium agent registers with CustomerNode as a capability:
```
{
  "agent_id": "migration-specialist",
  "capability": "legacy_eda_migration",
  "triggers": ["journey_stage:migration_planning", "event:files_uploaded"],
  "outputs": ["migration_plan", "conversion_report", "validation_report"],
  "approval_required": true,
  "estimated_duration": "hours_to_days"
}
```

**Entity Resolution API:** CustomerNode exposes an entity resolution endpoint:
```
POST /api/v1/entities/resolve
{
  "name": "Bosch Automotive Electronics",
  "salesforce_id": "001XXXXXXXXXXXX",
  "domain": "bosch.com",
  "contacts": ["hans.mueller@de.bosch.com"]
}

Response:
{
  "canonical_entity_id": "ent_bosch_auto_elec",
  "parent": "ent_bosch_gmbh",
  "hierarchy": ["Robert Bosch GmbH", "Bosch Mobility", "Bosch Automotive Electronics"],
  "known_sites": ["Reutlingen", "Schwieberdingen", "Abstatt"],
  "existing_journey": "j_bosch_ae_2026_q1",
  "confidence": 0.94
}
```

### 6.3 Legacy EDA Tool Integration

**Pattern:** File-based ingestion with format auto-detection. No direct API integration with legacy tools (they generally don't have suitable APIs).

**Supported Ingestion Methods:**

| Method | Use Case | Security Model |
|--------|----------|---------------|
| Web Upload Portal | Small migrations, individual engineers | TLS + auth, virus scan, format validation |
| SFTP Drop | Enterprise bulk transfers | SSH keys, IP allowlist, integrity checks |
| PLM Connector Pull | Organizations with Windchill/Teamcenter | Service account, connector-specific auth |
| Direct File Share | On-prem deployments | Network-level access, service account |

**Format Detection Pipeline:**
```
File arrives --> Magic number check --> Extension validation --> Header parse
  |
  v
Identified: "Cadence Allegro PCB, v17.2, binary format"
  |
  v
Inventory scan: 6 layers, 342 components, 1247 nets, 3 blind vias
  |
  v
Dependency map: References libraries [lib_custom.olb, lib_standard.olb]
  |
  v
Staged for conversion with metadata record
```

### 6.4 Altium Platform Integration

**Pattern:** API-driven workspace and content management.

**Altium 365 API Operations:**
- Workspace creation and configuration
- User/group provisioning (SCIM or direct API)
- Project creation and content upload
- Library upload to vault
- Design rule template deployment
- Component catalog configuration

**Altium Enterprise Server Operations:**
- Server configuration via REST API
- Vault service configuration
- User/role management via LDAP/SSO integration
- Content deployment via workspace API

**Headless Altium Designer Operations** (for conversion):
- Scripted import wizard execution (DXP commands)
- Batch library conversion
- Automated DRC execution
- Output generation (Gerber, drill, BOM) for validation comparison

### 6.5 PLM System Integration

**Pattern:** Bidirectional connector for part lifecycle data.

| PLM System | Connector Type | Capabilities |
|------------|---------------|-------------|
| PTC Windchill | Altium native connector | Part sync, lifecycle state, BOM publish |
| Siemens Teamcenter | Altium native connector | Part sync, lifecycle state, BOM publish |
| Arena Solutions | REST API connector | Part sync, BOM management |
| Oracle Agile | Custom connector | Part data, change order integration |

**Key Data Flows:**
- Part numbers and lifecycle states from PLM inform component mapping during migration
- Migrated designs published back to PLM with correct part references
- BOM data synchronized post-migration to maintain PLM data integrity

---

## 7. The "Self-Deploying" Concept

### 7.1 What "Self-Deploying" Means

The term "self-deploying" does not mean fully autonomous with no human involvement. It means the system can execute the vast majority of migration work with compute and tokens, requiring human involvement only at critical decision points.

**Analogy:** Think of it as a self-driving car with Level 4 autonomy for migrations. It handles the highway driving (library conversion, design import, validation, environment setup). Humans handle the complex intersections (ambiguous component mappings, customer-specific design rule decisions, go/no-go approvals).

### 7.2 Autonomy Levels by Stage

| Stage | Autonomy Level | Human Role | Agent Role |
|-------|---------------|------------|------------|
| Lead Identification | High | Review and approve targets | Scan market signals, identify prospects, research accounts |
| Qualification | Medium | Validate scoring, make advance/hold decisions | Run MEDDPICC analysis, surface red flags, recommend action |
| Solution Design | Medium | Review and customize solution | Generate solution design, demo scripts, competitive positioning |
| Proposal Generation | Medium | Review and send | Draft proposal, SOW, pricing |
| Migration Planning | Medium | Approve plan, authorize file access | Inventory assets, estimate effort, create roadmap |
| Library Conversion | High | Review exception reports, approve flagged items | Convert libraries, resolve mappings, validate |
| Design Conversion | High | Review validation reports, approve flagged designs | Convert designs, run validation suite |
| Environment Setup | High | Approve configuration, validate access | Configure workspace, users, permissions, standards |
| Validation | High | Final sign-off on validation reports | Run full validation suite, generate reports |
| Deployment/Go-Live | Medium | Coordinate with customer, manage cutover timing | Execute deployment steps, verify access, run smoke tests |
| Training | Medium-High | Conduct live sessions, answer questions | Generate personalized learning paths, create materials |
| Ongoing Support | Medium-High | Handle escalations, build relationships | Triage issues, search KB, monitor health, identify expansion |

### 7.3 Approval Gates

The system implements mandatory approval gates at critical transitions:

```
GATE 1: Qualification Decision
  Agent recommends: Advance / Develop / Hold / Disqualify
  Human approves or overrides
  --> Prevents wasting resources on poor-fit opportunities

GATE 2: Migration Plan Approval
  Agent produces: Scope, timeline, risk assessment, cost estimate
  Human reviews with customer
  --> Prevents scope misalignment

GATE 3: Library Conversion Review
  Agent produces: Conversion report with exceptions flagged
  Human reviews flagged items (typically 5-15% of components)
  --> Prevents incorrect component mappings propagating to designs

GATE 4: Design Validation Sign-Off
  Agent produces: Full validation report (netlist, BOM, visual, DRC)
  Human reviews any validation failures
  Customer signs off on representative sample
  --> Prevents shipping incorrectly converted designs

GATE 5: Go-Live Authorization
  Agent produces: Readiness checklist, all-green validation
  Human authorizes cutover
  Customer confirms readiness
  --> Prevents premature deployment
```

### 7.4 The Compound Learning Effect

Each migration makes the next one faster:

```
Migration 1 (Cadence, Automotive):
  - 12,000 components, 80% require manual mapping
  - 500 designs, 30% have conversion issues
  - Elapsed: 12 weeks
  - KB learns: 9,600 component mappings, 150 conversion patterns

Migration 2 (Cadence, Automotive, different customer):
  - 15,000 components, 40% require manual mapping (60% cached from M1)
  - 800 designs, 15% have conversion issues (patterns from M1 resolve many)
  - Elapsed: 8 weeks
  - KB learns: 6,000 new mappings, 80 new patterns (cumulative: 15,600 mappings)

Migration 10 (Cadence, Automotive):
  - 10,000 components, 10% require manual mapping (90% cached)
  - 300 designs, 5% have conversion issues
  - Elapsed: 3 weeks
  - KB is now authoritative for Cadence automotive migrations
```

This is the economics that makes the platform viable at scale. The 50th enterprise migration should be an order of magnitude cheaper than the 5th.

---

## 8. MVP vs Full Vision Phasing

### Phase 0: Foundation (Exists Today)

**What's Built:**
- 16-agent Altium Solutions Team in Agent Architect
- Stage-based workflow (Discovery -> Qualification -> Technical Sales -> Business Sales -> Deployment -> Support)
- Structured output artifacts (Account Briefs, Qualification Scorecards, Solution Designs, etc.)
- MCP server integration (Gmail, Google Docs, Chrome, PowerPoint)
- CustomerNode integration flagged but not yet active in team.json

**What's Missing:**
- No automated migration engine (agents advise but don't execute)
- No persistent knowledge graph (each engagement starts fresh)
- No CustomerNode integration (journey state not tracked)
- No Salesforce bidirectional sync (manual CRM updates)
- No learning system (no compound improvement)

### Phase 1: Connected Intelligence (3-6 months)

**Goal:** Connect the existing agent team to real data systems so agents operate on live customer data rather than manual input.

**Deliverables:**
1. **Salesforce Connector (Read):** Agents can pull account data, opportunity details, and contact information directly from Salesforce
2. **CustomerNode Entity Resolution:** Integrate CustomerNode's entity resolution to solve the "Bosch problem" -- agents see a unified customer hierarchy, not fragmented CRM records
3. **Persistent Customer Knowledge Store:** Agent outputs (account briefs, qualification scorecards) persist in a structured store, available to future agents working the same account
4. **CRM Writeback (Basic):** Qualification scores and deal stage recommendations pushed back to Salesforce as notes/custom fields

**Key Technical Work:**
- Salesforce REST API integration (read-only initially, then writeback)
- CustomerNode API integration for entity resolution
- Structured output storage (likely PostgreSQL + document store)
- Agent context assembly: modify orchestrator to inject customer history into agent prompts

**Success Metric:** An agent working on Bosch Automotive Electronics in week 8 can reference the account brief created in week 1 without manual copy-paste. Qualification Analyst sees a unified Bosch hierarchy, not 200 fragmented Salesforce records.

### Phase 2: Migration Engine MVP (6-12 months)

**Goal:** Automate the highest-volume, most repeatable part of migration -- component library conversion -- with the learning system capturing knowledge from each conversion.

**Deliverables:**
1. **File Ingestion Service:** Secure upload portal with format auto-detection and inventory scanning
2. **Library Conversion Pipeline:** Headless Altium Designer instances running scripted import wizards for component library conversion
3. **Component Mapping Knowledge Base:** Persistent store of "legacy part X -> Altium part Y" mappings with confidence scores
4. **Conversion Dashboard:** Web interface showing conversion progress, exception queue, validation status
5. **Agent-Assisted Exception Resolution:** When automated conversion fails on a component, the Migration Specialist agent analyzes the issue and proposes a resolution

**Key Technical Work:**
- Headless Altium Designer automation (DXP scripting for batch import)
- Containerized conversion workers (Altium Designer in Windows containers or VMs)
- Component mapping database with semantic search (for fuzzy matching)
- Validation tooling (automated netlist and BOM comparison)
- Exception queue with agent integration

**Constraints:**
- Altium Designer requires Windows and a GUI-capable environment; true "headless" may require VNC-style automation or Altium's batch processing APIs
- Licensing model for automated conversion instances needs negotiation with Altium licensing team
- Initial focus on Cadence and Mentor (highest enterprise volume)

**Success Metric:** Library conversion for a typical Cadence customer (5,000 components) takes 2 days of compute + 4 hours of human review for exceptions, versus 2-3 weeks of manual effort today.

### Phase 3: Full Migration Pipeline (12-18 months)

**Goal:** Extend the engine from library conversion to full design migration (schematics + PCB layouts) with end-to-end validation.

**Deliverables:**
1. **Design Conversion Pipeline:** Scripted import of schematics and PCB layouts
2. **Full Validation Suite:** Netlist diff, BOM compare, visual overlay, DRC execution
3. **Environment Auto-Provisioning:** Automated Altium 365/Enterprise Server workspace setup via API
4. **Migration Planner Agent (Enhanced):** Uses historical data from KB to estimate effort and predict issues before migration begins
5. **Customer-Facing Migration Portal:** CustomerNode-integrated view where customer can track migration progress, review validation reports, approve batches

**Key Technical Work:**
- PCB layout conversion automation (significantly more complex than library conversion)
- Visual comparison tooling (rendered image diff of source vs. converted PCB)
- Altium 365 API integration for workspace provisioning
- CustomerNode journey template for migration lifecycle
- Reporting and analytics dashboard

**Success Metric:** End-to-end migration of 200 designs from Cadence to Altium takes 3 weeks (1 week compute + 2 weeks human review/approval cycles) versus 3-4 months today.

### Phase 4: Self-Improving Platform (18-24 months)

**Goal:** The learning system is mature enough that migrations are measurably faster with each successive engagement, and the platform can predict and prevent issues before they occur.

**Deliverables:**
1. **Predictive Migration Assessment:** Before a single file is converted, the system predicts likely issues, estimates effort with high accuracy, and recommends a migration strategy based on historical patterns
2. **Automated Anomaly Detection:** The system identifies when a conversion result looks "wrong" by comparing against statistical baselines from previous migrations
3. **Cross-Customer Intelligence:** Patterns learned from Customer A's Cadence migration inform Customer B's Cadence migration (with appropriate data isolation)
4. **Self-Tuning Conversion:** Conversion pipeline parameters automatically adjust based on accumulated success/failure data
5. **Expansion Intelligence:** Post-deployment agents reliably identify expansion opportunities (new divisions, additional seats, adjacent use cases) and warm-transfer them to pre-sales agents

**Key Technical Work:**
- Machine learning models for effort estimation and issue prediction
- Statistical anomaly detection on conversion and validation results
- Cross-customer knowledge isolation framework (learning transfers, raw data does not)
- Feedback loop instrumentation (tracking which KB entries lead to successful resolutions)

**Success Metric:** For the 20th Cadence-to-Altium migration, the system predicts the effort estimate within 15% and pre-resolves 80%+ of conversion exceptions without human intervention.

### Phase 5: Full Lifecycle Automation (24-36 months)

**Goal:** The platform handles the complete lifecycle from lead identification through multi-year customer success, with agents operating across all stages and CustomerNode orchestrating the unified journey.

**Deliverables:**
1. **Proactive Lead Generation:** Agents monitor market signals (job postings for PCB designers, press releases mentioning design tool evaluations, contract renewal timelines for competitor tools) and proactively identify prospects
2. **Automated Proof-of-Concept:** System can run a small-scale proof-of-concept migration (10 components, 1 design) automatically as part of the evaluation process
3. **Continuous Deployment:** Post-deployment system continuously monitors Altium updates, customer environment changes, and proactively manages environment optimization
4. **Industry Migration Playbooks:** Pre-built migration strategies optimized by industry vertical (automotive, aerospace, consumer electronics, medical devices) with industry-specific compliance considerations
5. **Partner Ecosystem:** API layer allows system integrators and partners to leverage the migration engine for their own customer engagements

---

## 9. Security Architecture

### 9.1 Security Model Overview

Enterprise design data is among the most sensitive intellectual property a company possesses. A Boeing PCB design for a defense system, a Tesla battery management board, a Bosch automotive safety controller -- these are crown jewels. The security model must reflect this reality.

### 9.2 Data Classification

| Classification | Examples | Controls |
|----------------|----------|----------|
| Customer IP (Critical) | Legacy design files, PCB layouts, component libraries | Encryption at rest (AES-256), encryption in transit (TLS 1.3), access logging, time-limited retention, customer-controlled deletion |
| Customer Data (Sensitive) | Contact information, org charts, buying dynamics | Encrypted at rest, access-controlled, GDPR/CCPA compliant |
| Migration Knowledge (Internal) | Component mappings, conversion patterns | Anonymized (no customer attribution), access-controlled |
| Agent Outputs (Confidential) | Qualification scorecards, deal strategies | Access-controlled per deal team, encrypted at rest |
| Platform Telemetry (Internal) | Performance metrics, error rates | Aggregated, no customer-identifiable data |

### 9.3 Design File Security

```
Customer uploads design files
  |
  v
[Quarantine Zone]
  - Virus scan
  - Format validation (reject non-EDA files)
  - Integrity check
  |
  v
[Processing Zone]
  - Encrypted storage (customer-specific encryption key)
  - Processing workers operate in isolated environments (per-customer)
  - No cross-customer data access
  - All access logged
  |
  v
[Delivery Zone]
  - Converted files delivered to customer's Altium workspace
  - Source files retained only for agreed retention period
  - Customer can request immediate deletion
  |
  v
[Purge]
  - Source files securely deleted after retention period
  - Only anonymized mapping data retained in KB
```

### 9.4 Multi-Tenancy Isolation

- Each customer engagement operates in an isolated processing environment
- No design file data crosses customer boundaries
- Component mappings extracted for the KB are anonymized (stripped of customer-specific part numbers, project names, etc.)
- Agent context is customer-scoped; an agent working on Boeing cannot access Tesla data
- Audit logs per customer for compliance requirements

### 9.5 Compliance Considerations

| Regulation | Applicability | Controls |
|------------|--------------|----------|
| ITAR | Defense/aerospace customer designs | US-only processing, citizenship verification for human reviewers, no foreign cloud regions |
| GDPR | European customer contact data | Data minimization, right to erasure, consent tracking |
| SOC 2 Type II | Platform operations | Access controls, change management, monitoring, incident response |
| ISO 27001 | Overall security posture | Information security management system |
| Customer-specific NDAs | Per engagement | Data handling terms per customer agreement |

### 9.6 LLM Security Considerations

- Design file contents should not be sent to general-purpose LLM APIs for analysis; use on-premise or private deployment models for any processing that involves actual design data
- LLM-based agents that analyze design metadata (component counts, layer counts, format types) operate on structured metadata, not raw design data
- Component mapping suggestions from the LLM are always validated against the KB and/or human review before application
- Agent outputs that reference customer-specific information are stored in customer-scoped storage, never in shared model training data

---

## 10. Infrastructure Architecture

### 10.1 Deployment Architecture

```
+-------------------------------------------------------------------+
|                     CLOUD INFRASTRUCTURE                           |
|                                                                    |
|  +---------------------------+  +------------------------------+   |
|  |   ORCHESTRATION PLANE     |  |    DATA PLANE                |   |
|  |                           |  |                              |   |
|  | Agent Runtime (Claude)    |  | PostgreSQL (migration meta)  |   |
|  | CustomerNode Integration  |  | Graph DB (customer knowledge)|   |
|  | Salesforce Connector      |  | Vector DB (semantic search)  |   |
|  | Workflow Engine           |  | Object Storage (design files)|   |
|  | API Gateway               |  | Redis (caching, queues)      |   |
|  +---------------------------+  +------------------------------+   |
|                                                                    |
|  +---------------------------+  +------------------------------+   |
|  |   PROCESSING PLANE        |  |    PRESENTATION PLANE        |   |
|  |                           |  |                              |   |
|  | Windows VMs (Altium)      |  | Admin Dashboard              |   |
|  | Conversion Workers        |  | Customer Migration Portal    |   |
|  | Validation Workers        |  | Reporting / Analytics        |   |
|  | File Processing Pipeline  |  | API (partner access)         |   |
|  +---------------------------+  +------------------------------+   |
+-------------------------------------------------------------------+
```

### 10.2 The Windows VM Problem

Altium Designer is a Windows application. Automating it requires Windows environments with GPU-capable display (for 3D rendering during validation). This is the most operationally complex part of the infrastructure.

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| Windows VMs on cloud (Azure/AWS) | Scalable, managed infrastructure | Expensive per-hour, licensing complexity |
| On-prem Windows farm | Lower per-hour cost, full control | Capacity planning, maintenance burden |
| Altium Server-side processing API | Ideal if available | May not expose all import wizard capabilities |
| Hybrid | Scale cloud for bursts, baseline on-prem | Operational complexity |

**Recommendation:** Start with cloud Windows VMs (Azure preferred due to Windows licensing advantages), with a roadmap to work with Altium engineering on a server-side conversion API that eliminates the GUI dependency.

### 10.3 Scaling Model

| Component | Scaling Approach | Expected Scale |
|-----------|-----------------|---------------|
| Agent Runtime | Horizontal (more Claude sessions) | 10-50 concurrent agent sessions |
| Conversion Workers | Horizontal (more Windows VMs) | 5-20 workers for large migrations |
| Validation Workers | Horizontal | Matches conversion worker count |
| Database | Vertical + read replicas | Single primary, scale reads |
| Object Storage | Managed cloud storage | Unlimited (TB-scale per large customer) |
| CustomerNode | Managed by CustomerNode | Per their scaling model |

### 10.4 Cost Model Estimation

| Cost Driver | Unit | Estimated Cost | Notes |
|-------------|------|----------------|-------|
| Claude API tokens | Per million tokens | $15-75 (varies by model) | Agents are token-intensive; expect 1-5M tokens per deal lifecycle |
| Windows VM compute | Per hour | $1-5/hour per worker | Altium conversion is compute-intensive |
| Object storage | Per TB/month | $23/TB/month (S3) | Design files can be large; 10-100GB per customer |
| Database | Per month | $200-2000/month | Depends on instance size |
| CustomerNode | Per platform license | TBD | CustomerNode commercial terms |
| Altium licenses (automation) | Per seat | TBD | Need Altium licensing negotiation for headless use |

**Economics Target:** Total platform cost per enterprise migration should be 10-30% of the cost of the equivalent human professional services engagement. If a typical 200-seat enterprise migration costs $200K in PS fees today, the platform target is $20-60K in compute/token/license costs.

---

## 11. Key Technical Risks and Mitigations

### 11.1 Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| R1 | Altium Designer cannot be reliably automated headless for import operations | Medium | Critical | Engage Altium engineering early; use VNC-style automation as fallback; lobby for server-side API |
| R2 | Component mapping accuracy insufficient for enterprise quality standards | Medium | High | Conservative approach: flag low-confidence mappings for human review; never auto-approve below 95% confidence |
| R3 | Enterprise customers unwilling to upload design files to cloud platform | High | High | Offer on-prem deployment option; provide extensive security documentation; start with non-sensitive pilot designs |
| R4 | CustomerNode integration proves more complex than anticipated | Medium | Medium | Design for loose coupling; platform must function without CustomerNode (manual journey management) |
| R5 | Legacy EDA file formats have undocumented variations that break conversion | High | Medium | Build comprehensive format detection; maintain exception queue; every new variation enriches the KB |
| R6 | Token costs for agent-intensive workflows exceed ROI targets | Medium | Medium | Optimize prompts; cache frequently-used context; use smaller models for routine operations; reserve large models for complex reasoning |
| R7 | Validation pipeline cannot detect all conversion errors | Medium | High | Multi-layered validation (automated + statistical anomaly detection + human review for critical designs); never claim 100% automated validation |
| R8 | Learning system introduces bias from early migrations | Low | Medium | Confidence scoring on all KB entries; periodic human review of high-usage mappings; A/B testing against fresh conversions |
| R9 | ITAR/export control requirements make cloud processing infeasible for defense customers | High | Medium | On-prem deployment option from Phase 2; US-only cloud regions; FedRAMP pathway |
| R10 | Altium licensing does not support automated/headless use at viable economics | Medium | Critical | Early engagement with Altium licensing; frame as force-multiplier for PS revenue, not cannibalization; propose usage-based licensing |

### 11.2 Critical Dependencies

| Dependency | Owner | Risk Level | Contingency |
|------------|-------|------------|-------------|
| Altium Designer automation capabilities | Altium Engineering | High | VNC automation fallback; SDK investigation |
| CustomerNode API availability and stability | CustomerNode | Medium | Loose coupling; manual fallback for journey management |
| Salesforce API access for enterprise customers | Customer IT teams | Medium | Support for multiple auth models; CSV import fallback |
| Claude API availability and rate limits | Anthropic | Low | Queue-based architecture handles rate limits; multi-provider strategy for non-sensitive reasoning |
| Enterprise customer willingness to share design data | Customer decision-makers | High | On-prem option; graduated trust model (start with non-sensitive designs) |

---

## 12. Metrics and Observability

### 12.1 Business Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Migration Velocity | Designs converted per week per customer | 10x improvement over manual by Phase 3 |
| Cost per Migration | Total platform cost per enterprise migration | <30% of equivalent PS cost |
| Conversion Accuracy | Percentage of designs passing all validation checks | >95% first-pass, >99.5% after exception resolution |
| Time to Deploy | Days from signed deal to live Altium environment | <30 days for standard enterprise |
| KB Hit Rate | Percentage of component mappings found in KB (vs. new) | >80% by 10th migration of same source platform |
| Agent Effectiveness | Percentage of agent recommendations accepted by humans | >85% for qualification, >90% for migration decisions |
| Customer Satisfaction | Post-migration NPS score | >50 (excellent for enterprise software) |

### 12.2 Operational Metrics

| Metric | Definition | Alert Threshold |
|--------|-----------|----------------|
| Conversion Worker Queue Depth | Pending conversion jobs | >100 (scaling needed) |
| Exception Rate | Percentage of conversions requiring human intervention | >20% (indicates new pattern or tool version issue) |
| Agent Response Time | Time from trigger to agent output | >30 minutes for simple tasks |
| Validation Pipeline Throughput | Designs validated per hour | <5/hour (performance issue) |
| KB Staleness | Age of most-referenced mapping entries without revalidation | >6 months (revalidation needed) |

---

## 13. Open Questions

### Technical

1. **Altium Headless Automation:** What is the current state of Altium Designer's scripting/automation capabilities? Can import wizards be driven entirely via DXP script without GUI interaction? Is there an SDK or API roadmap for server-side conversion?

2. **CustomerNode API Maturity:** What APIs does CustomerNode currently expose for external agent integration? Is there a documented webhook/event model? What entity resolution capabilities exist today vs. need to be built?

3. **File Format Coverage:** What percentage of enterprise legacy designs are in formats that Altium's existing import wizards support? What are the known gaps (specific Cadence/Mentor versions, custom formats)?

4. **LLM for Design Analysis:** To what extent can LLMs reason about PCB design data? Can they meaningfully analyze component parameters, footprint geometries, or design rule equivalence? Or are they limited to orchestrating tooling that does the actual analysis?

### Business

5. **Licensing Model for Automation:** How does Altium licensing accommodate automated/headless use of Altium Designer for conversion? Is there a per-conversion pricing model, or does each worker need a full seat license?

6. **PS Cannibalization Concern:** How is the transition framed internally? This platform could dramatically reduce PS headcount needs. Is the positioning "same revenue, more customers" or "lower cost per customer, higher margin"?

7. **CustomerNode Commercial Relationship:** What is the commercial model for CustomerNode integration? Is this a partnership, an OEM arrangement, or a customer-vendor relationship?

8. **Customer Data Sensitivity:** What percentage of target enterprise customers would accept cloud-based processing of their design files? For those who won't, is on-prem deployment viable from a support and maintenance perspective?

### Strategic

9. **Competitive Moat:** If this platform is successful, what prevents competitors (Cadence, Siemens) from building the same thing in reverse (migration to their platforms)? The answer should be the Knowledge Base -- the compound learning from hundreds of migrations that cannot be replicated without doing the migrations.

10. **Platform vs. Service:** Is the end state a platform that Altium operates internally to serve customers, or a product that partners/integrators can license to serve their own customers?

---

## 14. Architectural Decision Records

### ADR-001: CustomerNode as Journey Orchestrator

**Status:** Proposed
**Date:** 2026-02-11

**Context:** The platform needs a journey orchestration layer that manages the customer lifecycle from first touch through ongoing success. This could be built custom, built on top of a generic workflow engine, or delegated to a purpose-built platform.

**Decision:** Use CustomerNode as the journey orchestration layer.

**Rationale:**
- CustomerNode is purpose-built for complex B2B journeys with 60-100 touchpoints
- It already has 50+ contextual AI agents, providing complementary capabilities
- Entity resolution is a core capability, directly addressing the "Bosch problem"
- It bridges the buyer-seller divide by creating a shared journey view
- Building this from scratch would take 12-18 months and distract from the migration engine

**Consequences:**
- Platform depends on CustomerNode's API stability and feature roadmap
- CustomerNode's pricing model directly impacts platform economics
- Altium agents must conform to CustomerNode's integration model
- If CustomerNode doesn't work out, migration to alternative orchestrator requires significant rework

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| Custom-built orchestrator | Full control, no external dependency | 12-18 months to build, maintains own entity resolution |
| Salesforce Journey Builder | Already in the CRM, team knows it | Not designed for agent orchestration, limited entity resolution |
| Temporal/Conductor workflow | Battle-tested workflow engines | No entity resolution, no customer-facing journey view |

---

### ADR-002: File-Based Legacy Integration (Not API-Based)

**Status:** Proposed
**Date:** 2026-02-11

**Context:** Legacy EDA tools (Cadence Allegro, Mentor PADS/Xpedition, EAGLE) need to provide source data for migration. The question is whether to integrate at the API level (if APIs exist) or at the file level.

**Decision:** Use file-based integration exclusively for legacy EDA data ingestion.

**Rationale:**
- Legacy EDA tools generally do not have suitable external APIs for data extraction
- Enterprise customers already have processes for exporting design files
- File-based approach works regardless of the legacy tool version or configuration
- Eliminates the need to maintain connectors for dozens of legacy tool versions
- Customers are comfortable with file transfer (it's how they share designs with CMs today)

**Consequences:**
- Cannot pull data directly from running legacy tool instances
- Depends on customer to export files correctly (format, completeness)
- File format variations between tool versions create conversion complexity
- Large file transfers need robust ingestion infrastructure

---

### ADR-003: Headless Altium Designer for Conversion (Not LLM-Direct)

**Status:** Proposed
**Date:** 2026-02-11

**Context:** The conversion of legacy EDA files to Altium format could theoretically be done by having an LLM parse the source format and generate Altium format directly, or by using Altium Designer's own import wizards in an automated fashion.

**Decision:** Use Altium Designer's import wizards, driven by scripted automation, as the conversion engine. LLM agents orchestrate the process and handle exceptions, but do not perform format translation directly.

**Rationale:**
- Altium's import wizards represent decades of format-specific conversion knowledge
- EDA file formats are complex binary formats; LLM parsing would be unreliable
- Import wizards handle thousands of edge cases in format translation
- Using Altium's own tooling produces files guaranteed to be valid Altium format
- LLMs add value in exception handling (ambiguous mappings, missing data) not bulk conversion

**Consequences:**
- Requires Windows compute infrastructure for Altium Designer instances
- Altium licensing must accommodate automated/headless use
- Conversion throughput is limited by Altium Designer's processing speed
- Cannot convert formats that Altium's import wizards don't support (rare edge case)

---

### ADR-004: Anonymized Learning System

**Status:** Proposed
**Date:** 2026-02-11

**Context:** The Migration Knowledge Base must learn from every migration to improve future migrations. However, enterprise customer design data is highly sensitive intellectual property. The system must learn without leaking customer IP.

**Decision:** All knowledge extracted from individual migrations is anonymized before entering the shared Knowledge Base. Customer-specific data remains in customer-scoped storage.

**Rationale:**
- Enterprise customers will not accept their design data being used to train systems for competitors
- Component mappings can be expressed generically ("Cadence CDS_RES_0402 -> Altium RC0402") without revealing customer context
- Conversion patterns can be expressed as format-level rules without customer attribution
- This model is analogous to how medical research anonymizes patient data while advancing general knowledge

**Knowledge Extraction Rules:**
- Component mappings: Source part number/type -> Altium part number/type (no customer part numbers, no design names)
- Conversion patterns: Source format condition -> resolution approach (no file paths, no project names)
- Effort data: Source platform + complexity metrics -> elapsed time (no customer name, no specific design details)
- Issue-resolution pairs: Error type + context category -> resolution steps (no customer-specific debugging details)

**Consequences:**
- Some potentially valuable context is lost in anonymization
- Effort estimation models may be less accurate without customer-specific factors
- Requires careful review of what constitutes "anonymized" for each data type
- Periodic audit needed to ensure anonymization is effective

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-11 | Nick DeMarco with AI | Initial vision document |

---

## Appendix A: Mapping to Existing Agent Architect Agents

The following table maps the conceptual agents in this architecture to existing agents in the Agent Architect repository (`/Users/nickd/Workspaces/AgentArchitect/agents/`).

| Architecture Agent | Existing Agent | Status | Gap |
|-------------------|---------------|--------|-----|
| Account Researcher | `account-researcher` | Exists | Add Salesforce data pull, CustomerNode entity lookup |
| Qualification Analyst | `qualification-analyst` | Exists | Add KB-backed scoring, historical deal pattern matching |
| Solution Architect | `solution-architect` | Exists | Add design inventory awareness from knowledge graph |
| Value Engineer | `value-engineer` | Exists | Add migration cost estimation from KB |
| Competitive Intel | `competitive-intel` | Exists | No significant changes needed |
| Proposal Writer | `proposal-writer` | Exists | Add auto-populated migration scope from discovery |
| Deal Strategist | `deal-strategist` | Exists | Add CustomerNode journey state integration |
| Migration Planner | `migration-specialist` | Exists (partial) | Extend with KB-backed estimation and predictive analysis |
| Library Translator | New | Does not exist | New agent for automated library conversion orchestration |
| Design Converter | New | Does not exist | New agent for automated design conversion orchestration |
| Environment Configurator | `ecad-specialist` | Exists (partial) | Extend with API-driven provisioning automation |
| Validation Orchestrator | New | Does not exist | New agent for automated validation pipeline management |
| Deployment Coordinator | `deployment-manager` | Exists | Extend with automated deployment step execution |
| Support Agent | `customer-support` | Exists | Add KB search, automated triage |
| Training Agent | New | Does not exist | New agent for personalized learning path generation |
| Health Monitor | New | Does not exist | New agent for adoption tracking and health scoring |
| Expansion Scout | New | Does not exist | New agent for expansion opportunity identification |
| Infrastructure Specialist | `infrastructure-specialist` | Exists | No significant changes needed |
| PLM Specialist | `plm-specialist` | Exists | Add automated connector configuration |
| MCAD Specialist | `mcad-specialist` | Exists | No significant changes needed |
| ERP Specialist | `erp-supplychain-specialist` | Exists | No significant changes needed |

**New agents required for full vision:** 5 (Library Translator, Design Converter, Validation Orchestrator, Training Agent, Health Monitor, Expansion Scout)

---

## Appendix B: CustomerNode Integration Detail

### B.1 Journey Template: Enterprise Migration

```
Journey: Enterprise EDA Migration to Altium
Stages:
  1. Awareness      -> Market signal detected, lead identified
  2. Engagement     -> First contact, account research complete
  3. Discovery      -> Technical discovery, qualification, ICP assessment
  4. Evaluation     -> Solution design, demo, competitive analysis
  5. Business Case  -> ROI model, proposal, executive alignment
  6. Decision       -> Negotiation, close plan, contract execution
  7. Migration      -> File ingestion, library conversion, design conversion
  8. Validation     -> Test, verify, customer sign-off
  9. Deployment     -> Go-live, user provisioning, training
  10. Adoption      -> Onboarding, support, health monitoring
  11. Expansion     -> New divisions, additional seats, upsell
  12. Renewal       -> Contract renewal, re-evaluation

Touchpoints per stage: 5-15
Total journey touchpoints: 60-150
Typical duration: 6-18 months (lead to deployed)
```

### B.2 CustomerNode's 50+ Agents vs. Altium Domain Agents

CustomerNode's agents handle journey orchestration and buyer-seller alignment:
- Discovery Guide: Structures the discovery conversation
- SOW Generator: Auto-generates statements of work
- Predictive Insights: Forecasts deal outcomes
- Stakeholder Mapper: Tracks buying committee dynamics

Altium's agents handle domain-specific execution:
- Migration Specialist: Converts EDA files
- ECAD Specialist: Configures Altium environments
- Qualification Analyst: Assesses technical fit for Altium specifically

The two agent ecosystems are complementary, not overlapping. CustomerNode agents answer "what should happen in this journey?" Altium agents answer "how do we do the Altium-specific work?"

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| EDA | Electronic Design Automation -- software tools for designing electronic systems (PCBs, ICs) |
| PCB | Printed Circuit Board -- the physical board that holds electronic components |
| Schematic | A diagram showing the logical connections between electronic components |
| Layout (PCB) | The physical arrangement of components and copper traces on a PCB |
| Component Library | Collection of reusable electronic component definitions (symbols, footprints, 3D models) |
| Footprint | The physical copper pad pattern on a PCB that a component solders to |
| Symbol | The schematic representation of an electronic component |
| Netlist | A list of all electrical connections in a design |
| DRC | Design Rule Check -- automated verification that a PCB layout meets manufacturing constraints |
| BOM | Bill of Materials -- list of all components needed to build a design |
| Gerber | Standard file format for PCB manufacturing data |
| ODB++ | Another standard format for PCB manufacturing data |
| Vault | Altium's managed content storage (components, templates, design blocks) |
| IntLib | Altium Integrated Library file format |
| DbLib | Altium Database Library -- components stored in a database |
| DXP | Altium's internal scripting/extension platform |
| PLM | Product Lifecycle Management -- systems like Windchill, Teamcenter |
| ERP | Enterprise Resource Planning -- systems like SAP, Oracle |
| MCAD | Mechanical Computer-Aided Design -- systems like SolidWorks, Creo |
| CoDesigner | Altium's ECAD-MCAD collaboration tool |
| MEDDPICC | Sales qualification framework (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition) |
| ICP | Ideal Customer Profile |
| ITAR | International Traffic in Arms Regulations -- US export control for defense articles |
| KB | Knowledge Base |
| NPS | Net Promoter Score -- customer satisfaction metric |
