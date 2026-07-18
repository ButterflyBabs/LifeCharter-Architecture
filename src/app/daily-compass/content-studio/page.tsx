"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  MessageSquare,
  Video,
  Mic,
  Copy,
  CheckCircle,
  RefreshCw,
  Calendar,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Wand2,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";
import Link from "next/link";

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  example: string;
}

interface GeneratedContent {
  id: string;
  type: "social" | "email" | "script";
  platform?: string;
  content: string;
  hashtags?: string[];
  imagePrompt?: string;
  status: "draft" | "approved" | "scheduled";
}

const contentTemplates: ContentTemplate[] = [
  {
    id: "1",
    name: "Client Win Story",
    description: "Share a client transformation",
    platform: "LinkedIn",
    example: "Just watched Sarah go from overwhelmed to aligned..."
  },
  {
    id: "2",
    name: "Value Bomb",
    description: "Share one key insight",
    platform: "Instagram",
    example: "3 signs you are out of alignment..."
  },
  {
    id: "3",
    name: "Behind the Scenes",
    description: "Show your process",
    platform: "Instagram Stories",
    example: "How I plan my week for alignment..."
  },
  {
    id: "4",
    name: "Question Hook",
    description: "Engage with a question",
    platform: "LinkedIn",
    example: "What would change if you stopped hustling and started aligning?"
  }
];

const aiPrompts = [
  "Create a post about the difference between hustle and alignment",
  "Write an email inviting past clients to a new workshop",
  "Generate 5 LinkedIn post ideas about LifeCharter",
  "Create a sales script for the Incubator follow-up call",
  "Write an Instagram caption about morning alignment rituals"
];

export default function ContentStudioPage() {
  const [selectedType, setSelectedType] = useState<"social" | "email" | "script">("social");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("linkedin");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [savedContent, setSavedContent] = useState<GeneratedContent[]>([]);
  const [, setShowTemplates] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const content: GeneratedContent = {
        id: Date.now().toString(),
        type: selectedType,
        platform: selectedPlatform,
        content: generateMockContent(selectedType, selectedPlatform, prompt),
        hashtags: selectedType === "social" ? ["#LifeCharter", "#Alignment", "#BusinessGrowth"] : undefined,
        imagePrompt: selectedType === "social" ? "A serene image of a person meditating at sunrise with soft golden light" : undefined,
        status: "draft"
      };
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 2000);
  };

  const generateMockContent = (type: string, _platform: string, _prompt: string): string => {
    if (type === "social") {
      return `🦋 What if I told you that everything you've been taught about business growth is backwards?

We've been told to hustle harder. To grind more. To sacrifice everything for success.

But what if the real key is alignment?

When you're aligned:
✓ Decisions become obvious
✓ Energy flows naturally  
✓ Results come with ease
✓ Success feels sustainable

I've watched hundreds of entrepreneurs transform their businesses not by doing MORE, but by aligning what they do with who they truly are.

The LifeCharter framework isn't about adding more to your plate. It's about clearing the clutter so what matters most can shine.

What's one area of your business that feels out of alignment right now? 👇`;
    } else if (type === "email") {
      return `Subject: Your invitation to align your business (closes soon)

Hi [Name],

I hope this email finds you well. I wanted to personally reach out because I remember when you attended the LifeCharter Incubator, and I saw how the concept of alignment resonated with you.

Since then, I've been thinking about your business and the challenges you mentioned around [specific challenge]. I believe you're ready for the next step.

The LifeCharter Circle is opening for new members, and I'd love to invite you to join us. This is where we go deep - beyond concepts into actual implementation.

In the Circle, you'll:
• Get weekly alignment check-ins
• Access the complete 12-domain framework
• Connect with other aligned entrepreneurs
• Receive direct support from me

The investment is $297/month, and the doors close Friday.

If you're feeling called to this, reply to this email and I'll send you the registration link.

With alignment,
Babs

P.S. If now isn't the right time, I completely understand. The Incubator will always be there for you.`;
    } else {
      return `SALES SCRIPT: Incubator to Circle Follow-up

OPENING:
"Hi [Name], it's Babs from LifeCharter. How are you doing since the Incubator?"

[Listen and acknowledge]

BRIDGE:
"I'm calling because I was thinking about our conversation during the workshop. You mentioned that [specific challenge] was really weighing on you, and I wanted to see how that's been going."

[Listen]

PRESENT:
"The reason I'm calling is that the LifeCharter Circle is opening for new members, and I immediately thought of you. You have that spark - I could see it during the Incubator - and I think you're ready for the next level.

The Circle is where we actually implement everything from the Incubator. It's weekly support, the full framework, and direct access to me. It's $297 a month.

What questions do you have about joining us?"

[Handle objections]

CLOSE:
"Based on what you've shared, I really believe this is the right next step for you. Can I count you in?"

[If yes] "Great! I'll send you the link right now while we're on the phone."

[If no] "I understand. Can I ask what would need to change for this to be a yes?"

FOLLOW-UP:
"No matter what you decide, I'm here to support you. Let's stay connected."`;
    }
  };

  const handleApprove = () => {
    if (generatedContent) {
      setSavedContent([...savedContent, { ...generatedContent, status: "approved" }]);
      setGeneratedContent(null);
      setPrompt("");
    }
  };

  const handleSchedule = () => {
    if (generatedContent) {
      setSavedContent([...savedContent, { ...generatedContent, status: "scheduled" }]);
      setGeneratedContent(null);
      setPrompt("");
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#2E7C83]/20 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-[#2E7C83]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Content Studio
            </h1>
            <p className="text-[#B9A9A9]">
              AI-powered content creation for your business
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Creation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What would you like to create?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setSelectedType("social")}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedType === "social"
                      ? "border-[#2E7C83] bg-[#2E7C83]/10"
                      : "border-[#1F315B]/20 hover:border-[#2E7C83]/50"
                  }`}
                >
                  <Share2 className="w-6 h-6 mx-auto mb-2 text-[#2E7C83]" />
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Social Post</p>
                </button>
                <button
                  onClick={() => setSelectedType("email")}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedType === "email"
                      ? "border-[#5E3B6C] bg-[#5E3B6C]/10"
                      : "border-[#1F315B]/20 hover:border-[#5E3B6C]/50"
                  }`}
                >
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#5E3B6C]" />
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Email</p>
                </button>
                <button
                  onClick={() => setSelectedType("script")}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedType === "script"
                      ? "border-[#D4AF63] bg-[#D4AF63]/10"
                      : "border-[#1F315B]/20 hover:border-[#D4AF63]/50"
                  }`}
                >
                  <Mic className="w-6 h-6 mx-auto mb-2 text-[#D4AF63]" />
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Sales Script</p>
                </button>
              </div>

              {/* Platform Selector (for social) */}
              {selectedType === "social" && (
                <div className="mb-6">
                  <label className="text-sm text-[#B9A9A9] mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {["linkedin", "instagram", "twitter", "facebook"].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                          selectedPlatform === platform
                            ? "border-[#2E7C83] bg-[#2E7C83]/10 text-[#2E7C83]"
                            : "border-[#1F315B]/20 text-[#B9A9A9]"
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Prompt */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#B9A9A9] mb-2 block">
                    Describe what you want to create
                  </label>
                  <Textarea
                    placeholder="e.g., Create a LinkedIn post about the difference between hustle and alignment..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                {/* Quick Prompts */}
                <div>
                  <p className="text-sm text-[#B9A9A9] mb-2">Or try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(p)}
                        className="text-xs px-3 py-1.5 bg-[#1F315B]/5 text-[#5E3B6C] dark:text-[#CDBED6] rounded-full hover:bg-[#D4AF63]/20 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      AI is creating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {generatedContent && (
            <Card className="border-[#D4AF63]/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF63]" />
                  AI Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#1F315B]/5 rounded-lg">
                  <p className="text-[#1F315B] dark:text-[#F6F1E8] whitespace-pre-wrap">
                    {generatedContent.content}
                  </p>
                  {generatedContent.hashtags && (
                    <p className="text-[#2E7C83] mt-3 text-sm">
                      {generatedContent.hashtags.join(" ")}
                    </p>
                  )}
                </div>

                {generatedContent.imagePrompt && (
                  <div className="p-3 bg-[#D4AF63]/10 rounded-lg">
                    <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
                      <strong>Image Suggestion:</strong> {generatedContent.imagePrompt}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button variant="outline" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button onClick={handleSchedule}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Templates & Saved */}
        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#D4AF63]" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setPrompt(`Create a ${template.name.toLowerCase()} post`);
                    setSelectedType("social");
                  }}
                  className="w-full text-left p-3 bg-[#1F315B]/5 rounded-lg hover:bg-[#1F315B]/10 transition-colors"
                >
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                    {template.name}
                  </p>
                  <p className="text-xs text-[#B9A9A9]">{template.description}</p>
                  <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6] mt-1">
                    {template.platform}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Saved Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Content</CardTitle>
            </CardHeader>
            <CardContent>
              {savedContent.length > 0 ? (
                <div className="space-y-3">
                  {savedContent.map((content) => (
                    <div
                      key={content.id}
                      className="p-3 bg-[#1F315B]/5 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#1F315B] dark:text-[#F6F1E8] capitalize">
                          {content.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          content.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {content.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#B9A9A9] line-clamp-2">
                        {content.content.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#B9A9A9] text-center py-4">
                  No saved content yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4AF63]" />
                Content Tips
              </h3>
              <ul className="text-sm space-y-2 text-[#CDBED6]">
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5" />
                  Lead with value, not promotion
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5" />
                  Share real stories and transformations
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5" />
                  End with a question to drive engagement
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5" />
                  Use your authentic voice - be you
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
