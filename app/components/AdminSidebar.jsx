"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Settings,
  Home,
  FileText,
  MessageCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function AdminSidebar({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Jobseekers", path: "/admin/jobseekers", icon: Users, exact: false },
    { name: "Employers", path: "/admin/employers", icon: Building2, exact: false },
    { name: "Jobs", path: "/admin/jobs", icon: Briefcase, exact: false },
    { name: "Applications", path: "/admin/applications", icon: FileText, exact: false },
    { name: "Messages", path: "/admin/messages", icon: MessageCircle, exact: false },
    { name: "Analytics", path: "/admin/analytics", icon: TrendingUp, exact: false },
    { name: "Settings", path: "/admin/settings", icon: Settings, exact: false },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.path;
    }
    // Exact match for nested routes
    return pathname === item.path || pathname?.startsWith(item.path + "/");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white/10 backdrop-blur-lg border border-white/20 text-white p-2.5 rounded-xl shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphic */}
      <aside
        className={`
          fixed lg:relative z-40 h-full w-80 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col
          transform transition-all duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                JobSolution
              </h1>
              <p className="text-xs text-white/60">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                  ${active 
                    ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-white/20 shadow-lg" 
                    : "hover:bg-white/10 border border-transparent"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    size={20} 
                    className={`transition-all ${active ? "text-blue-400" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span className={`font-medium ${active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                    {item.name}
                  </span>
                </div>
                {active && (
                  <ChevronRight size={16} className="text-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 transition-all group"
          >
            <Home size={20} className="group-hover:text-white" />
            <span className="font-medium">Back to Home</span>
          </Link>

          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all group"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>

          <div className="pt-4 text-center text-xs text-white/40">
            © 2026 JobSolution
            <br />
            Admin Dashboard v1.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Glassmorphic content wrapper */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}