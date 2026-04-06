import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, BookOpen, Award, Clock, ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";
import { getPrograms, getScholarships } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";

type AlertType = "admission" | "scholarship" | "deadline";
type AlertData = {
  id: string;
  title: string;
  type: AlertType;
  createdAt: string;
  href: string;
  isRead: boolean;
};

const typeConfig: Record<AlertType, { label: string; icon: React.ReactNode; color: string }> = {
  admission: { label: "Admission", icon: <BookOpen className="h-4 w-4" />, color: "bg-primary/10 text-primary" },
  scholarship: { label: "Scholarship", icon: <Award className="h-4 w-4" />, color: "bg-accent/10 text-accent-foreground" },
  deadline: { label: "Deadline", icon: <Clock className="h-4 w-4" />, color: "bg-destructive/10 text-destructive" },
};

const filterOptions: (AlertType | "all")[] = ["all", "admission", "scholarship", "deadline"];
const ALERT_READ_KEY = "student_alerts_read_ids";
const ALERT_DELETED_KEY = "student_alerts_deleted_ids";

const Alerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertType | "all">("all");
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readIds = new Set<string>(JSON.parse(localStorage.getItem(ALERT_READ_KEY) || "[]"));
    const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(ALERT_DELETED_KEY) || "[]"));
    const preferredSubjects = user?.preferences?.subjects || [];
    const preferredDegrees = user?.preferences?.degreeLevels || [];
    const preferredCountries = user?.preferences?.countries || [];
    const cgpa = user?.academicInfo?.[0]?.cgpa ? parseFloat(user.academicInfo[0].cgpa) : undefined;

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

    const run = async () => {
      try {
        const [pRes, sRes] = await Promise.all([getPrograms(), getScholarships()]);
        const allPrograms = pRes.data || [];
        const allScholarships = sRes.data || [];
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const recommendedPrograms = allPrograms.filter((p: any) => {
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

        const recommendedScholarships = allScholarships.filter((s: any) => {
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

        const matchAlerts: AlertData[] = [
          ...recommendedPrograms.map((p: any) => ({
            id: `prog-${p._id || p.id}`,
            title: `Program match: ${p.title}`,
            type: "admission" as const,
            createdAt: p.createdAt || todayStr,
            href: `/programs/${p._id || p.id}`,
            isRead: readIds.has(`prog-${p._id || p.id}`),
          })),
          ...recommendedScholarships.map((s: any) => ({
            id: `sch-${s._id || s.id}`,
            title: `Scholarship match: ${s.title}`,
            type: "scholarship" as const,
            createdAt: s.createdAt || todayStr,
            href: `/scholarships/${s._id || s.id}`,
            isRead: readIds.has(`sch-${s._id || s.id}`),
          })),
        ];

        const deadlineAlerts: AlertData[] = [...allPrograms, ...allScholarships]
          .filter((item: any) => {
            const raw = item.deadline;
            if (!raw) return false;
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return false;
            const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 15;
          })
          .map((item: any) => {
            const id = `deadline-${item._id || item.id}`;
            return {
              id,
              title: `Upcoming deadline: ${item.title}`,
              type: "deadline",
              createdAt: todayStr,
              href: item.organization || item.type ? `/scholarships/${item._id || item.id}` : `/programs/${item._id || item.id}`,
              isRead: readIds.has(id),
            };
          });

        const dynamicAlerts = [...matchAlerts, ...deadlineAlerts]
          .filter((a) => !deletedIds.has(a.id))
          .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAlerts(dynamicAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "all" ? alerts : alerts.filter((a) => a.type === filter)),
    [alerts, filter]
  );
  const counts = useMemo(
    () => ({
      all: alerts.filter((a) => !a.isRead).length,
      admission: alerts.filter((a) => a.type === "admission" && !a.isRead).length,
      scholarship: alerts.filter((a) => a.type === "scholarship" && !a.isRead).length,
      deadline: alerts.filter((a) => a.type === "deadline" && !a.isRead).length,
    }),
    [alerts]
  );

  const saveReadIds = (next: Set<string>) => {
    localStorage.setItem(ALERT_READ_KEY, JSON.stringify(Array.from(next)));
  };

  const markAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    const readIds = new Set<string>(JSON.parse(localStorage.getItem(ALERT_READ_KEY) || "[]"));
    readIds.add(id);
    saveReadIds(readIds);
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const deletedIds = new Set<string>(JSON.parse(localStorage.getItem(ALERT_DELETED_KEY) || "[]"));
    deletedIds.add(id);
    localStorage.setItem(ALERT_DELETED_KEY, JSON.stringify(Array.from(deletedIds)));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Alerts</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-primary text-primary-foreground" : ""}
            >
              {f === "all"
                ? `All (${counts.all})`
                : `${typeConfig[f as AlertType].label} (${counts[f as AlertType]})`}
            </Button>
          ))}
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">Loading alerts...</div>
          ) : filtered.map((alert) => {
            const config = typeConfig[alert.type];
            return (
              <Card key={alert.id} className={cn(!alert.isRead && "border-primary/30 bg-primary/5")}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", config.color)}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={alert.href}
                          onClick={() => markAsRead(alert.id)}
                          className={cn("text-sm hover:underline", !alert.isRead ? "font-semibold" : "font-medium")}
                        >
                          {alert.title}
                        </Link>
                        {!alert.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {!alert.isRead && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => markAsRead(alert.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{config.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!loading && filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No alerts in this category</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
