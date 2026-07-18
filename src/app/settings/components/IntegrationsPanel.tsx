/**
 * Integrations Panel
 * Accordion-style integrations with plan-based limits
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ChevronDown,
  ChevronUp,
  Lock
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface IntegrationCategory {
  title: string;
  items: Integration[];
}

interface IntegrationsPanelProps {
  planId: string;
  currentIntegrationCount: number;
}

// Plan-based integration limits
const PLAN_INTEGRATION_LIMITS: Record<string, number> = {
  starter: 10,
  growth: 25,
  vip: -1 // unlimited
};

const integrationCategories: IntegrationCategory[] = [
  {
    title: "AI Providers",
    items: [
      { id: "openai", name: "OpenAI", description: "GPT-4, GPT-3.5, DALL-E", icon: "🤖", color: "#10A37F" },
      { id: "anthropic", name: "Anthropic", description: "Claude AI models", icon: "🧠", color: "#D4A574" },
      { id: "moonshot", name: "Moonshot AI", description: "Kimi K2.5 and other models", icon: "🌙", color: "#1F315B" }
    ]
  },
  {
    title: "Business Foundation",
    items: [
      { id: "googleWorkspace", name: "Google Workspace", description: "Email, Docs, Calendar, Drive", icon: "📧", color: "#4285F4" },
      { id: "microsoft365", name: "Microsoft 365", description: "Outlook, Word, Excel, Teams", icon: "🏢", color: "#D83B01" },
      { id: "cloudflare", name: "Cloudflare", description: "Domain & DNS management", icon: "☁️", color: "#F48120" },
      { id: "namecheap", name: "Namecheap", description: "Domain registration", icon: "🌐", color: "#DE3723" },
      { id: "zoom", name: "Zoom", description: "Meetings and webinars", icon: "🎥", color: "#2D8CFF" },
      { id: "openPhone", name: "OpenPhone", description: "Business phone system", icon: "📞", color: "#00A8E8" }
    ]
  },
  {
    title: "CRM & Sales",
    items: [
      { id: "ghl", name: "GoHighLevel", description: "CRM, funnels, and automation", icon: "📊", color: "#3B82F6" },
      { id: "hubspot", name: "HubSpot", description: "CRM, marketing, sales, service", icon: "🟠", color: "#FF7A59" },
      { id: "salesforce", name: "Salesforce", description: "Enterprise CRM", icon: "☁️", color: "#00A1E0" },
      { id: "pipedrive", name: "Pipedrive", description: "Sales pipeline management", icon: "🎯", color: "#0087CC" },
      { id: "honeybook", name: "HoneyBook", description: "Service business CRM", icon: "🍯", color: "#FF6B6B" },
      { id: "dubsado", name: "Dubsado", description: "Client management", icon: "📋", color: "#1B1B1B" },
      { id: "activecampaign", name: "ActiveCampaign", description: "CRM and automation", icon: "⚡", color: "#0056D2" }
    ]
  },
  {
    title: "Email Marketing",
    items: [
      { id: "convertkit", name: "ConvertKit", description: "Email marketing for creators", icon: "✉️", color: "#FB6970" },
      { id: "mailchimp", name: "Mailchimp", description: "Email marketing platform", icon: "🐵", color: "#FFE01B" },
      { id: "kit", name: "Kit", description: "Email marketing", icon: "📬", color: "#FF6B6B" },
      { id: "mailerlite", name: "MailerLite", description: "Email marketing", icon: "📨", color: "#00A8E8" },
      { id: "beehiiv", name: "Beehiiv", description: "Newsletter platform", icon: "🐝", color: "#FFD700" }
    ]
  },
  {
    title: "Scheduling",
    items: [
      { id: "calendly", name: "Calendly", description: "Scheduling and appointments", icon: "📅", color: "#006BFF" },
      { id: "acuity", name: "Acuity Scheduling", description: "Appointment scheduling", icon: "🗓️", color: "#5D50E1" },
      { id: "savvycal", name: "SavvyCal", description: "Scheduling for professionals", icon: "🕐", color: "#FF6B6B" },
      { id: "calcom", name: "Cal.com", description: "Open scheduling", icon: "📆", color: "#292929" }
    ]
  },
  {
    title: "Website & Landing Pages",
    items: [
      { id: "wordpress", name: "WordPress", description: "Website platform", icon: "📝", color: "#21759B" },
      { id: "squarespace", name: "Squarespace", description: "Website builder", icon: "🟥", color: "#000000" },
      { id: "webflow", name: "Webflow", description: "No-code website builder", icon: "🌊", color: "#4353FF" },
      { id: "kajabi", name: "Kajabi", description: "All-in-one platform", icon: "🎓", color: "#2FC3E9" },
      { id: "leadpages", name: "Leadpages", description: "Landing page builder", icon: "📄", color: "#0066CC" },
      { id: "clickfunnels", name: "ClickFunnels", description: "Sales funnels", icon: "🔄", color: "#00A8E8" },
      { id: "systeme", name: "Systeme.io", description: "All-in-one marketing", icon: "⚙️", color: "#1E90FF" }
    ]
  },
  {
    title: "Forms & Assessments",
    items: [
      { id: "typeform", name: "Typeform", description: "Forms and surveys", icon: "❓", color: "#FF6B6B" },
      { id: "jotform", name: "Jotform", description: "Online forms", icon: "📋", color: "#FF6B00" },
      { id: "tally", name: "Tally", description: "Form builder", icon: "✅", color: "#FF6B6B" },
      { id: "scoreapp", name: "ScoreApp", description: "Assessments and quizzes", icon: "🎯", color: "#6B4EE6" },
      { id: "interact", name: "Interact", description: "Quizzes and assessments", icon: "💡", color: "#FF6B6B" }
    ]
  },
  {
    title: "Payments & Finance",
    items: [
      { id: "stripe", name: "Stripe", description: "Payment processing", icon: "💳", color: "#635BFF" },
      { id: "paypal", name: "PayPal", description: "Payment platform", icon: "💰", color: "#003087" },
      { id: "quickbooks", name: "QuickBooks", description: "Accounting software", icon: "📊", color: "#2CA01C" },
      { id: "xero", name: "Xero", description: "Accounting software", icon: "📈", color: "#13B5EA" },
      { id: "wise", name: "Wise", description: "International payments", icon: "💱", color: "#00B9FF" },
      { id: "thrivecart", name: "ThriveCart", description: "Shopping cart", icon: "🛒", color: "#00C853" }
    ]
  },
  {
    title: "Contracts & Proposals",
    items: [
      { id: "pandadoc", name: "PandaDoc", description: "Proposals and contracts", icon: "📄", color: "#00A8E8" },
      { id: "docusign", name: "DocuSign", description: "Electronic signatures", icon: "✍️", color: "#0056D2" },
      { id: "betterproposals", name: "Better Proposals", description: "Proposal software", icon: "📋", color: "#FF6B6B" },
      { id: "proposify", name: "Proposify", description: "Proposal creation", icon: "📑", color: "#FF6B6B" }
    ]
  },
  {
    title: "Course & Membership",
    items: [
      { id: "teachable", name: "Teachable", description: "Online course platform", icon: "🎓", color: "#1B1B1B" },
      { id: "thinkific", name: "Thinkific", description: "Course creation", icon: "💭", color: "#00A8E8" },
      { id: "skool", name: "Skool", description: "Community platform", icon: "🏫", color: "#00C853" },
      { id: "circle", name: "Circle", description: "Community platform", icon: "⭕", color: "#000000" },
      { id: "memberful", name: "Memberful", description: "Membership platform", icon: "👥", color: "#1B1B1B" }
    ]
  },
  {
    title: "Video & Content",
    items: [
      { id: "loom", name: "Loom", description: "Video messaging", icon: "🎬", color: "#625DF5" },
      { id: "wistia", name: "Wistia", description: "Video hosting", icon: "▶️", color: "#00A8E8" },
      { id: "vimeo", name: "Vimeo", description: "Video platform", icon: "🎥", color: "#1AB7EA" },
      { id: "youtube", name: "YouTube", description: "Video platform", icon: "📺", color: "#FF0000" },
      { id: "descript", name: "Descript", description: "Video editing", icon: "🎙️", color: "#00C853" }
    ]
  },
  {
    title: "Call Recording & Analysis",
    items: [
      { id: "fathom", name: "Fathom", description: "Call recording and notes", icon: "🎤", color: "#00C853" },
      { id: "fireflies", name: "Fireflies.ai", description: "Meeting transcription", icon: "🔥", color: "#FF6B00" },
      { id: "otter", name: "Otter.ai", description: "Voice notes", icon: "🦦", color: "#00A8E8" },
      { id: "grain", name: "Grain", description: "Call recording", icon: "🌾", color: "#FFD700" },
      { id: "gong", name: "Gong", description: "Revenue intelligence", icon: "🔔", color: "#FF6B6B" },
      { id: "avoma", name: "Avoma", description: "Meeting assistant", icon: "🤝", color: "#6B4EE6" }
    ]
  },
  {
    title: "Testimonials & Social Proof",
    items: [
      { id: "senja", name: "Senja", description: "Testimonial collection", icon: "⭐", color: "#FFD700" },
      { id: "vocalvideo", name: "Vocal Video", description: "Video testimonials", icon: "🎤", color: "#FF6B6B" },
      { id: "trustpilot", name: "Trustpilot", description: "Review platform", icon: "✓", color: "#00B67A" },
      { id: "googleBusiness", name: "Google Business", description: "Business reviews", icon: "🔍", color: "#4285F4" }
    ]
  },
  {
    title: "Affiliate & Referrals",
    items: [
      { id: "rewardful", name: "Rewardful", description: "Affiliate tracking", icon: "🎁", color: "#00C853" },
      { id: "firstpromoter", name: "FirstPromoter", description: "Referral program", icon: "🚀", color: "#FF6B6B" },
      { id: "referralcandy", name: "ReferralCandy", description: "Referral marketing", icon: "🍬", color: "#FF6B6B" },
      { id: "tapfiliate", name: "Tapfiliate", description: "Affiliate marketing", icon: "👆", color: "#00A8E8" }
    ]
  },
  {
    title: "Messaging",
    items: [
      { id: "telegram", name: "Telegram", description: "Bot integration and messaging", icon: "✈️", color: "#26A5E4" },
      { id: "whatsapp", name: "WhatsApp", description: "Business API messaging", icon: "💬", color: "#25D366" },
      { id: "slack", name: "Slack", description: "Team communication", icon: "💼", color: "#4A154B" },
      { id: "discord", name: "Discord", description: "Community and bots", icon: "🎮", color: "#5865F2" },
      { id: "twilio", name: "Twilio", description: "SMS and voice API", icon: "📱", color: "#F22F46" }
    ]
  },
  {
    title: "Social Media",
    items: [
      { id: "facebook", name: "Facebook", description: "Pages and groups", icon: "📘", color: "#1877F2" },
      { id: "instagram", name: "Instagram", description: "Business account", icon: "📸", color: "#E4405F" },
      { id: "linkedin", name: "LinkedIn", description: "Professional network", icon: "💼", color: "#0A66C2" },
      { id: "twitter", name: "X (Twitter)", description: "Social posting", icon: "🐦", color: "#000000" },
      { id: "tiktok", name: "TikTok", description: "Video content", icon: "🎵", color: "#000000" },
      { id: "pinterest", name: "Pinterest", description: "Visual discovery", icon: "📌", color: "#E60023" },
      { id: "threads", name: "Threads", description: "Text sharing", icon: "🧵", color: "#000000" },
      { id: "bluesky", name: "BlueSky", description: "Decentralized social", icon: "🦋", color: "#0085FF" }
    ]
  },
  {
    title: "Storage & Productivity",
    items: [
      { id: "googleDrive", name: "Google Drive", description: "File storage", icon: "📁", color: "#4285F4" },
      { id: "dropbox", name: "Dropbox", description: "Cloud storage", icon: "📦", color: "#0061FF" },
      { id: "oneDrive", name: "OneDrive", description: "Microsoft cloud storage", icon: "☁️", color: "#0078D4" },
      { id: "notion", name: "Notion", description: "Documentation and wiki", icon: "📝", color: "#000000" },
      { id: "airtable", name: "Airtable", description: "Database and spreadsheets", icon: "🗂️", color: "#18BFFF" },
      { id: "asana", name: "Asana", description: "Project management", icon: "✅", color: "#F06A6A" },
      { id: "trello", name: "Trello", description: "Kanban boards", icon: "📋", color: "#0079BF" },
      { id: "monday", name: "Monday.com", description: "Work management", icon: "📊", color: "#FF3D57" },
      { id: "clickup", name: "ClickUp", description: "Productivity platform", icon: "🚀", color: "#7B68EE" }
    ]
  }
];

export function IntegrationsPanel({ planId, currentIntegrationCount }: IntegrationsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["AI Providers"]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const limit = PLAN_INTEGRATION_LIMITS[planId] || 10;
  const isUnlimited = limit === -1;
  const remainingSlots = isUnlimited ? -1 : limit - currentIntegrationCount;
  const canConnectMore = isUnlimited || remainingSlots > 0;

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const toggleConnection = (id: string) => {
    if (!connectedIntegrations.has(id) && !canConnectMore) {
      return; // Can't connect more
    }

    setConnectedIntegrations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const updateApiKey = (id: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Integration Limit Header */}
      <div className="p-4 bg-[#1F315B]/5 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
              Integration Slots
            </h4>
            <p className="text-sm text-[#B9A9A9]">
              {isUnlimited
                ? "Unlimited integrations (VIP Plan)"
                : `${currentIntegrationCount} of ${limit} used`}
            </p>
          </div>
          {!isUnlimited && (
            <div className="text-right">
              <span className={`text-sm font-medium ${remainingSlots === 0 ? 'text-red-500' : 'text-green-500'}`}>
                {remainingSlots} remaining
              </span>
            </div>
          )}
        </div>
        {!canConnectMore && (
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-600">
              Integration limit reached. Upgrade to connect more tools.
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Upgrade Plan
            </Button>
          </div>
        )}
      </div>

      {/* Accordion Categories */}
      {integrationCategories.map((category) => {
        const isExpanded = expandedCategories.includes(category.title);
        const connectedCount = category.items.filter(item => connectedIntegrations.has(item.id)).length;

        return (
          <Card key={category.title} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#1F315B]/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                  {category.title}
                </span>
                {connectedCount > 0 && (
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                    {connectedCount} connected
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#B9A9A9]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#B9A9A9]" />
              )}
            </button>

            {isExpanded && (
              <CardContent className="p-4 pt-0 space-y-3">
                {category.items.map((integration) => {
                  const isConnected = connectedIntegrations.has(integration.id);
                  const isExpandedSettings = showApiKey[integration.id];
                  const canConnect = isConnected || canConnectMore;

                  return (
                    <div
                      key={integration.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isConnected
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-[#1F315B]/10"
                      } ${!canConnect ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${integration.color}20` }}
                          >
                            {integration.icon}
                          </div>
                          <div>
                            <h5 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                              {integration.name}
                            </h5>
                            <p className="text-xs text-[#B9A9A9]">
                              {integration.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isConnected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowApiKey({
                                  ...showApiKey,
                                  [integration.id]: !isExpandedSettings
                                })
                              }
                            >
                              {isExpandedSettings ? "Hide" : "Settings"}
                            </Button>
                          )}
                          <Button
                            variant={isConnected ? "outline" : "primary"}
                            size="sm"
                            onClick={() => toggleConnection(integration.id)}
                            disabled={!canConnect}
                          >
                            {!canConnect && !isConnected ? (
                              <Lock className="w-4 h-4 mr-1" />
                            ) : null}
                            {isConnected ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      </div>

                      {/* Settings Panel */}
                      {isConnected && isExpandedSettings && (
                        <div className="mt-3 pt-3 border-t border-[#1F315B]/10 space-y-3">
                          <div>
                            <label className="block text-sm text-[#B9A9A9] mb-2">
                              API Key / Token
                            </label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKeys[integration.id] || ""}
                                onChange={(e) =>
                                  updateApiKey(integration.id, e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button variant="outline" size="sm">
                                Save
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-[#B9A9A9]">
                            Your API key is encrypted and stored securely.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
