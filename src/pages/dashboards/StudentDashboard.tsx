import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, User, Star, CreditCard, MessageSquare, FileText, CheckCircle2, Heart, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getPrograms, getScholarships } from "@/lib/dataService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const StudentDashboard = () => {
  const { user, removeFromShortlist } = useAuth();
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [allScholarships, setAllScholarships] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await getPrograms();
        const sRes = await getScholarships();
        setAllPrograms(pRes.data || []);
        setAllScholarships(sRes.data || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const isPro = user?.studentTier === "pro" && user?.subscriptionStatus === "active";
  const isRegistered = user?.studentTier === "registered" || user?.studentTier === "pro";

  const profileSectionsTotal = 3; // personal, academic, preferences
  const personalComplete = !!(user?.name && user?.nationality && user?.dateOfBirth && user?.phone);
  const academicComplete = !!(user?.academicInfo && user.academicInfo.length > 0);
  const preferencesComplete = !!(
    user?.preferences &&
    ((user.preferences.countries && user.preferences.countries.length > 0) ||
      (user.preferences.subjects && user.preferences.subjects.length > 0) ||
      (user.preferences.degreeLevels && user.preferences.degreeLevels.length > 0))
  );
  const completedSections =
    (personalComplete ? 1 : 0) +
    (academicComplete ? 1 : 0) +
    (preferencesComplete ? 1 : 0);

  const profileCompletion = Math.round((completedSections / profileSectionsTotal) * 100);

  // Get shortlisted items
  const shortlistItems = user?.shortlist || [];
  const shortlistedPrograms = shortlistItems
    .filter((item) => item.itemType === "program" || item.type === "program")
    .map((item) => {
      const idStr = typeof item.itemId === "object" ? item.itemId?._id : (item.itemId || item.id);
      return allPrograms.find((p) => (p._id || p.id) === idStr);
    })
    .filter(Boolean);
  
  const shortlistedScholarships = shortlistItems
    .filter((item) => item.itemType === "scholarship" || item.type === "scholarship")
    .map((item) => {
      const idStr = typeof item.itemId === "object" ? item.itemId?._id : (item.itemId || item.id);
      return allScholarships.find((s) => (s._id || s.id) === idStr);
    })
    .filter(Boolean);

  // Derived recommendations based on preferences and CGPA
  const cgpa = user?.academicInfo?.[0]?.cgpa ? parseFloat(user.academicInfo[0].cgpa) : undefined;
  const preferredSubjects = user?.preferences?.subjects || [];
  const preferredDegrees = user?.preferences?.degreeLevels || [];
  const preferredCountries = user?.preferences?.countries || [];

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

  const recommendedPrograms = allPrograms.filter((p) => {
    if (p.status !== "active") return false;
    const pSubjects = normalizeArrayField(p.subjectGroups);
    if (preferredSubjects.length && preferredSubjects[0] !== "All Subjects") {
      if (!preferredSubjects.some((s) => pSubjects.includes(s))) return false;
    }
    if (preferredDegrees.length && preferredDegrees[0] !== "All Levels") {
      const degreeCandidate = normalizeCourseType(p.degreeLevel || p.courseType);
      if (!preferredDegrees.some((d) => normalizeCourseType(d).toLowerCase() === degreeCandidate.toLowerCase())) return false;
    }
    if (preferredCountries.length && preferredCountries[0] !== "All Countries") {
      const countryCandidate =
        p.country ||
        (typeof p.location === "string" && p.location.includes(",")
          ? p.location.split(",").pop()?.trim()
          : "");
      if (!countryCandidate || !preferredCountries.includes(countryCandidate)) return false;
    }
    if (cgpa && p.cgpaRequirement) {
      const required = parseFloat(p.cgpaRequirement);
      if (!Number.isNaN(required) && cgpa < required) return false;
    }
    return true;
  }).slice(0, 3);

  const recommendedScholarships = allScholarships.filter((s) => {
    if (s.status !== "active") return false;
    const sSubjects = normalizeArrayField(s.subjectGroups);
    if (preferredSubjects.length && preferredSubjects[0] !== "All Subjects") {
      if (!preferredSubjects.some((subj) => sSubjects.includes(subj))) return false;
    }
    if (preferredDegrees.length && preferredDegrees[0] !== "All Levels") {
      const degreeCandidate = normalizeCourseType(s.degreeLevel || s.courseType);
      if (!preferredDegrees.some((d) => normalizeCourseType(d).toLowerCase() === degreeCandidate.toLowerCase())) return false;
    }
    if (preferredCountries.length && preferredCountries[0] !== "All Countries") {
      if (!s.country || !preferredCountries.includes(s.country)) return false;
    }
    if (cgpa && s.cgpaRequirement) {
      const required = parseFloat(s.cgpaRequirement);
      if (!Number.isNaN(required) && cgpa < required) return false;
    }
    return true;
  }).slice(0, 3);

  const unreadAlerts = [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                {user?.studentTier === "guest" 
                  ? "Complete your registration to access all features."
                  : `Your profile is ${profileCompletion}% complete. Complete it to get better matches.`}
              </p>
              {user?.studentTier !== "guest" && (
                <div className="mt-3 max-w-xs">
                  <Progress value={profileCompletion} className="h-2" />
                </div>
              )}
            </div>
            {user?.studentTier !== "guest" && (
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                <Link to="/dashboard/profile">Complete Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status for Registered/Pro Users */}
        {isRegistered && !isPro && (
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock direct application submission, AI chatbot guidance, and visa documentation support.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  <Link to="/dashboard/subscription">
                    <CreditCard className="mr-2 h-4 w-4" /> Upgrade Now
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pro User Features */}
        {isPro && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Chatbot</p>
                  <p className="text-xs text-muted-foreground">Get guidance 24/7</p>
                </div>
              </CardContent>
            </Card>
            <Link to="/dashboard/visa-hub">
              <Card className="cursor-pointer transition-shadow hover:shadow-md border-accent/40 bg-gradient-to-r from-accent/5 to-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Visa & Doc Guide</p>
                    <p className="text-xs text-muted-foreground">Country guides and templates</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Applications</p>
                  <p className="text-xs text-muted-foreground">Track your submissions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/programs">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Browse Programs</p>
                  <p className="text-xs text-muted-foreground">Discover opportunities</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          {isRegistered && (
            <>
              <Link to="/dashboard/profile">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Edit Profile</p>
                      <p className="text-xs text-muted-foreground">Update your info</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/dashboard/alerts">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Bell className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Alerts</p>
                      <p className="text-xs text-muted-foreground">{unreadAlerts.length} unread</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {isPro && (
                <Link to="/dashboard/visa-hub">
                  <Card className="cursor-pointer transition-shadow hover:shadow-md border-primary/30">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Visa & Doc Guide</p>
                        <p className="text-xs text-muted-foreground">Explore guides and templates</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Shortlist Section - Only for Registered/Pro */}
        {isRegistered && (shortlistedPrograms.length > 0 || shortlistedScholarships.length > 0) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                My Shortlist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingData ? (
                 <p className="text-sm text-muted-foreground">Loading shortlist...</p>
              ) : (
                <>
              {shortlistedPrograms.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Programs</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shortlistedPrograms.map((program) => (
                      program && (
                        <Card key={program._id || program.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🏫</span>
                                <Badge variant="secondary" className="text-xs">{program.degreeLevel}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeFromShortlist(program._id || program.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <h4 className="mb-1 font-semibold text-sm">{program.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{program.university || program.owner?.name}</p>
                            <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                              <Link to={`/programs/${program._id || program.id}`}>View Details</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </div>
                </div>
              )}
              {shortlistedScholarships.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Scholarships</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shortlistedScholarships.map((scholarship) => (
                      scholarship && (
                        <Card key={scholarship._id || scholarship.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎓</span>
                                <Badge
                                  className={
                                    scholarship.type === "Fully-Funded"
                                      ? "bg-success text-success-foreground"
                                      : ""
                                  }
                                >
                                  {scholarship.type}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeFromShortlist(scholarship._id || scholarship.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <h4 className="mb-1 font-semibold text-sm">{scholarship.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{scholarship.organization || scholarship.owner?.name}</p>
                            <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                              <Link to={`/scholarships/${scholarship._id || scholarship.id}`}>View Details</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </div>
                </div>
              )}
              </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommended Programs & Scholarships - Only for Registered/Pro */}
        {isRegistered && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recommended Programs & Scholarships</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/programs">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoadingData ? (
                   <p className="text-sm text-muted-foreground">Loading recommendations...</p>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Programs</h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recommendedPrograms.map((p) => (
                          <Card key={p._id || p.id} className="border">
                            <CardContent className="p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-lg">🏫</span>
                                <Badge variant="secondary" className="text-xs">{p.degreeLevel}</Badge>
                              </div>
                              <h4 className="mb-1 font-semibold text-sm">{p.title}</h4>
                              <p className="text-xs text-muted-foreground">{p.university || p.owner?.name}</p>
                              <div className="mt-3 flex items-center gap-1 text-xs text-accent">
                                <Star className="h-3 w-3 fill-accent" />
                                <span className="font-medium">Preference Match</span>
                              </div>
                              <Button size="sm" className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                                <Link to={`/programs/${p._id || p.id}`}>View & Apply</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {recommendedPrograms.length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-full">No recommended programs right now.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Scholarships</h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recommendedScholarships.map((s) => (
                          <Card key={s._id || s.id} className="border">
                            <CardContent className="p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-lg">🎓</span>
                                <Badge
                                  className={s.type === "Fully-Funded" ? "bg-success text-success-foreground text-xs" : "text-xs"}
                                >
                                  {s.type}
                                </Badge>
                              </div>
                              <h4 className="mb-1 font-semibold text-sm">{s.title}</h4>
                              <p className="text-xs text-muted-foreground">{s.organization || s.owner?.name}</p>
                              <div className="mt-3 flex items-center gap-1 text-xs text-accent">
                                <Star className="h-3 w-3 fill-accent" />
                                <span className="font-medium">Preference Match</span>
                              </div>
                              <Button size="sm" className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                                <Link to={`/scholarships/${s._id || s.id}`}>View & Apply</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {recommendedScholarships.length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-full">No recommended scholarships right now.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

