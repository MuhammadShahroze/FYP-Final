import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Calendar, GraduationCap, DollarSign, CheckCircle2, CreditCard, FileText, Heart, Mail } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import NotFound from "./NotFound";

const ScholarshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, addToShortlist, removeFromShortlist } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<
    Record<string, { name: string; type: string; size: number; dataUrl: string }>
  >({});

  const [scholarship, setScholarship] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const res = await api.get(`/scholarships/${id}`);
        setScholarship(res.data.data);
      } catch (err) {
        console.error("Failed to load scholarship", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">Loading details...</div>;
  }

  if (!scholarship) {
    return <NotFound />;
  }

  const isPro = user?.studentTier === "pro" && user?.subscriptionStatus === "active";
  const isStudent = user?.role === "student";
  const isInShortlist = user?.shortlist?.some((item: any) => (item.itemId === scholarship._id || item.itemId === scholarship.id) && item.itemType === "scholarship") ?? false;
  const normalizedRequiredDocuments: string[] = (Array.isArray(scholarship.requiredDocuments) ? scholarship.requiredDocuments : [])
    .flatMap((doc: string) => `${doc || ""}`.split(","))
    .map((doc: string) => doc.trim())
    .filter(Boolean);

  const handleShortlistToggle = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (isInShortlist) {
      removeFromShortlist(scholarship._id || scholarship.id);
      toast({ title: "Removed from shortlist" });
    } else {
      addToShortlist(scholarship._id || scholarship.id, "scholarship");
      toast({ title: "Added to shortlist" });
    }
  };

  const submitApplication = async () => {
    const requiredDocuments = normalizedRequiredDocuments;
    const missing = requiredDocuments.filter((doc: string) => !documentFiles[doc]?.dataUrl);
    if (missing.length > 0) {
      toast({
        title: "Please provide all required documents",
        description: `Missing: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const documents = requiredDocuments.map((doc: string) => {
      const file = documentFiles[doc];
      return {
        name: doc,
        url: file.dataUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };
    });

    try {
      await api.post("/applications", {
        targetId: scholarship._id || scholarship.id,
        targetType: "scholarship",
        documents,
      });
      setShowApplyModal(false);
      toast({ title: "Application submitted successfully!" });
    } catch (error: any) {
      toast({
        title: "Failed to submit application",
        description: error.response?.data?.error || error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please login to apply", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!isPro) {
      toast({ 
        title: "Upgrade to Pro to apply for scholarships", 
        action: <ToastAction altText="Upgrade" onClick={() => navigate("/dashboard/subscription")}>Upgrade</ToastAction>
      });
      return;
    }
    if (!user) return;
    setShowApplyModal(true);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(`${reader.result || ""}`);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <Button size="sm" onClick={() => navigate(-1)} className="mb-6 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🎓</span>
                        <Badge
                          className={
                            scholarship.type === "Fully-Funded"
                              ? "bg-success text-success-foreground"
                              : ""
                          }
                        >
                          {scholarship.type === "Fully-Funded" ? "Fully Funded" : scholarship.type}
                        </Badge>
                        {isStudent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`ml-auto h-8 w-8 p-0 ${isInShortlist ? "bg-accent/20 text-accent hover:bg-accent/30" : "text-muted-foreground hover:text-accent"}`}
                            onClick={handleShortlistToggle}
                            title={isInShortlist ? "Remove from shortlist" : "Add to shortlist"}
                          >
                            <Heart className={`h-5 w-5 ${isInShortlist ? "fill-accent text-accent" : ""}`} />
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-3xl font-bold">{scholarship.title}</CardTitle>
                      <p className="text-lg text-muted-foreground mt-2">{scholarship.ownerName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">About the Scholarship</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      This scholarship opportunity provides financial support for international students pursuing higher education. 
                      The program aims to promote academic excellence and cultural exchange.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Scholarship Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Funding Amount</p>
                          <p className="font-medium">{scholarship.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Application Deadline</p>
                          <p className="font-medium">{formatDate(scholarship.deadline)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Country</p>
                          <p className="font-medium">{scholarship.country || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Degree Level</p>
                          <p className="font-medium">{scholarship.courseType === "masters" ? "Master's" : scholarship.courseType === "phd" ? "PhD" : scholarship.courseType || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Contact Email</p>
                          <p className="font-medium">{scholarship.contactEmail || scholarship.owner?.email || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Eligibility Requirements</h3>
                    <div className="space-y-2">
                      {(scholarship.requirements || "").split(", ").filter(Boolean).map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {normalizedRequiredDocuments.length > 0 && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Required Documents</h3>
                        <div className="space-y-2">
                          {normalizedRequiredDocuments.map((doc: string, idx: number) => (
                            <div key={`${doc}-${idx}`} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="text-muted-foreground">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Application Process</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Check your eligibility against the requirements</li>
                      <li>Prepare required documents (transcripts, CV, motivation letter)</li>
                      <li>Submit your application through our platform</li>
                      <li>Wait for organization review (typically 6-8 weeks)</li>
                      <li>Receive scholarship decision</li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">What's Covered</h3>
                    <div className="space-y-2">
                      {scholarship.type === "Fully-Funded" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Full tuition fees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Monthly living allowance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Health insurance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Travel allowance</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Partial tuition coverage</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">One-time grant amount</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {isStudent && (
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Apply Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isAuthenticated ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Please login to view application options
                        </p>
                        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                          <Link to={`/login?returnUrl=/scholarships/${scholarship._id || scholarship.id}&shortlistId=${scholarship._id || scholarship.id}&shortlistType=scholarship`}>
                            Login to Apply
                          </Link>
                        </Button>
                      </>
                    ) : !isPro ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>View details only</span>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Upgrade to Pro to Apply</p>
                            <p className="text-xs text-muted-foreground">
                              Pro members can apply directly to scholarships and track their applications
                            </p>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                          onClick={() => navigate("/dashboard/subscription")}
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Upgrade to Pro
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Pro member - Apply now</span>
                          </div>
                          <Separator />
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold">Application Deadline</p>
                            <p className="text-muted-foreground">{formatDate(scholarship.deadline)}</p>
                          </div>
                        </div>
                        <Button
                          onClick={handleApply}
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                        >
                          Apply Now
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Quick Facts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization</span>
                    <span className="font-medium">{scholarship.ownerName || scholarship.organization || "—"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{scholarship.country || "—"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funding Type</span>
                    <span className="font-medium">{scholarship.type === "Fully-Funded" ? "Fully Funded" : scholarship.type}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Degree Level</span>
                    <span className="font-medium">{scholarship.courseType === "masters" ? "Master's" : scholarship.courseType === "phd" ? "PhD" : scholarship.courseType || "—"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Contact Email</span>
                    <span className="font-medium break-all text-right">{scholarship.contactEmail || scholarship.owner?.email || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Login Modal for Shortlist */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              To shortlist this scholarship, you should login.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{scholarship.title}</strong> will be added to your shortlist after you login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Continue
            </Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={() => {
                navigate(`/login?returnUrl=/scholarships/${scholarship._id || scholarship.id}&shortlistId=${scholarship._id || scholarship.id}&shortlistType=scholarship`);
              }}
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Required Documents</DialogTitle>
            <DialogDescription>
              Upload each required document (PDF, DOC, DOCX, image, or supported file format).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {normalizedRequiredDocuments.length === 0 && (
              <p className="text-sm text-muted-foreground">No specific documents required for this scholarship.</p>
            )}
            {normalizedRequiredDocuments.map((doc: string, idx: number) => (
              <div key={`${doc}-${idx}`} className="space-y-2">
                <p className="text-sm font-medium">{doc}</p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "File too large",
                        description: "Please upload a file smaller than 10 MB.",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      const dataUrl = await readFileAsDataUrl(file);
                      setDocumentFiles((prev) => ({
                        ...prev,
                        [doc]: {
                          name: file.name,
                          type: file.type || "application/octet-stream",
                          size: file.size,
                          dataUrl,
                        },
                      }));
                    } catch {
                      toast({ title: "Failed to process file", variant: "destructive" });
                    }
                  }}
                />
                {documentFiles[doc]?.name && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {documentFiles[doc].name}
                  </p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={submitApplication}
            >
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScholarshipDetail;
