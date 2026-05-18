"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import {
  getFirestoreUser,
  updateFirestoreUser,
  subscribeToInvites,
  respondToFirestoreInvite,
  subscribeToNotifications,
  markFirestoreNotificationRead,
  type FirestoreUser,
  type FirestoreInvite,
  type FirestoreNotification,
} from "@/lib/firestoreService";
import { firebaseLogout } from "@/lib/firebaseAuth";

const COURSES = [
  "Animation",
  "Architecture",
  "Creative Computing",
  "Fashion Design",
  "Film & TV Production",
  "Fine Art",
  "Games Design",
  "Graphic Design",
  "Illustration",
  "Interior Design",
  "Music",
  "Photography",
  "Product Design",
  "UI/UX Design",
];

const SKILLS_LIST = [
  "Animation",
  "After Effects",
  "Blender",
  "C++",
  "Character Design",
  "Cinema 4D",
  "Creative Writing",
  "CSS",
  "Figma",
  "Film Editing",
  "Game Development",
  "Graphic Design",
  "HTML",
  "Illustration",
  "JavaScript",
  "Motion Graphics",
  "Photography",
  "Premiere Pro",
  "Python",
  "React",
  "Storyboarding",
  "Three.js",
  "TypeScript",
  "UI/UX Design",
  "Unity",
  "Unreal Engine",
  "Video Production",
  "WebGL",
  "XR/AR/VR",
];

const AVATAR_COLORS = [
  "#6C47FF",
  "#FF6B6B",
  "#F59E0B",
  "#22C55E",
  "#0EA5E9",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">(
    "profile",
  );
  const [invites, setInvites] = useState<FirestoreInvite[]>([]);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>(
    [],
  );
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    campus: "",
    course: "",
    yearOfStudy: "",
    portfolioUrl: "",
    githubUrl: "",
    behanceUrl: "",
    interests: "",
    available: true,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get("tab") === "notifications") {
      setActiveTab("notifications");
    }
  }, [searchParams]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/sign-up-login-screen");
        return;
      }
      setCurrentUid(firebaseUser.uid);
      const profile = await getFirestoreUser(firebaseUser.uid);
      if (profile) {
        setUser(profile);
        setForm({
          fullName: profile.fullName || "",
          bio: profile.bio || "",
          campus: profile.campus || "",
          course: profile.course || "",
          yearOfStudy: profile.yearOfStudy || "",
          portfolioUrl: profile.portfolioUrl || "",
          githubUrl: profile.githubUrl || "",
          behanceUrl: profile.behanceUrl || "",
          interests: (profile.interests || []).join(", "),
          available: profile.available ?? true,
        });
        setSelectedSkills(profile.skills || []);
      }
    });
    return () => unsub();
  }, [router]);

  // Subscribe to invites in real-time
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToInvites(currentUid, (fetchedInvites) => {
      setInvites(
        fetchedInvites.sort((a, b) => {
          const aTime =
            (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ||
            0;
          const bTime =
            (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() ||
            0;
          return bTime - aTime;
        }),
      );
    });
    return () => unsub();
  }, [currentUid]);

  // Subscribe to all app notifications in real-time.
  // This is what shows who messaged you inside the app, not only Mac notification.
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToNotifications(currentUid, (items) => {
      setNotifications(items);
    });
    return () => unsub();
  }, [currentUid]);

  const handleSave = async () => {
    if (!user || !currentUid) return;
    try {
      const updates: Partial<FirestoreUser> = {
        fullName: form.fullName.trim() || user.fullName,
        bio: form.bio,
        campus: form.campus,
        course: form.course,
        yearOfStudy: form.yearOfStudy,
        portfolioUrl: form.portfolioUrl,
        githubUrl: form.githubUrl,
        behanceUrl: form.behanceUrl,
        interests: form.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        available: form.available,
        skills: selectedSkills,
      };
      await updateFirestoreUser(currentUid, updates);
      setUser({ ...user, ...updates });
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch {
      /* ignore */
    }
    router.push("/sign-up-login-screen");
  };

  const handleInviteResponse = async (
    invite: FirestoreInvite,
    response: "accepted" | "declined",
  ) => {
    if (!currentUid) return;
    setRespondingId(invite.id);
    try {
      await respondToFirestoreInvite(
        invite.id,
        response,
        invite.projectId,
        currentUid,
      );
      toast.success(
        response === "accepted"
          ? "You joined the project!"
          : "Invitation declined.",
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const pendingInviteCount = invites.filter(
    (i) => i.status === "pending",
  ).length;
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;
  const totalNotificationCount = pendingInviteCount + unreadNotificationCount;

  const notificationIcon = (type: FirestoreNotification["type"]) => {
    if (type === "direct-message") return "💬";
    if (type === "group-message") return "👥";
    if (type === "task") return "✅";
    if (type === "file") return "📎";
    if (type === "invite") return "🤝";
    return "🔔";
  };

  const handleOpenNotification = async (item: FirestoreNotification) => {
    if (!item.read) {
      await markFirestoreNotificationRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-[#6C47FF] border-t-transparent animate-spin" />
      </div>
    );

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const colorIndex = currentUid
    ? currentUid.charCodeAt(0) % AVATAR_COLORS.length
    : 0;
  const avatarColor = user.avatarColor || AVATAR_COLORS[colorIndex];

  return (
    <AppLayout currentPath="/profile">
      <Toaster position="bottom-right" richColors />
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A1730" }}>
              My Profile
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#8B87A0" }}>
              Manage your account and notifications
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:bg-red-50 hover:border-red-200"
            style={{ borderColor: "#E8E6F0", color: "#EF4444" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Avatar + name card */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div
            className="avatar w-16 h-16 text-xl flex-shrink-0"
            style={{ background: avatarColor }}
          >
            <span>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: "#1A1730" }}
            >
              {user.fullName}
            </h2>
            <p className="text-sm" style={{ color: "#8B87A0" }}>
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`badge ${user.role === "teacher" ? "badge-coral" : "badge-violet"}`}
              >
                {user.role === "teacher" ? "👩‍🏫 Teacher" : "🎓 Student"}
              </span>
              <span
                className="badge"
                style={{ background: "#F0ECFF", color: "#6C47FF" }}
              >
                {user.campus}
              </span>
              {user.available && (
                <span className="badge badge-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "#F0ECFF" }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === "profile" ? "bg-white text-[#6C47FF] shadow-sm" : "text-[#8B87A0] hover:text-[#4A4665]"}`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 relative ${activeTab === "notifications" ? "bg-white text-[#6C47FF] shadow-sm" : "text-[#8B87A0] hover:text-[#4A4665]"}`}
          >
            Notifications
            {totalNotificationCount > 0 && (
              <span
                className="absolute top-1.5 right-4 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white font-bold"
                style={{ background: "#EF4444", fontSize: "9px" }}
              >
                {totalNotificationCount}
              </span>
            )}
          </button>
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "#1A1730" }}>
                Profile Information
              </h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn-secondary py-2 px-4 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Full Name
                </label>
                {editing ? (
                  <input
                    className="input-field"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm py-2" style={{ color: "#1A1730" }}>
                    {user.fullName}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Email
                </label>
                <p className="text-sm py-2" style={{ color: "#8B87A0" }}>
                  {user.email}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Role
                </label>
                <p
                  className="text-sm py-2 capitalize"
                  style={{ color: "#1A1730" }}
                >
                  {user.role}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Campus
                </label>
                {editing ? (
                  <select
                    className="input-field"
                    value={form.campus}
                    onChange={(e) =>
                      setForm({ ...form, campus: e.target.value })
                    }
                  >
                    {["Farnham", "Epsom", "Canterbury", "Rochester"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <p className="text-sm py-2" style={{ color: "#1A1730" }}>
                    {user.campus}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Course
                </label>
                {editing ? (
                  <select
                    className="input-field"
                    value={form.course}
                    onChange={(e) =>
                      setForm({ ...form, course: e.target.value })
                    }
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm py-2" style={{ color: "#1A1730" }}>
                    {user.course || "—"}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Year of Study
                </label>
                {editing ? (
                  <input
                    className="input-field"
                    placeholder="e.g. Year 3"
                    value={form.yearOfStudy}
                    onChange={(e) =>
                      setForm({ ...form, yearOfStudy: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm py-2" style={{ color: "#1A1730" }}>
                    {user.yearOfStudy || "—"}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Bio
                </label>
                {editing ? (
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Tell others about yourself…"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2" style={{ color: "#1A1730" }}>
                    {user.bio || "—"}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Skills
                </label>
                {editing ? (
                  <div
                    className="flex flex-wrap gap-2 p-3 rounded-xl border max-h-[180px] overflow-y-auto"
                    style={{ borderColor: "#E8E6F0" }}
                  >
                    {SKILLS_LIST.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`skill-chip ${selectedSkills.includes(skill) ? "selected" : ""}`}
                      >
                        {selectedSkills.includes(skill) && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        {skill}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {(user.skills || []).length > 0 ? (
                      user.skills.map((s) => (
                        <span key={s} className="badge badge-violet">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: "#8B87A0" }}>
                        No skills added yet
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Interests{" "}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "#8B87A0" }}
                  >
                    (comma-separated)
                  </span>
                </label>
                {editing ? (
                  <input
                    className="input-field"
                    placeholder="e.g. AR/XR, Generative Art"
                    value={form.interests}
                    onChange={(e) =>
                      setForm({ ...form, interests: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {(user.interests || []).length > 0 ? (
                      user.interests!.map((i) => (
                        <span
                          key={i}
                          className="badge"
                          style={{ background: "#F0FDF4", color: "#16A34A" }}
                        >
                          {i}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: "#8B87A0" }}>
                        No interests added yet
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  Portfolio URL
                </label>
                {editing ? (
                  <input
                    className="input-field"
                    type="url"
                    placeholder="https://behance.net/yourname"
                    value={form.portfolioUrl}
                    onChange={(e) =>
                      setForm({ ...form, portfolioUrl: e.target.value })
                    }
                  />
                ) : user.portfolioUrl ? (
                  <a
                    href={user.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm py-2 hover:underline"
                    style={{ color: "#6C47FF" }}
                  >
                    {user.portfolioUrl}
                  </a>
                ) : (
                  <p className="text-sm py-2" style={{ color: "#8B87A0" }}>
                    —
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#4A4665" }}
                >
                  GitHub URL
                </label>
                {editing ? (
                  <input
                    className="input-field"
                    type="url"
                    placeholder="https://github.com/yourhandle"
                    value={form.githubUrl}
                    onChange={(e) =>
                      setForm({ ...form, githubUrl: e.target.value })
                    }
                  />
                ) : user.githubUrl ? (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm py-2 hover:underline"
                    style={{ color: "#6C47FF" }}
                  >
                    {user.githubUrl}
                  </a>
                ) : (
                  <p className="text-sm py-2" style={{ color: "#8B87A0" }}>
                    —
                  </p>
                )}
              </div>

              {editing && (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ borderColor: "#E8E6F0", background: "#FAFAF8" }}
                >
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#1A1730" }}
                    >
                      Available for collaboration
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B87A0" }}>
                      Show as available in the Collaboration Finder
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.available}
                      onChange={(e) =>
                        setForm({ ...form, available: e.target.checked })
                      }
                    />
                    <div
                      className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{
                        background: form.available ? "#6C47FF" : "#D1D5DB",
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <div className="card p-6">
            <h3
              className="text-base font-bold mb-5"
              style={{ color: "#1A1730" }}
            >
              Notifications
              {totalNotificationCount > 0 && (
                <span
                  className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}
                >
                  {totalNotificationCount} new
                </span>
              )}
            </h3>

            {notifications.length === 0 && invites.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-sm font-medium" style={{ color: "#4A4665" }}>
                  No notifications yet
                </p>
                <p className="text-xs mt-1" style={{ color: "#8B87A0" }}>
                  Messages, files, tasks and project invitations will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((item) => {
                  const itemDate = (
                    item.createdAt as { toDate?: () => Date }
                  )?.toDate?.();
                  const isUnread = !item.read;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border transition-all"
                      style={{
                        borderColor: isUnread ? "#6C47FF" : "#E8E6F0",
                        background: isUnread ? "#F8F7FF" : "white",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: "#F0ECFF" }}
                          >
                            {notificationIcon(item.type)}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "#1A1730" }}
                            >
                              {item.title}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#4A4665" }}
                            >
                              {item.body}
                            </p>
                            <p
                              className="text-[11px] mt-1"
                              style={{ color: "#8B87A0" }}
                            >
                              {item.fromUserName
                                ? `From ${item.fromUserName} • `
                                : ""}
                              {itemDate
                                ? itemDate.toLocaleString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isUnread && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "#6C47FF", color: "white" }}
                            >
                              New
                            </span>
                          )}
                          <button
                            onClick={() => handleOpenNotification(item)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                            style={{ borderColor: "#E8E6F0", color: "#6C47FF" }}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {invites.map((invite) => {
                  const isPending = invite.status === "pending";
                  const isResponding = respondingId === invite.id;
                  const inviteDate = (
                    invite.createdAt as { toDate?: () => Date }
                  )?.toDate?.();
                  return (
                    <div
                      key={invite.id}
                      className="p-4 rounded-xl border transition-all"
                      style={{
                        borderColor: isPending ? "#6C47FF" : "#E8E6F0",
                        background: isPending ? "#F8F7FF" : "white",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: "#6C47FF" }}
                          >
                            {invite.fromUserName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "#1A1730" }}
                            >
                              {invite.fromUserName} invited you
                            </p>
                            <p className="text-xs" style={{ color: "#8B87A0" }}>
                              {inviteDate
                                ? inviteDate.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Recently"}
                            </p>
                          </div>
                        </div>
                        {isPending && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#6C47FF", color: "white" }}
                          >
                            New
                          </span>
                        )}
                      </div>

                      <div
                        className="p-3 rounded-xl mb-3"
                        style={{ background: "#F0ECFF" }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#1A1730" }}
                        >
                          {invite.projectTitle}
                        </p>
                      </div>

                      {invite.message && (
                        <p
                          className="text-xs mb-3 italic"
                          style={{ color: "#4A4665" }}
                        >
                          "{invite.message}"
                        </p>
                      )}

                      {isPending ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleInviteResponse(invite, "accepted")
                            }
                            disabled={isResponding}
                            className="btn-primary flex-1 py-2 text-sm"
                          >
                            {isResponding ? "…" : "✓ Accept"}
                          </button>
                          <button
                            onClick={() =>
                              handleInviteResponse(invite, "declined")
                            }
                            disabled={isResponding}
                            className="btn-secondary flex-1 py-2 text-sm"
                          >
                            {isResponding ? "…" : "✗ Decline"}
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block"
                          style={{
                            background:
                              invite.status === "accepted"
                                ? "#F0FDF4"
                                : "#FEF2F2",
                            color:
                              invite.status === "accepted"
                                ? "#16A34A"
                                : "#EF4444",
                          }}
                        >
                          {invite.status === "accepted"
                            ? "✓ Accepted"
                            : "✗ Declined"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
