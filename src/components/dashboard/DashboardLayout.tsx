import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap, LayoutDashboard, User, Bell, BookOpen,
  LogOut, Menu, X, Building2, Award, Shield, FileText, Users,
  CreditCard, ClipboardList, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPrograms, getScholarships } from "@/lib/dataService";

const getNavItems = (role: UserRole, alertsUnreadCount = 0) => {
  const baseItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  switch (role) {
    case "student":
      return [
        ...baseItems,
        { to: "/dashboard/profile", label: "Profile", icon: User },
        { to: "/dashboard/applications", label: "Applications", icon: ClipboardList },
        { to: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
        { to: "/dashboard/visa-hub", label: "Visa & Doc Guide", icon: Globe },
        { to: "/dashboard/alerts", label: alertsUnreadCount > 0 ? `Alerts (${alertsUnreadCount})` : "Alerts", icon: Bell },
        { to: "/programs?tab=programs", label: "Programs", icon: BookOpen },
        { to: "/programs?tab=scholarships", label: "Scholarships", icon: Award },
      ];
    case "university":
      return [
        ...baseItems,
        { to: "/dashboard/programs", label: "Programs", icon: BookOpen },
        { to: "/dashboard/applications", label: "Applications", icon: FileText },
        { to: "/dashboard/profile", label: "Profile", icon: User },
      ];
    case "scholarship_org":
      return [
        ...baseItems,
        { to: "/dashboard/scholarships", label: "Scholarships", icon: Award },
        { to: "/dashboard/applications", label: "Applications", icon: FileText },
        { to: "/dashboard/profile", label: "Profile", icon: User },
      ];
    case "admin":
      return [
        ...baseItems,
        { to: "/dashboard/users", label: "Users", icon: Users },
        { to: "/dashboard/institutions", label: "Institutions", icon: Building2 },
        { to: "/dashboard/subscriptions", label: "Subscriptions", icon: Shield },
        { to: "/dashboard/blogs", label: "Visa & Doc Guide", icon: FileText },
      ];
    default:
      return baseItems;
  }
};

import AIChatbot from "./AIChatbot";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsUnreadCount, setAlertsUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "student") return;
    const run = async () => {
      try {
        const [pRes, sRes] = await Promise.all([getPrograms(), getScholarships()]);
        const programs = pRes.data || [];
        const scholarships = sRes.data || [];
        const preferredSubjects = user?.preferences?.subjects || [];
        const preferredDegrees = user?.preferences?.degreeLevels || [];
        const preferredCountries = user?.preferences?.countries || [];
        const cgpa = user?.academicInfo?.[0]?.cgpa ? parseFloat(user.academicInfo[0].cgpa) : undefined;
        const now = new Date();
        const readIds = new Set<string>(JSON.parse(localStorage.getItem("student_alerts_read_ids") || "[]"));
        const deletedIds = new Set<string>(JSON.parse(localStorage.getItem("student_alerts_deleted_ids") || "[]"));

        const normalizeArrayField = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
          if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean);
          return [];
        };
        const normalizeCourseType = (value?: string) => {
          if (!value) return "";
          const lower = value.toLowerCase();
          if (lower.includes("master")) return "Master's";
          if (lower.includes("phd") || lower.includes("doctor")) return "PhD";
          if (lower.includes("bachelor")) return "Bachelor's";
          return value;
        };

        const recommendedPrograms = programs.filter((p: any) => {
          if (p.status !== "active") return false;
          const pSubjects = normalizeArrayField(p.subjectGroups);
          if (preferredSubjects.length && preferredSubjects[0] !== "All Subjects") {
            if (!preferredSubjects.some((s: string) => pSubjects.includes(s))) return false;
          }
          if (preferredDegrees.length && preferredDegrees[0] !== "All Levels") {
            const degreeCandidate = normalizeCourseType(p.degreeLevel || p.courseType);
            if (!preferredDegrees.some((d: string) => normalizeCourseType(d).toLowerCase() === degreeCandidate.toLowerCase())) return false;
          }
          if (preferredCountries.length && preferredCountries[0] !== "All Countries") {
            const countryCandidate =
              p.country ||
              (typeof p.location === "string" && p.location.includes(",") ? p.location.split(",").pop()?.trim() : "");
            if (!countryCandidate || !preferredCountries.includes(countryCandidate)) return false;
          }
          if (cgpa && p.cgpaRequirement) {
            const required = parseFloat(p.cgpaRequirement);
            if (!Number.isNaN(required) && cgpa < required) return false;
          }
          return true;
        });

        const recommendedScholarships = scholarships.filter((s: any) => {
          if (s.status !== "active") return false;
          const sSubjects = normalizeArrayField(s.subjectGroups);
          if (preferredSubjects.length && preferredSubjects[0] !== "All Subjects") {
            if (!preferredSubjects.some((subj: string) => sSubjects.includes(subj))) return false;
          }
          if (preferredDegrees.length && preferredDegrees[0] !== "All Levels") {
            const degreeCandidate = normalizeCourseType(s.degreeLevel || s.courseType);
            if (!preferredDegrees.some((d: string) => normalizeCourseType(d).toLowerCase() === degreeCandidate.toLowerCase())) return false;
          }
          if (preferredCountries.length && preferredCountries[0] !== "All Countries") {
            if (!s.country || !preferredCountries.includes(s.country)) return false;
          }
          if (cgpa && s.cgpaRequirement) {
            const required = parseFloat(s.cgpaRequirement);
            if (!Number.isNaN(required) && cgpa < required) return false;
          }
          return true;
        });

        const matchIds = [
          ...recommendedPrograms.map((p: any) => `prog-${p._id || p.id}`),
          ...recommendedScholarships.map((s: any) => `sch-${s._id || s.id}`),
        ];
        const deadlineIds = [...programs, ...scholarships]
          .filter((item: any) => {
            const raw = item.deadline;
            if (!raw) return false;
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return false;
            const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 15;
          })
          .map((item: any) => `deadline-${item._id || item.id}`);

        const totalIds = [...matchIds, ...deadlineIds].filter((id) => !deletedIds.has(id));
        const unread = totalIds.filter((id) => !readIds.has(id)).length;
        setAlertsUnreadCount(unread);
      } catch {
        setAlertsUnreadCount(0);
      }
    };
    run();
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = getNavItems(user?.role || "student", alertsUnreadCount);
  const dashboardLogoTarget = user?.role === "student" ? "/" : "/dashboard";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card/80 backdrop-blur-md transition-transform md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to={dashboardLogoTarget} className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">EduDuctor</span>
          </Link>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                `${location.pathname}${location.search}` === item.to || (item.to.startsWith("/programs") && location.pathname === "/programs" && location.search.includes(item.to.includes("scholarships") ? "tab=scholarships" : "tab=programs"))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user?.avatar || user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 md:px-6">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-semibold">
            {navItems.find((n) => `${location.pathname}${location.search}` === n.to || (n.to.startsWith("/programs") && location.pathname === "/programs"))?.label || "Dashboard"}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {/* AI Chatbot for Pro Students */}
      <AIChatbot />
    </div>
  );
};

export default DashboardLayout;
