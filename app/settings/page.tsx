"use client";
import { useState } from "react";

export default function SettingsPage() {
  // Placeholder user data
  const [name, setName] = useState("John Doe");
  const [email] = useState("john@example.com");
  const [apiKeys, setApiKeys] = useState([
    { key: "sk-1234abcd", label: "Main Key", revoked: false },
    { key: "sk-5678efgh", label: "Test Key", revoked: true },
  ]);
  const [theme, setTheme] = useState("light");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");

  // Placeholder handlers
  const handleNameChange = (e: any) => setName(e.target.value);
  const handleSaveProfile = (e: any) => {
    e.preventDefault();
    alert("Profile saved (mock)");
  };
  const handleChangePassword = () => alert("Change password (mock)");
  const handleCreateApiKey = () => {
    setApiKeys([...apiKeys, { key: "sk-newkey", label: newApiKey, revoked: false }]);
    setNewApiKey("");
  };
  const handleRevokeApiKey = (idx: number) => {
    setApiKeys(apiKeys.map((k, i) => i === idx ? { ...k, revoked: true } : k));
  };
  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      alert("Account deleted (mock)");
    }
  };
  const handleLogout = () => alert("Logout (mock)");

  return (
    <div className="pl-12 pt-10 pr-8 max-w-3xl w-full space-y-8">
      <h1 className="text-3xl font-bold text-primary mb-4">Settings</h1>

      {/* Profile Section */}
      <section className="bg-background border rounded-lg shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-primary mb-2">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-left font-medium text-sm text-primary">Name</label>
            <input
              className="w-full border border-border rounded-md p-2 bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-left font-medium text-sm text-primary">Email</label>
            <input
              className="w-full border border-border rounded-md p-2 bg-muted text-base text-muted-foreground"
              value={email}
              readOnly
            />
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition">Save Profile</button>
        </form>
        <div className="mt-2">
          <button
            className="text-primary underline text-sm"
            onClick={() => setShowChangePassword(v => !v)}
          >
            {showChangePassword ? "Hide" : "Change Password"}
          </button>
          {showChangePassword && (
            <div className="mt-2">
              <button className="bg-muted px-3 py-1 rounded-md text-primary" onClick={handleChangePassword}>Change Password (mock)</button>
            </div>
          )}
        </div>
      </section>

      {/* API Keys Section */}
      <section className="bg-background border rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-primary mb-2">API Keys</h2>
        <ul className="mb-2 space-y-2">
          {apiKeys.map((k, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="font-mono text-sm text-primary">{k.key}</span>
              <span className="ml-2 text-muted-foreground text-sm">{k.label}</span>
              {k.revoked ? (
                <span className="ml-4 text-red-500 text-sm">Revoked</span>
              ) : (
                <button className="ml-4 text-red-600 underline text-sm" onClick={() => handleRevokeApiKey(i)}>Revoke</button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="border border-border rounded-md p-2 flex-1 bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Label for new API key"
            value={newApiKey}
            onChange={e => setNewApiKey(e.target.value)}
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition" onClick={handleCreateApiKey}>Create</button>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-background border rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-primary mb-2">Preferences</h2>
        <div className="flex items-center gap-4">
          <span className="text-primary">Theme:</span>
          <button
            className={`px-3 py-1 rounded-md border ${theme === "light" ? "bg-primary/10 text-primary border-primary" : "bg-muted text-muted-foreground border-border"}`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-background border rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-primary mb-2">Account</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition" onClick={handleDeleteAccount}>Delete Account</button>
          <button className="bg-muted text-primary px-4 py-2 rounded-md hover:bg-gray-200 transition" onClick={handleLogout}>Logout</button>
        </div>
      </section>
    </div>
  );
} 