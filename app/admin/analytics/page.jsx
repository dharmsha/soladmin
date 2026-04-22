"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Building2,
  Award,
  Clock,
  Eye,
  Star,
  XCircle,
  CheckCircle,
  Download,
  RefreshCw,
  PieChart,
  BarChart3,
  Activity,
  Zap,
  Target,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobseekers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0,
    rejectedApplications: 0,
    viewedApplications: 0,
    uniqueCompanies: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [growthData, setGrowthData] = useState({
    userGrowth: 0,
    jobGrowth: 0,
    applicationGrowth: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Listen to users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      processUsersData(usersList);
    });

    // Listen to jobs
    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || null
      }));
      processJobsData(jobsList);
    });

    // Listen to applications
    const unsubscribeApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const appsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      processApplicationsData(appsList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeJobs();
      unsubscribeApplications();
    };
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      processUsersData(usersList);

      // Fetch jobs
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date()
      }));
      processJobsData(jobsList);

      // Fetch applications
      const appsSnapshot = await getDocs(collection(db, "applications"));
      const appsList = appsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      processApplicationsData(appsList);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processUsersData = (usersList) => {
    const jobseekers = usersList.filter(u => u.role === "jobseeker" || !u.role);
    const employers = usersList.filter(u => u.role === "employer" || u.role === "recruiter");
    
    setStats(prev => ({
      ...prev,
      totalUsers: usersList.length,
      totalJobseekers: jobseekers.length,
      totalEmployers: employers.length
    }));

    // Calculate monthly user growth
    const monthlyUsers = getMonthlyData(usersList, "createdAt");
    setMonthlyData(prev => {
      const updated = [...prev];
      monthlyUsers.forEach((item, index) => {
        if (updated[index]) {
          updated[index].users = item.count;
        } else {
          updated.push({ month: item.month, users: item.count, jobs: 0, applications: 0 });
        }
      });
      return updated;
    });
  };

  const processJobsData = (jobsList) => {
    const activeJobs = jobsList.filter(job => {
      if (!job.deadline) return true;
      return job.deadline > new Date();
    }).length;
    
    const uniqueCompanies = new Set(jobsList.map(job => job.employerId)).size;
    
    // Get top companies by jobs posted
    const companyJobs = {};
    jobsList.forEach(job => {
      if (job.employerId) {
        companyJobs[job.employerId] = (companyJobs[job.employerId] || 0) + 1;
      }
    });
    
    const topCompaniesList = Object.entries(companyJobs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, jobCount: count }));
    
    // Get top job titles
    const jobTitles = {};
    jobsList.forEach(job => {
      if (job.title) {
        jobTitles[job.title] = (jobTitles[job.title] || 0) + 1;
      }
    });
    
    const topJobsList = Object.entries(jobTitles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));
    
    setStats(prev => ({
      ...prev,
      totalJobs: jobsList.length,
      activeJobs: activeJobs,
      uniqueCompanies: uniqueCompanies
    }));
    
    setTopCompanies(topCompaniesList);
    setTopJobs(topJobsList);

    // Calculate monthly job growth
    const monthlyJobs = getMonthlyData(jobsList, "postedAt");
    setMonthlyData(prev => {
      const updated = [...prev];
      monthlyJobs.forEach((item, index) => {
        if (updated[index]) {
          updated[index].jobs = item.count;
        } else {
          updated.push({ month: item.month, users: 0, jobs: item.count, applications: 0 });
        }
      });
      return updated;
    });
  };

  const processApplicationsData = (appsList) => {
    setStats(prev => ({
      ...prev,
      totalApplications: appsList.length,
      pendingApplications: appsList.filter(a => a.status === "pending").length,
      shortlistedApplications: appsList.filter(a => a.status === "shortlisted").length,
      hiredApplications: appsList.filter(a => a.status === "hired").length,
      rejectedApplications: appsList.filter(a => a.status === "rejected").length,
      viewedApplications: appsList.filter(a => a.status === "viewed").length
    }));

    // Get recent activity
    const recent = [...appsList]
      .sort((a, b) => b.appliedAt - a.appliedAt)
      .slice(0, 10)
      .map(app => ({
        id: app.id,
        type: "application",
        userName: app.userName,
        jobTitle: app.jobTitle,
        status: app.status,
        timestamp: app.appliedAt
      }));
    
    setRecentActivity(recent);

    // Calculate monthly application growth
    const monthlyApps = getMonthlyData(appsList, "appliedAt");
    setMonthlyData(prev => {
      const updated = [...prev];
      monthlyApps.forEach((item, index) => {
        if (updated[index]) {
          updated[index].applications = item.count;
        } else {
          updated.push({ month: item.month, users: 0, jobs: 0, applications: item.count });
        }
      });
      return updated.sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
    });
  };

  const getMonthlyData = (items, dateField) => {
    const monthly = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    items.forEach(item => {
      if (item[dateField]) {
        const month = months[item[dateField].getMonth()];
        monthly[month] = (monthly[month] || 0) + 1;
      }
    });
    
    return Object.entries(monthly).map(([month, count]) => ({ month, count }));
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trendValue} from last month
            </p>
          )}
        </div>
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      shortlisted: "bg-green-100 text-green-700",
      hired: "bg-purple-100 text-purple-700",
      rejected: "bg-red-100 text-red-700",
      viewed: "bg-blue-100 text-blue-700"
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Complete platform analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" trend="up" trendValue="12%" />
        <StatCard title="Job Seekers" value={stats.totalJobseekers} icon={UserCheck} color="bg-green-500" trend="up" trendValue="8%" />
        <StatCard title="Employers" value={stats.totalEmployers} icon={Building2} color="bg-purple-500" trend="up" trendValue="5%" />
        <StatCard title="Total Jobs" value={stats.totalJobs} icon={Briefcase} color="bg-orange-500" trend="up" trendValue="15%" />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={Activity} color="bg-teal-500" />
        <StatCard title="Applications" value={stats.totalApplications} icon={FileText} color="bg-pink-500" trend="up" trendValue="20%" />
        <StatCard title="Companies" value={stats.uniqueCompanies} icon={Building2} color="bg-indigo-500" />
        <StatCard title="Hired" value={stats.hiredApplications} icon={Award} color="bg-emerald-500" trend="up" trendValue="10%" />
      </div>

      {/* Application Status Distribution */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Application Status Distribution
          </h3>
          <div className="space-y-4">
            {[
              { label: "Pending", count: stats.pendingApplications, color: "bg-yellow-500", icon: Clock },
              { label: "Viewed", count: stats.viewedApplications, color: "bg-blue-500", icon: Eye },
              { label: "Shortlisted", count: stats.shortlistedApplications, color: "bg-green-500", icon: Star },
              { label: "Hired", count: stats.hiredApplications, color: "bg-purple-500", icon: Award },
              { label: "Rejected", count: stats.rejectedApplications, color: "bg-red-500", icon: XCircle }
            ].map(item => {
              const percentage = stats.totalApplications > 0 
                ? ((item.count / stats.totalApplications) * 100).toFixed(1) 
                : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-gray-500" />
                      {item.label}
                    </span>
                    <span className="font-medium">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Monthly Trends
          </h3>
          <div className="space-y-4">
            {monthlyData.slice(-6).map((data, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{data.month}</span>
                  <span className="text-gray-500">{data.applications || 0} applications</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((data.applications || 0) / Math.max(...monthlyData.map(d => d.applications || 0))) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Companies & Jobs */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Top Companies by Jobs Posted
          </h3>
          <div className="space-y-3">
            {topCompanies.map((company, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-900">Company {company.id.slice(0, 8)}</span>
                </div>
                <span className="text-sm text-gray-600">{company.jobCount} jobs</span>
              </div>
            ))}
            {topCompanies.length === 0 && (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Most Popular Job Titles
          </h3>
          <div className="space-y-3">
            {topJobs.map((job, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-900">{job.title}</span>
                </div>
                <span className="text-sm text-gray-600">{job.count} openings</span>
              </div>
            ))}
            {topJobs.length === 0 && (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.userName}</p>
                      <p className="text-sm text-gray-500">Applied for {activity.jobTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                      {activity.status || "Pending"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <Zap className="w-8 h-8 mb-3 opacity-80" />
          <h4 className="text-lg font-semibold mb-1">Application Rate</h4>
          <p className="text-3xl font-bold">
            {stats.totalJobs > 0 ? (stats.totalApplications / stats.totalJobs).toFixed(1) : 0}
          </p>
          <p className="text-sm opacity-80 mt-1">applications per job</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Target className="w-8 h-8 mb-3 opacity-80" />
          <h4 className="text-lg font-semibold mb-1">Success Rate</h4>
          <p className="text-3xl font-bold">
            {stats.totalApplications > 0 ? ((stats.hiredApplications / stats.totalApplications) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm opacity-80 mt-1">candidates hired</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <UserPlus className="w-8 h-8 mb-3 opacity-80" />
          <h4 className="text-lg font-semibold mb-1">Active Users</h4>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <p className="text-sm opacity-80 mt-1">total registered users</p>
        </div>
      </div>
    </div>
  );
}