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
  AlertCircle,
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
  const currentPlan = "pro" as keyof typeof planLimits;
  const maxWorkspaces = planLimits[currentPlan];
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

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "system" as "light" | "dark" | "system",
    colorScheme: "lifecharter" as "lifecharter" | "sacred" | "modern",
    fontSize: "medium" as "small" | "medium" | "large",
    compactMode: false
  });

  // Integration settings
  const [integrations] = useState({
    ghl: { connected: false, apiKey: "" },
    stripe: { connected: false, apiKey: "" },
    convertkit: { connected: false, apiKey: "" },
    calendly: { connected: false, apiKey: "" },
    openai: { connected: true, apiKey: "sk-••••••••••••••••••••" }
  });

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
          <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
            Full Name
          </label>
          <Input
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
            Email
          </label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
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
          <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
            Timezone
          </label>
          <select
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            className="w-full h-10 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B]/20 px-3 text-[#1F315B] dark:text-[#F6F1E8]"
          >
            <option value="America/Denver">Mountain Time (Denver)</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/New_York">Eastern Time</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
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
        <div className="p-4 bg-[#1F315B]/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
              Your Workspaces
            </h4>
            <span className="text-sm text-[#B9A9A9]">
              {workspaces.length} of {maxWorkspaces} used
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeWorkspaceId === ws.id
                    ? "border-[#D4AF63] bg-[#D4AF63]/10"
                    : "border-[#1F315B]/10 hover:border-[#D4AF63]/50"
                }`}
                onClick={() => setActiveWorkspaceId(ws.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF63]/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#D4AF63]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                      {ws.name}
                      {ws.isDefault && (
                        <span className="ml-2 text-xs bg-[#D4AF63]/20 text-[#D4AF63] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#B9A9A9]">/{ws.slug}</p>
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
        <div className="border-t border-[#1F315B]/10 pt-6">
          <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">
            Edit: {activeWorkspace.name}
          </h4>

          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-xl bg-[#D4AF63]/20 flex items-center justify-center">
              {activeWorkspace.logo ? (
                <img src={activeWorkspace.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-[#D4AF63]" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm">
                Upload Logo
              </Button>
              <p className="text-xs text-[#B9A9A9] mt-2">
                Recommended: 400x400px transparent PNG
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                Workspace Name
              </label>
              <Input
                value={activeWorkspace.name}
                onChange={(e) => updateWorkspace(activeWorkspace.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                URL Slug
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">
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
            <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              Description
            </label>
            <Textarea
              value={activeWorkspace.description}
              onChange={(e) => updateWorkspace(activeWorkspace.id, { description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              Website
            </label>
            <Input
              type="url"
              value={activeWorkspace.website}
              onChange={(e) => updateWorkspace(activeWorkspace.id, { website: e.target.value })}
            />
          </div>

          {/* Social Profiles */}
          <div className="mt-6 border-t border-[#1F315B]/10 pt-6">
            <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Social Profiles
            </h4>
            <p className="text-sm text-[#B9A9A9] mb-4">
              Connect your social media accounts for easy sharing and cross-posting
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.id}>
                  <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
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

          <div className="mt-6 border-t border-[#1F315B]/10 pt-6">
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
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4 flex items-center gap-2">
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
                className="w-4 h-4 rounded border-[#1F315B]/20 text-[#D4AF63] focus:ring-[#D4AF63]"
              />
              <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4 flex items-center gap-2">
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
              className="w-4 h-4 rounded border-[#1F315B]/20 text-[#D4AF63] focus:ring-[#D4AF63]"
            />
            <span className="text-[#1F315B] dark:text-[#F6F1E8]">Enable SMS notifications</span>
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
                  className="w-4 h-4 rounded border-[#1F315B]/20 text-[#D4AF63] focus:ring-[#D4AF63]"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">Monthly summary</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.sms.urgentAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    sms: { ...notifications.sms, urgentAlerts: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-[#1F315B]/20 text-[#D4AF63] focus:ring-[#D4AF63]"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">Urgent alerts only</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">Theme</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Sliders }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setAppearance({ ...appearance, theme: theme.id as "light" | "dark" | "system" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                appearance.theme === theme.id
                  ? "border-[#D4AF63] bg-[#D4AF63]/10"
                  : "border-[#1F315B]/10 hover:border-[#D4AF63]/50"
              }`}
            >
              <theme.icon className="w-6 h-6 mx-auto mb-2 text-[#1F315B] dark:text-[#F6F1E8]" />
              <span className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">Color Scheme</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "lifecharter", label: "LifeCharter", colors: "#1F315B, #D4AF63, #5E3B6C" },
            { id: "sacred", label: "Sacred", colors: "#5E3B6C, #D4AF63, #2E7C83" },
            { id: "modern", label: "Modern", colors: "#0F172A, #3B82F6, #10B981" }
          ].map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => setAppearance({ ...appearance, colorScheme: scheme.id as "lifecharter" | "sacred" | "modern" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                appearance.colorScheme === scheme.id
                  ? "border-[#D4AF63] bg-[#D4AF63]/10"
                  : "border-[#1F315B]/10 hover:border-[#D4AF63]/50"
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
              <span className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">{scheme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">Display</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#B9A9A9] mb-2">Font Size</label>
            <div className="flex gap-2">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  onClick={() => setAppearance({ ...appearance, fontSize: size as "small" | "medium" | "large" })}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    appearance.fontSize === size
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 text-[#1F315B] dark:text-[#F6F1E8]"
                      : "border-[#1F315B]/10 text-[#B9A9A9]"
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
              checked={appearance.compactMode}
              onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
              className="w-4 h-4 rounded border-[#1F315B]/20 text-[#D4AF63] focus:ring-[#D4AF63]"
            />
            <span className="text-[#1F315B] dark:text-[#F6F1E8]">Compact mode (less padding)</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-4">
      {[
        { id: "ghl", name: "GoHighLevel", description: "CRM, funnels, and automation", icon: "GHL" },
        { id: "stripe", name: "Stripe", description: "Payment processing", icon: "ST" },
        { id: "convertkit", name: "ConvertKit", description: "Email marketing", icon: "CK" },
        { id: "calendly", name: "Calendly", description: "Scheduling", icon: "CA" },
        { id: "openai", name: "OpenAI", description: "AI features and automation", icon: "AI" }
      ].map((integration) => {
        const status = integrations[integration.id as keyof typeof integrations];
        return (
          <Card key={integration.id} className={status.connected ? "border-green-500/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1F315B]/10 flex items-center justify-center font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                    {integration.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                      {integration.name}
                    </h4>
                    <p className="text-sm text-[#B9A9A9]">{integration.description}</p>
                    {status.connected && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={status.connected ? "outline" : "primary"}
                  size="sm"
                >
                  {status.connected ? "Manage" : "Connect"}
                </Button>
              </div>
              {status.connected && integration.id === "openai" && (
                <div className="mt-4 pt-4 border-t border-[#1F315B]/10">
                  <label className="block text-sm text-[#B9A9A9] mb-2">API Key</label>
                  <Input
                    type="password"
                    value={status.apiKey}
                    readOnly
                    className="bg-[#1F315B]/5"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#D4AF63]/20 to-[#5E3B6C]/20 border-[#D4AF63]/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#B9A9A9]">Current Plan</p>
              <h3 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                LifeCharter Pro
              </h3>
              <p className="text-sm text-[#B9A9A9] mt-1">
                $97/month • Renews Aug 15, 2026
              </p>
            </div>
            <Button variant="outline">Change Plan</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">Payment Method</h4>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-[#1F315B]/10 rounded flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#1F315B] dark:text-[#F6F1E8]" />
                </div>
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-sm text-[#B9A9A9]">Expires 12/27</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">Billing History</h4>
        <div className="space-y-2">
          {[
            { date: "Jul 15, 2026", amount: "$97.00", status: "Paid" },
            { date: "Jun 15, 2026", amount: "$97.00", status: "Paid" },
            { date: "May 15, 2026", amount: "$97.00", status: "Paid" }
          ].map((invoice, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-[#1F315B]/10"
            >
              <div>
                <p className="text-[#1F315B] dark:text-[#F6F1E8]">{invoice.date}</p>
                <p className="text-sm text-[#B9A9A9]">LifeCharter Pro</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{invoice.amount}</p>
                <span className="text-xs text-green-500">{invoice.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Change Password
        </h4>
        <div className="space-y-4">
          <Input type="password" placeholder="Current password" />
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm new password" />
          <Button>Update Password</Button>
        </div>
      </div>

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Two-Factor Authentication
        </h4>
        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                2FA Not Enabled
              </p>
              <p className="text-sm text-[#B9A9A9] mt-1">
                Add an extra layer of security to your account
              </p>
              <Button className="mt-3" size="sm">
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">
          Active Sessions
        </h4>
        <div className="space-y-3">
          {[
            { device: "Chrome on MacOS", location: "Denver, CO", current: true },
            { device: "Safari on iPhone", location: "Denver, CO", current: false }
          ].map((session, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-[#1F315B]/10"
            >
              <div>
                <p className="text-[#1F315B] dark:text-[#F6F1E8]">
                  {session.device}
                  {session.current && (
                    <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-sm text-[#B9A9A9]">{session.location}</p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-red-500">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">
          Export Your Data
        </h4>
        <p className="text-sm text-[#B9A9A9] mb-4">
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

      <div className="border-t border-[#1F315B]/10 pt-6">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-4">
          Danger Zone
        </h4>
        <div className="space-y-3">
          <Card className="border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-red-500">Delete Account</h5>
                  <p className="text-sm text-[#B9A9A9]">
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
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
          Settings
        </h1>
        <p className="text-[#B9A9A9]">
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
                        ? "bg-[#D4AF63]/10 text-[#D4AF63]"
                        : "text-[#1F315B] dark:text-[#F6F1E8] hover:bg-[#1F315B]/5"
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
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                  {settingsSections.find(s => s.id === activeTab)?.title}
                </h2>
                <p className="text-sm text-[#B9A9A9]">
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