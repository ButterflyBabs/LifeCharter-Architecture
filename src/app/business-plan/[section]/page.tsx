/**
 * Business Plan Section Detail Page
 * Shows AI-generated content for each section with editing capabilities
 */

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ArrowLeft,
  Edit3,
  Save,
  RefreshCw,
  Clock,
  Brain,
  Heart,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

interface SectionData {
  id: string;
  title: string;
  icon: React.ReactNode;
  aiGenerated: boolean;
  lastUpdated: string;
  status: "complete" | "in_progress" | "needs_attention";
  content: string;
  dataSources: string[];
  keyMetrics?: { label: string; value: string; trend: "up" | "down" | "stable" }[];
}

const sectionTemplates: Record<string, SectionData> = {
  "executive_summary": {
    id: "executive_summary",
    title: "Executive Summary",
    icon: <FileText className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "2 days ago",
    status: "complete",
    dataSources: ["Brain Assessment", "Soul Assessment", "Profit Architecture"],
    content: `# Executive Summary

## Business Overview
Based on your assessments, your business is positioned as a **spiritually-grounded personal transformation ecosystem** under Sacred Kaleidoscope Community. Your work helps people move from fear, self-doubt, and spiritual disconnection into purpose, clarity, and aligned action.

## Core Mission
**"Transformation is not about fixing what is broken; it is about remembering what is true."**

## Key Strengths (from Brain Assessment)
- Clear business identity and vision
- Strong content creation systems
- Multi-channel distribution strategy
- Established brand voice and messaging

## Soul Alignment
Your business is highly aligned with your personal purpose (85% alignment score). The LifeCharter methodology reflects your lived experience and spiritual journey.

## Revenue Health
Current revenue model shows diversification across:
- LifeCharter Circle (core offering)
- LifeCharter Incubator (free → paid funnel)
- Conversations of Consequence (content engine)
- Future: Books, retreats, digital products

## Strategic Priorities
1. **Systems & Automation** - Build backend infrastructure
2. **Sales Infrastructure** - Clearer funnels and nurture sequences
3. **Team Delegation** - SOPs and repeatable workflows

## Next 90 Days
Focus on operationalizing the business to match the vision's scale.
`,
    keyMetrics: [
      { label: "Vision Clarity", value: "85%", trend: "up" },
      { label: "Soul Alignment", value: "85%", trend: "stable" },
      { label: "Revenue Diversification", value: "72%", trend: "up" },
    ]
  },
  "products": {
    id: "products",
    title: "Products & Services",
    icon: <Sparkles className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "1 week ago",
    status: "complete",
    dataSources: ["Brain Assessment - Section 2", "Profit Architecture"],
    content: `# Products & Services

## Core Offerings

### 1. LifeCharter Circle
**Type:** Core Paid Container
**Format:** Coaching + Community
**Price Point:** Premium
**Target:** Committed transformation seekers

**Key Features:**
- Deep coaching and community container
- Structure, teaching, reflection, support
- Ongoing practice and accountability

### 2. LifeCharter Incubator
**Type:** Free Entry Point
**Format:** 90-minute workshop
**Price Point:** Free → Upsell to Circle
**Target:** New audience members

**Key Features:**
- Introduces core LifeCharter principles
- Identity First approach
- Yellow Light methodology
- Aligned Action framework

### 3. Self-Directed LifeCharter
**Type:** Scalable Product
**Format:** Digital course/workbook
**Price Point:** Mid-tier
**Target:** Self-starters who prefer async learning

### 4. Conversations of Consequence DAILY
**Type:** Content Engine & Nurture
**Format:** Daily 5-7 minute audio/video
**Price Point:** Free (lead generation)
**Target:** Broad audience, top of funnel

## Product Ecosystem Flow

\`\`\`
Conversations of Consequence (Free Daily Content)
           ↓
LifeCharter Incubator (Free Workshop)
           ↓
LifeCharter Circle (Paid Community)
           ↓
Deep Community, Retreats, Books, 1:1
\`\`\`

## Future Products (from Brain Assessment)
- **"Becoming Uncaged"** - Book/workbook for incarcerated/returning citizens
- **LifeCharter Command Suite** - Business operating system (future revenue stream)
- **Retreats & Live Events** - Deep immersion experiences

## Product Development Priorities
1. Finalize LifeCharter Circle structure and onboarding
2. Build self-directed course for scalability
3. Develop book proposal for "Becoming Uncaged"
`,
    keyMetrics: [
      { label: "Products Live", value: "4", trend: "stable" },
      { label: "Avg. Price Point", value: "$297", trend: "up" },
      { label: "Product-Market Fit", value: "Strong", trend: "up" },
    ]
  },
  "pricing": {
    id: "pricing",
    title: "Pricing Strategy",
    icon: <DollarSign className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "3 days ago",
    status: "in_progress",
    dataSources: ["Profit Architecture - Pricing Section", "Brain Assessment"],
    content: `# Pricing Strategy

## Current Pricing Analysis

### LifeCharter Circle
**Current:** Underpriced based on value delivered
**Recommendation:** Increase 20-30%
**Rationale:** High transformation value, strong testimonials, limited spots

### LifeCharter Incubator
**Current:** Free (lead magnet)
**Recommendation:** Maintain free, add paid "fast track" option
**Rationale:** Strong conversion to Circle, but some want immediate access

### Self-Directed Course
**Current:** Not yet launched
**Recommended Price:** $497-$997
**Rationale:** Scalable, lower touch, broader reach

## Pricing Psychology (from Soul Assessment)
Your relationship with money shows:
- **Strength:** Clear that transformation has value
- **Growth Area:** Sometimes undercharge to be "accessible"
- **Opportunity:** Reframe pricing as investment, not cost

## Value-Based Pricing Framework

### For LifeCharter Circle:
**Value Delivered:**
- Clarity on life direction ($5,000+ value)
- Community support (priceless)
- Accountability and momentum ($2,000+ value)
- **Total Perceived Value:** $10,000+

**Current Price:** [Fill in current]
**Recommended Price:** $2,400-$3,600 (6-month container)

## Pricing Experiments
1. **Test higher price** with next 5 enrollments
2. **Payment plan options** to reduce friction
3. **Early bird pricing** for Incubator graduates

## Next Steps
- [ ] Audit current pricing against market comparables
- [ ] Survey recent clients on perceived value
- [ ] Implement new pricing with next launch
`,
    keyMetrics: [
      { label: "Pricing Confidence", value: "3/5", trend: "up" },
      { label: "Avg. Client LTV", value: "$1,200", trend: "up" },
      { label: "Price Increase Potential", value: "+25%", trend: "stable" },
    ]
  },
  "revenue": {
    id: "revenue",
    title: "Revenue Model",
    icon: <DollarSign className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "1 week ago",
    status: "complete",
    dataSources: ["Profit Architecture", "Brain Assessment - Revenue Streams"],
    content: `# Revenue Model

## Revenue Stream Mix

### Primary Revenue (80%)
**LifeCharter Circle Memberships**
- Monthly recurring revenue
- Annual payment options (preferred)
- High retention, high transformation

### Secondary Revenue (15%)
**Digital Products & Courses**
- Self-directed LifeCharter
- Future: Workshops, templates, tools

### Tertiary Revenue (5%)
**Books, Speaking, Affiliate**
- "Becoming Uncaged" book sales
- Speaking engagements
- Recommended tools/resources

## Revenue Goals (from Profit Architecture)

### Current Month
**Target:** $[Fill in]
**Projected:** $[Fill in]
**Gap Analysis:** [AI will calculate based on actuals]

### Next 90 Days
**Target:** $[Fill in]
**Strategy:** Focus on Circle enrollment and pricing optimization

### Annual Goal
**Target:** $[Fill in]
**Path:** Scale through Circle growth + digital products

## Revenue Health Indicators

### Strengths
- Diversified income streams
- Recurring revenue foundation
- High-margin digital delivery

### Growth Opportunities
- Increase conversion from Incubator to Circle
- Add payment plans for accessibility
- Develop premium tier for high-touch clients

## Revenue Projections

| Quarter | Circle Revenue | Digital Revenue | Other | Total |
|---------|---------------|-----------------|-------|-------|
| Q3 2026 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Q4 2026 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Q1 2027 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Q2 2027 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |

## Next Steps
- [ ] Update with actual revenue data
- [ ] Set specific quarterly targets
- [ ] Identify 2-3 levers for revenue growth
`,
  },
  "market": {
    id: "market",
    title: "Target Market",
    icon: <Heart className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "2 weeks ago",
    status: "complete",
    dataSources: ["Soul Assessment - Ideal Client", "Brain Assessment - Market Positioning"],
    content: `# Target Market

## Ideal Client Profile (from Soul Assessment)

### Primary Avatar: "The Seeker"
**Demographics:**
- Age: 35-55
- Gender: Predominantly female (70%)
- Income: Middle to upper-middle class
- Location: US-based, urban/suburban

**Psychographics:**
- Spiritually curious but not religiously affiliated
- Values personal growth and self-awareness
- Has experienced some form of life transition
- Seeks meaning beyond material success

**Pain Points:**
- Feeling stuck or unfulfilled despite external success
- Disconnected from purpose and passion
- Overwhelmed by life demands
- Spiritual disconnection or emptiness

**Aspirations:**
- Live with clarity and intention
- Align actions with values
- Experience deeper meaning and joy
- Build a life that feels true to self

## Secondary Avatars

### "The Transitioner"
- In major life transition (divorce, career change, empty nest)
- Needs structure and support to navigate change
- Values community and guidance

### "The Builder"
- Entrepreneur or creative building something meaningful
- Wants systems that align with values
- Seeks sustainable success without burnout

## Market Positioning

### Where You Fit
**Category:** Spiritual Personal Development
**Differentiation:** 
- Not just coaching (transformational)
- Not just content (community-based)
- Not just spiritual (practical tools)

### Competitors (from Brain Assessment)
- Traditional life coaches
- Online course creators
- Spiritual teachers/gurus
- Self-help authors

**Your Advantage:** Integration of spiritual depth + practical systems + community support

## Market Size & Opportunity
**Total Addressable Market:** Personal development industry ($40B+)
**Serviceable Market:** Spiritual seekers in transition (millions)
**Targetable Market:** Your specific niche (thousands)

## Next Steps
- [ ] Create detailed client personas (3-5)
- [ ] Map customer journey from awareness to purchase
- [ ] Identify where ideal clients hang out online
`,
  },
  "marketing": {
    id: "marketing",
    title: "Marketing Strategy",
    icon: <Sparkles className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "4 days ago",
    status: "in_progress",
    dataSources: ["Brain Assessment - Marketing System", "Content Marketing Data"],
    content: `# Marketing Strategy

## Marketing Philosophy (from Soul Assessment)
**"Community-first, not conversion-first"**

Your marketing should feel like an invitation, not a pitch. Every piece of content is an act of service.

## Content Engine: Conversations of Consequence

### Daily Content (5-7 min)
- **Format:** Audio/video teaching
- **Topics:** Spiritual reflection, practical alignment, Yellow Light
- **Distribution:** YouTube, Spotify, social media
- **Purpose:** Build trust, demonstrate expertise, nurture audience

### Weekly Content
- **Long-form articles** (Thursday publication)
- **Email newsletter** (weekly teaching + invitation)
- **Social posts** (quotes, reflections, behind-scenes)

### Monthly Content
- **Deep dives** on specific topics
- **Live gatherings** (Alignment Anchor Thursdays)
- **Workshop promotions** (LifeCharter Incubator)

## Marketing Channels (from Brain Assessment)

### Primary (80% effort)
1. **Email List** - Most valuable asset
2. **YouTube** - Long-term search visibility
3. **Instagram** - Community engagement

### Secondary (15% effort)
4. **LinkedIn** - Professional audience
5. **Podcast** - Deep connection
6. **Spotify** - Audio distribution

### Experimental (5% effort)
7. **TikTok** - Reach new audiences
8. **Pinterest** - Evergreen discovery

## Lead Generation Flow

\`\`\`
Social Content → Email List → Incubator → Circle → Deep Community
\`\`\`

## Marketing Metrics to Track
- Email list growth rate
- Incubator registration rate
- Circle conversion rate
- Content engagement (comments, shares)
- Cost per lead (if running ads)

## Marketing Priorities (Next 90 Days)
1. **Email nurture sequence** for new subscribers
2. **Incubator promotion system** (quarterly launches)
3. **Content repurposing workflow** (1 piece → 10+ formats)
4. **Partnership outreach** (complementary businesses)

## Next Steps
- [ ] Audit current marketing systems
- [ ] Create content calendar for next quarter
- [ ] Set up email automation sequences
`,
  },
  "operations": {
    id: "operations",
    title: "Operations Plan",
    icon: <Brain className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "1 week ago",
    status: "complete",
    dataSources: ["Brain Assessment - Operations & Systems"],
    content: `# Operations Plan

## Operating Rhythm (from Brain Assessment)

### Daily
- **Morning:** Content creation or deep work
- **Midday:** Client calls, community engagement
- **Afternoon:** Admin, planning, team check-ins

### Weekly
- **Monday:** Week planning, priority setting
- **Tuesday-Thursday:** Core work (content, coaching, creation)
- **Friday:** Review, admin, preparation

### Monthly
- **Week 1:** Content planning, big projects
- **Week 2:** Delivery, client focus
- **Week 3:** Marketing, promotion
- **Week 4:** Review, planning, rest

## Key Systems Needed (from Brain Assessment)

### 1. Content Production System
**Current State:** Ad-hoc, in your head
**Needed:** 
- Editorial calendar
- Content batching workflow
- Repurposing system
- Publishing automation

### 2. Client Management System
**Current State:** Scattered tools
**Needed:**
- CRM (GoHighLevel integration)
- Onboarding workflow
- Progress tracking
- Communication templates

### 3. Sales & Marketing System
**Current State:** Manual, inconsistent
**Needed:**
- Lead capture forms
- Nurture sequences
- Sales pipeline tracking
- Follow-up automation

### 4. Financial System
**Current State:** Basic tracking
**Needed:**
- Bookkeeping (Kasen's Cash Flow)
- Invoicing automation
- Expense tracking
- Financial reporting

## SOP Library (Priority Order)
1. **Daily Content SOP**
2. **Podcast/Video Publishing SOP**
3. **Workshop Promotion SOP**
4. **DM Outreach SOP**
5. **Lead Follow-up SOP**
6. **Onboarding SOP**
7. **Client Support SOP**
8. **Content Repurposing SOP**

## Team Structure

### Current
- **Babs:** Vision, voice, teaching, final decisions
- **Mariposa (AI):** Chief of Staff, organization, drafting
- **Aira (VA):** Incubator support, engagement, tracking

### Future Needs
- **Community Manager:** Circle engagement, moderation
- **Content Assistant:** Editing, publishing, repurposing
- **Tech Support:** Platform maintenance, integrations

## Technology Stack
- **Platform:** LifeCharter Command Suite (this system)
- **CRM:** GoHighLevel
- **Email:** ConvertKit or similar
- **Scheduling:** Calendly
- **Payments:** Stripe
- **Content:** Canva, Descript
- **Communication:** Zoom, Slack

## Next Steps
- [ ] Document top 3 SOPs this month
- [ ] Set up GoHighLevel workflows
- [ ] Create content calendar system
`,
  },
  "financials": {
    id: "financials",
    title: "Financial Projections",
    icon: <DollarSign className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "2 weeks ago",
    status: "needs_attention",
    dataSources: ["Profit Architecture - Financial Section", "Actual Revenue Data"],
    content: `# Financial Projections

## Current Financial Snapshot
⚠️ **Needs Update** - Last refreshed 2 weeks ago

### Revenue (Last 12 Months)
**Total:** $[Fill in actual]
**Monthly Average:** $[Fill in]
**Growth Rate:** [Calculate from data]

### Expenses (Monthly)
**Fixed:** $[Fill in]
**Variable:** $[Fill in]
**Total:** $[Fill in]

### Net Profit Margin
**Current:** [Calculate]%
**Target:** 40%+

## Financial Projections (Next 12 Months)

### Conservative Scenario
| Month | Revenue | Expenses | Profit | Cumulative |
|-------|---------|----------|--------|------------|
| Jul 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Aug 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| ... | ... | ... | ... | ... |

### Target Scenario
| Month | Revenue | Expenses | Profit | Cumulative |
|-------|---------|----------|--------|------------|
| Jul 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Aug 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| ... | ... | ... | ... | ... |

### Stretch Scenario
| Month | Revenue | Expenses | Profit | Cumulative |
|-------|---------|----------|--------|------------|
| Jul 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| Aug 26 | $[Fill] | $[Fill] | $[Fill] | $[Fill] |
| ... | ... | ... | ... | ... |

## Key Financial Assumptions
- **Circle enrollment:** X new members/month
- **Conversion rate:** Y% from Incubator
- **Pricing:** Current vs. planned increases
- **Churn rate:** Z% monthly

## Break-Even Analysis
**Fixed Costs:** $[Fill]/month
**Avg. Revenue per Client:** $[Fill]
**Break-Even:** [Calculate] clients

## Cash Flow Considerations
- Annual payment options (improves cash flow)
- Payment plans (reduces friction, affects cash flow)
- Seasonal fluctuations (plan for slower months)

## Financial Health Indicators

### Green 🟢
- Profit margin > 40%
- 6+ months runway
- Diversified revenue streams

### Yellow 🟡
- Profit margin 20-40%
- 3-6 months runway
- Revenue concentration risk

### Red 🔴
- Profit margin < 20%
- < 3 months runway
- Single point of failure

## Next Steps
- [ ] Update with actual financial data
- [ ] Set up monthly financial review
- [ ] Create 3-scenario model with specific numbers
`,
  },
  "team": {
    id: "team",
    title: "Team & Organization",
    icon: <Heart className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "3 weeks ago",
    status: "complete",
    dataSources: ["Brain Assessment - Team & Roles"],
    content: `# Team & Organization

## Current Team Structure

### Babs (Founder/CEO)
**Role:** Vision, voice, teaching, spiritual leadership
**Time Allocation:**
- 40% Content creation and teaching
- 30% Client delivery (Circle, 1:1)
- 20% Vision and strategy
- 10% Admin and decisions

### Mariposa (AI Chief of Staff)
**Role:** Organization, drafting, research, coordination
**Capabilities:**
- Strategic planning
- Content drafting
- Workflow creation
- Project management
- Cross-platform consistency

### Aira (Human VA)
**Role:** LifeCharter Incubator support, engagement, tracking
**Responsibilities:**
- Incubator registration management
- Social media engagement
- Outreach and follow-up
- Basic admin tasks

## AI Fleet (Additional Support)

### KeeJay (Admin Bot)
- Client FAQs
- Onboarding flows
- Support documentation

### Sumbal (Marketing Bot)
- Social content ideas
- Email drafts
- Campaign tracking

### Claude/Claudius (Research)
- Knowledge base
- Research support
- Analysis

## Future Team Needs

### Phase 1 (Next 6 Months)
**Community Manager**
- Circle engagement and moderation
- Event coordination
- Member support

### Phase 2 (6-12 Months)
**Content Assistant**
- Editing and publishing
- Repurposing workflow
- Platform management

### Phase 3 (12-18 Months)
**Operations Manager**
- SOP maintenance
- Team coordination
- Systems optimization

## Org Chart (Future State)

\`\`\`
                    Babs (CEO/Vision)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Community      Content/        Operations
    Manager       Marketing         Manager
         │               │               │
    Members      Content Asst.     VA/Admin
\`\`\`

## Delegation Priorities

### Immediate (This Month)
- [ ] Document Incubator SOP for Aira
- [ ] Create content repurposing workflow
- [ ] Set up automated reporting

### Short-Term (Next 3 Months)
- [ ] Hire Community Manager
- [ ] Build out AI bot capabilities
- [ ] Create decision-making framework

### Long-Term (Next Year)
- [ ] Build full team of 3-5 people
- [ ] Create leadership development path
- [ ] Establish company culture and values

## Team Culture (from Soul Assessment)
**Core Values:**
- Alignment over hustle
- Sacred responsibility
- Compassionate truth
- Inner freedom

**Working Principles:**
- Remote-first, async-friendly
- Outcomes over hours
- Rest is part of the work
- AI-assisted, human-centered

## Next Steps
- [ ] Create job description for Community Manager
- [ ] Document top 5 SOPs for delegation
- [ ] Set up team communication rhythms
`,
  },
  "milestones": {
    id: "milestones",
    title: "Milestones & Metrics",
    icon: <CheckCircle className="w-5 h-5" />,
    aiGenerated: true,
    lastUpdated: "5 days ago",
    status: "complete",
    dataSources: ["All Assessments", "Quick Pulse Check-ins"],
    content: `# Milestones & Metrics

## Key Performance Indicators (KPIs)

### Business Health
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Monthly Revenue | $[Fill] | $[Fill] | 🟡 |
| Profit Margin | [Fill]% | 40%+ | 🟡 |
| Client Retention | [Fill]% | 85%+ | 🟢 |
| Email List Size | [Fill] | [Fill] | 🟡 |

### Impact Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lives Transformed | [Fill] | [Fill] | 🟢 |
| Client Satisfaction | [Fill]/5 | 4.5+/5 | 🟢 |
| Community Engagement | [Fill]% | 60%+ | 🟡 |
| Content Reach | [Fill] | [Fill] | 🟡 |

### Alignment Metrics (from Assessments)
| Metric | Current | Trend |
|--------|---------|-------|
| Brain Score | 73% | → Stable |
| Soul Score | 60% | ↓ Declining |
| Profit Score | 80% | ↑ Improving |
| Overall Health | 71% | 🟢 Healthy |

## 90-Day Milestones

### Quarter 3 2026 (Jul-Sep)
**Theme:** Systems & Infrastructure

**Milestone 1:** Complete LifeCharter Command Suite
- [ ] All modules functional
- [ ] Team trained on platform
- [ ] Client data migrated

**Milestone 2:** Pricing Optimization
- [ ] New pricing implemented
- [ ] 5 new Circle members at new rate
- [ ] Revenue increased 20%

**Milestone 3:** Content System
- [ ] 90 days of content scheduled
- [ ] Repurposing workflow automated
- [ ] Email nurture sequences live

### Quarter 4 2026 (Oct-Dec)
**Theme:** Growth & Scale

**Milestone 4:** Team Expansion
- [ ] Community Manager hired
- [ ] SOPs documented and delegated
- [ ] Babs focused on vision/teaching only

**Milestone 5:** Product Launch
- [ ] Self-directed LifeCharter live
- [ ] 50 sales in first month
- [ ] Positive client feedback

## Annual Goals 2026-2027

### Financial
- **Revenue Target:** $[Fill]
- **Profit Margin:** 40%+
- **Client LTV:** $[Fill]

### Impact
- **Clients Served:** [Fill]
- **Books Sold:** [Fill]
- **Community Members:** [Fill]

### Personal (Babs)
- **Work Hours:** 25-30/week
- **Soul Alignment:** 85%+
- **Team Size:** 3-5 people

## Tracking & Review

### Weekly
- Revenue vs. plan
- Content published
- Client interactions

### Monthly
- All KPIs review
- Milestone progress
- Pivot signals check

### Quarterly
- Deep business review
- Strategy adjustments
- Team/role evaluation

## Next Steps
- [ ] Fill in current metrics
- [ ] Set specific 90-day targets
- [ ] Create dashboard for tracking
`,
  },
};

export default function BusinessPlanSectionPage() {
  const params = useParams();
  const sectionId = params.section as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const section = sectionTemplates[sectionId] || {
    id: sectionId,
    title: "Section Not Found",
    icon: <FileText className="w-5 h-5" />,
    aiGenerated: false,
    lastUpdated: "",
    status: "needs_attention" as const,
    content: "# Section Not Found\n\nThis section does not exist yet.",
    dataSources: [],
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate AI refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "needs_attention":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/business-plan"
          className="inline-flex items-center text-sm text-[#B9A9A9] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Business Plan
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF63]/10 flex items-center justify-center">
              {section.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {section.title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-[#B9A9A9]">
                  {getStatusIcon(section.status)}
                  <span className="capitalize">{section.status.replace("_", " ")}</span>
                </span>
                <span className="text-[#B9A9A9]">•</span>
                <span className="text-sm text-[#B9A9A9]">
                  Updated {section.lastUpdated}
                </span>
                {section.aiGenerated && (
                  <>
                    <span className="text-[#B9A9A9]">•</span>
                    <span className="flex items-center gap-1 text-sm text-[#D4AF63]">
                      <Sparkles className="w-3 h-3" />
                      AI-Generated
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "AI Refresh"}
            </Button>
            <Button 
              variant={isEditing ? "primary" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <><Save className="w-4 h-4 mr-2" /> Save</>
              ) : (
                <><Edit3 className="w-4 h-4 mr-2" /> Edit</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {isEditing ? (
                <textarea
                  className="w-full h-[600px] p-4 font-mono text-sm bg-[#1F315B]/5 dark:bg-[#F6F1E8]/5 rounded-lg border border-[#1F315B]/10 focus:border-[#D4AF63] focus:outline-none resize-none"
                  defaultValue={section.content}
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {section.content.split("\n").map((line, i) => {
                    if (line.startsWith("# ")) {
                      return <h1 key={i} className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mt-8 mb-4">{line.replace("# ", "")}</h1>;
                    } else if (line.startsWith("## ")) {
                      return <h2 key={i} className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] mt-6 mb-3">{line.replace("## ", "")}</h2>;
                    } else if (line.startsWith("### ")) {
                      return <h3 key={i} className="text-lg font-medium text-[#1F315B] dark:text-[#F6F1E8] mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    } else if (line.startsWith("- [ ]")) {
                      return (
                        <div key={i} className="flex items-center gap-2 my-2">
                          <div className="w-4 h-4 border-2 border-[#B9A9A9] rounded" />
                          <span className="text-[#1F315B] dark:text-[#F6F1E8]">{line.replace("- [ ]", "").trim()}</span>
                        </div>
                      );
                    } else if (line.startsWith("- [x]")) {
                      return (
                        <div key={i} className="flex items-center gap-2 my-2">
                          <div className="w-4 h-4 bg-[#D4AF63] rounded flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[#1F315B] dark:text-[#F6F1E8] line-through opacity-50">{line.replace("- [x]", "").trim()}</span>
                        </div>
                      );
                    } else if (line.startsWith("- ")) {
                      return <li key={i} className="ml-4 text-[#1F315B] dark:text-[#F6F1E8]">{line.replace("- ", "")}</li>;
                    } else if (line.startsWith("|")) {
                      // Table row - simplified rendering
                      return <div key={i} className="font-mono text-sm text-[#B9A9A9] my-1">{line}</div>;
                    } else if (line.trim() === "") {
                      return <div key={i} className="h-4" />;
                    } else {
                      return <p key={i} className="text-[#1F315B] dark:text-[#F6F1E8] my-2">{line}</p>;
                    }
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Data Sources */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Data Sources</h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {section.dataSources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4 text-[#2E7C83]" />
                    <span className="text-[#1F315B] dark:text-[#F6F1E8]">{source}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh from Sources
              </Button>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          {section.keyMetrics && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Key Metrics</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {section.keyMetrics.map((metric, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#B9A9A9]">{metric.label}</span>
                        <span className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">{metric.value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={parseInt(metric.value)} className="h-2 flex-1" />
                        {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {metric.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {metric.trend === "stable" && <span className="text-[#B9A9A9]">→</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Section
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                  <FileText className="w-4 h-4 mr-2" />
                  View History
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Suggestions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}