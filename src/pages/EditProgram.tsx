import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { toDateInputValue } from "@/lib/date";
import { countries } from "@/data/mockData";
import NotFound from "./NotFound";

const EditProgram = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    year: "",
    type: "",
    courseType: "",
    subjectGroups: "",
    registrationEndDate: "",
    courseTitle: "",
    courseCode: "",
    cgpaRequirement: "",
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

  useEffect(() => {
    if (!id || !user) {
      setNotFound(true);
      return;
    }
    const loadProgram = async () => {
      try {
        const res = await api.get(`/programs/${id}`);
        const existing = res.data.data;
        if (!existing || (existing.owner?._id !== (user._id || (user as any).id) && existing.ownerId !== (user._id || (user as any).id))) {
          setNotFound(true);
          return;
        }
        const [season, year] = existing.semester.split(" ");
        setFormData({
          year: year || "",
          type: season?.toLowerCase() === "summer" ? "summer" : "winter",
          courseType: existing.courseType || "",
          subjectGroups: existing.subjectGroups || "",
          registrationEndDate: toDateInputValue(existing.deadline),
          courseTitle: existing.title || "",
          courseCode: existing.courseCode || "",
          cgpaRequirement: existing.cgpaRequirement || "",
          semesterFee: existing.semesterFee || existing.tuitionFee || "",
          courseDuration: existing.courseDuration || "",
          courseLanguage: existing.courseLanguage || "",
          location: existing.location || "",
          country: existing.country || "",
          programDescription: existing.description || "",
          applicationProcess: existing.applicationProcess || "",
          requirements: existing.requirements || "",
          eligibilityMinCgpa: existing.eligibilityMinCgpa || existing.cgpaRequirement || "",
          contactEmail: existing.contactEmail || user?.email || "",
        });
        setLanguageRequirements(
          (existing.eligibilityLanguageRequirements || []).map((r: any) => ({
            id: `lang_${crypto.randomUUID()}`,
            test: r.test,
            bands: r.bands,
          }))
        );
        setRequiredDocuments(
          (Array.isArray(existing.requiredDocuments) && existing.requiredDocuments.length > 0
            ? existing.requiredDocuments
            : [""]
          ).map((doc: string) => ({
            id: `doc_${crypto.randomUUID()}`,
            name: doc || "",
          }))
        );
      } catch (err) {
        console.error("Failed to load program", err);
        setNotFound(true);
      }
    };
    loadProgram();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setLoading(true);

    try {
      const normalizedRequiredDocuments = requiredDocuments
        .flatMap((doc) => doc.name.split(","))
        .map((doc) => doc.trim())
        .filter(Boolean);

      await api.put(`/programs/${id}`, {
        title: formData.courseTitle,
        semester: `${formData.type === "summer" ? "Summer" : "Winter"} ${formData.year}`,
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

      toast({ title: "Program updated successfully!" });
      navigate("/dashboard/programs");
    } catch (err: any) {
      toast({ title: "Failed to update program", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (notFound) {
    return <NotFound />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard/programs")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="font-display text-2xl font-bold">Edit Program</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the basic details for your program</CardDescription>
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
              <CardTitle>Key Details</CardTitle>
              <CardDescription>Update main program fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    value={formData.courseTitle}
                    onChange={(e) => handleChange("courseTitle", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
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
                    value={formData.cgpaRequirement}
                    onChange={(e) => handleChange("cgpaRequirement", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesterFee">Semester Fee *</Label>
                  <Input
                    id="semesterFee"
                    type="number"
                    value={formData.semesterFee}
                    onChange={(e) => handleChange("semesterFee", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEndDate">Application Deadline *</Label>
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
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Program description, application process, and general requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programDescription">Program Description *</Label>
                <Textarea
                  id="programDescription"
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
                  rows={4}
                  value={formData.applicationProcess}
                  onChange={(e) => handleChange("applicationProcess", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Other Requirements</Label>
                <Textarea
                  id="requirements"
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
              <CardDescription>Update the list of required documents for applicants</CardDescription>
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
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/programs")}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditProgram;
