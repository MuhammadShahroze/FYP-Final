import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Users, Building2, CreditCard, FileText, Shield, TrendingUp, AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useTemplates } from "@/contexts/TemplateContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [guides, setGuides] = useState<any[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  
  const [guideForm, setGuideForm] = useState({
    country: "",
    visaType: "",
    processingTime: "",
    cost: "",
  });
  const [guideRequirements, setGuideRequirements] = useState<string[]>([]);
  const [guideSteps, setGuideSteps] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [newStep, setNewStep] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [guideSearch, setGuideSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [allScholarships, setAllScholarships] = useState<any[]>([]);
  const [institutionTypeFilter, setInstitutionTypeFilter] = useState<"all" | "university" | "scholarship_org">("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDialogTitle, setDetailDialogTitle] = useState("");
  const [detailRows, setDetailRows] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [usersRes, programsRes, scholarshipsRes] = await Promise.all([
          api.get("/users"),
          api.get("/programs"),
          api.get("/scholarships"),
        ]);
        setUsers(usersRes.data.data || []);
        setAllPrograms(programsRes.data.data || []);
        setAllScholarships(scholarshipsRes.data.data || []);
      } catch (err) {
        console.error("Failed to load users for admin:", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await api.get("/visas");
        setGuides(res.data.data || []);
      } catch (err) {
        console.error("Failed to load visa guides for admin:", err);
      } finally {
        setIsLoadingGuides(false);
      }
    };
    fetchGuides();
  }, []);

  const countByOwnerId = useMemo(() => {
    const counter = new Map<string, number>();
    const increment = (ownerCandidate: any) => {
      const ownerId = `${ownerCandidate || ""}`;
      if (!ownerId) return;
      counter.set(ownerId, (counter.get(ownerId) || 0) + 1);
    };
    allPrograms.forEach((p) => increment(p.ownerId?._id || p.ownerId));
    allScholarships.forEach((s) => increment(s.ownerId?._id || s.ownerId));
    return counter;
  }, [allPrograms, allScholarships]);

  const institutions = useMemo(
    () =>
      users
        .filter((u) => u.role === "university" || u.role === "scholarship_org")
        .map((u) => {
          const id = u._id || u.id;
          return {
            id,
            name: u.institutionName || u.name,
            type: u.role === "university" ? "University" : "Scholarship Org",
            role: u.role,
            status: u.verified ? "approved" : "pending",
            offeredCount: countByOwnerId.get(`${id}`) || 0,
            joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
            sourceUser: u,
          };
        }),
    [users, countByOwnerId]
  );

  const subscriptions = useMemo(
    () =>
      users
        .filter((u) => u.studentTier === "pro" || u.subscriptionStatus === "active" || u.subscriptionStatus === "expired")
        .map((u) => ({
          id: u._id || u.id,
          user: u.name,
          plan: u.studentTier === "pro" ? "Pro" : "Basic",
          status: u.subscriptionStatus || "inactive",
          amount: u.studentTier === "pro" ? "$99" : "—",
          renewalDate: "—",
          sourceUser: u,
        })),
    [users]
  );

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.subscriptionStatus === "active" || u.verified).length;
  const pendingInstitutions = institutions.filter((i) => i.status === "pending").length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;

  const adminPath = location.pathname.split("/")[2] || "";
  const currentTab =
    adminPath === "institutions"
      ? "institutions"
      : adminPath === "subscriptions"
      ? "subscriptions"
      : adminPath === "blogs"
      ? "blogs"
      : "users";

  const handleTabChange = (value: string) => {
    switch (value) {
      case "institutions":
        navigate("/dashboard/institutions");
        break;
      case "subscriptions":
        navigate("/dashboard/subscriptions");
        break;
      case "blogs":
        navigate("/dashboard/blogs");
        break;
      default:
        navigate("/dashboard/users");
    }
  };

  const handleGuideChange = (field: keyof typeof guideForm, value: string) => {
    setGuideForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGuide = async () => {
    if (!guideForm.country || !guideForm.visaType) return;
    try {
      const dbGuide = {
        country: guideForm.country,
        countryFlag: "Ã°Å¸Å’Â", // Static for now
        visaType: guideForm.visaType,
        processingTime: guideForm.processingTime || "TBD",
        cost: guideForm.cost || "TBD",
        requirements: guideRequirements,
        steps: guideSteps,
      };
      
      const res = await api.post("/visas", dbGuide);
      setGuides((prev) => [res.data.data, ...prev]);
      
      setGuideForm({
        country: "",
        visaType: "",
        processingTime: "",
        cost: "",
      });
      setGuideRequirements([]);
      setGuideSteps([]);
      setNewRequirement("");
      setNewStep("");
    } catch (err) {
      console.error("Failed to save new visa guide:", err);
    }
  };

  const addRequirementToList = () => {
    if (!newRequirement.trim()) return;
    setGuideRequirements((prev) => [...prev, newRequirement.trim()]);
    setNewRequirement("");
  };

  const removeRequirementFromList = (index: number) => {
    setGuideRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const addStepToList = () => {
    if (!newStep.trim()) return;
    setGuideSteps((prev) => [...prev, newStep.trim()]);
    setNewStep("");
  };

  const removeStepFromList = (index: number) => {
    setGuideSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTemplateChange = (field: keyof typeof templateForm, value: string) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.category) return;

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (templateFile) {
      fileUrl = URL.createObjectURL(templateFile);
      fileName = templateFile.name;
    }

    if (editingTemplateId) {
      updateTemplate(editingTemplateId, {
        name: templateForm.name,
        category: templateForm.category,
        description: templateForm.description,
        fileUrl,
        fileName,
      });
    } else {
      addTemplate({
        name: templateForm.name,
        category: templateForm.category,
        description: templateForm.description,
        fileUrl,
        fileName,
      });
    }

    setTemplateForm({
      name: "",
      category: "",
      description: "",
    });
    setEditingTemplateId(null);
    setTemplateFile(null);
  };

  const handleEditTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateForm({
      name: tpl.name,
      category: tpl.category,
      description: tpl.description,
    });
    setEditingTemplateId(id);
    setTemplateFile(null);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    if (editingTemplateId === id) {
      setEditingTemplateId(null);
      setTemplateForm({
        name: "",
        category: "",
        description: "",
      });
      setTemplateFile(null);
    }
  };

  const filteredGuides = guides.filter((g) => {
    if (!guideSearch) return true;
    const q = guideSearch.toLowerCase();
    return g.country?.toLowerCase().includes(q) || g.visaType?.toLowerCase().includes(q);
  });

  const filteredTemplates = templates.filter((t) => {
    if (!templateSearch) return true;
    const q = templateSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const analyticsData = useMemo(() => {
    const buckets = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        date: d,
        month: d.toLocaleString("default", { month: "short" }),
        users: 0,
        active: 0,
        subs: 0,
        institutions: 0,
      };
    });

    users.forEach((u) => {
      const created = u.createdAt ? new Date(u.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) return;
      const createdKey = `${created.getFullYear()}-${created.getMonth()}`;
      const createdIndex = buckets.findIndex((b) => b.key === createdKey);
      if (createdIndex !== -1) {
        buckets[createdIndex].users += 1;
        if (u.role === "university" || u.role === "scholarship_org") buckets[createdIndex].institutions += 1;
        if (u.studentTier === "pro" || u.subscriptionStatus === "active") buckets[createdIndex].subs += 1;
      }

      buckets.forEach((b) => {
        const monthEnd = new Date(b.date.getFullYear(), b.date.getMonth() + 1, 0, 23, 59, 59, 999);
        if (created <= monthEnd && (u.verified || u.subscriptionStatus === "active")) {
          b.active += 1;
        }
      });
    });

    return buckets.map(({ key, date, ...rest }) => rest);
  }, [users]);

  const analyticsConfig = {
    users: {
      label: "Total users",
      theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
    },
    active: {
      label: "Active users",
      theme: { light: "hsl(var(--accent))", dark: "hsl(var(--accent))" },
    },
    subs: {
      label: "Active subscriptions",
      theme: { light: "hsl(var(--success))", dark: "hsl(var(--success))" },
    },
    institutions: {
      label: "Institutions",
      theme: { light: "hsl(var(--warning))", dark: "hsl(var(--warning))" },
    },
  };

  const userRoleDistribution = useMemo(
    () => [
      { name: "Students", value: users.filter((u) => u.role === "student").length, color: "hsl(var(--primary))" },
      { name: "Universities", value: users.filter((u) => u.role === "university").length, color: "hsl(var(--accent))" },
      { name: "Scholarship Orgs", value: users.filter((u) => u.role === "scholarship_org").length, color: "hsl(var(--success))" },
      { name: "Admins", value: users.filter((u) => u.role === "admin").length, color: "hsl(var(--warning))" },
    ].filter((entry) => entry.value > 0),
    [users]
  );

  const openDetails = (title: string, rows: Array<{ label: string; value: string }>) => {
    setDetailDialogTitle(title);
    setDetailRows(rows);
    setDetailDialogOpen(true);
  };

  const filteredInstitutions = institutions.filter((inst) => {
    if (institutionTypeFilter === "all") return true;
    return inst.role === institutionTypeFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              Admin Dashboard Ã°Å¸â€˜â€¹
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage users, institutions, subscriptions, and platform content
            </p>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Building2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingInstitutions}</p>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Platform Analytics</CardTitle>
                <p className="text-xs text-muted-foreground">User and subscription trends (last 6 months)</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Live data
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={analyticsConfig} className="h-64 w-full">
                <LineChart data={analyticsData} margin={{ left: 12, right: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                    dot={false}
                    name="Total users"
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="var(--color-active)"
                    strokeWidth={2}
                    dot={false}
                    name="Active users"
                  />
                  <Line
                    type="monotone"
                    dataKey="subs"
                    stroke="var(--color-subs)"
                    strokeWidth={2}
                    dot={false}
                    name="Active subscriptions"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">Breakdown by user role</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={analyticsConfig} className="h-64 w-full">
                <PieChart>
                  <Pie
                    data={userRoleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="institutions">Institutions</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="blogs">Visa & Doc Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => {
                        const joinedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Ã¢â‚¬â€";

                        return (
                          <TableRow key={u._id || u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{u.role}</Badge>
                            </TableCell>
                            <TableCell>{joinedDate}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                                  onClick={() =>
                                    openDetails(`User: ${u.name}`, [
                                      { label: "Name", value: u.name || "—" },
                                      { label: "Email", value: u.email || "—" },
                                      { label: "Role", value: u.role || "—" },
                                      { label: "Institution", value: u.institutionName || "—" },
                                      { label: "Phone", value: u.phone || "—" },
                                      { label: "Nationality", value: u.nationality || "—" },
                                      { label: "Date of Birth", value: u.dateOfBirth || "—" },
                                      { label: "Joined", value: joinedDate },
                                    ])
                                  }
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="institutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Institution Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Tabs
                    value={institutionTypeFilter}
                    onValueChange={(value) => setInstitutionTypeFilter(value as "all" | "university" | "scholarship_org")}
                  >
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="university">Universities</TabsTrigger>
                      <TabsTrigger value="scholarship_org">Organizations</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Offered</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Loading institutions...
                        </TableCell>
                      </TableRow>
                    ) : filteredInstitutions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No institutions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInstitutions.map((inst) => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-medium">{inst.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{inst.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={inst.status === "approved" ? "default" : "secondary"}>
                              {inst.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{inst.offeredCount}</TableCell>
                          <TableCell>{inst.joinedDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                                onClick={() =>
                                  openDetails(`Institution: ${inst.name}`, [
                                    { label: "Name", value: inst.name || "—" },
                                    { label: "Type", value: inst.type || "—" },
                                    { label: "Email", value: inst.sourceUser?.email || "—" },
                                    { label: "Status", value: inst.status || "—" },
                                    { label: "Offered (Programs + Scholarships)", value: String(inst.offeredCount ?? 0) },
                                    { label: "Joined", value: inst.joinedDate || "—" },
                                  ])
                                }
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Loading subscriptions...
                        </TableCell>
                      </TableRow>
                    ) : subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No subscriptions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.user}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{sub.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === "active" ? "default" : sub.status === "expired" ? "destructive" : "secondary"}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{sub.amount}</TableCell>
                          <TableCell>{sub.renewalDate}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                              onClick={() =>
                                openDetails(`Subscription: ${sub.user}`, [
                                  { label: "User", value: sub.user || "—" },
                                  { label: "Email", value: sub.sourceUser?.email || "—" },
                                  { label: "Plan", value: sub.plan || "—" },
                                  { label: "Status", value: sub.status || "—" },
                                  { label: "Amount", value: sub.amount || "—" },
                                  { label: "Role", value: sub.sourceUser?.role || "—" },
                                ])
                              }
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blogs" className="space-y-4">
            {/* Admin Visa & Doc Guide management */}
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Visa & Doc Guide Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create and curate country-specific visa guidance and document templates that students see in the Visa & Doc Guide.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* This will be enhanced with full CRUD in the backend. For now it's a responsive overview + local admin form. */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Create / edit guidance */}
                  <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Add new country guide</p>
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                        onClick={handleAddGuide}
                      >
                        <FileText className="mr-2 h-4 w-4" /> Save Guide
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Country</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                          placeholder="e.g. Germany"
                          value={guideForm.country}
                          onChange={(e) => handleGuideChange("country", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Visa Type</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                          placeholder="e.g. Student Visa (National)"
                          value={guideForm.visaType}
                          onChange={(e) => handleGuideChange("visaType", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Processing Time</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                          placeholder="e.g. 6Ã¢â‚¬â€œ12 weeks"
                          value={guideForm.processingTime}
                          onChange={(e) => handleGuideChange("processingTime", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Approx. Cost</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                          placeholder="e.g. Ã¢â€šÂ¬75"
                          value={guideForm.cost}
                          onChange={(e) => handleGuideChange("cost", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Requirements</p>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-md border bg-background px-3 py-2 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                            placeholder="e.g. Valid passport (6+ months)"
                            value={newRequirement}
                            onChange={(e) => setNewRequirement(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addRequirementToList();
                              }
                            }}
                          />
                          <Button size="sm" className="text-xs" onClick={addRequirementToList}>
                            Add
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-28 overflow-auto pr-1">
                          {guideRequirements.map((req, index) => (
                            <div
                              key={`${req}-${index}`}
                              className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1 text-[11px]"
                            >
                              <span className="line-clamp-2">{req}</span>
                              <button
                                type="button"
                                className="text-[10px] text-destructive hover:underline"
                                onClick={() => removeRequirementFromList(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {guideRequirements.length === 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Add each requirement and it will appear in the country guide accordion for students.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Step-by-step process</p>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-md border bg-background px-3 py-2 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                            placeholder="e.g. Receive university admission letter"
                            value={newStep}
                            onChange={(e) => setNewStep(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addStepToList();
                              }
                            }}
                          />
                          <Button size="sm" className="text-xs" onClick={addStepToList}>
                            Add
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-28 overflow-auto pr-1">
                          {guideSteps.map((step, index) => (
                            <div
                              key={`${step}-${index}`}
                              className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1 text-[11px]"
                            >
                              <span className="line-clamp-2">
                                {index + 1}. {step}
                              </span>
                              <button
                                type="button"
                                className="text-[10px] text-destructive hover:underline"
                                onClick={() => removeStepFromList(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {guideSteps.length === 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Add each step in order; students will see these as a numbered process.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Detailed requirements and steps can be managed later. Students will immediately see the new country in the
                      Visa & Doc Guide (once wired to the backend).
                    </p>
                  </div>

                  {/* Current country guides (mirrors Current templates layout) */}
                  <div className="space-y-3 rounded-lg border bg-card/80 p-4 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Current country guides ({filteredGuides.length})</p>
                        <Link
                          to="/dashboard/visa-hub"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Preview in Visa &amp; Doc Guide
                        </Link>
                      </div>
                      <div className="w-full sm:w-40">
                        <Input
                          placeholder="Search guides..."
                          value={guideSearch}
                          onChange={(e) => setGuideSearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                      {isLoadingGuides && <p className="text-sm text-muted-foreground p-2">Loading guides...</p>}
                      {!isLoadingGuides && filteredGuides.map((guide) => (
                        <div
                          key={guide._id || guide.id}
                          className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{guide.countryFlag}</span>
                              <div>
                                <p className="text-xs font-semibold truncate">{guide.country}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{guide.visaType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>Processing: <span className="font-medium text-foreground">{guide.processingTime}</span></span>
                              <span>Cost: <span className="font-medium text-foreground">{guide.cost}</span></span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {guide.requirements.length} requirements Ã¢â‚¬Â¢ {guide.steps.length} steps
                            </span>
                          </div>
                          <Link
                            to="/dashboard/visa-hub"
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                      {filteredGuides.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No guides match this search.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Template Management */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Template Management</p>
                    <span className="text-xs text-muted-foreground">
                      These templates appear in the student Visa &amp; Doc Guide downloads.
                    </span>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Template form */}
                    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        {editingTemplateId ? "Edit template" : "Add new template"}
                      </p>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Template name</p>
                          <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                            placeholder="e.g. Motivation Letter Template"
                            value={templateForm.name}
                            onChange={(e) => handleTemplateChange("name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Category</p>
                          <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                            placeholder="e.g. Application, Visa"
                            value={templateForm.category}
                            onChange={(e) => handleTemplateChange("category", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Short description</p>
                          <textarea
                            className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
                            placeholder="What is this template for?"
                            value={templateForm.description}
                            onChange={(e) => handleTemplateChange("description", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Add Template File</p>
                          <input
                            type="file"
                            className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setTemplateFile(file);
                            }}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Upload the actual DOC/PDF students will download. Changes are kept for this session.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={handleSaveTemplate}>
                          {editingTemplateId ? "Update Template" : "Save Template"}
                        </Button>
                        {editingTemplateId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground"
                            onClick={() => {
                              setEditingTemplateId(null);
                              setTemplateForm({ name: "", category: "", description: "" });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Template list */}
                    <div className="space-y-2 rounded-lg border bg-card/80 p-4 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Current templates ({filteredTemplates.length})</p>
                          <Link
                            to="/dashboard/visa-hub"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Preview in Visa &amp; Doc Guide
                          </Link>
                        </div>
                        <div className="w-full sm:w-56">
                          <Input
                            placeholder="Search templates..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {filteredTemplates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {tpl.category}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {tpl.downloadCount.toLocaleString()} downloads
                                </span>
                              </div>
                              <p className="text-xs font-semibold">{tpl.name}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {tpl.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => handleEditTemplate(tpl.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[11px] text-destructive"
                                onClick={() => handleDeleteTemplate(tpl.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                        {templates.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No templates yet. Add your first template on the left.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-right break-all">{row.value || "—"}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;

