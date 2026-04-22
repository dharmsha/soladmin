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
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  FileText, 
  Users, 
  Briefcase, 
  Building2,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Award,
  TrendingUp,
  UserCheck,
  MessageSquare,
  Link as LinkIcon
} from "lucide-react";

export default function SuperAdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
    viewed: 0
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchAllData();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Real-time applications
    const unsubscribeApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const appsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        viewedAt: doc.data().viewedAt?.toDate(),
        shortlistedAt: doc.data().shortlistedAt?.toDate(),
        hiredAt: doc.data().hiredAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      }));
      setApplications(appsList);
      updateStats(appsList);
    });

    // Real-time jobs
    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date()
      }));
      setJobs(jobsList);
    });

    // Real-time users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    });

    return () => {
      unsubscribeApplications();
      unsubscribeJobs();
      unsubscribeUsers();
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const appsSnapshot = await getDocs(collection(db, "applications"));
      const appsList = appsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      setApplications(appsList);
      updateStats(appsList);

      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsList);

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (appsList) => {
    setStats({
      total: appsList.length,
      pending: appsList.filter(a => a.status === "pending").length,
      shortlisted: appsList.filter(a => a.status === "shortlisted").length,
      hired: appsList.filter(a => a.status === "hired").length,
      rejected: appsList.filter(a => a.status === "rejected").length,
      viewed: appsList.filter(a => a.status === "viewed").length
    });
  };

  const updateApplicationStatus = async (applicationId, newStatus, feedback = "") => {
    try {
      const appRef = doc(db, "applications", applicationId);
      const updateData = {
        status: newStatus,
        lastUpdated: new Date()
      };

      if (newStatus === "viewed") updateData.viewedAt = new Date();
      if (newStatus === "shortlisted") updateData.shortlistedAt = new Date();
      if (newStatus === "hired") updateData.hiredAt = new Date();
      if (newStatus === "rejected") updateData.rejectedAt = new Date();
      if (feedback) updateData.employerFeedback = feedback;

      const currentApp = applications.find(app => app.id === applicationId);
      const currentHistory = currentApp?.statusHistory || [];
      
      updateData.statusHistory = [
        ...currentHistory,
        {
          status: newStatus,
          timestamp: new Date(),
          note: feedback || `Status updated to ${newStatus}`,
          updatedBy: "Super Admin"
        }
      ];

      await updateDoc(appRef, updateData);
      alert(`Application status updated to ${newStatus}!`);
    } catch (error) {
      alert("Error updating status: " + error.message);
    }
  };

  const getEmployerName = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return "Unknown Company";
    const employer = users.find(u => u.id === job.employerId);
    return employer?.companyName || employer?.name || "Unknown Company";
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || "Unknown Job";
  };

  const getJobLocation = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.location || "N/A";
  };

  const getFilteredApplications = () => {
    let filtered = [...applications];
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userMobile?.includes(searchTerm) ||
        getJobTitle(app.jobId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEmployerName(app.jobId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (companyFilter !== "all") {
      filtered = filtered.filter(app => getEmployerName(app.jobId) === companyFilter);
    }
    
    if (jobFilter !== "all") {
      filtered = filtered.filter(app => getJobTitle(app.jobId) === jobFilter);
    }
    
    if (dateRange.start) {
      filtered = filtered.filter(app => app.appliedAt >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(app => app.appliedAt <= endDate);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" ? b.appliedAt - a.appliedAt : a.appliedAt - b.appliedAt;
      } else if (sortBy === "name") {
        return sortOrder === "desc" 
          ? (b.userName || "").localeCompare(a.userName || "")
          : (a.userName || "").localeCompare(b.userName || "");
      }
      return 0;
    });
    
    return filtered;
  };

  const exportToCSV = () => {
    const filtered = getFilteredApplications();
    if (filtered.length === 0) {
      alert("No data to export!");
      return;
    }
    
    const csvData = filtered.map(app => ({
      "Application ID": app.id,
      "Applicant Name": app.userName,
      "Email": app.userEmail,
      "Mobile": app.userMobile || "",
      "Job Title": getJobTitle(app.jobId),
      "Company": getEmployerName(app.jobId),
      "Location": getJobLocation(app.jobId),
      "Status": app.status,
      "Applied Date": app.appliedAt.toLocaleDateString(),
      "Applied Time": app.appliedAt.toLocaleTimeString(),
      "Last Updated": app.lastUpdated?.toLocaleDateString() || ""
    }));

    const csvHeaders = Object.keys(csvData[0]).join(",");
    const csvRows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(","));
    const csvString = [csvHeaders, ...csvRows].join("\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_applications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredApplications = getFilteredApplications();
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      viewed: { color: "bg-blue-100 text-blue-800", icon: Eye, label: "Viewed" },
      shortlisted: { color: "bg-green-100 text-green-800", icon: Star, label: "Shortlisted" },
      hired: { color: "bg-purple-100 text-purple-800", icon: Award, label: "Hired" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" }
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

  const uniqueCompanies = [...new Set(applications.map(app => getEmployerName(app.jobId)))];
  const uniqueJobs = [...new Set(applications.map(app => getJobTitle(app.jobId)))];

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer" onClick={() => {
      if (label === "Pending") setStatusFilter("pending");
      else if (label === "Shortlisted") setStatusFilter("shortlisted");
      else if (label === "Hired") setStatusFilter("hired");
      else if (label === "Rejected") setStatusFilter("rejected");
      else if (label === "Viewed") setStatusFilter("viewed");
      else setStatusFilter("all");
      setCurrentPage(1);
    }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-600" />
          All Applications
        </h1>
        <p className="text-gray-500 mt-1">Complete overview of all job applications across all companies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} icon={FileText} color="bg-blue-500" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard label="Viewed" value={stats.viewed} icon={Eye} color="bg-indigo-500" />
        <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} color="bg-green-500" />
        <StatCard label="Hired" value={stats.hired} icon={Award} color="bg-purple-500" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, job title, company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status ({stats.total})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="viewed">Viewed ({stats.viewed})</option>
            <option value="shortlisted">Shortlisted ({stats.shortlisted})</option>
            <option value="hired">Hired ({stats.hired})</option>
            <option value="rejected">Rejected ({stats.rejected})</option>
          </select>
          
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Companies ({uniqueCompanies.length})</option>
            {uniqueCompanies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
          
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <select
            value={jobFilter}
            onChange={(e) => {
              setJobFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Jobs ({uniqueJobs.length})</option>
            {uniqueJobs.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End Date"
          />
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
            </button>
          </div>
        </div>
        
        {(searchTerm || statusFilter !== "all" || companyFilter !== "all" || jobFilter !== "all" || dateRange.start || dateRange.end) && (
          <div className="mt-3 text-right">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCompanyFilter("all");
                setJobFilter("all");
                setDateRange({ start: "", end: "" });
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {paginatedApplications.length} of {filteredApplications.length} applications
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Job Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Applied Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    No applications found
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
                        <p className="font-medium text-gray-900">{getJobTitle(application.jobId)}</p>
                        <p className="text-sm text-gray-600">{getEmployerName(application.jobId)}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {getJobLocation(application.jobId)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {application.userEmail}</p>
                        {application.userMobile && (
                          <p className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {application.userMobile}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-600">{application.appliedAt.toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{application.appliedAt.toLocaleTimeString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
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
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                  <p className="text-sm text-gray-500">{selectedApplication.userName}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant & Job Info */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Applicant Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Full Name:</strong> {selectedApplication.userName || "N/A"}</p>
                    <p><strong>Email:</strong> {selectedApplication.userEmail}</p>
                    <p><strong>Mobile:</strong> {selectedApplication.userMobile || "N/A"}</p>
                    {selectedApplication.experience && <p><strong>Experience:</strong> {selectedApplication.experience}</p>}
                    {selectedApplication.currentCompany && <p><strong>Current Company:</strong> {selectedApplication.currentCompany}</p>}
                    {selectedApplication.noticePeriod && <p><strong>Notice Period:</strong> {selectedApplication.noticePeriod}</p>}
                    {selectedApplication.resumeUrl && (
                      <p>
                        <strong>Resume:</strong>{" "}
                        <a href={selectedApplication.resumeUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> View Resume
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Position:</strong> {getJobTitle(selectedApplication.jobId)}</p>
                    <p><strong>Company:</strong> {getEmployerName(selectedApplication.jobId)}</p>
                    <p><strong>Location:</strong> {getJobLocation(selectedApplication.jobId)}</p>
                    <p><strong>Applied on:</strong> {selectedApplication.appliedAt.toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> {selectedApplication.lastUpdated?.toLocaleString() || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Cover Letter
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedApplication.coverLetter}</p>
                </div>
              )}

              {/* Status Timeline */}
              {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3">Status Timeline</h3>
                  <div className="space-y-3">
                    {selectedApplication.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{history.status}</p>
                          <p className="text-sm text-gray-500">{history.timestamp?.toLocaleString()}</p>
                          {history.note && <p className="text-sm text-gray-600 mt-1">{history.note}</p>}
                          {history.updatedBy && <p className="text-xs text-gray-400">Updated by: {history.updatedBy}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employer Feedback */}
              {selectedApplication.employerFeedback && (
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Employer Feedback
                  </h3>
                  <p className="text-yellow-700">{selectedApplication.employerFeedback}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedApplication.status !== "shortlisted" && selectedApplication.status !== "hired" && selectedApplication.status !== "rejected" && (
                  <>
                    <button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, "shortlisted");
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, "rejected");
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedApplication.status === "shortlisted" && (
                  <button
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, "hired");
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Mark as Hired
                  </button>
                )}
                <button
                  onClick={() => window.location.href = `mailto:${selectedApplication.userEmail}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}