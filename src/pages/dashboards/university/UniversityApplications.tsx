import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Eye, Filter, FileText, Search, XCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const UniversityApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applicationSearch, setApplicationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const SEEN_KEY = "institution_seen_application_ids_university";
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")));

  useEffect(() => {
    const userId = (user as any)?._id || (user as any)?.id;
    if (!userId) return;
    if (user.role !== "university") {
      navigate("/dashboard", { replace: true });
      return;
    }
    const loadApps = async () => {
      try {
        const res = await api.get("/applications/institution");
        setApplications(res.data.data || []);
      } catch (error) {
        console.error("Error loading apps", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadApps();
  }, [navigate, user]);

  const markSeen = (id: string) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const isAppNew = (app: any) => {
    const id = `${app?._id || app?.id || ""}`;
    if (!id) return false;
    if (!seenIds.has(id)) return true;
    return false;
  };

  const isUnreviewed = (status?: string) => status === "pending" || status === "under_review";

  const filteredApplications = useMemo(() => {
    const q = applicationSearch.trim().toLowerCase();
    return applications.filter((a) => {
      if (q) {
        const name = (a.student?.name || a.studentName || "").toLowerCase();
        const prog = (a.program?.title || a.targetTitle || a.programTitle || "").toLowerCase();
        if (!name.includes(q) && !prog.includes(q)) return false;
      }
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [applications, applicationSearch, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      underReview: applications.filter((a) => a.status === "under_review").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  }, [applications]);

  const setStatusFromCard = (value: "all" | "pending" | "under_review" | "accepted" | "rejected") => {
    setStatusFilter(value);
  };

  const handleStatusChange = async (id: string, status: "pending" | "under_review" | "accepted" | "rejected") => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications((prev) => prev.map((app) => ((app._id || app.id) === id ? { ...app, status } : app)));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            Back
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold">Applications</h2>
            <p className="text-sm text-muted-foreground">Review and manage applications for your programs</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { key: "all" as const, label: "Total", value: stats.total, icon: FileText, color: "bg-primary/10 text-primary" },
            { key: "pending" as const, label: "Pending", value: stats.pending, icon: Clock, color: "bg-warning/10 text-warning" },
            { key: "under_review" as const, label: "Under Review", value: stats.underReview, icon: Clock, color: "bg-accent/10 text-accent" },
            { key: "accepted" as const, label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "bg-success/10 text-success" },
            { key: "rejected" as const, label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-destructive/10 text-destructive" },
          ].map((s) => (
            <Card
              key={s.label}
              role="button"
              tabIndex={0}
              onClick={() => setStatusFromCard(s.key)}
              onKeyDown={(e) => e.key === "Enter" && setStatusFromCard(s.key)}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/40",
                statusFilter === s.key && "border-accent bg-accent/5"
              )}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Student Applications</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={applicationSearch}
                  onChange={(e) => setApplicationSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 sm:w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow
                      key={app._id || app.id}
                      className={cn(isUnreviewed(app.status) && "bg-accent/5")}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{app.student?.name || app.studentName}</span>
                          {isAppNew(app) && (
                            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{app.program?.title || app.targetTitle || app.programTitle || "—"}</TableCell>
                      <TableCell>{app.student?.academicInfo?.[0]?.cgpa || app.studentCgpa}</TableCell>
                      <TableCell>{new Date(app.createdAt || app.appliedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={app.status}
                          onValueChange={(value) =>
                            handleStatusChange(app._id || app.id, value as "pending" | "under_review" | "accepted" | "rejected")
                          }
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="inline-flex items-center gap-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                          onClick={() => {
                            const id = `${app._id || app.id || ""}`;
                            if (id) markSeen(id);
                            navigate(`/dashboard/applications/${app._id || app.id}`);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!isLoading && filteredApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UniversityApplications;
