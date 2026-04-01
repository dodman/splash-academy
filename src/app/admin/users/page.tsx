"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  appliedRole: string | null;
  createdAt: string;
  _count: { courses: number; enrollments: number };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "applications">("all");
  const myRole = session?.user?.role || "ADMIN";
  const isOA = myRole === "OVERALL_ADMIN";

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  };

  const refreshAndFetch = () => {
    fetchUsers();
    window.dispatchEvent(new Event("admin-notifications-refresh"));
  };

  useEffect(() => { fetchUsers(); }, []);

  const approveUser = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    refreshAndFetch();
  };

  const changeRole = async (userId: string, newRole: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    refreshAndFetch();
  };

  const approveRoleApplication = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, approved: true, clearApplication: true }),
    });
    refreshAndFetch();
  };

  const rejectRoleApplication = async (userId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearApplication: true }),
    });
    refreshAndFetch();
  };

  const resetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Reset password for ${userName} to "123456"?`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    if (res.ok) {
      alert(`Password for ${userName} has been reset to "123456"`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    refreshAndFetch();
  };

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    INSTRUCTOR: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
    OVERALL_ADMIN: "bg-amber-100 text-amber-700",
  };

  // Check if current user can manage a target user
  const canManage = (targetRole: string) => {
    if (targetRole === "OVERALL_ADMIN") return false;
    if (targetRole === "ADMIN" && !isOA) return false;
    return true;
  };

  const pendingUsers = users.filter((u) => !u.approved);
  const applicationUsers = users.filter((u) => u.appliedRole);
  const displayUsers = filter === "pending" ? pendingUsers : filter === "applications" ? applicationUsers : users;

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p className="text-muted-foreground mt-1">{users.length} users total</p>

      {/* Filter buttons */}
      <div className="mt-4 flex gap-2">
        <button onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
          All ({users.length})
        </button>
        {pendingUsers.length > 0 && (
          <button onClick={() => setFilter("pending")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === "pending" ? "bg-primary text-white" : "bg-yellow-100 text-yellow-700"}`}>
            Pending Approval ({pendingUsers.length})
          </button>
        )}
        {applicationUsers.length > 0 && (
          <button onClick={() => setFilter("applications")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === "applications" ? "bg-primary text-white" : "bg-purple-100 text-purple-700"}`}>
            Role Applications ({applicationUsers.length})
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Application</th>
              <th className="pb-3 font-medium">Joined</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayUsers.map((user) => (
              <tr key={user.id} className={!user.approved ? "bg-yellow-50/50" : user.appliedRole ? "bg-purple-50/50" : ""}>
                <td className="py-3 font-medium">{user.name}</td>
                <td className="py-3 text-muted-foreground">{user.email}</td>
                <td className="py-3">
                  {canManage(user.role) ? (
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${roleColors[user.role] || ""}`}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      {isOA && <option value="ADMIN">ADMIN</option>}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role] || ""}`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  {user.approved ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Approved</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                  )}
                </td>
                <td className="py-3">
                  {user.appliedRole ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Wants {user.appliedRole}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-2 flex-wrap">
                    {!user.approved && (
                      <button onClick={() => approveUser(user.id)}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition">
                        Approve
                      </button>
                    )}
                    {user.appliedRole && (
                      <>
                        <button onClick={() => approveRoleApplication(user.id, user.appliedRole!)}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                          Grant {user.appliedRole}
                        </button>
                        <button onClick={() => rejectRoleApplication(user.id)}
                          className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
                          Deny
                        </button>
                      </>
                    )}
                    {canManage(user.role) && (
                      <button onClick={() => resetPassword(user.id, user.name)}
                        className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition">
                        Reset PW
                      </button>
                    )}
                    {canManage(user.role) && (
                      <button onClick={() => deleteUser(user.id)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
