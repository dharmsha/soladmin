"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  FileText,
  Trash2,
  Edit2,
  Filter,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Link as LinkIcon,
  Mail,
  Phone
} from "lucide-react";

export default function SuperAdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalCompanies: 0,
    avgApplicationsPerJob: 0
  });

  useEffect(() => {
    fetchAllData();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Real-time jobs
    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || null
      }));
      setJobs(jobsList);
      updateStats(jobsList, applications, employers);
    });

    // Real-time applications
    const unsubscribeApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const appsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      setApplications(appsList);
      updateStats(jobs, appsList, employers);
    });

    // Real-time employers
    const unsubscribeEmployers = onSnapshot(collection(db, "users"), (snapshot) => {
      const employersList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role === "employer" || user.role === "recruiter");
      setEmployers(employersList);
      updateStats(jobs, applications, employersList);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
      unsubscribeEmployers();
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all jobs
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || null
      }));
      setJobs(jobsList);

      // Fetch all applications
      const appsSnapshot = await getDocs(collection(db, "applications"));
      const appsList = appsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      setApplications(appsList);

      // Fetch employers
      const usersSnapshot = await getDocs(collection(db, "users"));
      const employersList = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role === "employer" || user.role === "recruiter");
      setEmployers(employersList);

      updateStats(jobsList, appsList, employersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (jobsList, appsList, employersList) => {
    const totalJobs = jobsList.length;
    const activeJobs = jobsList.filter(job => {
      if (!job.deadline) return true;
      return job.deadline > new Date();
    }).length;
    const totalApplications = appsList.length;
    const totalCompanies = new Set(jobsList.map(job => job.employerId)).size;
    const avgApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;

    setStats({
      totalJobs,
      activeJobs,
      totalApplications,
      totalCompanies,
      avgApplicationsPerJob
    });
  };

  const getEmployerName = (employerId) => {
    const employer = employers.find(emp => emp.id === employerId);
    return employer?.companyName || employer?.name || "Unknown Company";
  };

  const getEmployerContact = (employerId) => {
    const employer = employers.find(emp => emp.id === employerId);
    return {
      email: employer?.email || "N/A",
      mobile: employer?.mobile || "N/A"
    };
  };

  const getJobApplications = (jobId) => {
    return applications.filter(app => app.jobId === jobId);
  };

  const getJobStats = (jobId) => {
    const jobApps = getJobApplications(jobId);
    return {
      total: jobApps.length,
      pending: jobApps.filter(app => app.status === "pending").length,
      shortlisted: jobApps.filter(app => app.status === "shortlisted").length,
      viewed: jobApps.filter(app => app.status === "viewed").length,
      hired: jobApps.filter(app => app.status === "hired").length,
      rejected: jobApps.filter(app => app.status === "rejected").length
    };
  };

  const updateJobStatus = async (jobId, isActive) => {
    try {
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { isActive: !isActive });
      alert(`Job ${!isActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      alert("Error updating job status: " + error.message);
    }
  };

  const deleteJob = async (jobId) => {
    if (confirm("Are you sure you want to delete this job? This will also delete all associated applications.")) {
      try {
        await deleteDoc(doc(db, "jobs", jobId));
        alert("Job deleted successfully");
      } catch (error) {
        alert("Error deleting job: " + error.message);
      }
    }
  };

  const getFilteredJobs = () => {
    let filtered = [...jobs];
    
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEmployerName(job.employerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => {
        if (statusFilter === "active") return !job.deadline || job.deadline > new Date();
        if (statusFilter === "expired") return job.deadline && job.deadline <= new Date();
        return true;
      });
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(job => job.jobType === typeFilter);
    }
    
    return filtered.sort((a, b) => b.postedAt - a.postedAt);
  };

  const filteredJobs = getFilteredJobs();
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  const isJobExpired = (job) => {
    return job.deadline && job.deadline < new Date();
  };

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const getJobTypeColor = (type) => {
    const colors = {
      "Full-time": "bg-blue-100 text-blue-700",
      "Part-time": "bg-green-100 text-green-700",
      "Remote": "bg-purple-100 text-purple-700",
      "Hybrid": "bg-orange-100 text-orange-700",
      "Contract": "bg-yellow-100 text-yellow-700",
      "Internship": "bg-pink-100 text-pink-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-blue-600" />
          Jobs Management
        </h1>
        <p className="text-gray-500 mt-1">Complete overview of all job postings across all companies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} color="bg-blue-500" />
        <StatCard label="Active Jobs" value={stats.activeJobs} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Total Applications" value={stats.totalApplications} icon={FileText} color="bg-purple-500" />
        <StatCard label="Companies Hiring" value={stats.totalCompanies} icon={Building2} color="bg-orange-500" />
        <StatCard label="Avg Applications/Job" value={stats.avgApplicationsPerJob} icon={TrendingUp} color="bg-teal-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title, company, location..."
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
            <option value="all">All Jobs ({stats.totalJobs})</option>
            <option value="active">Active Jobs ({stats.activeJobs})</option>
            <option value="expired">Expired Jobs ({stats.totalJobs - stats.activeJobs})</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Job Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location & Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applications</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Posted Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    No jobs found
                   </td>
                 </tr>
              ) : (
                paginatedJobs.map((job) => {
                  const jobStats = getJobStats(job.id);
                  const isExpired = isJobExpired(job);
                  const employerName = getEmployerName(job.employerId);
                  
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {job.id.slice(0, 8)}</p>
                          {job.salary && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {job.salary}
                            </p>
                          )}
                        </div>
                       </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{employerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {job.employerId?.slice(0, 8)}</p>
                        </div>
                       </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {job.location && (
                            <p className="text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {job.location}
                            </p>
                          )}
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                            {job.jobType || "Not specified"}
                          </span>
                        </div>
                       </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-blue-600">{jobStats.total}</p>
                          <div className="flex flex-wrap gap-1 text-xs">
                            <span className="text-green-600">{jobStats.shortlisted} shortlisted</span>
                            <span className="text-purple-600">{jobStats.hired} hired</span>
                          </div>
                        </div>
                       </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{formatDate(job.postedAt)}</p>
                        {job.deadline && (
                          <p className="text-xs text-gray-400 mt-1">
                            Deadline: {formatDate(job.deadline)}
                          </p>
                        )}
                       </td>
                      <td className="px-4 py-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                       </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowJobModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                       </td>
                    </tr>
                  );
                })
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
              Page {currentPage} of {totalPages} ({filteredJobs.length} jobs)
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

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowJobModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-sm text-gray-500">Job Details</p>
                </div>
              </div>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Basic Information */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Job Title:</strong> {selectedJob.title}</p>
                    <p><strong>Department:</strong> {selectedJob.department || "Not specified"}</p>
                    <p><strong>Experience Required:</strong> {selectedJob.experience || "Not specified"}</p>
                    <p><strong>Education:</strong> {selectedJob.education || "Not specified"}</p>
                    <p><strong>Skills Required:</strong> {selectedJob.skills || "Not specified"}</p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Company:</strong> {getEmployerName(selectedJob.employerId)}</p>
                    <p><strong>Location:</strong> {selectedJob.location || "Not specified"}</p>
                    <p><strong>Job Type:</strong> {selectedJob.jobType || "Not specified"}</p>
                    <p><strong>Salary Range:</strong> {selectedJob.salary || "Not specified"}</p>
                    <p><strong>Work Mode:</strong> {selectedJob.workMode || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Job Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.description || "No description provided"}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Requirements
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.requirements}</p>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Benefits
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedJob.benefits}</p>
                </div>
              )}

              {/* Application Statistics */}
              <div className="p-4 bg-purple-50 rounded-xl">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Application Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{getJobStats(selectedJob.id).total}</p>
                    <p className="text-xs text-purple-600">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{getJobStats(selectedJob.id).pending}</p>
                    <p className="text-xs text-yellow-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{getJobStats(selectedJob.id).shortlisted}</p>
                    <p className="text-xs text-green-600">Shortlisted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{getJobStats(selectedJob.id).hired}</p>
                    <p className="text-xs text-purple-600">Hired</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{getJobStats(selectedJob.id).rejected}</p>
                    <p className="text-xs text-red-600">Rejected</p>
                  </div>
                </div>
              </div>

              {/* Recent Applicants */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Applicants
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getJobApplications(selectedJob.id).slice(0, 5).map(app => (
                    <div key={app.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{app.userName}</p>
                          <p className="text-xs text-gray-500">{app.userEmail}</p>
                          {app.userMobile && <p className="text-xs text-gray-500">{app.userMobile}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            app.status === "shortlisted" ? "bg-green-100 text-green-700" :
                            app.status === "hired" ? "bg-purple-100 text-purple-700" :
                            app.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {app.status || "Pending"}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{app.appliedAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getJobApplications(selectedJob.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No applications received yet</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Posted Date</p>
                  <p className="font-medium">{formatDate(selectedJob.postedAt)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Application Deadline</p>
                  <p className="font-medium">{formatDate(selectedJob.deadline) || "No deadline"}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const employer = employers.find(e => e.id === selectedJob.employerId);
                    if (employer?.email) {
                      window.location.href = `mailto:${employer.email}`;
                    } else {
                      alert("Employer email not found");
                    }
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Contact Employer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}