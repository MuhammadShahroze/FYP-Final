import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Calendar, CheckCircle2, Clock, Plus, Search, Trash2, Users, XCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

const OrgScholarships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scholarshipSearch, setScholarshipSearch] = useState("");
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = (user as any)?._id || (user as any)?.id;
    if (!userId) return;
    if (user?.role !== "scholarship_org") {
      navigate("/dashboard", { replace: true });
      return;
    }
    const loadData = async () => {
      try {
        const [schRes, appsRes] = await Promise.all([
          api.get("/scholarships/org/me"),
          api.get("/applications/institution")
        ]);
        setScholarships(schRes.data.data || []);
        setApplications(appsRes.data.data || []);
      } catch (error) {
        console.error("Error loading org scholarship data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [navigate, user?.role, user]);

  const appsByScholarshipId = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const a of applications) {
      const sid = a.scholarship?._id || a.scholarship;
      if (!sid) continue;
      const list = map.get(sid) ?? [];
      list.push(a);
      map.set(sid, list);
    }
    return map;
  }, [applications]);

  const filteredScholarships = useMemo(() => {
    const q = scholarshipSearch.trim().toLowerCase();
    if (!q) return scholarships;
    return scholarships.filter((s) => s.title.toLowerCase().includes(q));
  }, [scholarshipSearch, scholarships]);

  const handleDeleteScholarship = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this scholarship?")) return;
    try {
      await api.delete(`/scholarships/${id}`);
      setScholarships((prev) => prev.filter((s) => (s._id || s.id) !== id));
      setApplications((prev) => prev.filter((a) => (a.scholarship?._id || a.scholarship) !== id));
    } catch (error) {
      console.error("Failed to delete scholarship", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
              Back
            </Button>
            <div>
              <h2 className="font-display text-xl font-bold">Scholarships</h2>
              <p className="text-sm text-muted-foreground">Manage your scholarships and track applications</p>
            </div>
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <Link to="/dashboard/scholarships/create">
              <Plus className="mr-2 h-4 w-4" /> Create Scholarship
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Your Scholarships</CardTitle>
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={scholarshipSearch}
                onChange={(e) => setScholarshipSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Loading scholarships...</p>
                </div>
              )}
              {!isLoading && filteredScholarships.map((scholarship) => {
                const sid = scholarship._id || scholarship.id;
                const apps = appsByScholarshipId.get(sid) ?? [];
                const accepted = apps.filter((a) => a.status === "accepted").length;
                const pending = apps.filter((a) => a.status === "pending").length;
                const rejected = apps.filter((a) => a.status === "rejected").length;

                return (
                  <Card key={sid} className="border">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{scholarship.title}</h3>
                            <Badge variant="secondary">{scholarship.type}</Badge>
                            <Badge variant={scholarship.status === "active" ? "default" : "outline"}>
                              {scholarship.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" /> {apps.length} applications
                            </span>
                            <span className={cn("flex items-center gap-1", accepted > 0 && "text-success")}>
                              <CheckCircle2 className="h-4 w-4" /> {accepted} accepted
                            </span>
                            <span className={cn("flex items-center gap-1", pending > 0 && "text-warning")}>
                              <Clock className="h-4 w-4" /> {pending} pending
                            </span>
                            <span className={cn("flex items-center gap-1", rejected > 0 && "text-destructive")}>
                              <XCircle className="h-4 w-4" /> {rejected} rejected
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> Deadline: {formatDate(scholarship.deadline)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                            <Link to={`/scholarships/${sid}`}>
                              <Award className="mr-1 h-3 w-3" /> View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/dashboard/scholarships/${sid}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteScholarship(sid)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {!isLoading && filteredScholarships.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Award className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p>No scholarships found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrgScholarships;
