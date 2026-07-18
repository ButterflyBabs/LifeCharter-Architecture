/**
 * Team Management Component
 * Manage team members with plan-based limits
 */

"use client";

import { useState } from "react";
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
  MoreHorizontal,
  Crown
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending" | "inactive";
  avatar?: string | null;
  joinedAt?: string;
}

interface TeamManagementProps {
  workspaceId: string;
  workspaceName: string;
}

// Plan-based team member limits
const planLimits = {
  starter: 2,      // Owner + 1 member
  pro: 5,          // Owner + 4 members
  enterprise: 10,  // Owner + 9 members
  unlimited: 999   // For future
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer"
};

const roleDescriptions = {
  owner: "Full access including billing and workspace deletion",
  admin: "Can manage team, settings, and all content",
  editor: "Can create and edit content, view analytics",
  viewer: "View-only access to reports and dashboards"
};

export function TeamManagement({ workspaceId, workspaceName }: TeamManagementProps) {
  // Demo: Pro plan (5 members)
  const currentPlan: keyof typeof planLimits = "pro";
  const maxMembers = planLimits[currentPlan];
  
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "AmiLynne Carroll",
      email: "babs@lifecharter.architecture",
      role: "owner",
      status: "active",
      joinedAt: "2024-01-15"
    }
  ]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    name: "",
    role: "editor" as TeamMember["role"]
  });
  const [inviteSent, setInviteSent] = useState(false);

  const activeMembers = members.filter(m => m.status === "active" || m.status === "pending");
  const canAddMore = activeMembers.length < maxMembers;

  const handleAddMember = () => {
    if (!newMember.email || !canAddMore) return;
    
    const member: TeamMember = {
      id: `member-${Date.now()}`,
      name: newMember.name || newMember.email.split("@")[0],
      email: newMember.email,
      role: newMember.role,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0]
    };
    
    setMembers([...members, member]);
    setNewMember({ email: "", name: "", role: "editor" });
    setIsAdding(false);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  const handleRemoveMember = (id: string) => {
    if (members.find(m => m.id === id)?.role === "owner") {
      alert("Cannot remove workspace owner");
      return;
    }
    setMembers(members.filter(m => m.id !== id));
  };

  const handleChangeRole = (id: string, newRole: TeamMember["role"]) => {
    if (members.find(m => m.id === id)?.role === "owner") {
      alert("Cannot change owner role");
      return;
    }
    setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const handleResendInvite = (id: string) => {
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
            Team Members
          </h3>
          <p className="text-sm text-[#B9A9A9]">
            {activeMembers.length} of {maxMembers} members used • {workspaceName}
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
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {inviteSent && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Invitation sent successfully</span>
        </div>
      )}

      {/* Add Member Form */}
      {isAdding && (
        <Card className="border-[#D4AF63]/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                Invite Team Member
              </h4>
              <button
                onClick={() => setIsAdding(false)}
                className="text-[#B9A9A9] hover:text-[#1F315B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
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
                <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
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
              <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["admin", "editor", "viewer"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewMember({ ...newMember, role })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      newMember.role === role
                        ? "border-[#D4AF63] bg-[#D4AF63]/10"
                        : "border-[#1F315B]/10 hover:border-[#D4AF63]/50"
                    }`}
                  >
                    <div className="font-medium text-[#1F315B] dark:text-[#F6F1E8] capitalize">
                      {roleLabels[role]}
                    </div>
                    <div className="text-xs text-[#B9A9A9] mt-1">
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
              <Button
                onClick={handleAddMember}
                disabled={!newMember.email}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <Card
            key={member.id}
            className={member.status === "pending" ? "border-yellow-500/30" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-[#D4AF63]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                        {member.name}
                      </span>
                      {member.role === "owner" && (
                        <Crown className="w-4 h-4 text-[#D4AF63]" />
                      )}
                      {member.status === "pending" && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#B9A9A9]">{member.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#B9A9A9] capitalize">
                        {roleLabels[member.role]}
                      </span>
                      {member.joinedAt && member.status === "active" && (
                        <span className="text-xs text-[#B9A9A9]">
                          Joined {member.joinedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.status === "pending" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvite(member.id)}
                    >
                      Resend Invite
                    </Button>
                  ) : (
                    member.role !== "owner" && (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as TeamMember["role"])}
                        className="text-sm rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B]/20 px-3 py-1.5 text-[#1F315B] dark:text-[#F6F1E8]"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )
                  )}
                  
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Permissions Info */}
      <div className="p-4 bg-[#1F315B]/5 rounded-lg">
        <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Role Permissions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="flex items-start gap-2">
              <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8] capitalize min-w-[60px]">
                {role}:
              </span>
              <span className="text-[#B9A9A9]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Info */}
      <div className="p-4 bg-[#D4AF63]/10 rounded-lg border border-[#D4AF63]/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </h4>
            <p className="text-sm text-[#B9A9A9]">
              {maxMembers} team members included
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
