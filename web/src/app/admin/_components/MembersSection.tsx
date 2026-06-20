"use client";

import { useState } from "react";
import { useAdminUsers } from "@/app/admin/_components/AdminUsersContext";
import {
  AdminCard,
  AdminSelect,
  EmptyState,
  FieldLabel,
  SectionHeader,
} from "@/components/admin/ui";
import { BadgeManagementSection } from "../components/BadgeManagementSection";
import { UserStatsSection } from "../components/UserStatsSection";

export function MembersSection() {
  const { users, loading } = useAdminUsers();
  const [selectedUserId, setSelectedUserId] = useState("");

  return (
    <div className="space-y-4">
      <AdminCard>
        <SectionHeader
          title="Members"
          subtitle="Pick one person to manage badges and review activity in one place."
        />
        <label className="block max-w-md">
          <FieldLabel>Member</FieldLabel>
          <AdminSelect
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full"
          >
            <option value="" style={{ backgroundColor: "#0C0C10" }}>
              Select a member...
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id} style={{ backgroundColor: "#0C0C10" }}>
                {u.full_name || u.email}
                {u.region ? ` · ${u.region}` : ""}
              </option>
            ))}
          </AdminSelect>
        </label>
        {loading && users.length === 0 && (
          <div className="mt-4">
            <EmptyState message="Loading members..." />
          </div>
        )}
      </AdminCard>

      {selectedUserId && (
        <>
          <BadgeManagementSection userId={selectedUserId} />
          <UserStatsSection userId={selectedUserId} />
        </>
      )}
    </div>
  );
}
