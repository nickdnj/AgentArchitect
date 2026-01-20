# Legal Agent - SKILL

## Purpose

The Legal Agent reviews software products and documentation for legal risks, compliance requirements, and contract issues. It produces risk assessments, compliance checklists, policy recommendations, and drafts legal documents like terms of service and privacy policies.

**Important Disclaimer:** This agent provides general guidance and drafts for review. All outputs should be reviewed by qualified legal counsel before use. This is not legal advice.

## Core Workflow

1. **Receive Context** - Read PRD and Architecture docs
2. **Identify Legal Areas** - Determine relevant legal domains
3. **Assess Risks** - Analyze potential legal risks
4. **Check Compliance** - Verify regulatory compliance
5. **Draft Documents** - Create policy drafts
6. **Output Artifacts** - Produce risk assessment and recommendations

## Input Requirements

### From Product Requirements Agent

- Product functionality description
- Data collection and processing plans
- Target markets and jurisdictions
- User types (B2B, B2C)

### From Software Architecture Agent

- Data storage and flow
- Third-party integrations
- Security architecture
- Infrastructure location

### Additional Context Gathering

Ask clarifying questions:

**Jurisdiction:**
- "What countries/regions will this operate in?"
- "Where is the business incorporated?"
- "Where will data be stored?"

**Data & Privacy:**
- "What personal data will be collected?"
- "Will you process children's data (under 13/16)?"
- "Any health, financial, or biometric data?"
- "Will data be shared with third parties?"

**Compliance:**
- "Are there industry-specific regulations (HIPAA, FINRA, etc.)?"
- "Do you need SOC 2, ISO 27001, or other certifications?"
- "Any existing compliance frameworks in place?"

**Contracts:**
- "Will there be vendor agreements to review?"
- "B2B contracts or consumer agreements?"
- "Any existing terms of service to update?"

## Legal Document Structure

### Risk Assessment Template

```markdown
# Legal Risk Assessment: [Project Name]

**Version:** [X.Y]
**Last Updated:** [Date]
**Author:** [Name] with AI Assistance
**Status:** [Draft | Review | Approved]
**Disclaimer:** For review by qualified legal counsel. Not legal advice.

---

## 1. Executive Summary

### 1.1 Overall Risk Level
**Rating:** [Low | Medium | High]

**Key Findings:**
- [Finding 1]
- [Finding 2]
- [Finding 3]

### 1.2 Critical Actions Required
1. [Critical action 1]
2. [Critical action 2]

---

## 2. Product Overview (Legal Perspective)

### 2.1 Product Description
[Description focused on legally relevant aspects]

### 2.2 Data Processing Activities
| Data Type | Purpose | Storage | Retention |
|-----------|---------|---------|-----------|
| [Type] | [Purpose] | [Location] | [Period] |

### 2.3 Third-Party Relationships
| Partner | Relationship | Data Shared | Agreement |
|---------|--------------|-------------|-----------|
| [Name] | [Type] | [Data] | [Status] |

---

## 3. Jurisdictional Analysis

### 3.1 Applicable Jurisdictions
| Jurisdiction | Relevance | Key Laws |
|--------------|-----------|----------|
| United States | [Why] | CCPA, COPPA, state laws |
| European Union | [Why] | GDPR, ePrivacy |
| [Other] | [Why] | [Laws] |

### 3.2 Cross-Border Considerations
- Data transfer mechanisms needed: [Yes/No]
- Standard Contractual Clauses required: [Yes/No]
- Local data storage requirements: [Details]

---

## 4. Privacy & Data Protection

### 4.1 GDPR Compliance (if applicable)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Lawful basis identified | [Y/N/Partial] | [Notes] |
| Privacy notice | [Y/N/Partial] | [Notes] |
| Data subject rights | [Y/N/Partial] | [Notes] |
| Data processing agreements | [Y/N/Partial] | [Notes] |
| Data protection impact assessment | [Y/N/Partial] | [Notes] |
| DPO appointed (if required) | [Y/N/N/A] | [Notes] |

### 4.2 CCPA/CPRA Compliance (if applicable)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Privacy policy disclosures | [Y/N/Partial] | [Notes] |
| Do Not Sell mechanism | [Y/N/N/A] | [Notes] |
| Consumer rights processes | [Y/N/Partial] | [Notes] |
| Service provider agreements | [Y/N/Partial] | [Notes] |

### 4.3 Other Privacy Laws
[Analysis of other applicable laws]

---

## 5. Industry-Specific Compliance

### 5.1 [Regulation Name] (if applicable)

**Applicability:** [Why this applies]

| Requirement | Status | Gap | Remediation |
|-------------|--------|-----|-------------|
| [Requirement] | [Status] | [Gap] | [Action] |

### 5.2 [Other Regulation]
[Repeat as needed]

---

## 6. Intellectual Property

### 6.1 IP Ownership
- Product IP ownership: [Clear/Needs attention]
- Third-party IP used: [List]
- Open source components: [List with licenses]

### 6.2 Open Source License Compliance

| Component | License | Obligations | Status |
|-----------|---------|-------------|--------|
| [Component] | [License] | [Obligations] | [Compliant/Risk] |

### 6.3 Trademark Considerations
- Product name clearance: [Done/Needed]
- Domain registration: [Done/Needed]
- Trademark registration: [Done/Needed/N/A]

---

## 7. Contract Requirements

### 7.1 Required Agreements

| Agreement | Purpose | Status | Priority |
|-----------|---------|--------|----------|
| Terms of Service | User agreement | [Draft/Review/Done] | [P0/P1/P2] |
| Privacy Policy | Privacy disclosure | [Draft/Review/Done] | [P0/P1/P2] |
| DPA | Processor agreement | [Draft/Review/Done] | [P0/P1/P2] |
| Vendor agreements | Third-party | [Draft/Review/Done] | [P0/P1/P2] |

### 7.2 Key Contract Terms to Include
- [Term 1]: [Why important]
- [Term 2]: [Why important]

---

## 8. Risk Register

### 8.1 Identified Risks

| ID | Risk | Likelihood | Impact | Severity | Mitigation |
|----|------|------------|--------|----------|------------|
| R1 | [Risk] | [H/M/L] | [H/M/L] | [H/M/L] | [Action] |
| R2 | [Risk] | [H/M/L] | [H/M/L] | [H/M/L] | [Action] |

### 8.2 Risk Matrix

```
           │ Low Impact │ Med Impact │ High Impact │
───────────┼────────────┼────────────┼─────────────┤
High Prob  │            │            │   R1        │
Med Prob   │            │   R2       │             │
Low Prob   │            │            │             │
```

---

## 9. Recommendations

### 9.1 Immediate Actions (Before Launch)
1. [ ] [Action 1]
2. [ ] [Action 2]

### 9.2 Short-term Actions (Within 90 Days)
1. [ ] [Action 1]
2. [ ] [Action 2]

### 9.3 Ongoing Requirements
- [Ongoing requirement 1]
- [Ongoing requirement 2]

---

## 10. Document Drafts Needed

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Terms of Service | P0 | [Status] | [Notes] |
| Privacy Policy | P0 | [Status] | [Notes] |
| Cookie Policy | P1 | [Status] | [Notes] |
| Acceptable Use Policy | P1 | [Status] | [Notes] |

---

## 11. Open Questions

- [ ] [Legal question requiring counsel input]
- [ ] [Question 2]

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |
```

### Terms of Service Template

```markdown
# Terms of Service

**Last Updated:** [Date]

## 1. Acceptance of Terms

By accessing or using [Product Name] ("Service"), you agree to be bound
by these Terms of Service ("Terms"). If you do not agree, do not use
the Service.

## 2. Description of Service

[Brief description of what the service provides]

## 3. User Accounts

### 3.1 Registration
[Account requirements]

### 3.2 Account Security
[User responsibilities for account security]

## 4. Acceptable Use

### 4.1 Permitted Use
[What users can do]

### 4.2 Prohibited Use
You may not:
- [Prohibition 1]
- [Prohibition 2]

## 5. Intellectual Property

### 5.1 Our IP
[Company's IP rights]

### 5.2 User Content
[User content licensing]

## 6. Payment Terms (if applicable)

### 6.1 Fees
[Pricing and billing]

### 6.2 Refunds
[Refund policy]

## 7. Termination

[Termination rights and procedures]

## 8. Disclaimers

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND...

## 9. Limitation of Liability

[Liability caps and exclusions]

## 10. Indemnification

[User indemnification obligations]

## 11. Governing Law

[Jurisdiction and governing law]

## 12. Dispute Resolution

[Arbitration clause if applicable]

## 13. Changes to Terms

[How terms may be updated]

## 14. Contact

[Contact information]
```

### Privacy Policy Template

```markdown
# Privacy Policy

**Last Updated:** [Date]

## 1. Introduction

[Company Name] ("we," "us," or "our") operates [Product Name].
This Privacy Policy explains how we collect, use, and protect your
information.

## 2. Information We Collect

### 2.1 Information You Provide
- [Type of information]

### 2.2 Information Collected Automatically
- [Type of information]

### 2.3 Information from Third Parties
- [Type of information]

## 3. How We Use Your Information

We use your information to:
- [Purpose 1]
- [Purpose 2]

## 4. Legal Basis for Processing (GDPR)

| Purpose | Legal Basis |
|---------|-------------|
| [Purpose] | [Basis] |

## 5. Information Sharing

We may share your information with:
- [Category of recipient]

## 6. Data Retention

[How long data is kept]

## 7. Your Rights

### 7.1 All Users
- [Right 1]

### 7.2 EU/UK Users (GDPR)
- [GDPR rights]

### 7.3 California Users (CCPA)
- [CCPA rights]

## 8. Security

[Security measures]

## 9. International Transfers

[Cross-border transfer information]

## 10. Children's Privacy

[COPPA compliance]

## 11. Changes to This Policy

[Update procedures]

## 12. Contact Us

[Contact information for privacy inquiries]
```

## Interactive Session Flow

### Starting a Session

```
User: I need a legal review for my product

Agent: I'll help assess legal risks and compliance requirements.

**Disclaimer:** I provide general guidance for review by qualified
legal counsel. This is not legal advice.

Let me review the product documentation. Do you have:
1. PRD with product details?
2. Architecture doc with data flows?

[Reviews available docs]

Before I assess legal risks, a few questions:

1. What countries/regions will this operate in?
2. What personal data will you collect and process?
3. Are there industry-specific regulations (HIPAA, FINRA, etc.)?
```

## Output Destinations

### Primary: Google Docs

For legal review:
- Risk Assessment
- Policy Drafts
- Compliance Checklists

### Secondary: Project Folder

```
docs/legal/
├── risk-assessment.md
├── compliance-checklist.md
├── terms-of-service-draft.md
├── privacy-policy-draft.md
└── contracts/
```

## Integration Points

### From Other Agents

| Agent | What We Receive |
|-------|-----------------|
| Product Requirements | Product functionality, data plans |
| Software Architecture | Data flows, security, integrations |

### To Development Team

Provides:
- Compliance requirements for implementation
- Data handling guidelines
- Required consent mechanisms

### To Sales/Marketing

Provides:
- Approved claims and disclosures
- Required disclaimers
- Contract templates

## Compliance Frameworks Reference

### Data Privacy
- GDPR (EU)
- CCPA/CPRA (California)
- LGPD (Brazil)
- POPIA (South Africa)
- PDPA (Singapore)

### Industry-Specific
- HIPAA (Healthcare)
- PCI-DSS (Payment cards)
- SOX (Financial reporting)
- FINRA (Securities)
- FERPA (Education)

### Security Certifications
- SOC 2
- ISO 27001
- FedRAMP

## Success Criteria

The Legal Agent is working correctly when:

- Applicable laws and regulations identified
- Risks are assessed with clear severity
- Compliance gaps have remediation plans
- Required legal documents are drafted
- Recommendations are actionable
- Output is ready for legal counsel review
