"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  getDocs,
  doc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Eye, 
  XCircle,
  Clock,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  UserCheck,
  Mail,
  Phone,
  MessageSquare,
  Award,
  Shield,
  RefreshCw,
  Building2,
  AlertCircle
} from "lucide-react";

export default function AdminJobseekersPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0,
    rejectedApplications: 0,
    viewedApplications: 0,
    totalJobs: 0,
    totalJobseekers: 0,
    uniqueCompanies: 0
  });
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppForFeedback, setSelectedAppForFeedback] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Function to fetch real data from Firebase
  const fetchRealData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching real data from Firebase...");
      
      // Fetch applications
      const appsQuery = query(collection(db, "applications"), orderBy("appliedAt", "desc"));
      const appsSnapshot = await getDocs(appsQuery);
      const appsList = appsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.() || data.appliedAt || new Date(),
          lastUpdated: data.lastUpdated?.toDate?.() || data.lastUpdated || new Date(),
          viewedAt: data.viewedAt?.toDate?.() || data.viewedAt,
          shortlistedAt: data.shortlistedAt?.toDate?.() || data.shortlistedAt,
          hiredAt: data.hiredAt?.toDate?.() || data.hiredAt,
          rejectedAt: data.rejectedAt?.toDate?.() || data.rejectedAt,
        };
      });
      
      console.log(`✅ Found ${appsList.length} total applications`);
      
      // Fetch jobs
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Fetch users (jobseekers only)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const jobseekersCount = usersList.filter(u => u.role === "jobseeker" || u.userType === "jobseeker" || !u.role).length;
      console.log(`✅ Found ${jobseekersCount} job seekers`);
      
      setApplications(appsList);
      setJobs(jobsList);
      setUsers(usersList);
      
      // Update stats
      const uniqueCompanies = new Set(appsList.map(app => app.companyName).filter(Boolean)).size;
      setStats({
        totalApplications: appsList.length,
        pendingApplications: appsList.filter(app => app.status === "pending").length,
        shortlistedApplications: appsList.filter(app => app.status === "shortlisted").length,
        hiredApplications: appsList.filter(app => app.status === "hired").length,
        rejectedApplications: appsList.filter(app => app.status === "rejected").length,
        viewedApplications: appsList.filter(app => app.status === "viewed").length,
        totalJobs: jobsList.length,
        totalJobseekers: jobseekersCount,
        uniqueCompanies: uniqueCompanies
      });
      
      setLastRefreshed(new Date());
      
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener
  useEffect(() => {
    fetchRealData();
    
    // Real-time listener for applications
    const unsubscribe = onSnapshot(collection(db, "applications"), (snapshot) => {
      console.log("📡 Real-time update received!");
      const appsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.() || data.appliedAt || new Date(),
          lastUpdated: data.lastUpdated?.toDate?.() || data.lastUpdated || new Date(),
        };
      });
      
      setApplications(appsList);
      
      // Update stats with new data
      setJobs(currentJobs => {
        setUsers(currentUsers => {
          const uniqueCompanies = new Set(appsList.map(app => app.companyName).filter(Boolean)).size;
          setStats({
            totalApplications: appsList.length,
            pendingApplications: appsList.filter(app => app.status === "pending").length,
            shortlistedApplications: appsList.filter(app => app.status === "shortlisted").length,
            hiredApplications: appsList.filter(app => app.status === "hired").length,
            rejectedApplications: appsList.filter(app => app.status === "rejected").length,
            viewedApplications: appsList.filter(app => app.status === "viewed").length,
            totalJobs: currentJobs.length,
            totalJobseekers: currentUsers.filter(u => u.role === "jobseeker" || u.userType === "jobseeker" || !u.role).length,
            uniqueCompanies: uniqueCompanies
          });
          return currentUsers;
        });
        return currentJobs;
      });
      
      setLastRefreshed(new Date());
    });
    
    return () => unsubscribe();
  }, []);

  const updateApplicationStatus = async (applicationId, newStatus, feedback = "") => {
    setStatusUpdateLoading(true);
    try {
      const appRef = doc(db, "applications", applicationId);
      const updateData = {
        status: newStatus,
        lastUpdated: new Date(),
      };

      if (feedback) updateData.employerFeedback = feedback;
      
      // Add timestamp for specific status
      if (newStatus === "viewed") updateData.viewedAt = new Date();
      if (newStatus === "shortlisted") updateData.shortlistedAt = new Date();
      if (newStatus === "hired") updateData.hiredAt = new Date();
      if (newStatus === "rejected") updateData.rejectedAt = new Date();

      const currentApp = applications.find(app => app.id === applicationId);
      const currentHistory = currentApp?.statusHistory || [];
      
      updateData.statusHistory = [
        ...currentHistory,
        {
          status: newStatus,
          timestamp: new Date(),
          note: feedback || `Status updated to ${newStatus}`,
          updatedBy: "Admin"
        }
      ];

      await updateDoc(appRef, updateData);
      alert(`✅ Application status updated to ${newStatus}!`);
      
      setShowFeedbackModal(false);
      setSelectedAppForFeedback(null);
      setFeedbackText("");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error updating status: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleStatusUpdate = (application, newStatus) => {
    if (newStatus === "rejected") {
      setSelectedAppForFeedback(application);
      setShowFeedbackModal(true);
    } else {
      updateApplicationStatus(application.id, newStatus);
    }
  };

  const exportToCSV = () => {
    const filtered = getFilteredApplications();
    if (filtered.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const csvData = filtered.map(app => ({
      "Application ID": app.id,
      "Job Title": app.jobTitle,
      "Company": app.companyName,
      "Applicant Name": app.userName,
      "Email": app.userEmail,
      "Mobile": app.userMobile || "",
      "Status": app.status,
      "Applied Date": app.appliedAt?.toLocaleDateString?.() || "N/A",
    }));

    const csvHeaders = Object.keys(csvData[0]).join(",");
    const csvRows = csvData.map(row => Object.values(row).map(value => `"${value || ''}"`).join(","));
    const csvString = [csvHeaders, ...csvRows].join("\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredApplications = () => {
    let filtered = [...applications];
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (companyFilter !== "all") {
      filtered = filtered.filter(app => app.companyName === companyFilter);
    }
    
    if (dateRange.start) {
      filtered = filtered.filter(app => app.appliedAt && app.appliedAt >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(app => app.appliedAt && app.appliedAt <= endDate);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.appliedAt || new Date(0);
        const dateB = b.appliedAt || new Date(0);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else if (sortBy === "name") {
        return sortOrder === "desc" 
          ? (b.userName || "").localeCompare(a.userName || "")
          : (a.userName || "").localeCompare(b.userName || "");
      }
      return 0;
    });
    
    return filtered;
  };

  const filteredApplications = getFilteredApplications();
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
      viewed: { color: "bg-blue-100 text-blue-800", label: "Viewed", icon: Eye },
      shortlisted: { color: "bg-green-100 text-green-800", label: "Shortlisted", icon: Star },
      hired: { color: "bg-purple-100 text-purple-800", label: "Hired", icon: Award },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const uniqueCompanies = [...new Set(applications.map(app => app.companyName).filter(Boolean))];

  const statCards = [
    { label: "Total Applications", value: stats.totalApplications, icon: FileText, color: "bg-blue-500", filter: null },
    { label: "Pending", value: stats.pendingApplications, icon: Clock, color: "bg-yellow-500", filter: "pending" },
    { label: "Shortlisted", value: stats.shortlistedApplications, icon: Star, color: "bg-green-500", filter: "shortlisted" },
    { label: "Hired", value: stats.hiredApplications, icon: Award, color: "bg-purple-500", filter: "hired" },
    { label: "Rejected", value: stats.rejectedApplications, icon: XCircle, color: "bg-red-500", filter: "rejected" },
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "bg-indigo-500", filter: null },
    { label: "Job Seekers", value: stats.totalJobseekers, icon: Users, color: "bg-pink-500", filter: null },
    { label: "Companies", value: stats.uniqueCompanies, icon: Building2, color: "bg-teal-500", filter: null }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white font-medium">Loading Real Data from Firebase...</p>
          <p className="mt-2 text-gray-400 text-sm">Fetching applications & job seekers</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchRealData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Admin Dashboard - Live Applications
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Real-time data from Firebase • {applications.length} total applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Last synced</p>
                <p className="text-sm font-medium">{lastRefreshed.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={fetchRealData}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border hover:border-blue-300" 
                onClick={() => {
                  if (stat.filter) {
                    setStatusFilter(stat.filter);
                    setCurrentPage(1);
                  }
                }}
              >
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, job, company, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📊 All Status ({stats.totalApplications})</option>
              <option value="pending">⏳ Pending ({stats.pendingApplications})</option>
              <option value="viewed">👁️ Viewed ({stats.viewedApplications})</option>
              <option value="shortlisted">⭐ Shortlisted ({stats.shortlistedApplications})</option>
              <option value="hired">🎉 Hired ({stats.hiredApplications})</option>
              <option value="rejected">❌ Rejected ({stats.rejectedApplications})</option>
            </select>
            
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🏢 All Companies ({uniqueCompanies.length})</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="End Date"
            />
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              >
                <option value="date">📅 Sort by Date</option>
                <option value="name">👤 Sort by Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                {sortOrder === "desc" ? "↓ Newest First" : "↑ Oldest First"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">👤 Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">💼 Job Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">📞 Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">✅ Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">📅 Applied Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">⚡ Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedApplications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-12 h-12 text-gray-300" />
                        <p>No applications found</p>
                        <p className="text-sm">Try changing your filters or check back later</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{application.userName || "Anonymous"}</p>
                          <p className="text-xs text-gray-500 md:hidden">{application.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{application.jobTitle || "Unknown"}</p>
                          <p className="text-sm text-gray-600">{application.companyName || "Unknown"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {application.userEmail}</p>
                          {application.userMobile && <p className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {application.userMobile}</p>}
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(application.status)}
                       </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-600">
                          {application.appliedAt?.toLocaleDateString?.() || "N/A"}
                        </p>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {application.status !== "shortlisted" && application.status !== "hired" && application.status !== "rejected" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(application, "shortlisted")}
                                className="text-green-600 hover:text-green-800"
                                title="Shortlist"
                              >
                                <Star className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(application, "rejected")}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {application.status === "shortlisted" && (
                            <button
                              onClick={() => handleStatusUpdate(application, "hired")}
                              className="text-purple-600 hover:text-purple-800"
                              title="Mark as Hired"
                            >
                              <Award className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                       </td>
                    </tr>
                  ))
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
                Page {currentPage} of {totalPages} ({filteredApplications.length} applications)
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

      {/* Modals */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApplication(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">Application Details</h2>
              <button onClick={() => setSelectedApplication(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Applicant Details
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedApplication.userName || "N/A"}</p>
                    <p><strong>Email:</strong> {selectedApplication.userEmail}</p>
                    <p><strong>Mobile:</strong> {selectedApplication.userMobile || "N/A"}</p>
                    {selectedApplication.resumeUrl && (
                      <p>
                        <strong>Resume:</strong>{" "}
                        <a href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Resume
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Details
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Position:</strong> {selectedApplication.jobTitle}</p>
                    <p><strong>Company:</strong> {selectedApplication.companyName}</p>
                    <p><strong>Applied on:</strong> {selectedApplication.appliedAt?.toLocaleString?.() || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              {selectedApplication.coverLetter && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Cover Letter
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                </div>
              )}
              
              {selectedApplication.employerFeedback && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Feedback
                  </h3>
                  <p className="text-gray-700">{selectedApplication.employerFeedback}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedApplication.status !== "shortlisted" && selectedApplication.status !== "hired" && selectedApplication.status !== "rejected" && (
                  <>
                    <button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, "shortlisted");
                        setSelectedApplication(null);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppForFeedback(selectedApplication);
                        setShowFeedbackModal(true);
                        setSelectedApplication(null);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedAppForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h2 className="text-xl font-bold">Provide Rejection Reason</h2>
            </div>
            <div className="p-5">
              <p className="text-gray-600 mb-3">
                Provide feedback for <strong>{selectedAppForFeedback.userName}</strong>'s application
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Reason for rejection (optional but recommended)"
              />
            </div>
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedAppForFeedback(null);
                  setFeedbackText("");
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateApplicationStatus(selectedAppForFeedback.id, "rejected", feedbackText);
                }}
                disabled={statusUpdateLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {statusUpdateLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}