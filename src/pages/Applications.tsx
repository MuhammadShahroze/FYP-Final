import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  submitted: { label: "Submitted", color: "bg-primary/10 text-primary", icon: Send },
  under_review: { label: "Under Review", color: "bg-accent/10 text-accent", icon: Clock },
  pending: { label: "Pending", color: "bg-accent/10 text-accent", icon: Clock },
  accepted: { label: "Accepted", color: "bg-success/10 text-success", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
  documents_requested: { label: "Docs Requested", color: "bg-warning/10 text-warning", icon: AlertCircle },
};

const Applications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const [rawApplications, setRawApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchApps = async () => {
      try {
        const res = await api.get("/applications/me");
        setRawApplications(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, [user]);

  const applications = useMemo(() => {
    return rawApplications.map((a) => {
      const programName =
        a.program?.title ||
        a.scholarship?.title ||
        a.targetTitle ||
        a.programTitle ||
        a.scholarshipTitle ||
        "—";
      const university =
        a.program?.owner?.name ||
        a.scholarship?.owner?.name ||
        a.program?.ownerName ||
        a.scholarship?.ownerName ||
        a.targetOwnerName ||
        "—";
      const displayStatus = a.status || "under_review";
      const docs = a.documents ?? [];

      return {
        id: a._id || a.id,
        programId: a.program?._id || (a.targetType === "program" ? a.targetId : undefined) || a.programId,
        scholarshipId: a.scholarship?._id || (a.targetType === "scholarship" ? a.targetId : undefined) || a.scholarshipId,
        programName,
        university,
        status: displayStatus,
        appliedDate: new Date(a.createdAt || a.appliedDate).toLocaleDateString(),
        documentsSubmitted: docs,
        documentsRequired: docs,
      };
    });
  }, [rawApplications]);

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const stats = {
    total: applications.length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    pending: applications.filter((a) => a.status === "under_review").length,
    drafts: applications.filter((a) => a.status === "draft").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold">My Applications</h2>
            <p className="text-sm text-muted-foreground">Track and manage your program and scholarship applications</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "bg-primary/10 text-primary" },
            { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "bg-success/10 text-success" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "bg-accent/10 text-accent" },
            { label: "Drafts", value: stats.drafts, icon: FileText, color: "bg-muted text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filtered.map((app) => {
            const config = statusConfig[app.status] ?? statusConfig.under_review;
            const docsTotal = app.documentsRequired.length || 1;
            const docsProgress = Math.round((app.documentsSubmitted.length / docsTotal) * 100);
            const viewLink = app.programId ? `/programs/${app.programId}` : app.scholarshipId ? `/scholarships/${app.scholarshipId}` : "#";

            return (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">Application</span>
                        <div>
                          <h3 className="font-semibold">{app.programName}</h3>
                          <p className="text-sm text-muted-foreground">{app.university}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={config.color}>
                          <config.icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Applied: {app.appliedDate}</span>
                      </div>
                      {app.documentsSubmitted.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Documents</span>
                            <span className="font-medium">{app.documentsSubmitted.length}/{docsTotal}</span>
                          </div>
                          <Progress value={docsProgress} className="h-1.5" />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.documentsRequired.map((doc: any, index: number) => {
                              const docLabel = typeof doc === "string" ? doc : doc?.name || `Document ${index + 1}`;
                              const docKey = typeof doc === "string" ? doc : doc?._id || doc?.name || index;
                              return (
                                <Badge key={docKey} variant="default" className="text-[10px] px-1.5 py-0">
                                  {docLabel}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {app.status === "accepted" && (
                        <Button size="sm" variant="outline">
                          Download Letter
                        </Button>
                      )}
                      {viewLink !== "#" && (
                        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                          <Link to={viewLink}>
                            {app.programId ? "View Program" : "View Scholarship"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {isLoading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading applications...
              </CardContent>
            </Card>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No applications found in this category.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Applications;
