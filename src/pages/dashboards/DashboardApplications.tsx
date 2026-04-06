import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Applications from "@/pages/Applications";
import UniversityApplications from "@/pages/dashboards/university/UniversityApplications";
import OrgApplications from "@/pages/dashboards/org/OrgApplications";

const DashboardApplications = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "student") return <Applications />;
  if (user.role === "university") return <UniversityApplications />;
  if (user.role === "scholarship_org") return <OrgApplications />;

  return <Navigate to="/dashboard" replace />;
};

export default DashboardApplications;

