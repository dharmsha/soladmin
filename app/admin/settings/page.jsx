"use client";

import { useState } from "react";
import { 
  Settings, 
  Shield, 
  Bell, 
  Lock, 
  User, 
  Globe,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Save,
  RefreshCw
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "JobSolution",
    siteEmail: "admin@jobsolution.com",
    sitePhone: "+91 98765 43210",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    language: "English",
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    twoFactorAuth: false
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 500);
  };

  const SettingCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your admin preferences</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <SettingCard title="General Settings" icon={Globe}>
          <SettingRow label="Site Name">
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </SettingRow>
          
          <SettingRow label="Admin Email">
            <input
              type="email"
              value={settings.siteEmail}
              onChange={(e) => setSettings({...settings, siteEmail: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </SettingRow>
          
          <SettingRow label="Contact Phone">
            <input
              type="text"
              value={settings.sitePhone}
              onChange={(e) => setSettings({...settings, sitePhone: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </SettingRow>
          
          <SettingRow label="Timezone">
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Asia/Kolkata</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Dubai</option>
            </select>
          </SettingRow>
          
          <SettingRow label="Language">
            <select
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </SettingRow>
        </SettingCard>

        {/* Notification Settings */}
        <SettingCard title="Notifications" icon={Bell}>
          <SettingRow label="Email Notifications">
            <button
              onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
              className={`w-10 h-5 rounded-full transition flex items-center ${settings.emailNotifications ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings.emailNotifications ? "translate-x-5" : "translate-x-0.5"}`}></div>
            </button>
          </SettingRow>
          
          <SettingRow label="Push Notifications">
            <button
              onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})}
              className={`w-10 h-5 rounded-full transition flex items-center ${settings.pushNotifications ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings.pushNotifications ? "translate-x-5" : "translate-x-0.5"}`}></div>
            </button>
          </SettingRow>
        </SettingCard>

        {/* Appearance */}
        <SettingCard title="Appearance" icon={Sun}>
          <SettingRow label="Dark Mode">
            <button
              onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
              className={`w-10 h-5 rounded-full transition flex items-center ${settings.darkMode ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings.darkMode ? "translate-x-5" : "translate-x-0.5"}`}></div>
            </button>
          </SettingRow>
          
          <SettingRow label="Date Format">
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </SettingRow>
        </SettingCard>

        {/* Security */}
        <SettingCard title="Security" icon={Shield}>
          <SettingRow label="Two-Factor Authentication">
            <button
              onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
              className={`w-10 h-5 rounded-full transition flex items-center ${settings.twoFactorAuth ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings.twoFactorAuth ? "translate-x-5" : "translate-x-0.5"}`}></div>
            </button>
          </SettingRow>
          
          <SettingRow label="Change Password">
            <button className="text-blue-600 text-sm hover:underline">
              Update Password
            </button>
          </SettingRow>
        </SettingCard>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            setSettings({
              siteName: "JobSolution",
              siteEmail: "admin@jobsolution.com",
              sitePhone: "+91 98765 43210",
              timezone: "Asia/Kolkata",
              dateFormat: "DD/MM/YYYY",
              language: "English",
              emailNotifications: true,
              pushNotifications: true,
              darkMode: false,
              twoFactorAuth: false
            });
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Reset
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}