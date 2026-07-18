"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Copy,
  CheckCircle,
  Sparkles,
  Search,
  Tag,
  Star,
  Plus,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";

interface Script {
  id: string;
  title: string;
  category: string;
  type: "sales" | "email" | "dm" | "objection";
  content: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
}

const mockScripts: Script[] = [
  {
    id: "1",
    title: "Incubator to Circle Follow-up Call",
    category: "Sales",
    type: "sales",
    content: `OPENING:
"Hi [Name], it's Babs from LifeCharter. How are you doing since the Incubator?"

[Listen and acknowledge]

BRIDGE:
"I'm calling because I was thinking about our conversation during the workshop. You mentioned that [specific challenge] was really weighing on you."

PRESENT:
"The LifeCharter Circle is opening for new members, and I immediately thought of you. It's $297 a month. What questions do you have?"

CLOSE:
"Based on what you've shared, I really believe this is the right next step. Can I count you in?"`,
    tags: ["incubator", "circle", "conversion"],
    isFavorite: true,
    usageCount: 23,
    lastUsed: "2026-07-15"
  },
  {
    id: "2",
    title: "LinkedIn DM - Cold Outreach",
    category: "Prospecting",
    type: "dm",
    content: `Hi [Name],

I came across your profile and noticed you're focused on [specific area]. I've been helping entrepreneurs in similar positions align their businesses with their true values—and I thought you might appreciate this perspective.

I host a free 90-minute workshop called the LifeCharter Incubator where we explore what alignment actually looks like in practice (not just theory).

Would you be open to learning more?

Best,
Babs`,
    tags: ["linkedin", "outreach", "incubator"],
    isFavorite: false,
    usageCount: 15,
    lastUsed: "2026-07-10"
  },
  {
    id: "3",
    title: "Price Objection Handler",
    category: "Objections",
    type: "objection",
    content: `PROSPECT: "That's more than I was expecting to spend."

RESPONSE:
"I completely understand. Investing in yourself and your business is a big decision. Can I ask—what were you hoping the investment would be?"

[Listen]

"Here's what I've found: when people focus only on the cost, they sometimes miss the cost of staying where they are. You mentioned [specific pain point]—how much is that costing you right now, financially and energetically?"

[Pause]

"The Circle isn't an expense—it's an investment in becoming the version of you who doesn't have [pain point] anymore. Does that feel worth exploring?"`,
    tags: ["objection", "price", "sales"],
    isFavorite: true,
    usageCount: 42,
    lastUsed: "2026-07-17"
  },
  {
    id: "4",
    title: "Welcome Email - New Circle Member",
    category: "Onboarding",
    type: "email",
    content: `Subject: Welcome to the Circle, [Name] 🦋

Dear [Name],

Welcome to the LifeCharter Circle! I'm so excited you've decided to join us on this journey of alignment and transformation.

Here's what happens next:

📅 Your first Alignment Call is scheduled for [Date] at [Time]
🔗 Join URL: [Zoom Link]
📚 Access your member portal: [Portal Link]
💬 Join our private community: [Community Link]

Before our call, please complete your LifeCharter Assessment (takes about 15 minutes). This helps us identify which domains need the most attention.

If you have any questions, simply reply to this email. I'm here to support you.

With alignment,
Babs

P.S. Mark your calendar for our weekly Circle gatherings every Thursday at 1pm MT.`,
    tags: ["onboarding", "email", "circle"],
    isFavorite: false,
    usageCount: 8,
    lastUsed: "2026-07-12"
  },
  {
    id: "5",
    title: "Follow-up After No Response",
    category: "Follow-up",
    type: "email",
    content: `Subject: Following up, [Name]

Hi [Name],

I wanted to circle back on my previous message about the LifeCharter Incubator. I know things get busy, and this might not be the right timing—and that's completely okay.

I also know that sometimes the people who need this work the most are the ones who feel too overwhelmed to even start. If that's you, I get it. I've been there.

If you're still interested, I'd love to have you join us. If not, no pressure at all. Just reply and let me know either way.

Wishing you alignment,
Babs`,
    tags: ["follow-up", "email", "nurture"],
    isFavorite: false,
    usageCount: 31,
    lastUsed: "2026-07-14"
  }
];

const categories = ["All", "Sales", "Prospecting", "Objections", "Onboarding", "Follow-up"];
const types = [
  { id: "all", label: "All Types", icon: MessageSquare },
  { id: "sales", label: "Sales Calls", icon: Phone },
  { id: "email", label: "Emails", icon: Mail },
  { id: "dm", label: "DMs", icon: MessageSquare },
  { id: "objection", label: "Objections", icon: MessageSquare }
];

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>(mockScripts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("all");
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || script.category === selectedCategory;
    const matchesType = selectedType === "all" || script.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleCopy = (script: Script) => {
    navigator.clipboard.writeText(script.content);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
    
    // Update usage count
    setScripts(scripts.map(s => 
      s.id === script.id 
        ? { ...s, usageCount: s.usageCount + 1, lastUsed: new Date().toISOString().split("T")[0] }
        : s
    ));
  };

  const toggleFavorite = (id: string) => {
    setScripts(scripts.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const newScript: Script = {
        id: Date.now().toString(),
        title: `AI Generated: ${aiPrompt.substring(0, 30)}...`,
        category: "Sales",
        type: "sales",
        content: `[AI Generated Script based on: "${aiPrompt}"]

OPENING:
"Hi [Name], I hope you're having a great day. I wanted to reach out because [personalized reason based on their profile]."

BRIDGE:
"I've been working with entrepreneurs who are facing similar challenges to what you described, and I thought you might find this valuable..."

VALUE:
"The LifeCharter framework helps you align your business with your true values so you can grow without the burnout."

CLOSE:
"I'd love to invite you to our free Incubator workshop. Would you be open to learning more?"

[This is a template - customize with specific details about your prospect]`,
        tags: ["ai-generated", "custom"],
        isFavorite: false,
        usageCount: 0
      };
      setScripts([newScript, ...scripts]);
      setIsGenerating(false);
      setAiPrompt("");
      setShowAIGenerator(false);
    }, 2000);
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#2E7C83]/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#2E7C83]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                Scripts & Templates
              </h1>
              <p className="text-[#B9A9A9]">
                AI-powered sales scripts, emails, and objection handlers
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAIGenerator(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate Script
          </Button>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <Card className="mb-6 border-[#D4AF63]/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#D4AF63]" />
              Generate Custom Script with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#B9A9A9] mb-2 block">
                Describe the situation or what you need
              </label>
              <Textarea
                placeholder="e.g., Create a script for following up with someone who downloaded my lead magnet but hasn't booked a call yet..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleAIGenerate}
                disabled={!aiPrompt || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9A9A9]" />
          <Input
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedType === type.id
                  ? "bg-[#1F315B] text-[#F6F1E8]"
                  : "bg-[#1F315B]/10 text-[#1F315B] dark:text-[#F6F1E8] hover:bg-[#1F315B]/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Scripts List */}
      <div className="space-y-4">
        {filteredScripts.map((script) => (
          <Card key={script.id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-[#1F315B]/5 transition-colors"
              onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-[#2E7C83]/20 text-[#2E7C83] rounded-full">
                      {script.category}
                    </span>
                    {script.isFavorite && (
                      <Star className="w-4 h-4 text-[#D4AF63] fill-[#D4AF63]" />
                    )}
                  </div>
                  <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                    {script.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#B9A9A9]">
                    <span>Used {script.usageCount} times</span>
                    {script.lastUsed && <span>Last used: {script.lastUsed}</span>}
                    <div className="flex gap-1">
                      {script.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-[#1F315B]/10 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(script.id);
                    }}
                    className="p-2 hover:bg-[#1F315B]/10 rounded-lg"
                  >
                    <Star className={`w-5 h-5 ${script.isFavorite ? "text-[#D4AF63] fill-[#D4AF63]" : "text-[#B9A9A9]"}`} />
                  </button>
                  {expandedScript === script.id ? (
                    <ChevronUp className="w-5 h-5 text-[#B9A9A9]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#B9A9A9]" />
                  )}
                </div>
              </div>
            </div>

            {expandedScript === script.id && (
              <CardContent className="border-t border-[#1F315B]/10 pt-4">
                <div className="bg-[#1F315B]/5 p-4 rounded-lg mb-4">
                  <pre className="text-sm text-[#1F315B] dark:text-[#F6F1E8] whitespace-pre-wrap font-sans">
                    {script.content}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => handleCopy(script)}>
                    {copiedId === script.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Script
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {scripts.length}
              </p>
              <p className="text-sm text-[#B9A9A9]">Total Scripts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {scripts.filter(s => s.isFavorite).length}
              </p>
              <p className="text-sm text-[#B9A9A9]">Favorites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {scripts.reduce((acc, s) => acc + s.usageCount, 0)}
              </p>
              <p className="text-sm text-[#B9A9A9]">Total Uses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {scripts.filter(s => s.lastUsed === new Date().toISOString().split("T")[0]).length}
              </p>
              <p className="text-sm text-[#B9A9A9]">Used Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
