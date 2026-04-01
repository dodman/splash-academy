"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  careerGoal: string | null;
  appliedRole: string | null;
  createdAt: string;
}

const COUNTRIES = [
  // Africa (all 54 countries)
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo (Brazzaville)", "Congo (DRC)", "Côte d'Ivoire", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe",
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  // Rest of the world
  "Afghanistan", "Albania", "Argentina", "Australia", "Austria", "Bangladesh",
  "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Finland", "France", "Germany", "Greece",
  "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Malaysia", "Mexico", "Netherlands", "New Zealand",
  "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania",
  "Russia", "Saudi Arabia", "Singapore", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Venezuela", "Vietnam",
];

export default function ProfilePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [careerGoal, setCareerGoal] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Role application state
  const [applyingRole, setApplyingRole] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus !== "authenticated") return;

    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data);
          setName(data.name || "");
          setBio(data.bio || "");
          setDateOfBirth(data.dateOfBirth || "");
          setCountry(data.country || "");
          setCity(data.city || "");
          setPhone(data.phone || "");
          setAvatar(data.avatar || "");
          setCareerGoal(data.careerGoal || "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [sessionStatus, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, dateOfBirth, country, city, phone, avatar, careerGoal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
      } else {
        setProfile(data);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Something went wrong");
    }

    setSaving(false);
  };

  const applyForRole = async (role: string) => {
    setApplyingRole(true);
    setApplyMessage("");
    try {
      const res = await fetch("/api/apply-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyMessage(data.message);
        setProfile(prev => prev ? { ...prev, appliedRole: role } : null);
      } else {
        setApplyMessage(data.error || "Failed to apply");
      }
    } catch {
      setApplyMessage("Something went wrong");
    }
    setApplyingRole(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password");
      } else {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccess(""), 3000);
      }
    } catch {
      setPasswordError("Something went wrong");
    }

    setChangingPassword(false);
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name}</h1>
            <span className="text-sm text-muted-foreground">{profile?.email}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.role} &middot; Member since{" "}
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg">{success}</div>
          )}

          {/* Personal Information */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="+1 (555) 123-4567" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white">
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Your city" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none" placeholder="Tell us a bit about yourself..." />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/500 characters</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Career Goal</label>
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="e.g., Become a full-stack developer" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="https://example.com/avatar.jpg" />
              <p className="text-xs text-muted-foreground mt-1">Paste a URL to your profile photo</p>
            </div>
          </div>

          {/* Account */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={profile?.email || ""} disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Role</label>
              <input type="text" value={profile?.role || ""} disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed" />
            </div>
          </div>

          {/* Change Password */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            {passwordError && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg mb-4">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg mb-4">{passwordSuccess}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Repeat new password" />
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                className="w-full py-2.5 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>

          {/* Apply for Role */}
          {profile?.role === "STUDENT" && (
            <div className="border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-2">Apply for a Role</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Want to teach or help manage the platform? Apply below and an admin will review your request.
              </p>

              {profile.appliedRole ? (
                <div className="bg-yellow-50 text-yellow-800 text-sm px-4 py-3 rounded-lg">
                  Your application for <strong>{profile.appliedRole.toLowerCase()}</strong> is pending admin review.
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => applyForRole("INSTRUCTOR")}
                    disabled={applyingRole}
                    className="flex-1 py-2.5 border-2 border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition disabled:opacity-50"
                  >
                    Apply as Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => applyForRole("ADMIN")}
                    disabled={applyingRole}
                    className="flex-1 py-2.5 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Apply as Admin
                  </button>
                </div>
              )}

              {applyMessage && (
                <p className="text-sm mt-3 text-muted-foreground">{applyMessage}</p>
              )}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
