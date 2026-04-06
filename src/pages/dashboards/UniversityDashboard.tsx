import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock, FileText, Plus, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import {
  api
} from "@/lib/api";

const UniversityDashboard = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load only this university's programs and applications
  useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const [progRes, appsRes] = await Promise.all([
          api.get("/programs/university/me"),
          api.get("/applications/institution")
        ]);
        setPrograms(progRes.data.data || []);
        setApplications(appsRes.data.data || []);
      } catch (error) {
        console.error("Error loading university data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.role === "university") {
      fetchInstitutionData();
    }
  }, [user]);

  const totalApplications = applications.length;
  const pendingApplications = applications.filter(a => a.status === "pending").length;
  const acceptedApplications = applications.filter(a => a.status === "accepted").length;
  const rejectedApplications = applications.filter(a => a.status === "rejected").length;

  // Analytics data (real, derived from fetched applications/programs)
  const monthBuckets = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleString("default", { month: "short" }),
      applications: 0,
      accepted: 0,
      rejected: 0,
    };
  });

  const applicationTrends = monthBuckets.map((bucket) => ({ ...bucket }));
  applications.forEach((app) => {
    const rawDate = app.createdAt || app.appliedDate;
    const dt = rawDate ? new Date(rawDate) : null;
    if (!dt || Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const index = applicationTrends.findIndex((m) => m.key === key);
    if (index === -1) return;
    applicationTrends[index].applications += 1;
    if (app.status === "accepted") applicationTrends[index].accepted += 1;
    if (app.status === "rejected") applicationTrends[index].rejected += 1;
  });

  const appCountsByProgramId = new Map<string, { applications: number; accepted: number }>();
  applications.forEach((app) => {
    const programId = `${app.program?._id || app.program || app.programId || ""}`;
    if (!programId) return;
    const current = appCountsByProgramId.get(programId) || { applications: 0, accepted: 0 };
    current.applications += 1;
    if (app.status === "accepted") current.accepted += 1;
    appCountsByProgramId.set(programId, current);
  });

  const programStats = programs
    .map((program) => {
      const id = `${program._id || program.id || ""}`;
      const counters = appCountsByProgramId.get(id) || { applications: 0, accepted: 0 };
      return {
        name: program.title || "Untitled",
        applications: counters.applications,
        accepted: counters.accepted,
      };
    })
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 8);

  const analyticsConfig = {
    applications: {
      label: "Applications",
      theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
    },
    accepted: {
      label: "Accepted",
      theme: { light: "hsl(var(--success))", dark: "hsl(var(--success))" },
    },
    rejected: {
      label: "Rejected",
      theme: { light: "hsl(var(--destructive))", dark: "hsl(var(--destructive))" },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Welcome, {user?.name}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your programs and review student applications
              </p>
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <Link to="/dashboard/programs/create">
                <Plus className="mr-2 h-4 w-4" /> Create Program
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{programs.length}</p>
                  <p className="text-xs text-muted-foreground">Active Programs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalApplications}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingApplications}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedApplications}</p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Trends</CardTitle>
              <p className="text-xs text-muted-foreground">Monthly application and acceptance rates</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={analyticsConfig} className="h-64 w-full">
                <LineChart data={applicationTrends} margin={{ left: 12, right: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="var(--color-applications)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    stroke="var(--color-accepted)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="var(--color-rejected)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Performance</CardTitle>
              <p className="text-xs text-muted-foreground">Applications and acceptances by program</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={analyticsConfig} className="h-64 w-full">
                <BarChart data={programStats} margin={{ left: 12, right: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="applications" fill="var(--color-applications)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" fill="var(--color-accepted)" radius={[4, 4, 0, 0]} />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick access */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/dashboard/programs">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Programs</p>
                  <p className="text-xs text-muted-foreground">View, create, and manage your programs</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/applications">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Applications</p>
                  <p className="text-xs text-muted-foreground">Review and manage student applications</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UniversityDashboard;
