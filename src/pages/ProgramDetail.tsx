import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Clock, GraduationCap, DollarSign, CheckCircle2, CreditCard, FileText, Heart, Mail } from "lucide-react";
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

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, addToShortlist, removeFromShortlist } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<
    Record<string, { name: string; type: string; size: number; dataUrl: string }>
  >({});

  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const res = await api.get(`/programs/${id}`);
        setProgram(res.data.data);
      } catch (err) {
        console.error("Failed to load program", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center">Loading details...</div>;
  }

  if (!program) {
    return <NotFound />;
  }

  const isPro = user?.studentTier === "pro" && user?.subscriptionStatus === "active";
  const isStudent = user?.role === "student";
  const isInShortlist =
    user?.shortlist?.some((item: any) => (item.itemId === program._id || item.itemId === program.id) && item.itemType === "program") ?? false;

  const universityName = program.ownerName || program.university || "—";
  const subjectLabel = Array.isArray(program.subjectGroups)
    ? program.subjectGroups.join(", ")
    : program.subjectGroups || program.subject || "—";
  const countryLabel =
    program.country ||
    (typeof program.location === "string" && program.location.includes(",")
      ? program.location.split(",").pop()?.trim()
      : "") ||
    "—";
  const degreeLabel = program.courseType === "masters" ? "Master's" : program.courseType === "phd" ? "PhD" : program.courseType || "—";
  const tuitionLabel = program.semesterFee || program.tuitionFee ? `€${program.semesterFee || program.tuitionFee}/semester` : "—";
  const normalizedRequiredDocuments: string[] = (Array.isArray(program.requiredDocuments) ? program.requiredDocuments : [])
    .flatMap((doc: string) => `${doc || ""}`.split(","))
    .map((doc: string) => doc.trim())
    .filter(Boolean);

  const handleShortlistToggle = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (isInShortlist) {
      removeFromShortlist(program._id || program.id);
      toast({ title: "Removed from shortlist" });
    } else {
      addToShortlist(program._id || program.id, "program");
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
        targetId: program._id || program.id,
        targetType: "program",
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
        title: "Upgrade to Pro to apply for programs",
        action: <ToastAction altText="Upgrade" onClick={() => navigate("/dashboard/subscription")}>Upgrade</ToastAction>,
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
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">University</span>
                        <Badge variant="secondary" className="text-sm">
                          {degreeLabel}
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
                      <CardTitle className="text-3xl font-bold">{program.title}</CardTitle>
                      <p className="text-lg text-muted-foreground mt-2">{universityName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact: {program.contactEmail || "—"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{program.description}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Program Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{program.location || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-medium">{program.courseDuration || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Tuition Fee</p>
                          <p className="font-medium">{tuitionLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Subject</p>
                          <p className="font-medium">{subjectLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Language</p>
                          <p className="font-medium">{program.courseLanguage || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Contact Email</p>
                          <p className="font-medium">{program.contactEmail || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Eligibility Requirements</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-muted-foreground">
                          Minimum CGPA: <span className="font-medium">{program.eligibilityMinCgpa || program.cgpaRequirement || "—"}</span>
                        </span>
                      </div>
                      {program.eligibilityLanguageRequirements && program.eligibilityLanguageRequirements.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Language Requirements</p>
                          {program.eligibilityLanguageRequirements.map((lr: any, idx: number) => (
                            <div key={`${lr.test}-${idx}`} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="text-muted-foreground">
                                <span className="font-medium">{lr.test}</span>: {lr.bands}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(program.requirements || "").split(", ").filter(Boolean).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Other Requirements</p>
                          {(program.requirements || "")
                            .split(", ")
                            .filter(Boolean)
                            .map((req: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                <span className="text-muted-foreground">{req}</span>
                              </div>
                            ))}
                        </div>
                      )}
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

                  {program.applicationProcess && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Application Process</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{program.applicationProcess}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {isStudent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Apply Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isAuthenticated ? (
                      <>
                        <p className="text-sm text-muted-foreground">Please login to view application options</p>
                        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                          <Link to={`/login?returnUrl=/programs/${program.id}&shortlistId=${program.id}&shortlistType=program`}>
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
                            <p className="text-xs text-muted-foreground">Pro members can apply directly to programs and track their applications</p>
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
                            <p className="text-muted-foreground">{formatDate(program.deadline)}</p>
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
                    <span className="text-muted-foreground">University</span>
                    <span className="font-medium">{universityName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{countryLabel}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Degree Level</span>
                    <span className="font-medium">{degreeLabel}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-medium">{subjectLabel}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Contact Email</span>
                    <span className="font-medium break-all text-right">{program.contactEmail || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>To shortlist this program, you should login.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{program.title}</strong> will be added to your shortlist after you login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Continue
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={() => {
                navigate(`/login?returnUrl=/programs/${program._id || program.id}&shortlistId=${program._id || program.id}&shortlistType=program`);
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
              <p className="text-sm text-muted-foreground">No specific documents required for this program.</p>
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

export default ProgramDetail;
