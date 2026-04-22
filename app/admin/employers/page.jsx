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
  deleteDoc
} from "firebase/firestore";
import { 
  Building2, 
  Briefcase, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
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
  AlertCircle,
  RefreshCw,
  Shield,
  BarChart3,
  UserPlus,
  FileText,
  MessageCircle,
  Star,
  Trash2,
  Edit2
} from "lucide-react";

export default function SuperAdminEmployersPage() {
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalHired: 0,
    activeEmployers: 0
  });

  useEffect(() => {
    fetchAllData();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Real-time employers
    const unsubscribeEmployers = onSnapshot(collection(db, "users"), (snapshot) => {
      const employersList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter(user => user.role === "employer" || user.role === "recruiter");
      
      setEmployers(employersList);
      updateStats(employersList, jobs, applications);
    });

    // Real-time jobs
    const unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date()
      }));
      setJobs(jobsList);
      updateStats(employers, jobsList, applications);
    });

    // Real-time applications
    const unsubscribeApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const appsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      }));
      setApplications(appsList);
      updateStats(employers, jobs, appsList);
    });

    return () => {
      unsubscribeEmployers();
      unsubscribeJobs();
      unsubscribeApplications();
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch employers (users with role employer)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const employersList = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter(user => user.role === "employer" || user.role === "recruiter");
      setEmployers(employersList);

      // Fetch all jobs
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate() || new Date()
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

      updateStats(employersList, jobsList, appsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (employersList, jobsList, appsList) => {
    const totalApplications = appsList.length;
    const totalHired = appsList.filter(app => app.status === "hired").length;
    const activeEmployers = employersList.filter(emp => emp.isActive !== false).length;

    setStats({
      totalEmployers: employersList.length,
      totalJobs: jobsList.length,
      totalApplications: totalApplications,
      totalHired: totalHired,
      activeEmployers: activeEmployers
    });
  };

  const getEmployerJobs = (employerId) => {
    return jobs.filter(job => job.employerId === employerId);
  };

  const getEmployerApplications = (employerId) => {
    const employerJobIds = getEmployerJobs(employerId).map(job => job.id);
    return applications.filter(app => employerJobIds.includes(app.jobId));
  };

  const getEmployerStats = (employerId) => {
    const employerJobs = getEmployerJobs(employerId);
    const employerApps = getEmployerApplications(employerId);
    const totalJobs = employerJobs.length;
    const totalApplications = employerApps.length;
    const shortlisted = employerApps.filter(app => app.status === "shortlisted").length;
    const hired = employerApps.filter(app => app.status === "hired").length;
    const viewed = employerApps.filter(app => app.status === "viewed").length;
    const pending = employerApps.filter(app => app.status === "pending").length;
    
    return { totalJobs, totalApplications, shortlisted, hired, viewed, pending };
  };

  const getTopLocations = (employerId) => {
    const employerJobs = getEmployerJobs(employerId);
    const locations = employerJobs.map(job => job.location).filter(Boolean);
    const locationCount = {};
    locations.forEach(loc => {
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    });
    return Object.entries(locationCount).slice(0, 3);
  };

  const getTopPositions = (employerId) => {
    const employerJobs = getEmployerJobs(employerId);
    const positions = employerJobs.map(job => job.title).filter(Boolean);
    const positionCount = {};
    positions.forEach(pos => {
      positionCount[pos] = (positionCount[pos] || 0) + 1;
    });
    return Object.entries(positionCount).slice(0, 3);
  };

  const getFilteredEmployers = () => {
    let filtered = [...employers];
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.mobile?.includes(searchTerm) ||
        emp.companyWebsite?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredEmployers = getFilteredEmployers();
  const totalPages = Math.ceil(filteredEmployers.length / itemsPerPage);
  const paginatedEmployers = filteredEmployers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  const StatCard = ({ label, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
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
          <p className="mt-4 text-gray-600">Loading employers data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          Employers Management
        </h1>
        <p className="text-gray-500 mt-1">Complete overview of all registered employers and their recruitment activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Employers" value={stats.totalEmployers} icon={Building2} color="bg-blue-500" />
        <StatCard label="Active Employers" value={stats.activeEmployers} icon={Users} color="bg-green-500" />
        <StatCard label="Total Jobs Posted" value={stats.totalJobs} icon={Briefcase} color="bg-purple-500" />
        <StatCard label="Total Applications" value={stats.totalApplications} icon={FileText} color="bg-orange-500" />
        <StatCard label="Total Hired" value={stats.totalHired} icon={Award} color="bg-teal-500" />
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name, employer name, email, phone, or website..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact Info</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jobs & Locations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recruitment Stats</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedEmployers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    No employers found
                  </td>
                </tr>
              ) : (
                paginatedEmployers.map((employer) => {
                  const stats = getEmployerStats(employer.id);
                  const topLocations = getTopLocations(employer.id);
                  const topPositions = getTopPositions(employer.id);
                  
                  return (
                    <tr key={employer.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{employer.companyName || employer.name || "N/A"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {employer.id.slice(0, 8)}</p>
                          {employer.companyWebsite && (
                            <a 
                              href={employer.companyWebsite} 
                              target="_blank" 
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              {employer.companyWebsite}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" /> 
                            {employer.email}
                          </p>
                          {employer.mobile && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" /> 
                              {employer.mobile}
                            </p>
                          )}
                          {employer.contactPerson && (
                            <p className="text-xs text-gray-500">Contact: {employer.contactPerson}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{stats.totalJobs} Jobs</p>
                          {topLocations.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> 
                                {topLocations.map(([loc, count]) => `${loc} (${count})`).join(", ")}
                              </p>
                            </div>
                          )}
                          {topPositions.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">
                                Top: {topPositions.map(([pos]) => pos).join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{stats.totalApplications} Applications</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-green-500" />
                            <span className="text-sm text-green-600">{stats.shortlisted} Shortlisted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-3 h-3 text-purple-500" />
                            <span className="text-sm text-purple-600">{stats.hired} Hired</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-yellow-600">{stats.pending} Pending</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{formatDate(employer.createdAt)}</p>
                        {employer.lastLogin && (
                          <p className="text-xs text-gray-400">Last login: {formatDate(employer.lastLogin?.toDate())}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedEmployer(employer);
                            setShowEmployerModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
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
              Page {currentPage} of {totalPages} ({filteredEmployers.length} employers)
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

      {/* Employer Details Modal */}
      {showEmployerModal && selectedEmployer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEmployerModal(false)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEmployer.companyName || selectedEmployer.name}</h2>
                  <p className="text-sm text-gray-500">Employer Details</p>
                </div>
              </div>
              <button onClick={() => setShowEmployerModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Company Name:</strong> {selectedEmployer.companyName || selectedEmployer.name}</p>
                    <p><strong>Industry:</strong> {selectedEmployer.industry || "Not specified"}</p>
                    <p><strong>Company Size:</strong> {selectedEmployer.companySize || "Not specified"}</p>
                    <p><strong>Website:</strong> {selectedEmployer.companyWebsite ? (
                      <a href={selectedEmployer.companyWebsite} target="_blank" className="text-blue-600 hover:underline">{selectedEmployer.companyWebsite}</a>
                    ) : "Not specified"}</p>
                    <p><strong>Description:</strong> {selectedEmployer.companyDescription || "No description"}</p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Contact Person:</strong> {selectedEmployer.contactPerson || selectedEmployer.name || "N/A"}</p>
                    <p><strong>Email:</strong> {selectedEmployer.email}</p>
                    <p><strong>Mobile:</strong> {selectedEmployer.mobile || "Not provided"}</p>
                    <p><strong>Alternate Phone:</strong> {selectedEmployer.alternatePhone || "Not provided"}</p>
                    <p><strong>Address:</strong> {selectedEmployer.address || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Recruitment Statistics */}
              <div className="p-4 bg-purple-50 rounded-xl">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Recruitment Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{getEmployerStats(selectedEmployer.id).totalJobs}</p>
                    <p className="text-xs text-purple-600">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{getEmployerStats(selectedEmployer.id).totalApplications}</p>
                    <p className="text-xs text-purple-600">Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{getEmployerStats(selectedEmployer.id).shortlisted}</p>
                    <p className="text-xs text-green-600">Shortlisted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-600">{getEmployerStats(selectedEmployer.id).hired}</p>
                    <p className="text-xs text-teal-600">Hired</p>
                  </div>
                </div>
              </div>

              {/* Jobs Posted by this Employer */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Jobs Posted ({getEmployerJobs(selectedEmployer.id).length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {getEmployerJobs(selectedEmployer.id).map(job => (
                    <div key={job.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                            {job.jobType && <span>{job.jobType}</span>}
                            {job.salary && <span>💰 {job.salary}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            {applications.filter(app => app.jobId === job.id).length} Applications
                          </p>
                          <p className="text-xs text-gray-400">
                            Posted: {job.postedAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getEmployerJobs(selectedEmployer.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No jobs posted yet</p>
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent Applications
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getEmployerApplications(selectedEmployer.id).slice(0, 5).map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    return (
                      <div key={app.id} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{app.userName}</p>
                            <p className="text-sm text-gray-600">Applied for: {job?.title || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{app.userEmail}</p>
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
                    );
                  })}
                  {getEmployerApplications(selectedEmployer.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No applications received yet</p>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowEmployerModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.location.href = `mailto:${selectedEmployer.email}`;
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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