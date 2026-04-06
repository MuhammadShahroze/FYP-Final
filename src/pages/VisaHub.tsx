import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, FileDown, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { api } from "@/lib/api";
import { useTemplates } from "@/contexts/TemplateContext";

import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

const VisaHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get("tab") === "templates" ? "templates" : "guides";

  const isPro = user?.studentTier === "pro" && user?.subscriptionStatus === "active";
  const [search, setSearch] = useState("");
  const [guides, setGuides] = useState<any[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const { templates } = useTemplates();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await api.get("/visas");
        setGuides(res.data.data || []);
      } catch (err) {
        console.error("Failed to load visa guides", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(
    (g) => g.country?.toLowerCase().includes(search.toLowerCase()) || g.visaType?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTemplates = templates.filter((t) => {
    if (!templateSearch) return true;
    const q = templateSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-3 rounded-xl border bg-gradient-to-r from-primary/5 via-accent/5 to-background p-4 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Visa & Doc Guide</h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Search country-wise visa steps, download ready-to-use document templates, and track your personal checklist in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                {guides.length}+ countries covered
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">
                {templates.length}+ templates
              </span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
          <TabsList>
            <TabsTrigger value="guides" className="gap-1.5">
              <Globe className="h-4 w-4" /> Country Guides
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <FileText className="h-4 w-4" /> Templates
            </TabsTrigger>
          </TabsList>

          {/* Country Guides */}
          <TabsContent value="guides" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by country..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {isLoading && <p className="text-center w-full py-10 col-span-2 text-muted-foreground">Loading guides...</p>}
              {!isLoading && filteredGuides.length > 0 && filteredGuides.map((guide) => (
                <Card key={guide._id || guide.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{guide.countryFlag}</span>
                      <div>
                        <CardTitle className="text-base">{guide.country}</CardTitle>
                        <p className="text-xs text-muted-foreground">{guide.visaType}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Processing</p>
                        <p className="font-medium">{guide.processingTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="font-medium">{guide.cost}</p>
                      </div>
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="requirements" className="border-0">
                        <AccordionTrigger className="text-sm py-2">Requirements</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {guide.requirements.map((r: any, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="steps" className="border-0">
                        <AccordionTrigger className="text-sm py-2">Step-by-Step Process</AccordionTrigger>
                        <AccordionContent>
                          <ol className="space-y-2">
                            {guide.steps.map((s: any, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {i + 1}
                                </span>
                                {s}
                              </li>
                            ))}
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
              {!isLoading && filteredGuides.length === 0 && search && (
                <Card className="col-span-2 border-dashed py-12">
                  <CardContent className="flex flex-col items-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-lg font-bold">Country Not Found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        While we're constantly expanding our database, we don't have a static guide for <strong>"{search}"</strong> yet.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-sm max-w-md">
                      <p className="font-semibold mb-1">💡 Pro Tip: Use our AI Assistant!</p>
                      <p className="text-xs">Ask our AI Chatbot (bottom right) for real-time visa requirements and application steps for any country in the world.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                      View All Countries
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Document Templates */}
          <TabsContent value="templates" className="space-y-4">
            {!isPro ? (
              <Card className="border-dashed py-20">
                <CardContent className="flex flex-col items-center text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl font-bold">Pro Feature</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Upgrade to Pro to access our full library of document templates, including motivation letters, CVs, and visa cover letters.
                    </p>
                  </div>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/dashboard/subscription">Upgrade to Pro</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Search across all document templates to quickly find the right file to download.
              </p>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search templates by name or category..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                      <span className="text-xs text-muted-foreground">{template.downloadCount.toLocaleString()} downloads</span>
                    </div>
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    {template.fileUrl ? (
                      <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                        <a href={template.fileUrl} download={template.fileName || template.name}>
                          <FileDown className="h-3.5 w-3.5" /> Download Template
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-1.5" disabled>
                        <FileDown className="h-3.5 w-3.5" /> Download coming soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
              </>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VisaHub;
