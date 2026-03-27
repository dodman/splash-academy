"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { courses: number; enrollments: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    INSTRUCTOR: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
  };

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

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Courses</th>
              <th className="pb-3 font-medium">Enrolled</th>
              <th className="pb-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-3 font-medium">{user.name}</td>
                <td className="py-3 text-muted-foreground">{user.email}</td>
                <td className="py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role] || ""}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-3">{user._count.courses}</td>
                <td className="py-3">{user._count.enrollments}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
