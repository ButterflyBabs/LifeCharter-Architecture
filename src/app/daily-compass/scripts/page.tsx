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
  Star,
  Plus,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";

type ItemType = "script" | "template";
type ScriptType = "sales" | "email" | "dm" | "objection";
type Category = "Sales" | "Prospecting" | "Objections" | "Onboarding" | "Follow-up" | "Content" | "Nurture" | "Closing";

interface Script {
  id: string;
  title: string;
  itemType: ItemType;
  category: Category;
  type: ScriptType;
  content: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  description?: string;
}

const mockScripts: Script[] = [
  {
    id: "1",
    title: "Incubator to Circle Follow-up Call",
    itemType: "script",
    category: "Sales",
    type: "sales",
    description: "Complete call script for converting Incubator attendees to Circle members",
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
    lastUsed: "2026-07-15",
    createdAt: "2026-01-15"
  },
  {
    id: "2",
    title: "LinkedIn DM - Cold Outreach",
    itemType: "template",
    category: "Prospecting",
    type: "dm",
    description: "Template for initial LinkedIn outreach to cold prospects",
    content: `Hi [Name],

I came across your profile and noticed you're focused on [specific area]. I've been helping entrepreneurs in similar positions align their businesses with their true values—and I thought you might appreciate this perspective.

I host a free 90-minute workshop called the LifeCharter Incubator where we explore what alignment actually looks like in practice (not just theory).

Would you be open to learning more?

Best,
Babs`,
    tags: ["linkedin", "outreach", "incubator"],
    isFavorite: false,
    usageCount: 15,
    lastUsed: "2026-07-10",
    createdAt: "2026-02-01"
  },
  {
    id: "3",
    title: "Price Objection Handler",
    itemType: "script",
    category: "Objections",
    type: "objection",
    description: "Step-by-step response framework for price objections",
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
    lastUsed: "2026-07-17",
    createdAt: "2026-01-20"
  },
  {
    id: "4",
    title: "Welcome Email - New Circle Member",
    itemType: "template",
    category: "Onboarding",
    type: "email",
    description: "Email template for welcoming new members to the Circle",
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
    lastUsed: "2026-07-12",
    createdAt: "2026-03-01"
  },
  {
    id: "5",
    title: "Follow-up After No Response",
    itemType: "template",
    category: "Follow-up",
    type: "email",
    description: "Gentle follow-up email for prospects who haven't responded",
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
    lastUsed: "2026-07-14",
    createdAt: "2026-02-15"
  }
];

const defaultCategories: Category[] = ["Sales", "Prospecting", "Objections", "Onboarding", "Follow-up", "Content", "Nurture", "Closing"];
const scriptTypes = [
  { id: "sales", label: "Sales Calls", icon: Phone },
  { id: "email", label: "Emails", icon: Mail },
  { id: "dm", label: "DMs", icon: MessageSquare },
  { id: "objection", label: "Objections", icon: MessageSquare }
];

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>(mockScripts);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedType, setSelectedType] = useState<ScriptType | "all">("all");
  const [selectedItemType, setSelectedItemType] = useState<ItemType | "all">("all");
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New script creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScriptTitle, setNewScriptTitle] = useState("");
  const [newScriptDescription, setNewScriptDescription] = useState("");
  const [newScriptItemType, setNewScriptItemType] = useState<ItemType>("script");
  const [newScriptCategory, setNewScriptCategory] = useState<Category>("Sales");
  const [newScriptType, setNewScriptType] = useState<ScriptType>("sales");
  const [newScriptContent, setNewScriptContent] = useState("");
  const [newScriptTags, setNewScriptTags] = useState("");
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiAssistPrompt, setAiAssistPrompt] = useState("");
  
  // Custom category state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         script.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || script.category === selectedCategory;
    const matchesType = selectedType === "all" || script.type === selectedType;
    const matchesItemType = selectedItemType === "all" || script.itemType === selectedItemType;
    return matchesSearch && matchesCategory && matchesType && matchesItemType;
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
        itemType: "script",
        category: "Sales",
        type: "sales",
        description: "AI-generated script based on your prompt",
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
        usageCount: 0,
        createdAt: new Date().toISOString().split("T")[0]
      };
      setScripts([newScript, ...scripts]);
      setIsGenerating(false);
      setAiPrompt("");
      setShowAIGenerator(false);
    }, 2000);
  };

  const handleCreateScript = () => {
    if (!newScriptTitle || !newScriptContent) return;
    
    const newScript: Script = {
      id: Date.now().toString(),
      title: newScriptTitle,
      itemType: newScriptItemType,
      category: newScriptCategory,
      type: newScriptType,
      description: newScriptDescription,
      content: newScriptContent,
      tags: newScriptTags.split(",").map(tag => tag.trim()).filter(tag => tag),
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date().toISOString().split("T")[0]
    };
    
    setScripts([newScript, ...scripts]);
    
    // Reset form
    setNewScriptTitle("");
    setNewScriptDescription("");
    setNewScriptItemType("script");
    setNewScriptCategory("Sales");
    setNewScriptType("sales");
    setNewScriptContent("");
    setNewScriptTags("");
    setShowCreateModal(false);
    setShowAIAssist(false);
    setAiAssistPrompt("");
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const formattedCategory = newCategoryName.trim() as Category;
    if (!categories.includes(formattedCategory)) {
      setCategories([...categories, formattedCategory]);
    }
    setNewScriptCategory(formattedCategory);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handleAIAssist = async () => {
    if (!aiAssistPrompt) return;
    setIsGenerating(true);
    
    // Simulate AI generating content based on prompt
    setTimeout(() => {
      const generatedContent = `[AI-Assisted Script Based on: "${aiAssistPrompt}"]

OPENING:
"Hi [Name], I noticed [specific observation about their business/situation]."

CONTEXT:
"Many entrepreneurs I work with tell me that [relevant challenge]. Does that resonate with you?"

VALUE:
"What we've found is that [solution/benefit]. For example, [brief example or case study]."

INVITATION:
"I'd love to explore how this might work for you specifically. Would you be open to a brief conversation?"

[Customize the placeholders with specific details before using]`;
      
      setNewScriptContent(generatedContent);
      setIsGenerating(false);
      setShowAIAssist(false);
      setAiAssistPrompt("");
    }, 2000);
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#4a9b9b]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Scripts & Templates
              </h1>
              <p className="text-[#b8a898]">
                AI-powered sales scripts, emails, and objection handlers
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
            <Button onClick={() => setShowAIGenerator(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate Script
            </Button>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <Card className="mb-6 border-[#c9a227]/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#c9a227]" />
              Generate Custom Script with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-[#b8a898] mb-2 block">
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

      {/* Create New Script Modal */}
      {showCreateModal && (
        <Card className="mb-6 border-[#4a9b9b]/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#4a9b9b]" />
              Create New Script/Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#b8a898] mb-1 block">Title</label>
                <Input
                  placeholder="e.g., Discovery Call Script"
                  value={newScriptTitle}
                  onChange={(e) => setNewScriptTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-[#b8a898] mb-1 block">Item Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewScriptItemType("script")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      newScriptItemType === "script"
                        ? "border-[#4a9b9b] bg-[#4a9b9b]/10 text-[#4a9b9b]"
                        : "border-[#1a2b4a]/20 text-[#b8a898]"
                    }`}
                  >
                    Script
                  </button>
                  <button
                    onClick={() => setNewScriptItemType("template")}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      newScriptItemType === "template"
                        ? "border-[#c9a227] bg-[#c9a227]/10 text-[#c9a227]"
                        : "border-[#1a2b4a]/20 text-[#b8a898]"
                    }`}
                  >
                    Template
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#b8a898] mb-1 block">Category</label>
                {!showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <select
                      value={newScriptCategory}
                      onChange={(e) => setNewScriptCategory(e.target.value as Category)}
                      className="flex-1 p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowNewCategoryInput(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-[#b8a898] mb-1 block">Communication Type</label>
                <select
                  value={newScriptType}
                  onChange={(e) => setNewScriptType(e.target.value as ScriptType)}
                  className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                >
                  <option value="sales">Sales Call</option>
                  <option value="email">Email</option>
                  <option value="dm">DM/Message</option>
                  <option value="objection">Objection Handler</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#b8a898] mb-1 block">Description</label>
              <Input
                placeholder="Brief description of when/why to use this..."
                value={newScriptDescription}
                onChange={(e) => setNewScriptDescription(e.target.value)}
              />
            </div>
            
            {/* AI Assist Section */}
            {!showAIAssist ? (
              <Button 
                variant="outline" 
                onClick={() => setShowAIAssist(true)}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Help Writing This Script
              </Button>
            ) : (
              <div className="p-4 bg-[#c9a227]/10 rounded-lg space-y-3">
                <label className="text-sm text-[#b8a898] block">
                  Describe what you want the script to accomplish
                </label>
                <Textarea
                  placeholder="e.g., A script for reaching out to past clients about a new service offering..."
                  value={aiAssistPrompt}
                  onChange={(e) => setAiAssistPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAIAssist}
                    disabled={!aiAssistPrompt || isGenerating}
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Writing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Script Content
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAIAssist(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm text-[#b8a898] mb-1 block">Script Content</label>
              <Textarea
                placeholder="Paste or type your script here..."
                value={newScriptContent}
                onChange={(e) => setNewScriptContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[#b8a898] mb-1 block">Tags (comma separated)</label>
              <Input
                placeholder="e.g., discovery, sales, follow-up"
                value={newScriptTags}
                onChange={(e) => setNewScriptTags(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleCreateScript}
                disabled={!newScriptTitle || !newScriptContent}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Script
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setShowAIAssist(false);
                  setNewScriptTitle("");
                  setNewScriptContent("");
                  setNewScriptTags("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8a898]" />
          <Input
            placeholder="Search scripts and templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedItemType}
            onChange={(e) => setSelectedItemType(e.target.value as ItemType | "all")}
            className="px-4 py-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
          >
            <option value="all">All Items</option>
            <option value="script">Scripts</option>
            <option value="template">Templates</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category | "All")}
            className="px-4 py-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedType("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedType === "all"
              ? "bg-[#1a2b4a] text-[#F8F5F0]"
              : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/20"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          All Types
        </button>
        {scriptTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as ScriptType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedType === type.id
                  ? "bg-[#1a2b4a] text-[#F8F5F0]"
                  : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/20"
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
              className="p-4 cursor-pointer hover:bg-[#1a2b4a]/5 transition-colors"
              onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      script.itemType === "script" 
                        ? "bg-[#4a9b9b]/20 text-[#4a9b9b]" 
                        : "bg-[#c9a227]/20 text-[#c9a227]"
                    }`}>
                      {script.itemType === "script" ? "📜 Script" : "📋 Template"}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[#1a2b4a]/10 text-[#7b6b8d] dark:text-[#e8e4f0] rounded-full">
                      {script.category}
                    </span>
                    {script.isFavorite && (
                      <Star className="w-4 h-4 text-[#c9a227] fill-[#c9a227]" />
                    )}
                  </div>
                  <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                    {script.title}
                  </h3>
                  {script.description && (
                    <p className="text-sm text-[#b8a898] mt-1">{script.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#b8a898]">
                    <span>Used {script.usageCount} times</span>
                    {script.lastUsed && <span>Last used: {script.lastUsed}</span>}
                    <span>Created: {script.createdAt}</span>
                    <div className="flex gap-1">
                      {script.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-[#1a2b4a]/10 rounded-full">
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
                    className="p-2 hover:bg-[#1a2b4a]/10 rounded-lg"
                  >
                    <Star className={`w-5 h-5 ${script.isFavorite ? "text-[#c9a227] fill-[#c9a227]" : "text-[#b8a898]"}`} />
                  </button>
                  {expandedScript === script.id ? (
                    <ChevronUp className="w-5 h-5 text-[#b8a898]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#b8a898]" />
                  )}
                </div>
              </div>
            </div>

            {expandedScript === script.id && (
              <CardContent className="border-t border-[#1a2b4a]/10 pt-4">
                <div className="bg-[#1a2b4a]/5 p-4 rounded-lg mb-4">
                  <pre className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] whitespace-pre-wrap font-sans">
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
              <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {scripts.length}
              </p>
              <p className="text-sm text-[#b8a898]">Total Scripts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {scripts.filter(s => s.isFavorite).length}
              </p>
              <p className="text-sm text-[#b8a898]">Favorites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {scripts.reduce((acc, s) => acc + s.usageCount, 0)}
              </p>
              <p className="text-sm text-[#b8a898]">Total Uses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {scripts.filter(s => s.lastUsed === new Date().toISOString().split("T")[0]).length}
              </p>
              <p className="text-sm text-[#b8a898]">Used Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
