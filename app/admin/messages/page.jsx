"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { 
  Mail, 
  Send, 
  Users, 
  Briefcase, 
  Building2,
  XCircle,
  CheckCircle,
  Search,
  RefreshCw,
  MessageSquare,
  UserCheck,
  Clock,
  Eye,
  Star,
  Award,
  Phone,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Copy,
  Check
} from "lucide-react";

export default function SuperAdminMessagesPage() {
  const [jobseekers, setJobseekers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentEmails, setSentEmails] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailType, setEmailType] = useState("bulk");
  const [singleEmail, setSingleEmail] = useState({
    to: "",
    subject: "",
    body: ""
  });

  useEffect(() => {
    fetchUsers();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      const jobseekersList = usersList.filter(u => u.role === "jobseeker" || !u.role);
      const employersList = usersList.filter(u => u.role === "employer" || u.role === "recruiter");
      
      setJobseekers(jobseekersList);
      setEmployers(employersList);
    });
    
    return () => unsubscribeUsers();
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      const jobseekersList = usersList.filter(u => u.role === "jobseeker" || !u.role);
      const employersList = usersList.filter(u => u.role === "employer" || u.role === "recruiter");
      
      setJobseekers(jobseekersList);
      setEmployers(employersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getFilteredUsers = () => {
    let users = [];
    if (selectedTab === "jobseekers") users = [...jobseekers];
    else if (selectedTab === "employers") users = [...employers];
    else users = [...jobseekers, ...employers];
    
    if (searchTerm) {
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
      );
    }
    
    return users;
  };

  const filteredUsers = getFilteredUsers();

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredUsers.map(user => user.email));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (email) => {
    if (selectedRecipients.includes(email)) {
      setSelectedRecipients(selectedRecipients.filter(e => e !== email));
    } else {
      setSelectedRecipients([...selectedRecipients, email]);
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedRecipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }
    if (!emailSubject.trim()) {
      alert("Please enter email subject");
      return;
    }
    if (!emailBody.trim()) {
      alert("Please enter email body");
      return;
    }
    
    setSending(true);
    
    const emailPromises = selectedRecipients.map(async (recipient) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            to: recipient,
            subject: emailSubject,
            body: emailBody,
            sentAt: new Date(),
            status: "sent"
          });
        }, 100);
      });
    });
    
    const results = await Promise.all(emailPromises);
    setSentEmails([...results, ...sentEmails]);
    
    alert(`Email sent to ${selectedRecipients.length} recipients!`);
    setEmailSubject("");
    setEmailBody("");
    setSelectedRecipients([]);
    setSelectAll(false);
    setSending(false);
  };

  const handleSendSingleEmail = async () => {
    if (!singleEmail.to) {
      alert("Please enter recipient email");
      return;
    }
    if (!singleEmail.subject.trim()) {
      alert("Please enter email subject");
      return;
    }
    if (!singleEmail.body.trim()) {
      alert("Please enter email body");
      return;
    }
    
    setSending(true);
    
    setTimeout(() => {
      setSentEmails([{
        to: singleEmail.to,
        subject: singleEmail.subject,
        body: singleEmail.body,
        sentAt: new Date(),
        status: "sent"
      }, ...sentEmails]);
      
      alert(`Email sent to ${singleEmail.to}!`);
      setSingleEmail({ to: "", subject: "", body: "" });
      setSending(false);
    }, 500);
  };

  const handleSendToAll = () => {
    const allEmails = filteredUsers.map(user => user.email);
    setSelectedRecipients(allEmails);
    setSelectAll(true);
  };

  const handleClearSelection = () => {
    setSelectedRecipients([]);
    setSelectAll(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEmailTemplate = (type) => {
    const templates = {
      welcome: {
        subject: "Welcome to JobSolution Platform!",
        body: `Dear User,\n\nWelcome to JobSolution! We're excited to have you on board.\n\nOur platform connects talented job seekers with great employers. Here's what you can do:\n\n• Create and update your profile\n• Apply to thousands of jobs\n• Track your applications\n• Get hired faster\n\nIf you need any assistance, feel free to reply to this email.\n\nBest regards,\nJobSolution Team`
      },
      interview: {
        subject: "Interview Invitation Update",
        body: `Dear Candidate,\n\nGreetings from JobSolution!\n\nWe wanted to inform you that multiple employers have shown interest in your profile. Keep checking your dashboard for interview invitations.\n\nTips for success:\n• Keep your profile updated\n• Respond quickly to messages\n• Prepare well for interviews\n\nGood luck with your job search!\n\nBest regards,\nJobSolution Team`
      },
      hiring: {
        subject: "Job Opportunity Alert!",
        body: `Dear Job Seeker,\n\nGreat news! There are new job opportunities matching your profile on JobSolution.\n\nLogin to your dashboard to:\n• View recommended jobs\n• Apply instantly\n• Track your applications\n\nDon't miss out on these opportunities!\n\nBest regards,\nJobSolution Team`
      },
      employer: {
        subject: "Post More Jobs & Find Top Talent",
        body: `Dear Employer,\n\nHope you're finding great candidates on JobSolution!\n\nDid you know? Companies that post regularly get 3x more qualified applicants.\n\nPost new jobs today and get:\n• AI-powered candidate matching\n• Instant notifications\n• Detailed analytics\n\nLogin to your employer dashboard now!\n\nBest regards,\nJobSolution Team`
      }
    };
    
    return templates[type] || templates.welcome;
  };

  const applyTemplate = (type) => {
    const template = getEmailTemplate(type);
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Messages Center
        </h1>
        <p className="text-gray-500 mt-1">Send emails to jobseekers, employers, or both</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Jobseekers" value={jobseekers.length} icon={Users} color="bg-blue-500" />
        <StatCard label="Total Employers" value={employers.length} icon={Building2} color="bg-green-500" />
        <StatCard label="Emails Sent" value={sentEmails.length} icon={Mail} color="bg-purple-500" />
        <StatCard label="Total Users" value={jobseekers.length + employers.length} icon={UserCheck} color="bg-orange-500" />
      </div>

      {/* Email Type Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-2 border-b pb-3">
          <button
            onClick={() => setEmailType("bulk")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              emailType === "bulk" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Bulk Email
          </button>
          <button
            onClick={() => setEmailType("single")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              emailType === "single" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Single Email
          </button>
        </div>
      </div>

      {/* Bulk Email Section */}
      {emailType === "bulk" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - User Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      selectedTab === "all" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({jobseekers.length + employers.length})
                  </button>
                  <button
                    onClick={() => setSelectedTab("jobseekers")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      selectedTab === "jobseekers" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Jobseekers ({jobseekers.length})
                  </button>
                  <button
                    onClick={() => setSelectedTab("employers")}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      selectedTab === "employers" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Employers ({employers.length})
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {selectAll ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleSendToAll}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Send to All
                  </button>
                </div>
              </div>
              
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectAll(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(user.email)}
                        onChange={() => handleSelectUser(user.email)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.name || user.companyName || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.role === "employer" && user.companyName && (
                          <p className="text-xs text-gray-400">Company: {user.companyName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === "employer" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role === "employer" ? "Employer" : "Jobseeker"}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                Selected: <strong>{selectedRecipients.length}</strong> recipients
              </p>
              {selectedRecipients.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Email Composition */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Compose Email</h3>
              <p className="text-sm text-gray-500">Send to {selectedRecipients.length} recipient(s)</p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => applyTemplate("welcome")} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Welcome</button>
                  <button onClick={() => applyTemplate("interview")} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Interview</button>
                  <button onClick={() => applyTemplate("hiring")} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Job Alert</button>
                  <button onClick={() => applyTemplate("employer")} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">For Employers</button>
                </div>
              </div>
              
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {/* Preview Button */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-blue-600 text-sm hover:underline"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
              
              {/* Preview */}
              {showPreview && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Email Preview</h4>
                  <p className="text-sm text-gray-500 mb-2">To: {selectedRecipients.length} recipient(s)</p>
                  <p className="text-sm font-medium text-gray-700">Subject: {emailSubject || "[No Subject]"}</p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm whitespace-pre-wrap text-gray-700">{emailBody || "[No Message]"}</p>
                  </div>
                </div>
              )}
              
              {/* Send Button */}
              <button
                onClick={handleSendBulkEmail}
                disabled={selectedRecipients.length === 0 || !emailSubject || !emailBody || sending}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to {selectedRecipients.length} Recipient(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Email Section */}
      {emailType === "single" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - User Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Find User</h3>
              <p className="text-sm text-gray-500">Search and select a user to email</p>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSingleEmail({ ...singleEmail, to: user.email })}
                    className={`p-3 rounded-lg cursor-pointer transition mb-2 ${
                      singleEmail.to === user.email
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.name || user.companyName || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {singleEmail.to === user.email && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Email Composition */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Send Email</h3>
              <p className="text-sm text-gray-500">Compose and send to selected user</p>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                <input
                  type="email"
                  value={singleEmail.to}
                  onChange={(e) => setSingleEmail({ ...singleEmail, to: e.target.value })}
                  placeholder="Enter email address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={singleEmail.subject}
                  onChange={(e) => setSingleEmail({ ...singleEmail, subject: e.target.value })}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={singleEmail.body}
                  onChange={(e) => setSingleEmail({ ...singleEmail, body: e.target.value })}
                  placeholder="Write your message here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <button
                onClick={handleSendSingleEmail}
                disabled={!singleEmail.to || !singleEmail.subject || !singleEmail.body || sending}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sent Emails History */}
      {sentEmails.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Recent Sent Emails
          </h3>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Sent At</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sentEmails.slice(0, 10).map((email, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{email.to}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{email.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-500">{email.sentAt.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Sent
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyToClipboard(email.body)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          Copy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}