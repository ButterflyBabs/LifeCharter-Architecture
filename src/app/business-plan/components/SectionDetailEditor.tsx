/**
 * Section Detail Editor
 * Hybrid approach: AI-generated base + targeted questions + manual edits
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  CheckCircle, 
  Circle, 
  Sparkles,
  Save,
  Edit3,
  AlertCircle
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "text" | "number" | "textarea" | "select" | "currency";
  placeholder?: string;
  required: boolean;
  aiSuggested?: string;
  section: string;
}



const sectionQuestions: Record<string, Question[]> = {
  "products": [
    { id: "p1", question: "What is your flagship product/service name?", type: "text", required: true, section: "products" },
    { id: "p2", question: "Current price point", type: "currency", required: true, section: "products" },
    { id: "p3", question: "How many clients have purchased this?", type: "number", required: true, section: "products" },
    { id: "p4", question: "What transformation does this provide?", type: "textarea", required: true, section: "products" },
    { id: "p5", question: "Delivery format (1:1, group, digital, etc.)", type: "select", required: true, section: "products" },
    { id: "p6", question: "Time to deliver results", type: "text", required: false, section: "products" },
    { id: "p7", question: "What makes this different from competitors?", type: "textarea", required: true, section: "products" },
  ],
  "pricing": [
    { id: "pr1", question: "Current hourly rate (if applicable)", type: "currency", required: false, section: "pricing" },
    { id: "pr2", question: "Package price range (low to high)", type: "text", required: true, section: "pricing" },
    { id: "pr3", question: "How confident are you in your pricing? (1-10)", type: "number", required: true, section: "pricing" },
    { id: "pr4", question: "What would you charge if you were 2x more confident?", type: "currency", required: true, section: "pricing" },
    { id: "pr5", question: "Payment plans currently offered?", type: "select", required: false, section: "pricing" },
  ],
  "revenue": [
    { id: "r1", question: "Last month's revenue", type: "currency", required: true, section: "revenue" },
    { id: "r2", question: "Revenue 12 months ago", type: "currency", required: true, section: "revenue" },
    { id: "r3", question: "Primary revenue source (%)", type: "text", required: true, section: "revenue" },
    { id: "r4", question: "Monthly revenue goal for next quarter", type: "currency", required: true, section: "revenue" },
    { id: "r5", question: "Annual revenue target", type: "currency", required: true, section: "revenue" },
  ],
  "market": [
    { id: "m1", question: "Describe your ideal client in one sentence", type: "text", required: true, section: "market" },
    { id: "m2", question: "Age range of typical client", type: "text", required: false, section: "market" },
    { id: "m3", question: "Top 3 problems your clients face", type: "textarea", required: true, section: "market" },
    { id: "m4", question: "Where do they hang out online?", type: "textarea", required: true, section: "market" },
    { id: "m5", question: "What have they tried before working with you?", type: "textarea", required: true, section: "market" },
  ],
  "marketing": [
    { id: "mk1", question: "Primary marketing channel", type: "select", required: true, section: "marketing" },
    { id: "mk2", question: "Email list size", type: "number", required: true, section: "marketing" },
    { id: "mk3", question: "Social media followers (total)", type: "number", required: false, section: "marketing" },
    { id: "mk4", question: "Content pieces published per week", type: "number", required: true, section: "marketing" },
    { id: "mk5", question: "Current lead generation strategy", type: "textarea", required: true, section: "marketing" },
  ],
  "operations": [
    { id: "o1", question: "Hours worked per week", type: "number", required: true, section: "operations" },
    { id: "o2", question: "Team members (including contractors)", type: "number", required: true, section: "operations" },
    { id: "o3", question: "Biggest operational bottleneck", type: "textarea", required: true, section: "operations" },
    { id: "o4", question: "Systems/tools currently used", type: "textarea", required: false, section: "operations" },
  ],
  "financials": [
    { id: "f1", question: "Monthly fixed expenses", type: "currency", required: true, section: "financials" },
    { id: "f2", question: "Monthly variable expenses", type: "currency", required: true, section: "financials" },
    { id: "f3", question: "Current profit margin (%)", type: "number", required: true, section: "financials" },
    { id: "f4", question: "Cash runway (months)", type: "number", required: false, section: "financials" },
    { id: "f5", question: "Break-even revenue per month", type: "currency", required: true, section: "financials" },
  ],
  "team": [
    { id: "t1", question: "Current team size", type: "number", required: true, section: "team" },
    { id: "t2", question: "Roles filled", type: "textarea", required: true, section: "team" },
    { id: "t3", question: "Next hire needed", type: "text", required: false, section: "team" },
    { id: "t4", question: "Delegation comfort level (1-10)", type: "number", required: true, section: "team" },
  ],
  "milestones": [
    { id: "mi1", question: "Revenue goal for next 90 days", type: "currency", required: true, section: "milestones" },
    { id: "mi2", question: "Number of new clients goal", type: "number", required: true, section: "milestones" },
    { id: "mi3", question: "One project to complete this quarter", type: "text", required: true, section: "milestones" },
    { id: "mi4", question: "Personal/work-life goal", type: "text", required: false, section: "milestones" },
  ],
};

interface SectionDetailEditorProps {
  sectionId: string;
  sectionTitle: string;
}

export function SectionDetailEditor({ sectionId, sectionTitle }: SectionDetailEditorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "content" | "metrics">("questions");
  const [showAiSuggestions] = useState(true);

  const questions = sectionQuestions[sectionId] || [];
  const completedCount = questions.filter(q => answers[q.id]).length;
  const progress = questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = () => {
    // Save to database
    console.log("Saving answers:", answers);
    setIsEditing(false);
  };

  const renderInput = (question: Question) => {
    const value = answers[question.id] || "";
    
    switch (question.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[100px]"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );
      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">$</span>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder={question.placeholder}
              className="pl-8"
            />
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                {sectionTitle}
              </h2>
              <p className="text-sm text-[#B9A9A9]">
                {completedCount} of {questions.length} questions answered
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={isEditing ? "primary" : "outline"}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  <><Save className="w-4 h-4 mr-2" /> Save</>
                ) : (
                  <><Edit3 className="w-4 h-4 mr-2" /> Edit</>
                )}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
            <div 
              className="bg-[#D4AF63] h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#1F315B]/10">
        {["questions", "content", "metrics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "questions" | "content" | "metrics")}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab 
                ? "text-[#D4AF63] border-b-2 border-[#D4AF63]" 
                : "text-[#B9A9A9]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className={answers[question.id] ? "border-green-500/30" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {answers[question.id] ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#B9A9A9]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-[#B9A9A9]">Q{index + 1}</span>
                      {question.required && (
                        <span className="text-xs text-red-500">*Required</span>
                      )}
                    </div>
                    <label className="block text-[#1F315B] dark:text-[#F6F1E8] font-medium mb-3">
                      {question.question}
                    </label>
                    {renderInput(question)}
                    
                    {/* AI Suggestion */}
                    {showAiSuggestions && question.aiSuggested && !answers[question.id] && (
                      <div className="mt-3 p-3 bg-[#D4AF63]/10 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-[#D4AF63] mb-1">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Suggestion (from your assessments)</span>
                        </div>
                        <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">
                          {question.aiSuggested}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleAnswer(question.id, question.aiSuggested!)}
                        >
                          Use This
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              AI-Generated Content
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-[#B9A9A9] italic">
                Complete the questions above to generate personalized content for this section...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              Key Metrics
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 border border-[#1F315B]/10 rounded-lg">
                <div className="flex items-center gap-2 text-[#B9A9A9] mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Metrics will appear here once questions are answered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
