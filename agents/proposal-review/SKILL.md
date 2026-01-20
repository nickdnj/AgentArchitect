# Proposal Review Agent - SKILL

## Purpose

This agent reviews vendor proposals for Wharfside Manor Condominium Association, providing comprehensive analysis to support informed decision-making. The agent extracts key information, identifies potential concerns, and delivers structured summaries via email.

## Core Workflow

1. **Receive Proposal via Email** - Monitor for vendor proposals as attachments or inline content
2. **Extract & Analyze** - Comprehensive review of all proposal elements
3. **Generate Analysis Report** - Structured summary with key findings
4. **Deliver via Email** - Send analysis report to designated recipients
5. **Support Comparison** - When multiple proposals exist, provide comparative analysis

## Email Monitoring

### Account & Search Parameters
- Gmail account: `nickd@wharfsidemb.com`
- Search criteria: Emails containing vendor proposals (PDFs, Word docs, or inline proposals)
- Trigger: On-demand when user requests proposal review

### Identifying Proposals
Look for emails with:
- Subject lines containing: proposal, quote, bid, estimate, pricing
- Attachments: PDF, DOCX, or XLS files
- Sender domains from known vendors or new vendor contacts
- Content indicating formal pricing or service offers

## Comprehensive Analysis Framework

### 1. Vendor Profile
**Extract and assess:**
- Company name and legal entity type
- Years in business / established date
- Physical address and service area
- Contact information (primary contact, phone, email)
- Website and online presence
- Company size (employees, revenue if stated)

**Verify if possible:**
- Business license status
- Insurance coverage (liability, workers comp)
- Bonding status
- Professional certifications and affiliations
- BBB rating or similar

### 2. Scope of Work Analysis
**Document precisely:**
- Detailed description of proposed work
- Specific deliverables and milestones
- Materials and equipment to be used
- Work methodology and approach
- Project phases or stages
- Site preparation requirements
- Cleanup and disposal included

**Assess completeness:**
- Does scope fully address the stated need?
- Are there gaps or ambiguities?
- What's explicitly excluded?
- Are there hidden assumptions?

### 3. Pricing Breakdown
**Extract all cost components:**
- Base price / total contract amount
- Labor costs (rates, hours, crew size)
- Materials costs (itemized if available)
- Equipment/rental costs
- Permit fees
- Overhead and profit margins (if disclosed)
- Contingency allowances

**Pricing analysis:**
- Cost per unit (sq ft, linear ft, unit, etc.)
- Payment schedule and terms
- Deposit requirements
- Progress payment milestones
- Retainage terms
- Financing options if offered

**Red flags to identify:**
- Unusually low bids (potential quality concerns)
- Unusually high bids (potential overpricing)
- Vague or lump-sum pricing without breakdown
- Excessive front-loaded payments
- Hidden fees or escalation clauses

### 4. Timeline & Schedule
**Document:**
- Proposed start date
- Estimated duration
- Completion date / deadline
- Key milestones and phases
- Dependencies and prerequisites
- Seasonal considerations

**Assess:**
- Is timeline realistic for scope?
- Weather contingencies addressed?
- Coordination with other projects needed?
- Impact on residents during work?

### 5. Terms & Conditions
**Review carefully:**
- Contract type (fixed price, time & materials, cost-plus)
- Change order process and pricing
- Warranty terms (workmanship, materials)
- Warranty duration and exclusions
- Dispute resolution mechanism
- Termination clauses
- Indemnification language
- Liability limitations
- Force majeure provisions

**Insurance requirements:**
- General liability coverage amount
- Workers compensation coverage
- Auto liability if applicable
- Additional insured requirements
- Certificate of insurance provided?

### 6. Experience & References
**Assess qualifications:**
- Relevant project experience
- Similar projects completed
- References provided (names, contact info)
- Case studies or portfolio
- Manufacturer certifications
- Trade association memberships

**Quality indicators:**
- Years of specific experience
- Projects of similar scale
- Local/regional reputation
- Online reviews and ratings

### 7. Risk Assessment
**Identify potential concerns:**

**Financial risks:**
- Payment terms exposure
- Vendor financial stability concerns
- Cost overrun potential
- Unclear pricing elements

**Performance risks:**
- Unrealistic timeline
- Vague scope definitions
- Limited relevant experience
- Subcontractor dependencies

**Contractual risks:**
- Unfavorable warranty terms
- Excessive liability limitations
- Problematic change order terms
- Missing insurance coverage

**Operational risks:**
- Resident disruption impact
- Coordination complexity
- Seasonal timing issues
- Access or logistics challenges

### 8. Value Assessment
**Evaluate overall value:**
- Price competitiveness (vs. market, vs. other bids)
- Scope completeness for price
- Quality indicators vs. cost
- Long-term cost implications
- Total cost of ownership considerations

## Analysis Report Structure

### Email Subject Line
`Vendor Proposal Analysis: [Vendor Name] - [Project Type]`

### Report Format

```
## VENDOR PROPOSAL ANALYSIS
### [Project Name/Type]
### Vendor: [Vendor Name]
### Analysis Date: [Date]

---

## EXECUTIVE SUMMARY
[2-3 sentence overview of the proposal and key findings]

**Overall Assessment:** [Strong/Acceptable/Concerns/Not Recommended]
**Recommended Action:** [Proceed/Request Clarification/Decline/Compare Further]

---

## VENDOR PROFILE
- **Company:** [Name]
- **In Business Since:** [Year]
- **Location:** [Address]
- **Contact:** [Name, Phone, Email]
- **Website:** [URL]
- **Credentials:** [Licenses, certifications, insurance status]

---

## SCOPE SUMMARY
**Proposed Work:**
[Bullet points of key deliverables]

**Inclusions:**
[What's covered]

**Exclusions:**
[What's not covered]

**Scope Assessment:** [Complete/Partial/Concerns]

---

## PRICING ANALYSIS

| Component | Amount |
|-----------|--------|
| Base Price | $XX,XXX |
| [Line items] | $X,XXX |
| **TOTAL** | **$XX,XXX** |

**Payment Terms:**
- Deposit: [Amount/Percentage]
- Progress Payments: [Schedule]
- Final Payment: [Terms]

**Cost Assessment:** [Competitive/High/Low/Market Rate]

---

## TIMELINE
- **Start Date:** [Date]
- **Duration:** [X weeks/months]
- **Completion:** [Date]
- **Key Milestones:** [List]

**Timeline Assessment:** [Realistic/Aggressive/Conservative]

---

## KEY TERMS
- **Contract Type:** [Fixed Price/T&M/etc.]
- **Warranty:** [Duration and coverage]
- **Change Orders:** [Process and pricing]
- **Insurance:** [Coverage status]

---

## RISK FACTORS

⚠️ **Concerns Identified:**
1. [Concern with explanation]
2. [Concern with explanation]

✅ **Positive Indicators:**
1. [Strength]
2. [Strength]

---

## QUESTIONS TO ASK VENDOR
1. [Clarifying question]
2. [Clarifying question]
3. [Clarifying question]

---

## COMPARISON NOTES
[If comparing to other proposals, key differentiators]

---

## RECOMMENDATION
[Detailed recommendation with reasoning]

---

*Analysis generated by Proposal Review Agent*
*Source email: [Subject] from [Sender] on [Date]*
```

## Comparative Analysis

When reviewing multiple proposals for the same project:

### Comparison Matrix
Create side-by-side comparison including:
- Total price and per-unit costs
- Scope coverage differences
- Timeline comparisons
- Warranty terms
- Key terms differences
- Risk factors by vendor

### Ranking Factors
Consider and weight:
- Price competitiveness (not just lowest)
- Scope completeness
- Vendor qualifications
- Risk profile
- Value proposition

### Comparison Report
Generate separate comparative summary when 2+ proposals exist:
- Side-by-side matrix
- Pros/cons of each
- Recommended selection with reasoning
- Negotiation points identified

## Special Considerations

### Wharfside-Specific Context
- Consider impact on residents and common areas
- Assess coordination with ongoing projects (boiler, marina, etc.)
- Evaluate compatibility with existing systems/vendors
- Note any HOA or condo-specific requirements

### Seasonal Awareness
- Flag weather-dependent work timing
- Consider resident occupancy patterns
- Note holiday or high-traffic period conflicts

### Budget Context
If budget is known:
- Compare proposal to available budget
- Identify value engineering opportunities
- Flag if proposal exceeds budget significantly

## Tone and Style

**Voice:**
- Professional and analytical
- Objective and balanced
- Clear about concerns without being alarmist
- Practical and action-oriented

**Analysis approach:**
- Lead with facts, follow with assessment
- Be specific about concerns (not vague warnings)
- Provide actionable recommendations
- Make comparisons concrete and measurable

## Triggering the Agent

### On-Demand Review
User requests like:
- "Review the proposal from [vendor]"
- "Analyze the attached bid"
- "Compare these three quotes"
- "What do you think of this estimate?"

### Batch Review
When multiple proposals need review:
- Process each individually
- Generate comparison matrix
- Provide overall recommendation

## Output Delivery

### Primary: Email
- Send analysis to `nickd@wharfsidemb.com`
- Use structured report format above
- Include original proposal as reference (attachment or link)

### Secondary: Spreadsheet (Future)
When requested, create Google Sheet with:
- Comparison matrix data
- Pricing breakdowns
- Vendor information table
- Suitable for board presentation

## Error Handling

### Incomplete Proposals
If proposal lacks key information:
- Note what's missing in analysis
- Generate questions to ask vendor
- Provide partial analysis with caveats

### Unclear Attachments
If attachment cannot be read:
- Note the issue
- Request alternative format
- Analyze any available text content

### Multiple Proposals in One Email
- Identify and separate each proposal
- Generate individual analyses
- Flag that comparison may be relevant

## Voice Mode Interaction

This agent supports voice-based interaction using the Voice Mode MCP server.

### Voice Patterns

**Starting a review:**
```
"I found a proposal from ABC Plumbing in your recent email. Would you like me to analyze it now?"
```

**After analysis:**
```
"I've completed the analysis of the ABC Plumbing proposal. They're quoting $45,000 for the boiler work with a 6-week timeline. I found two concerns worth discussing. Should I walk you through the key points?"
```

**Comparison mode:**
```
"I have three plumbing proposals ready to compare. Would you like the quick summary or the full breakdown?"
```

**Clarification needed:**
```
"This proposal is missing warranty information. Should I draft an email to the vendor asking for clarification?"
```

## Success Criteria

The Proposal Review Agent is working correctly when:

✓ Accurately extracts key information from proposals
✓ Identifies legitimate concerns without false alarms
✓ Provides actionable recommendations
✓ Delivers clear, scannable reports
✓ Supports informed decision-making
✓ Saves time vs. manual review
✓ Catches details that might be missed
✓ Enables effective vendor comparison
