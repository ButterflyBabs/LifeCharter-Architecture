/**
 * Settings Page
 * User preferences, workspace settings, integrations, and account management
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AvatarUpload } from "./components/AvatarUpload";
import { TeamManagement } from "./components/TeamManagement";
import { IntegrationsPanel } from "./components/IntegrationsPanel";
import BillingPanel from "./components/BillingPanel";
import SecurityPanel from "./components/SecurityPanel";
import { useTheme } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Save,
  CheckCircle,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Sliders,
  Database,
  ExternalLink,
  Trash2,
  Lock,
  FileText
} from "lucide-react";

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: "profile",
    title: "Profile",
    icon: <User className="w-5 h-5" />,
    description: "Your personal information and preferences"
  },
  {
    id: "workspace",
    title: "Workspace",
    icon: <Building2 className="w-5 h-5" />,
    description: "Business name, branding, and team settings"
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    description: "Email, SMS, and in-app notification preferences"
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: <Palette className="w-5 h-5" />,
    description: "Theme, colors, and display preferences"
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: <ExternalLink className="w-5 h-5" />,
    description: "Connect GoHighLevel, Stripe, email, and other tools"
  },
  {
    id: "billing",
    title: "Billing",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Subscription, payment methods, and invoices"
  },
  {
    id: "security",
    title: "Security",
    icon: <Shield className="w-5 h-5" />,
    description: "Password, 2FA, and access controls"
  },
  {
    id: "data",
    title: "Data & Privacy",
    icon: <Database className="w-5 h-5" />,
    description: "Export, backup, and privacy settings"
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string>("demo-user-123");
  const supabase = createClient();

  // Change-password state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleUpdatePassword = async () => {
    setPwMsg(null);
    if (pwNew.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    const email = profile.email;
    if (!email) {
      setPwMsg({ ok: false, text: "Couldn't determine your account email — try reloading." });
      return;
    }
    setPwSaving(true);
    // Verify the current password by re-authenticating before changing it.
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pwCurrent });
    if (signInErr) {
      setPwSaving(false);
      setPwMsg({ ok: false, text: "Current password is incorrect." });
      return;
    }
    const { error: updErr } = await supabase.auth.updateUser({ password: pwNew });
    setPwSaving(false);
    if (updErr) {
      setPwMsg({ ok: false, text: updErr.message });
      return;
    }
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwMsg({ ok: true, text: "Password updated." });
  };


  // Theme context for appearance settings
  const theme = useTheme();

  // Profile settings
  const [profile, setProfile] = useState({
    fullName: "AmiLynne Carroll",
    email: "babs@lifecharter.architecture",
    phone: "",
    timezone: "America/Denver",
    bio: "Alignment Architect | Founder of Sacred Kaleidoscope Community",
    avatar: null as string | null
  });


  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setProfile({
            fullName: profile.full_name || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            timezone: profile.timezone || "America/Denver",
            bio: profile.bio || "",
            avatar: profile.avatar_url || null
          });
        }
      }
    }
    loadProfile();
  }, []);

  // Social platform type
  type SocialPlatform = {
    id: string;
    name: string;
    placeholder: string;
    icon: string;
  };

  const socialPlatforms: SocialPlatform[] = [
    { id: "facebook", name: "Facebook Profile", placeholder: "https://facebook.com/yourname", icon: "📘" },
    { id: "facebook_page", name: "Facebook Page", placeholder: "https://facebook.com/yourpage", icon: "📄" },
    { id: "facebook_group", name: "Facebook Group", placeholder: "https://facebook.com/groups/yourgroup", icon: "👥" },
    { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/yourhandle", icon: "📸" },
    { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile", icon: "💼" },
    { id: "tiktok", name: "TikTok", placeholder: "https://tiktok.com/@yourhandle", icon: "🎵" },
    { id: "x", name: "X (Twitter)", placeholder: "https://x.com/yourhandle", icon: "🐦" },
    { id: "bluesky", name: "BlueSky", placeholder: "https://bsky.app/profile/yourhandle", icon: "🦋" },
    { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@yourchannel", icon: "▶️" },
    { id: "pinterest", name: "Pinterest", placeholder: "https://pinterest.com/yourhandle", icon: "📌" },
    { id: "threads", name: "Threads", placeholder: "https://threads.net/@yourhandle", icon: "🧵" }
  ];

  // Workspace settings
  const [workspaces, setWorkspaces] = useState([
    {
      id: "ws-1",
      name: "Sacred Kaleidoscope Community",
      slug: "sacred-kaleidoscope",
      description: "Spiritually grounded personal transformation ecosystem",
      website: "https://lifecharter.architecture",
      logo: null as string | null,
      isDefault: true,
      socials: {} as Record<string, string>
    }
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("ws-1");
  
  // Plan limits
  const planLimits = {
    starter: 1,
    pro: 3,
    enterprise: 5
  };
  const workspacePlan = "pro" as keyof typeof planLimits;
  const maxWorkspaces = planLimits[workspacePlan];
  const canCreateMore = workspaces.length < maxWorkspaces;

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: {
      weeklyDigest: true,
      monthlyReview: true,
      assessmentReminders: true,
      businessPlanUpdates: true,
      marketing: false
    },
    sms: {
      enabled: false,
      monthlySummary: false,
      urgentAlerts: true
    },
    inApp: {
      dailyTips: true,
      goalReminders: true,
      teamMentions: true
    }
  });

  // Integration settings - comprehensive tech stack for coaches and small business
  const [integrations, setIntegrations] = useState({
    // AI Providers
    openai: { connected: true, apiKey: "sk-••••••••••••••••••••" },
    anthropic: { connected: false, apiKey: "" },
    moonshot: { connected: false, apiKey: "" },
    
    // Business Foundation
    googleWorkspace: { connected: false, apiKey: "" },
    microsoft365: { connected: false, apiKey: "" },
    cloudflare: { connected: false, apiKey: "" },
    namecheap: { connected: false, apiKey: "" },
    zoom: { connected: false, apiKey: "" },
    openPhone: { connected: false, apiKey: "" },
    
    // CRM & Sales
    ghl: { connected: false, apiKey: "" },
    hubspot: { connected: false, apiKey: "" },
    salesforce: { connected: false, apiKey: "" },
    pipedrive: { connected: false, apiKey: "" },
    honeybook: { connected: false, apiKey: "" },
    dubsado: { connected: false, apiKey: "" },
    activecampaign: { connected: false, apiKey: "" },
    
    // Email Marketing
    convertkit: { connected: false, apiKey: "" },
    mailchimp: { connected: false, apiKey: "" },
    kit: { connected: false, apiKey: "" },
    mailerlite: { connected: false, apiKey: "" },
    beehiiv: { connected: false, apiKey: "" },
    
    // Scheduling
    calendly: { connected: false, apiKey: "" },
    acuity: { connected: false, apiKey: "" },
    savvycal: { connected: false, apiKey: "" },
    calcom: { connected: false, apiKey: "" },
    
    // Website & Landing Pages
    wordpress: { connected: false, apiKey: "" },
    squarespace: { connected: false, apiKey: "" },
    webflow: { connected: false, apiKey: "" },
    kajabi: { connected: false, apiKey: "" },
    leadpages: { connected: false, apiKey: "" },
    clickfunnels: { connected: false, apiKey: "" },
    systeme: { connected: false, apiKey: "" },
    
    // Forms & Assessments
    typeform: { connected: false, apiKey: "" },
    jotform: { connected: false, apiKey: "" },
    tally: { connected: false, apiKey: "" },
    scoreapp: { connected: false, apiKey: "" },
    interact: { connected: false, apiKey: "" },
    
    // Payments & Finance
    stripe: { connected: false, apiKey: "" },
    paypal: { connected: false, apiKey: "" },
    quickbooks: { connected: false, apiKey: "" },
    xero: { connected: false, apiKey: "" },
    wise: { connected: false, apiKey: "" },
    thrivecart: { connected: false, apiKey: "" },
    
    // Contracts & Proposals
    pandadoc: { connected: false, apiKey: "" },
    docusign: { connected: false, apiKey: "" },
    betterproposals: { connected: false, apiKey: "" },
    proposify: { connected: false, apiKey: "" },
    
    // Course & Membership
    teachable: { connected: false, apiKey: "" },
    thinkific: { connected: false, apiKey: "" },
    skool: { connected: false, apiKey: "" },
    circle: { connected: false, apiKey: "" },
    memberful: { connected: false, apiKey: "" },
    
    // Video & Content
    loom: { connected: false, apiKey: "" },
    wistia: { connected: false, apiKey: "" },
    vimeo: { connected: false, apiKey: "" },
    youtube: { connected: false, apiKey: "" },
    descript: { connected: false, apiKey: "" },
    
    // Call Recording & Analysis
    fathom: { connected: false, apiKey: "" },
    fireflies: { connected: false, apiKey: "" },
    otter: { connected: false, apiKey: "" },
    grain: { connected: false, apiKey: "" },
    gong: { connected: false, apiKey: "" },
    avoma: { connected: false, apiKey: "" },
    
    // Testimonials
    senja: { connected: false, apiKey: "" },
    vocalvideo: { connected: false, apiKey: "" },
    trustpilot: { connected: false, apiKey: "" },
    googleBusiness: { connected: false, apiKey: "" },
    
    // Affiliate & Referrals
    rewardful: { connected: false, apiKey: "" },
    firstpromoter: { connected: false, apiKey: "" },
    referralcandy: { connected: false, apiKey: "" },
    tapfiliate: { connected: false, apiKey: "" },
    
    // Messaging
    telegram: { connected: false, apiKey: "", botToken: "" },
    whatsapp: { connected: false, apiKey: "" },
    slack: { connected: false, apiKey: "" },
    discord: { connected: false, apiKey: "" },
    twilio: { connected: false, apiKey: "" },
    
    // Social Media
    facebook: { connected: false, apiKey: "" },
    instagram: { connected: false, apiKey: "" },
    linkedin: { connected: false, apiKey: "" },
    twitter: { connected: false, apiKey: "" },
    tiktok: { connected: false, apiKey: "" },
    pinterest: { connected: false, apiKey: "" },
    threads: { connected: false, apiKey: "" },
    bluesky: { connected: false, apiKey: "" },
    
    // Storage & Productivity
    googleDrive: { connected: false, apiKey: "" },
    dropbox: { connected: false, apiKey: "" },
    oneDrive: { connected: false, apiKey: "" },
    notion: { connected: false, apiKey: "" },
    airtable: { connected: false, apiKey: "" },
    asana: { connected: false, apiKey: "" },
    trello: { connected: false, apiKey: "" },
    monday: { connected: false, apiKey: "" },
    clickup: { connected: false, apiKey: "" }
  });

  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <AvatarUpload
        currentAvatar={profile.avatar}
        onAvatarChange={(url) => setProfile({ ...profile, avatar: url })}
        userId={userId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Full Name
          </label>
          <Input
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Email
          </label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Phone
          </label>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Timezone
          </label>
          <select
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            className="w-full h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-[#1a2b4a] dark:text-[#F8F5F0]"
          >
            <option value="America/Denver">Mountain Time (Denver)</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/New_York">Eastern Time</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
          Bio
        </label>
        <Textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );

  const renderWorkspaceSettings = () => {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
    
    const handleCreateWorkspace = () => {
      if (!canCreateMore) return;
      const newId = `ws-${workspaces.length + 1}`;
      const newWorkspace = {
        id: newId,
        name: `New Workspace ${workspaces.length + 1}`,
        slug: `workspace-${workspaces.length + 1}`,
        description: "",
        website: "",
        logo: null as string | null,
        isDefault: false,
        socials: {} as Record<string, string>
      };
      setWorkspaces([...workspaces, newWorkspace]);
      setActiveWorkspaceId(newId);
    };

    const handleDeleteWorkspace = (id: string) => {
      if (workspaces.length <= 1) {
        alert("You must have at least one workspace");
        return;
      }
      const updated = workspaces.filter(w => w.id !== id);
      setWorkspaces(updated);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(updated[0].id);
      }
    };

    const updateWorkspace = (id: string, updates: Partial<typeof workspaces[0]>) => {
      setWorkspaces(workspaces.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    return (
      <div className="space-y-6">
        {/* Workspace Selector */}
        <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
              Your Workspaces
            </h4>
            <span className="text-sm text-[#b8a898]">
              {workspaces.length} of {maxWorkspaces} used
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeWorkspaceId === ws.id
                    ? "border-[#c9a227] bg-[#c9a227]/10"
                    : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                }`}
                onClick={() => setActiveWorkspaceId(ws.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9a227]/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#c9a227]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {ws.name}
                      {ws.isDefault && (
                        <span className="ml-2 text-xs bg-[#c9a227]/20 text-[#c9a227] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#b8a898]">/{ws.slug}</p>
                  </div>
                </div>
                {workspaces.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkspace(ws.id);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>

          {canCreateMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateWorkspace}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Create New Workspace
            </Button>
          ) : (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-600">
                Workspace limit reached. Upgrade your plan to create more workspaces.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Upgrade Plan
              </Button>
            </div>
          )}
        </div>

        {/* Active Workspace Settings */}
        <div className="border-t border-[#1a2b4a]/10 pt-6">
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
            Edit: {activeWorkspace.name}
          </h4>

          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-xl bg-[#c9a227]/20 flex items-center justify-center">
              {activeWorkspace.logo ? (
                <img src={activeWorkspace.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-[#c9a227]" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm">
                Upload Logo
              </Button>
              <p className="text-xs text-[#b8a898] mt-2">
                Recommended: 400x400px transparent PNG
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Workspace Name
              </label>
              <Input
                value={activeWorkspace.name}
                onChange={(e) => updateWorkspace(activeWorkspace.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                URL Slug
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8a898]">
                  lifecharter.architecture/
                </span>
                <Input
                  value={activeWorkspace.slug}
                  onChange={(e) => updateWorkspace(activeWorkspace.id, { slug: e.target.value })}
                  className="pl-44"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Description
            </label>
            <Textarea
              value={activeWorkspace.description}
              onChange={(e) => updateWorkspace(activeWorkspace.id, { description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Website
            </label>
            <Input
              type="url"
              value={activeWorkspace.website}
              onChange={(e) => updateWorkspace(activeWorkspace.id, { website: e.target.value })}
            />
          </div>

          {/* Social Profiles */}
          <div className="mt-6 border-t border-[#1a2b4a]/10 pt-6">
            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Social Profiles
            </h4>
            <p className="text-sm text-[#b8a898] mb-4">
              Connect your social media accounts for easy sharing and cross-posting
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.id}>
                  <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                    <span className="mr-2">{platform.icon}</span>
                    {platform.name}
                  </label>
                  <Input
                    type="url"
                    placeholder={platform.placeholder}
                    value={activeWorkspace.socials?.[platform.id] || ""}
                    onChange={(e) => {
                      const newSocials = { ...activeWorkspace.socials, [platform.id]: e.target.value };
                      updateWorkspace(activeWorkspace.id, { socials: newSocials });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#1a2b4a]/10 pt-6">
            <TeamManagement
              workspaceId={activeWorkspace.id}
              workspaceName={activeWorkspace.name}
            />
          </div>

          {!activeWorkspace.isDefault && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkspaces(workspaces.map(w => ({ ...w, isDefault: w.id === activeWorkspace.id })));
                }}
              >
                Set as Default Workspace
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Notifications
        </h4>
        <div className="space-y-3">
          {Object.entries(notifications.email).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setNotifications({
                  ...notifications,
                  email: { ...notifications.email, [key]: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#1a2b4a]/20 text-[#c9a227] focus:ring-[#c9a227]"
              />
              <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1a2b4a]/10 pt-6">
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          SMS Notifications
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.sms.enabled}
              onChange={(e) => setNotifications({
                ...notifications,
                sms: { ...notifications.sms, enabled: e.target.checked }
              })}
              className="w-4 h-4 rounded border-[#1a2b4a]/20 text-[#c9a227] focus:ring-[#c9a227]"
            />
            <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Enable SMS notifications</span>
          </label>
          {notifications.sms.enabled && (
            <div className="ml-7 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.sms.monthlySummary}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, monthlySummary: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-[#1a2b4a]/20 text-[#c9a227] focus:ring-[#c9a227]"
                />
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Monthly summary</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.sms.urgentAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, urgentAlerts: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-[#1a2b4a]/20 text-[#c9a227] focus:ring-[#c9a227]"
                />
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Urgent alerts only</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => {
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">Theme</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Sliders }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => theme.setTheme(t.id as "light" | "dark" | "system")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme.theme === t.id
                    ? "border-[#c9a227] bg-[#c9a227]/10"
                    : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                }`}
              >
                <t.icon className="w-6 h-6 mx-auto mb-2 text-[#1a2b4a] dark:text-[#F8F5F0]" />
                <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#1a2b4a]/10 pt-6">
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">Color Scheme</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "lifecharter", label: "LifeCharter", colors: "#1a2b4a, #c9a227, #7b6b8d" },
              { id: "sacred", label: "Sacred", colors: "#7b6b8d, #c9a227, #4a9b9b" },
              { id: "modern", label: "Modern", colors: "#0F172A, #3B82F6, #10B981" }
            ].map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => theme.setColorScheme(scheme.id as "lifecharter" | "sacred" | "modern")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme.colorScheme === scheme.id
                    ? "border-[#c9a227] bg-[#c9a227]/10"
                    : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                }`}
              >
                <div className="flex justify-center gap-1 mb-2">
                  {scheme.colors.split(", ").map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{scheme.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#1a2b4a]/10 pt-6">
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">Display</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#b8a898] mb-2">Font Size</label>
              <div className="flex gap-2">
                {["small", "medium", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => theme.setFontSize(size as "small" | "medium" | "large")}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      theme.fontSize === size
                        ? "border-[#c9a227] bg-[#c9a227]/10 text-[#1a2b4a] dark:text-[#F8F5F0]"
                        : "border-[#1a2b4a]/10 text-[#b8a898]"
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={theme.compactMode}
                onChange={(e) => theme.setCompactMode(e.target.checked)}
                className="w-4 h-4 rounded border-[#1a2b4a]/20 text-[#c9a227] focus:ring-[#c9a227]"
              />
              <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Compact mode (less padding)</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderIntegrationSettings = () => {
    // Get user's current plan - in production this would come from subscription data
    const currentPlanId = "growth"; // starter, growth, or vip
    const connectedCount = 0; // This would be calculated from actual connected integrations
    
    return (
      <IntegrationsPanel 
        planId={currentPlanId}
        currentIntegrationCount={connectedCount}
      />
    );
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const _oldIntegrationCode = () => {
    const integrationCategories = [
      {
        title: "AI Providers",
        items: [
          { id: "openai", name: "OpenAI", description: "GPT-4, GPT-3.5, DALL-E", icon: "🤖", color: "#10A37F" },
          { id: "anthropic", name: "Anthropic", description: "Claude AI models", icon: "🧠", color: "#D4A574" },
          { id: "moonshot", name: "Moonshot AI", description: "Kimi K2.5 and other models", icon: "🌙", color: "#1a2b4a" }
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
        title: "Scheduling & Appointments",
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
        title: "Messaging & Communication",
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

    const toggleConnection = (id: string) => {
      setIntegrations(prev => ({
        ...prev,
        [id]: { ...prev[id as keyof typeof prev], connected: !prev[id as keyof typeof prev].connected }
      }));
    };

    const updateApiKey = (id: string, value: string) => {
      setIntegrations(prev => ({
        ...prev,
        [id]: { ...prev[id as keyof typeof prev], apiKey: value }
      }));
    };

    return (
      <div className="space-y-8">
        {integrationCategories.map((category) => (
          <div key={category.title}>
            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
              {category.title}
            </h4>
            <div className="space-y-3">
              {category.items.map((integration) => {
                const status = integrations[integration.id as keyof typeof integrations];
                const isExpanded = showApiKey[integration.id];
                
                return (
                  <Card key={integration.id} className={status.connected ? "border-green-500/30" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${integration.color}20` }}
                          >
                            {integration.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                              {integration.name}
                            </h4>
                            <p className="text-sm text-[#b8a898]">{integration.description}</p>
                            {status.connected && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-1">
                                <CheckCircle className="w-3 h-3" />
                                Connected
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {status.connected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowApiKey({ ...showApiKey, [integration.id]: !isExpanded })}
                            >
                              {isExpanded ? "Hide" : "Settings"}
                            </Button>
                          )}
                          <Button
                            variant={status.connected ? "outline" : "primary"}
                            size="sm"
                            onClick={() => toggleConnection(integration.id)}
                          >
                            {status.connected ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expandable API Key Section */}
                      {status.connected && isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#1a2b4a]/10 space-y-3">
                          <div>
                            <label className="block text-sm text-[#b8a898] mb-2">
                              API Key / Token
                            </label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                placeholder="Enter your API key"
                                value={status.apiKey}
                                onChange={(e) => updateApiKey(integration.id, e.target.value)}
                                className="flex-1"
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {/* Save API key */}}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                          
                          {integration.id === "telegram" && (
                            <div>
                              <label className="block text-sm text-[#b8a898] mb-2">
                                Bot Token
                              </label>
                              <Input
                                type="password"
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                value={(status as { botToken?: string }).botToken || ""}
                                onChange={(e) => setIntegrations(prev => ({
                                  ...prev,
                                  telegram: { ...prev.telegram, botToken: e.target.value }
                                }))}
                              />
                            </div>
                          )}
                          
                          <p className="text-xs text-[#b8a898]">
                            Your API key is encrypted and stored securely.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };


  const renderBillingSettings = () => <BillingPanel />;

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Change Password
        </h4>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Current password"
            autoComplete="current-password"
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
          />
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</p>
          )}
          <Button
            onClick={handleUpdatePassword}
            disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
          >
            {pwSaving ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </div>

      <SecurityPanel />
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
          Export Your Data
        </h4>
        <p className="text-sm text-[#b8a898] mb-4">
          Download all your assessments, business plan, and account data
        </p>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Database className="w-4 h-4 mr-2" />
            Export All Data (JSON)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Export Business Plan (PDF)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Globe className="w-4 h-4 mr-2" />
            Export Assessment Results (CSV)
          </Button>
        </div>
      </div>

      <div className="border-t border-[#1a2b4a]/10 pt-6">
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
          Danger Zone
        </h4>
        <div className="space-y-3">
          <Card className="border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-red-500">Delete Account</h5>
                  <p className="text-sm text-[#b8a898]">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="outline" className="text-red-500 border-red-500/30">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileSettings();
      case "workspace": return renderWorkspaceSettings();
      case "notifications": return renderNotificationSettings();
      case "appearance": return renderAppearanceSettings();
      case "integrations": return renderIntegrationSettings();
      case "billing": return renderBillingSettings();
      case "security": return renderSecuritySettings();
      case "data": return renderDataSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
          Settings
        </h1>
        <p className="text-[#b8a898]">
          Manage your account, workspace, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === section.id
                        ? "bg-[#c9a227]/10 text-[#c9a227]"
                        : "text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {settingsSections.find(s => s.id === activeTab)?.title}
                </h2>
                <p className="text-sm text-[#b8a898]">
                  {settingsSections.find(s => s.id === activeTab)?.description}
                </p>
              </div>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {renderContent()}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}