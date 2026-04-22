"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const jobsSnap = await getDocs(collection(db, "jobs"));
      const appsSnap = await getDocs(collection(db, "applications"));
      const usersSnap = await getDocs(collection(db, "users"));
      setStats({
        totalJobs: jobsSnap.size,
        totalApplications: appsSnap.size,
        totalUsers: usersSnap.size,
      });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
            <Briefcase className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Job Seekers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
}