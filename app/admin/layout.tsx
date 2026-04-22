import AdminSidebar from "@/app/components/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard - JobSolution",
  description: "Manage jobs, applications, and users",
};

export default function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <AdminSidebar>{children}</AdminSidebar>;
}