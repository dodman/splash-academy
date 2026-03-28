"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
  _count: { courses: number; enrollments: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("all");

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    if (res.ok) fetchUsers();
  };

  const rejectUser = async (userId: string) => {
    if (!confirm("Reject and delete this user account?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchUsers();
  };

  const changeRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) fetchUsers();
  };

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    INSTRUCTOR: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  const pendingUsers = users.filter((u) => !u.approved);
  const displayUsers = filter === "pending" ? pendingUsers : users;

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p className="text-muted-foreground mt-1">{users.length} users total</p>

      {/* Pending notification */}
      {pendingUsers.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-yellow-800 font-medium">
              {pendingUsers.length} user{pendingUsers.length !== 1 ? "s" : ""} pending approval
            </span>
          </div>
          <button
            onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
            className="text-xs px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300 transition"
          >
            {filter === "pending" ? "Show All" : "Show Pending Only"}
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Courses</th>
              <th className="pb-3 font-medium">Enrolled</th>
              <th className="pb-3 font-medium">Joined</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayUsers.map((user) => (
              <tr key={user.id} className={!user.approved ? "bg-yellow-50/50" : ""}>
                <td className="py-3 font-medium">{user.name}</td>
                <td className="py-3 text-muted-foreground">{user.email}</td>
                <td className="py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${roleColors[user.role] || ""}`}
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="py-3">
                  {user.approved ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3">{user._count.courses}</td>
                <td className="py-3">{user._count.enrollments}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {!user.approved && (
                      <>
                        <button
                          onClick={() => approveUser(user.id)}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </>
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
