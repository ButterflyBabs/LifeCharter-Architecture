/**
 * Team Management Component
 * Manage team members with plan-based limits — persisted to the workspace.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  User,
  UserPlus,
  UserX,
  Mail,
  Shield,
  CheckCircle,
  X,
  Crown,
  Camera,
  Loader2,
} from "lucide-react";

type Role = "admin" | "editor" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "pending" | "inactive";
  avatar?: string | null;
  joinedAt?: string | null;
}

interface TeamManagementProps {
  workspaceId: string;
  workspaceName: string;
  onChangePlan?: () => void;
}

// Plan-based team member limits (owner counts toward the total).
const planLimits = {
  starter: 2,
  pro: 5,
  enterprise: 10,
  unlimited: 999,
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const roleDescriptions: Record<string, string> = {
  owner: "Full access including billing and workspace deletion",
  admin: "Can manage team, settings, and all content",
  editor: "Can create and edit content, view analytics",
  viewer: "View-only access to reports and dashboards",
};

export function TeamManagement({ workspaceId, workspaceName, onChangePlan }: TeamManagementProps) {
  const currentPlan: keyof typeof planLimits = "pro";
  const maxMembers = planLimits[currentPlan];

  // The workspace owner (the account holder) is rendered from the profile and
  // isn't a stored member row.
  const [owner, setOwner] = useState<{ name: string; avatar: string | null }>({
    name: "Owner",
    avatar: null,
  });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", name: "", role: "editor" as Role });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarTargetId = useRef<string | null>(null);

  // Load the owner (once) and this workspace's members (on workspace change).
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setOwner({ name: (d.fullName as string) || "Owner", avatar: d.avatarUrl || null });
      })
      .catch(() => {});
  }, []);

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await res.json().catch(() => ({}));
      setMembers(res.ok && Array.isArray(data.members) ? data.members : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const activeCount = members.length + 1; // + owner
  const canAddMore = activeCount < maxMembers;

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    if (ok) setTimeout(() => setMsg(null), 3000);
  };

  const handleAddMember = async () => {
    if (!newMember.email || !canAddMore || adding) return;
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.member) throw new Error(data?.error);
      setMembers((prev) => [...prev, data.member]);
      setNewMember({ email: "", name: "", role: "editor" });
      setIsAdding(false);
      flash(true, "Team member added.");
    } catch (e) {
      flash(false, (e as Error)?.message || "Couldn't add the member.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      flash(false, "Couldn't remove the member.");
    } finally {
      setBusyId(null);
    }
  };

  // Persist a single field on a member and reflect the server's response.
  const patchMember = async (id: string, patch: Partial<TeamMember>) => {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.member) throw new Error();
      setMembers((prev) => prev.map((m) => (m.id === id ? data.member : m)));
    } catch {
      flash(false, "Couldn't save the change.");
      // Reload to discard the optimistic edit.
      loadMembers();
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = (id: string, role: Role) => patchMember(id, { role });

  const handleNameBlur = (id: string, name: string) => {
    const member = members.find((m) => m.id === id);
    if (member && name.trim() && name.trim() !== member.name) {
      patchMember(id, { name: name.trim() });
    }
  };

  const openAvatarPicker = (id: string) => {
    avatarTargetId.current = id;
    avatarInputRef.current?.click();
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = avatarTargetId.current;
    if (!file || !id) return;
    setBusyId(id);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "members");
      const up = await fetch("/api/uploads/image", { method: "POST", body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData.url) throw new Error();
      await patchMember(id, { avatar: upData.url });
    } catch {
      flash(false, "Couldn't upload the photo.");
      setBusyId(null);
    } finally {
      avatarTargetId.current = null;
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden avatar picker shared by all member rows */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            Team Members
          </h3>
          <p className="text-sm text-[#b8a898]">
            {activeCount} of {maxMembers} members used • {workspaceName}
          </p>
        </div>
        {canAddMore ? (
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        ) : (
          <div className="text-right">
            <p className="text-sm text-yellow-600 mb-1">Team limit reached</p>
            <Button variant="outline" size="sm" onClick={onChangePlan}>
              Upgrade Plan
            </Button>
          </div>
        )}
      </div>

      {/* Status message */}
      {msg && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            msg.ok
              ? "bg-green-500/10 border border-green-500/20 text-green-600"
              : "bg-red-500/10 border border-red-500/20 text-red-600"
          }`}
        >
          {msg.ok ? <CheckCircle className="w-4 h-4" /> : null}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Add Member Form */}
      {isAdding && (
        <Card className="border-[#c9a227]/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                Invite Team Member
              </h4>
              <button
                onClick={() => setIsAdding(false)}
                className="text-[#b8a898] hover:text-[#1a2b4a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                  Full Name (optional)
                </label>
                <Input
                  placeholder="Jane Smith"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["admin", "editor", "viewer"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewMember({ ...newMember, role })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      newMember.role === role
                        ? "border-[#c9a227] bg-[#c9a227]/10"
                        : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] capitalize">
                      {roleLabels[role]}
                    </div>
                    <div className="text-xs text-[#b8a898] mt-1">
                      {roleDescriptions[role]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!newMember.email || adding}>
                <Mail className="w-4 h-4 mr-2" />
                {adding ? "Adding…" : "Send Invitation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {/* Owner (from the account profile) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center overflow-hidden">
                  {owner.avatar ? (
                    <img src={owner.avatar} alt={owner.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[#c9a227]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{owner.name}</span>
                    <Crown className="w-4 h-4 text-[#c9a227]" />
                  </div>
                  <span className="text-xs text-[#b8a898]">Owner</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <p className="text-sm text-[#b8a898] px-1">Loading team…</p>
        )}

        {!loading && members.length === 0 && (
          <p className="text-sm text-[#b8a898] px-1">
            No team members yet. Use “Add Member” to invite someone.
          </p>
        )}

        {members.map((member) => {
          const isBusy = busyId === member.id;
          return (
            <Card
              key={member.id}
              className={member.status === "pending" ? "border-yellow-500/30" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar with upload button */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center overflow-hidden">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[#c9a227]" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openAvatarPicker(member.id)}
                        disabled={isBusy}
                        title="Change photo"
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7b6b8d] text-white flex items-center justify-center hover:bg-[#6a5b7c] shadow-sm border border-white transition-colors"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          defaultValue={member.name}
                          onBlur={(e) => handleNameBlur(member.id, e.target.value)}
                          className="h-8 py-1 max-w-[200px]"
                        />
                        {member.status === "pending" && (
                          <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#b8a898] mt-1 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={member.role}
                      disabled={isBusy}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as Role)}
                      className="text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      disabled={isBusy}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Permissions Info */}
      <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Role Permissions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="flex items-start gap-2">
              <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] capitalize min-w-[60px]">
                {role}:
              </span>
              <span className="text-[#b8a898]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Info */}
      <div className="p-4 bg-[#c9a227]/10 rounded-lg border border-[#c9a227]/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </h4>
            <p className="text-sm text-[#b8a898]">
              {maxMembers} team members included
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onChangePlan}>
            Change Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
