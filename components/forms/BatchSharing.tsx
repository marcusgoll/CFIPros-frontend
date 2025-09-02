"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Plus, Trash2, Users, Mail, Shield } from "lucide-react";

interface Cohort {
  cohortId: string;
  name: string;
  description?: string;
  memberCount: number;
  permissions: string[];
  createdAt: string;
}

interface SharingSettings {
  isPublic: boolean;
  cohorts: Cohort[];
  pendingInvitations: {
    email: string;
    role: string;
    status: "pending" | "accepted" | "expired";
  }[];
}

interface BatchSharingProps {
  batchId: string;
  className?: string;
}

export function BatchSharing({ batchId, className }: BatchSharingProps) {
  const [settings, setSettings] = useState<SharingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCohort, setIsAddingCohort] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");

  const fetchSharingSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/batches/${batchId}/sharing`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sharing settings: ${response.status}`);
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sharing settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharingSettings();
  }, [batchId, fetchSharingSettings]);

  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) {
      return;
    }

    try {
      setIsAddingCohort(true);
      const response = await fetch(`/api/batches/${batchId}/sharing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_cohort",
          name: newCohortName,
          permissions: ["view", "download"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create cohort: ${response.status}`);
      }

      setNewCohortName("");
      await fetchSharingSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cohort");
    } finally {
      setIsAddingCohort(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${batchId}/sharing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "invite_user",
          emails: [inviteEmail],
          roles: [inviteRole],
          permissions: ["view", "download"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to invite user: ${response.status}`);
      }

      setInviteEmail("");
      await fetchSharingSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    }
  };

  const handleDeleteCohort = async (cohortId: string) => {
    try {
      const response = await fetch(
        `/api/batches/${batchId}/sharing?cohortId=${cohortId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete cohort: ${response.status}`);
      }

      await fetchSharingSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cohort");
    }
  };

  const togglePublicAccess = async () => {
    if (!settings) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${batchId}/sharing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle_public",
          isPublic: !settings.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update public access: ${response.status}`);
      }

      await fetchSharingSettings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update public access"
      );
    }
  };

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <div className="mb-4 flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error Loading Sharing Settings</span>
        </div>
        <p className="mb-4 text-gray-600">
          {error || "Failed to load sharing settings"}
        </p>
        <Button onClick={fetchSharingSettings} size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <h3 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
        <Users className="mr-2 h-5 w-5" />
        Sharing & Cohorts
      </h3>

      {/* Public Access Toggle */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Public Access</h4>
            <p className="text-sm text-gray-600">
              Anyone with the link can view this batch
            </p>
          </div>
          <Button
            variant={settings.isPublic ? "primary" : "outline"}
            size="sm"
            onClick={togglePublicAccess}
          >
            {settings.isPublic ? "Public" : "Private"}
          </Button>
        </div>
      </div>

      {/* Cohorts Section */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Cohorts</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingCohort(!isAddingCohort)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Cohort</span>
          </Button>
        </div>

        {/* Add Cohort Form */}
        {isAddingCohort && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="Cohort name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleCreateCohort}
                loading={isAddingCohort}
                size="sm"
              >
                Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingCohort(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Cohorts List */}
        {settings.cohorts.length > 0 ? (
          <div className="space-y-3">
            {settings.cohorts.map((cohort) => (
              <div
                key={cohort.cohortId}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{cohort.name}</h5>
                  {cohort.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {cohort.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {cohort.memberCount} members
                    </span>
                    <span className="flex items-center">
                      <Shield className="mr-1 h-4 w-4" />
                      {cohort.permissions.join(", ")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCohort(cohort.cohortId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No cohorts created yet</p>
        )}
      </div>

      {/* Invite Users Section */}
      <div>
        <h4 className="mb-4 font-medium text-gray-900">
          Invite Individual Users
        </h4>
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
          >
            <option value="student">Student</option>
            <option value="cfi">CFI</option>
            <option value="school_admin">School Admin</option>
          </select>
          <Button onClick={handleInviteUser} size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Invite
          </Button>
        </div>

        {/* Pending Invitations */}
        {settings.pendingInvitations.length > 0 && (
          <div>
            <h5 className="mb-2 text-sm font-medium text-gray-900">
              Pending Invitations
            </h5>
            <div className="space-y-2">
              {settings.pendingInvitations.map((invite, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {invite.email}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({invite.role})
                    </span>
                  </div>
                  <span className="text-xs capitalize text-yellow-600">
                    {invite.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
