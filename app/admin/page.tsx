"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Mail, 
  Phone, 
  Calendar, 
  Building2,
  UserCheck,
  Eye,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Award,
  Clock,
  XCircle  // ✅ Imported from lucide-react - no need to redefine
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalUsers: 0,
    totalEmployers: 0,
    totalJobseekers: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching all data...");
      
      // Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt || new Date()
      }));
      
      // Separate users by role
      const employers = allUsers.filter(u => 
        u.role === "employer" || 
        u.userType === "employer" || 
        u.accountType === "employer"
      );
      
      const jobseekers = allUsers.filter(u => 
        u.role === "jobseeker" || 
        u.userType === "jobseeker" || 
        u.accountType === "jobseeker" ||
        (!u.role && !u.userType)
      );
      
      // Fetch jobs
      const jobsSnap = await getDocs(collection(db, "jobs"));
      
      // Fetch applications
      const appsSnap = await getDocs(collection(db, "applications"));
      const applications = appsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate?.() || doc.data().appliedAt || new Date()
      }));
      
      // Calculate stats
      const pendingApps = applications.filter(app => app.status === "pending").length;
      const shortlistedApps = applications.filter(app => app.status === "shortlisted").length;
      const hiredApps = applications.filter(app => app.status === "hired").length;
      
      setStats({
        totalJobs: jobsSnap.size,
        totalApplications: applications.length,
        totalUsers: allUsers.length,
        totalEmployers: employers.length,
        totalJobseekers: jobseekers.length,
        pendingApplications: pendingApps,
        shortlistedApplications: shortlistedApps,
        hiredApplications: hiredApps
      });
      
      // Get recent users
      const sortedUsers = [...allUsers].sort((a, b) => b.createdAt - a.createdAt);
      setRecentUsers(sortedUsers.slice(0, 10));
      
      // Get recent applications
      const sortedApps = [...applications].sort((a, b) => b.appliedAt - a.appliedAt);
      setRecentApplications(sortedApps.slice(0, 10));
      
      console.log(`✅ Found: ${employers.length} employers, ${jobseekers.length} job seekers`);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportUsersToCSV = () => {
    const filtered = getFilteredUsers();
    if (filtered.length === 0) {
      alert("No users to export!");
      return;
    }
    
    const csvData = filtered.map(user => ({
      "User ID": user.id,
      "Name": user.name || user.fullName || user.displayName || "N/A",
      "Email": user.email || "N/A",
      "Phone": user.phone || user.mobile || "N/A",
      "Role": user.role || user.userType || "jobseeker",
      "Company": user.companyName || user.company || "N/A",
      "Registered On": user.createdAt?.toLocaleDateString?.() || "N/A",
    }));

    const csvHeaders = Object.keys(csvData[0]).join(",");
    const csvRows = csvData.map(row => Object.values(row).map(value => `"${value || ''}"`).join(","));
    const csvString = [csvHeaders, ...csvRows].join("\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredUsers = () => {
    let filtered = [...recentUsers];
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.name || user.fullName || user.displayName || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || user.mobile || "")?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(user => {
        const role = (user.role || user.userType || "jobseeker").toLowerCase();
        if (userTypeFilter === "employer") return role === "employer";
        if (userTypeFilter === "jobseeker") return role === "jobseeker";
        return true;
      });
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (user) => {
    const role = (user.role || user.userType || "jobseeker").toLowerCase();
    const isEmployer = role === "employer";
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
        isEmployer 
          ? "bg-purple-100 text-purple-800" 
          : "bg-blue-100 text-blue-800"
      }`}>
        {isEmployer ? <Building2 className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
        {isEmployer ? "Employer" : "Job Seeker"}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, jobs, and applications</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={Users} 
            color="bg-blue-500"
            onClick={() => setUserTypeFilter("all")}
          />
          <StatCard 
            title="Job Seekers" 
            value={stats.totalJobseekers} 
            icon={UserCheck} 
            color="bg-green-500"
            onClick={() => setUserTypeFilter("jobseeker")}
          />
          <StatCard 
            title="Employers" 
            value={stats.totalEmployers} 
            icon={Building2} 
            color="bg-purple-500"
            onClick={() => setUserTypeFilter("employer")}
          />
          <StatCard 
            title="Total Jobs" 
            value={stats.totalJobs} 
            icon={Briefcase} 
            color="bg-orange-500"
          />
        </div>

        {/* Application Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Hired</p>
                <p className="text-2xl font-bold text-green-600">{stats.hiredApplications}</p>
              </div>
              <Award className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
            <p className="text-gray-600 text-sm">Latest job applications received</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentApplications.map((app, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{app.userName || "Anonymous"}</p>
                      <p className="text-sm text-gray-500">{app.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{app.jobTitle || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-700">{app.companyName || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        app.status === "shortlisted" ? "bg-green-100 text-green-800" :
                        app.status === "hired" ? "bg-purple-100 text-purple-800" :
                        app.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {app.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {app.appliedAt?.toLocaleDateString?.() || "N/A"}
                    </td>
                  </tr>
                ))}
                {recentApplications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                <p className="text-gray-600 text-sm">Job seekers and employers registered on the platform</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportUsersToCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={userTypeFilter}
                onChange={(e) => {
                  setUserTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users ({stats.totalUsers})</option>
                <option value="jobseeker">Job Seekers ({stats.totalJobseekers})</option>
                <option value="employer">Employers ({stats.totalEmployers})</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(user.name || user.fullName || user.displayName || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name || user.fullName || user.displayName || "Anonymous"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{user.email || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{user.phone || user.mobile || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {user.companyName || user.company || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {user.createdAt?.toLocaleDateString?.() || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No users found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredUsers.length} users)
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal - Using XCircle from lucide-react */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" /> {/* ✅ Using imported XCircle */}
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedUser.name || selectedUser.fullName || selectedUser.displayName || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.name || selectedUser.fullName || selectedUser.displayName || "Anonymous"}
                  </h3>
                  {getRoleBadge(selectedUser)}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Email Address</p>
                  <p className="text-gray-900 font-medium">{selectedUser.email || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="text-gray-900 font-medium">{selectedUser.phone || selectedUser.mobile || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Account Type</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {selectedUser.role || selectedUser.userType || "Job Seeker"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Company (if employer)</p>
                  <p className="text-gray-900 font-medium">{selectedUser.companyName || selectedUser.company || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Registered On</p>
                  <p className="text-gray-900 font-medium">
                    {selectedUser.createdAt?.toLocaleString?.() || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {selectedUser.updatedAt?.toLocaleString?.() || "N/A"}
                  </p>
                </div>
              </div>
              
              {selectedUser.bio && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Bio / About</p>
                  <p className="text-gray-900">{selectedUser.bio}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}