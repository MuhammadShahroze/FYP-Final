import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { countries } from "@/data/mockData";

const CreateProgram = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    year: "",
    type: "",
    courseType: "",
    subjectGroups: "",
    registrationStartDate: "",
    registrationEndDate: "",
    courseTitle: "",
    courseCode: "",
    cgpaRequirement: "",
    semesterStartDate: "",
    semesterEndDate: "",
    semesterFee: "",
    courseDuration: "",
    courseLanguage: "",
    location: "",
    country: "",
    programDescription: "",
    applicationProcess: "",
    requirements: "",
    eligibilityMinCgpa: "",
    contactEmail: "",
  });
  const [languageRequirements, setLanguageRequirements] = useState<
    { id: string; test: string; bands: string }[]
  >([]);
  const [requiredDocuments, setRequiredDocuments] = useState<{ id: string; name: string }[]>([
    { id: `doc_${crypto.randomUUID()}`, name: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      const normalizedRequiredDocuments = requiredDocuments
        .flatMap((doc) => doc.name.split(","))
        .map((doc) => doc.trim())
        .filter(Boolean);

      await api.post("/programs", {
        title: formData.courseTitle,
        semester: `${formData.type === "winter" ? "Winter" : "Summer"} ${formData.year}`,
        deadline: formData.registrationEndDate,
        courseCode: formData.courseCode,
        cgpaRequirement: formData.cgpaRequirement,
        description: formData.programDescription,
        requirements: formData.requirements,
        subjectGroups: formData.subjectGroups,
        courseType: formData.courseType,
        semesterFee: formData.semesterFee,
        courseDuration: formData.courseDuration,
        courseLanguage: formData.courseLanguage,
        location: formData.location,
        country: formData.country,
        applicationProcess: formData.applicationProcess,
        eligibilityMinCgpa: formData.eligibilityMinCgpa || formData.cgpaRequirement,
        eligibilityLanguageRequirements: languageRequirements.map(({ id, ...rest }) => rest),
        requiredDocuments: normalizedRequiredDocuments,
        contactEmail: formData.contactEmail,
      });
      
      toast({ title: "Program created successfully!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Failed to create program", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="font-display text-2xl font-bold">Create New Program</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for your program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2026"
                    value={formData.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winter">Winter</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseType">Course Type *</Label>
                  <Select
                    value={formData.courseType}
                    onValueChange={(value) => handleChange("courseType", value)}
                    required
                  >
                    <SelectTrigger id="courseType">
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor's degree</SelectItem>
                      <SelectItem value="masters">Master's degree</SelectItem>
                      <SelectItem value="phd">PhD / Doctorate</SelectItem>
                      <SelectItem value="cross-faculty">Cross-faculty graduate and research school</SelectItem>
                      <SelectItem value="prep">Prep course</SelectItem>
                      <SelectItem value="language">Language course</SelectItem>
                      <SelectItem value="short">Short course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectGroups">Subject Groups *</Label>
                  <Input
                    id="subjectGroups"
                    placeholder="e.g. Computer Science, Engineering"
                    value={formData.subjectGroups}
                    onChange={(e) => handleChange("subjectGroups", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="admissions@university.edu"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Dates</CardTitle>
              <CardDescription>Set the registration period for applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationStartDate">Registration Start Date *</Label>
                  <Input
                    id="registrationStartDate"
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleChange("registrationStartDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEndDate">Registration End Date *</Label>
                  <Input
                    id="registrationEndDate"
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => handleChange("registrationEndDate", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Information about the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g. MSc Computer Science"
                    value={formData.courseTitle}
                    onChange={(e) => handleChange("courseTitle", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
                    placeholder="e.g. CS-2026"
                    value={formData.courseCode}
                    onChange={(e) => handleChange("courseCode", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseDuration">Course Duration</Label>
                  <Select
                    value={formData.courseDuration}
                    onValueChange={(value) => handleChange("courseDuration", value)}
                  >
                    <SelectTrigger id="courseDuration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                      <SelectItem value="1.5 years">1.5 years</SelectItem>
                      <SelectItem value="2 years">2 years</SelectItem>
                      <SelectItem value="3 years">3 years</SelectItem>
                      <SelectItem value="4 years">4 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseLanguage">Course Language</Label>
                  <Select
                    value={formData.courseLanguage}
                    onValueChange={(value) => handleChange("courseLanguage", value)}
                  >
                    <SelectTrigger id="courseLanguage">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Munich, Germany"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange("country", value)} required>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries
                        .filter((country) => country !== "All Countries")
                        .map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cgpaRequirement">CGPA Requirement *</Label>
                  <Input
                    id="cgpaRequirement"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={formData.cgpaRequirement}
                    onChange={(e) => handleChange("cgpaRequirement", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semester Information</CardTitle>
              <CardDescription>Semester dates and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="semesterStartDate">Semester Start Date *</Label>
                  <Input
                    id="semesterStartDate"
                    type="date"
                    value={formData.semesterStartDate}
                    onChange={(e) => handleChange("semesterStartDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesterEndDate">Semester End Date *</Label>
                  <Input
                    id="semesterEndDate"
                    type="date"
                    value={formData.semesterEndDate}
                    onChange={(e) => handleChange("semesterEndDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesterFee">Semester Fee *</Label>
                  <Input
                    id="semesterFee"
                    type="number"
                    placeholder="e.g. 5000"
                    value={formData.semesterFee}
                    onChange={(e) => handleChange("semesterFee", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Program description, application process, and general requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programDescription">Program Description *</Label>
                <Textarea
                  id="programDescription"
                  placeholder="Describe the program in detail..."
                  rows={6}
                  value={formData.programDescription}
                  onChange={(e) => handleChange("programDescription", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationProcess">Application Process</Label>
                <Textarea
                  id="applicationProcess"
                  placeholder="Describe the step-by-step application process..."
                  rows={4}
                  value={formData.applicationProcess}
                  onChange={(e) => handleChange("applicationProcess", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Other Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="List other requirements (e.g. portfolio, interviews, etc.)"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>Name the documents students must provide for application review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredDocuments.map((doc, idx) => (
                <div key={doc.id} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Inter Result, Degree Transcript, Motivation Letter, SOP, CV"
                    value={doc.name}
                    onChange={(e) =>
                      setRequiredDocuments((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    disabled={requiredDocuments.length === 1}
                    onClick={() =>
                      setRequiredDocuments((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRequiredDocuments((prev) => [...prev, { id: `doc_${crypto.randomUUID()}`, name: "" }])
                }
              >
                <Plus className="mr-2 h-3 w-3" /> Add More
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility Requirements</CardTitle>
              <CardDescription>Minimum academic and language requirements for admission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eligibilityMinCgpa">Minimum CGPA</Label>
                  <Input
                    id="eligibilityMinCgpa"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.0"
                    value={formData.eligibilityMinCgpa}
                    onChange={(e) => handleChange("eligibilityMinCgpa", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Language Bands</Label>
                <div className="space-y-2">
                  {languageRequirements.map((req, idx) => (
                    <div key={req.id} className="flex flex-wrap items-center gap-2">
                      <Select
                        value={req.test}
                        onValueChange={(value) =>
                          setLanguageRequirements((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, test: value } : r
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Test" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IELTS">IELTS</SelectItem>
                          <SelectItem value="TOEFL">TOEFL</SelectItem>
                          <SelectItem value="Duolingo">Duolingo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="w-48"
                        placeholder="e.g. Overall 6.5, no band < 6.0"
                        value={req.bands}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLanguageRequirements((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, bands: value } : r
                            )
                          );
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() =>
                          setLanguageRequirements((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLanguageRequirements((prev) => [
                        ...prev,
                        { id: `lang_${crypto.randomUUID()}`, test: "", bands: "" },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-3 w-3" /> Add Language Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> {loading ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateProgram;
