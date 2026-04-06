import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, Clock, GraduationCap, Search, SlidersHorizontal, X, Calendar, DollarSign, Heart, ArrowLeft,
} from "lucide-react";
import { subjects, countries, degreeLevels, fundingTypes, cgpaRanges, durations } from "@/data/mockData";
import { getPrograms, getScholarships } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/date";

function mapCourseType(t: string): string {
  if (t === "masters") return "Master's";
  if (t === "bachelors") return "Bachelor's";
  if (t === "phd") return "PhD";
  if (t === "cross-faculty") return "Cross-faculty graduate and research school";
  if (t === "prep") return "Prep course";
  if (t === "language") return "Language course";
  if (t === "short") return "Short course";
  return t || "—";
}

const Programs = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("programs");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "scholarships" || tab === "programs") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { user, isAuthenticated, addToShortlist, removeFromShortlist } = useAuth();
  const isStudent = user?.role === "student";
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingShortlist, setPendingShortlist] = useState<{ id: string; type: "program" | "scholarship"; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") || "All Subjects");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "All Countries");
  const [selectedDegree, setSelectedDegree] = useState(searchParams.get("degree") || "All Levels");
  const [selectedFunding, setSelectedFunding] = useState("All Types");
  const [selectedCGPA, setSelectedCGPA] = useState("All CGPA");
  const [selectedDuration, setSelectedDuration] = useState("All Durations");
  const [searchQuery, setSearchQuery] = useState("");

  const [programsList, setProgramsList] = useState<any[]>([]);
  const [scholarshipsList, setScholarshipsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pRes = await getPrograms();
        const sRes = await getScholarships();
        
        const pData = pRes.data || [];
        const sData = sRes.data || [];

        setProgramsList(pData.map((p: any) => ({
          id: p._id,
          name: p.title,
          university: p.owner?.name || p.university || "University",
          country: p.country || "—",
          countryFlag: p.countryFlag || "🏫",
          degreeLevel: p.degreeLevel,
          subject: p.subjectGroups && p.subjectGroups.length > 0 ? p.subjectGroups[0] : "—",
          duration: p.courseDuration || "Not Mentioned",
          tuitionFee: p.semesterFee || p.tuitionFee || "Not Mentioned",
          eligibility: p.requirements || "Nill",
          description: p.description || "Nill",
          cgpa: p.cgpaRequirement || "",
          location: p.location || ""
        })));

        setScholarshipsList(sData.map((s: any) => ({
          id: s._id,
          title: s.title,
          organization: s.owner?.name || s.organization || "Organization",
          country: s.country || "—",
          countryFlag: s.countryFlag || "🎓",
          fundingType: s.type,
          amount: s.amount,
          deadline: formatDate(s.deadline),
          eligibility: s.requirements || "—",
          degreeLevel: s.degreeLevel,
          subject: s.subjectGroups && s.subjectGroups.length > 0 ? s.subjectGroups[0] : "All Subjects",
          cgpa: s.cgpaRequirement || "",
          duration: "",
        })));
      } catch (error) {
        console.error("Error fetching programs/scholarships", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredPrograms = useMemo(() => {
    return programsList.filter((p) => {
      if (selectedSubject !== "All Subjects" && p.subject !== selectedSubject) return false;
      if (selectedCountry !== "All Countries" && p.country !== selectedCountry) return false;
      if (selectedDegree !== "All Levels" && p.degreeLevel !== selectedDegree) return false;
      if (selectedDuration !== "All Durations" && p.duration && p.duration !== "—") {
        if (selectedDuration === "1 year" && !p.duration.includes("1 year")) return false;
        if (selectedDuration === "2 years" && !p.duration.includes("2 years")) return false;
        if (selectedDuration === "3 years" && !p.duration.includes("3 years")) return false;
        if (selectedDuration === "4+ years" && !p.duration.includes("4")) return false;
      }
      if (selectedCGPA !== "All CGPA" && p.cgpa) {
        const cgpaNum = parseFloat(p.cgpa);
        if (selectedCGPA === "2.5 - 2.9" && (cgpaNum < 2.5 || cgpaNum >= 3.0)) return false;
        if (selectedCGPA === "3.0 - 3.4" && (cgpaNum < 3.0 || cgpaNum >= 3.5)) return false;
        if (selectedCGPA === "3.5 - 3.9" && (cgpaNum < 3.5 || cgpaNum >= 4.0)) return false;
        if (selectedCGPA === "4.0+" && cgpaNum < 4.0) return false;
      }
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.university.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [programsList, selectedSubject, selectedCountry, selectedDegree, selectedDuration, selectedCGPA, searchQuery]);

  const filteredScholarships = useMemo(() => {
    return scholarshipsList.filter((s) => {
      if (selectedSubject !== "All Subjects" && s.subject !== selectedSubject && s.subject !== "All Subjects") return false;
      if (selectedCountry !== "All Countries" && s.country !== selectedCountry) return false;
      if (selectedDegree !== "All Levels" && s.degreeLevel !== selectedDegree) return false;
      if (selectedFunding !== "All Types" && s.fundingType !== selectedFunding) return false;
      if (selectedDuration !== "All Durations" && s.duration) {
        if (selectedDuration === "1 year" && !s.duration.includes("1 year")) return false;
        if (selectedDuration === "2 years" && !s.duration.includes("2 years")) return false;
        if (selectedDuration === "3 years" && !s.duration.includes("3 years")) return false;
        if (selectedDuration === "4+ years" && !s.duration.includes("4")) return false;
      }
      if (selectedCGPA !== "All CGPA" && s.cgpa) {
        const cgpaNum = parseFloat(s.cgpa);
        if (selectedCGPA === "2.5 - 2.9" && (cgpaNum < 2.5 || cgpaNum >= 3.0)) return false;
        if (selectedCGPA === "3.0 - 3.4" && (cgpaNum < 3.0 || cgpaNum >= 3.5)) return false;
        if (selectedCGPA === "3.5 - 3.9" && (cgpaNum < 3.5 || cgpaNum >= 4.0)) return false;
        if (selectedCGPA === "4.0+" && cgpaNum < 4.0) return false;
      }
      if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [scholarshipsList, selectedSubject, selectedCountry, selectedDegree, selectedFunding, selectedDuration, selectedCGPA, searchQuery]);

  const resetFilters = () => {
    setSelectedSubject("All Subjects");
    setSelectedCountry("All Countries");
    setSelectedDegree("All Levels");
    setSelectedFunding("All Types");
    setSelectedCGPA("All CGPA");
    setSelectedDuration("All Durations");
    setSearchQuery("");
  };

  const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b bg-card px-4 py-8">
          <div className="container mx-auto">
            <div className="mb-3">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {activeTab === "programs" ? "Explore Programs" : "Discover Scholarships"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Find the perfect opportunity from our global network of universities and organizations
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search programs or universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto flex gap-6 px-4 py-8">
          {/* Filter sidebar */}
          {filtersOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden w-64 shrink-0 lg:block"
            >
              <Card>
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-foreground">Filters</h3>
                    <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                      Reset all
                    </button>
                  </div>
                  <FilterSelect label="Subject" value={selectedSubject} onChange={setSelectedSubject} options={subjects} />
                  <FilterSelect label="Country" value={selectedCountry} onChange={setSelectedCountry} options={countries} />
                  <FilterSelect label="Degree Level" value={selectedDegree} onChange={setSelectedDegree} options={degreeLevels} />
                  <FilterSelect label="CGPA" value={selectedCGPA} onChange={setSelectedCGPA} options={cgpaRanges} />
                  <FilterSelect label="Duration" value={selectedDuration} onChange={setSelectedDuration} options={durations} />
                  {activeTab === "scholarships" && (
                    <FilterSelect label="Funding Type" value={selectedFunding} onChange={setSelectedFunding} options={fundingTypes} />
                  )}
                </CardContent>
              </Card>
            </motion.aside>
          )}

          {/* Results */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="programs">Programs ({filteredPrograms.length})</TabsTrigger>
                <TabsTrigger value="scholarships">Scholarships ({filteredScholarships.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="programs" className="mt-6">
                {loading ? (
                  <div className="py-20 text-center">Loading programs...</div>
                ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filteredPrograms.map((program, i) => {
                    const isInShortlist = user?.shortlist?.some(item => (item.itemId === program.id || item.itemId?._id === program.id) && item.itemType === "program") || false;
                    
                    const handleShortlistClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (!isAuthenticated) {
                        setPendingShortlist({ id: program.id, type: "program", name: program.name });
                        setShowLoginModal(true);
                        return;
                      }
                      
                      if (isInShortlist) {
                        removeFromShortlist(program.id);
                        toast({ title: "Removed from shortlist" });
                      } else {
                        addToShortlist(program.id, "program");
                        toast({ title: "Added to shortlist" });
                      }
                    };
                    
                    return (
                      <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                          <CardContent className="flex-1 p-5">
                            <div className="flex items-start justify-between">
                              <span className="text-2xl">{program.countryFlag}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{program.degreeLevel}</Badge>
                                {isStudent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${isInShortlist ? "bg-accent/20 text-accent hover:bg-accent/30" : "text-muted-foreground hover:text-accent"}`}
                                    onClick={handleShortlistClick}
                                    title={isInShortlist ? "Remove from shortlist" : "Add to shortlist"}
                                  >
                                    <Heart className={`h-4 w-4 ${isInShortlist ? "fill-accent text-accent" : ""}`} />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                              {program.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">{program.university}</p>
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{program.location}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{program.duration}</span>
                              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{program.tuitionFee}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-5 pt-0">
                            <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                              <Link to={`/programs/${program.id}`}>View Details</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                  {filteredPrograms.length === 0 && (
                    <div className="col-span-full py-16 text-center text-muted-foreground">
                      <GraduationCap className="mx-auto h-12 w-12 opacity-30" />
                      <p className="mt-4">No programs match your filters. Try adjusting your criteria.</p>
                    </div>
                  )}
                </div>
                )}
              </TabsContent>

              <TabsContent value="scholarships" className="mt-6">
                {loading ? (
                  <div className="py-20 text-center">Loading scholarships...</div>
                ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filteredScholarships.map((scholarship, i) => {
                    const isInShortlist = user?.shortlist?.some(item => (item.itemId === scholarship.id || item.itemId?._id === scholarship.id) && item.itemType === "scholarship") || false;
                    
                    const handleShortlistClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (!isAuthenticated) {
                        setPendingShortlist({ id: scholarship.id, type: "scholarship", name: scholarship.title });
                        setShowLoginModal(true);
                        return;
                      }
                      
                      if (isInShortlist) {
                        removeFromShortlist(scholarship.id);
                        toast({ title: "Removed from shortlist" });
                      } else {
                        addToShortlist(scholarship.id, "scholarship");
                        toast({ title: "Added to shortlist" });
                      }
                    };
                    
                    return (
                      <motion.div
                        key={scholarship.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                          <CardContent className="flex-1 p-5">
                            <div className="flex items-start justify-between">
                              <span className="text-2xl">{scholarship.countryFlag}</span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    scholarship.fundingType === "Fully Funded"
                                      ? "bg-success text-success-foreground"
                                      : ""
                                  }
                                >
                                  {scholarship.fundingType}
                                </Badge>
                                {isStudent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${isInShortlist ? "bg-accent/20 text-accent hover:bg-accent/30" : "text-muted-foreground hover:text-accent"}`}
                                    onClick={handleShortlistClick}
                                    title={isInShortlist ? "Remove from shortlist" : "Add to shortlist"}
                                  >
                                    <Heart className={`h-4 w-4 ${isInShortlist ? "fill-accent text-accent" : ""}`} />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                              {scholarship.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">{scholarship.organization}</p>
                            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                              <p className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{scholarship.amount}</p>
                              <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Deadline: {formatDate(scholarship.deadline)}</p>
                              <p className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{scholarship.eligibility}</p>
                            </div>
                          </CardContent>
                          <CardFooter className="p-5 pt-0">
                            <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                              <Link to={`/scholarships/${scholarship.id}`}>View Details</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                  {filteredScholarships.length === 0 && (
                    <div className="col-span-full py-16 text-center text-muted-foreground">
                      <GraduationCap className="mx-auto h-12 w-12 opacity-30" />
                      <p className="mt-4">No scholarships match your filters. Try adjusting your criteria.</p>
                    </div>
                  )}
                </div>
                )}
              </TabsContent>
            </Tabs>
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
              To shortlist this {pendingShortlist?.type === "program" ? "program" : "scholarship"}, you should login.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{pendingShortlist?.name}</strong> will be added to your shortlist after you login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Continue
            </Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={() => {
                if (pendingShortlist) {
                  const url = pendingShortlist.type === "program" 
                    ? `/programs/${pendingShortlist.id}` 
                    : `/scholarships/${pendingShortlist.id}`;
                  navigate(`/login?returnUrl=${url}&shortlistId=${pendingShortlist.id}&shortlistType=${pendingShortlist.type}`);
                } else {
                  navigate("/login");
                }
              }}
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Programs;
