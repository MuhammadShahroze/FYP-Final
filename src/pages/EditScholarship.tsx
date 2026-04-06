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

const EditScholarship = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    type: "",
    courseType: "",
    subjectGroups: "",
    registrationEndDate: "",
    cgpaRequirement: "",
    feeCompensation: "",
    scholarshipDescription: "",
    requirements: "",
    contactEmail: "",
    country: "",
  });
  const [requiredDocuments, setRequiredDocuments] = useState<{ id: string; name: string }[]>([
    { id: `doc_${crypto.randomUUID()}`, name: "" },
  ]);

  useEffect(() => {
    if (!id || !user) {
      setNotFound(true);
      return;
    }
    const loadScholarship = async () => {
      try {
        const res = await api.get(`/scholarships/${id}`);
        const existing = res.data.data;
        if (!existing || (existing.owner?._id !== (user._id || (user as any).id) && existing.ownerId !== (user._id || (user as any).id))) {
          setNotFound(true);
          return;
        }
        setFormData({
          type: existing.type === "Fully-Funded" ? "fully-funded" : "partial",
          courseType: existing.courseType || "",
          subjectGroups: existing.subjectGroups || "",
          registrationEndDate: toDateInputValue(existing.deadline),
          cgpaRequirement: existing.cgpaRequirement || "",
          feeCompensation: existing.amount.replace(/[^0-9.]/g, "") || "",
          scholarshipDescription: existing.description || "",
          requirements: existing.requirements || "",
          contactEmail: existing.contactEmail || user?.email || "",
          country: existing.country || "",
        });
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
        console.error("Failed to load scholarship", err);
        setNotFound(true);
      }
    };
    loadScholarship();
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

      await api.put(`/scholarships/${id}`, {
        title: `${formData.courseType === "masters" ? "Master's" : formData.courseType === "phd" ? "PhD" : "Bachelor's"} Scholarship - ${formData.subjectGroups}`,
        type: formData.type === "fully-funded" ? "Fully-Funded" : "Partial",
        deadline: formData.registrationEndDate,
        cgpaRequirement: formData.cgpaRequirement,
        amount: `$${formData.feeCompensation}`,
        description: formData.scholarshipDescription,
        requirements: formData.requirements,
        subjectGroups: formData.subjectGroups,
        courseType: formData.courseType,
        country: formData.country,
        requiredDocuments: normalizedRequiredDocuments,
        contactEmail: formData.contactEmail,
      });

      toast({ title: "Scholarship updated successfully!" });
      navigate("/dashboard/scholarships");
    } catch (err: any) {
      toast({ title: "Failed to update scholarship", description: err.message, variant: "destructive" });
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
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard/scholarships")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="font-display text-2xl font-bold">Edit Scholarship</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update scholarship details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="fully-funded">Fully-Funded</SelectItem>
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
                    value={formData.subjectGroups}
                    onChange={(e) => handleChange("subjectGroups", e.target.value)}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Funding</CardTitle>
              <CardDescription>Update academic and funding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="feeCompensation">Funding Amount *</Label>
                  <Input
                    id="feeCompensation"
                    type="number"
                    value={formData.feeCompensation}
                    onChange={(e) => handleChange("feeCompensation", e.target.value)}
                    required
                  />
                </div>
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
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scholarshipDescription">Scholarship Description *</Label>
                <Textarea
                  id="scholarshipDescription"
                  rows={6}
                  value={formData.scholarshipDescription}
                  onChange={(e) => handleChange("scholarshipDescription", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements *</Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/scholarships")}>
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

export default EditScholarship;
