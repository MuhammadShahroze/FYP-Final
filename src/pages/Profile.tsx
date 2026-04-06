import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { countries, subjects, degreeLevels } from "@/data/mockData";
import { toDateInputValue } from "@/lib/date";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nationality, setNationality] = useState(user?.nationality || "");
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(user?.dateOfBirth));
  const [academicRecords, setAcademicRecords] = useState(() =>
    (user?.academicInfo || []).map((r) => ({
      ...r,
      id: r.id || `acad_${crypto.randomUUID()}`,
      _editing: false,
    }))
  );
  const [prefCountries, setPrefCountries] = useState<string[]>(
    user?.preferences?.countries || []
  );
  const [prefSubjects, setPrefSubjects] = useState<string[]>(
    user?.preferences?.subjects || []
  );
  const [prefDegreeLevel, setPrefDegreeLevel] = useState<string>(
    user?.preferences?.degreeLevels?.[0] || ""
  );
  const [personalEditing, setPersonalEditing] = useState(false);
  const [prefEditing, setPrefEditing] = useState(false);

  useEffect(() => {
    setDateOfBirth(toDateInputValue(user?.dateOfBirth));
  }, [user?.dateOfBirth]);

  const academicToPersist = useMemo(
    () => academicRecords.map(({ _editing, ...r }) => r),
    [academicRecords]
  );

  const handleSave = () => {
    if (!user) return;

    updateProfile({
      name,
      phone,
      nationality,
      dateOfBirth,
      academicInfo: academicToPersist,
      preferences: {
        countries: prefCountries,
        subjects: prefSubjects,
        degreeLevels: prefDegreeLevel ? [prefDegreeLevel] : [],
      },
    });
    toast({ title: "Profile updated!" });
  };

  if (!user) return null;

  // Only implement full profile management for students for now
  if (user.role !== "student") {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h2 className="font-display text-xl font-bold">Profile</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {user.name}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              {user.institution && (
                <p><span className="font-medium">Institution:</span> {user.institution}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Profile Management</h2>
          </div>
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="academic">Academic Info</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={name}
                      disabled={!personalEditing}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={phone}
                      disabled={!personalEditing}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={nationality}
                      disabled={!personalEditing}
                      onChange={(e) => setNationality(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      disabled={!personalEditing}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  {personalEditing ? (
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                      onClick={() => {
                        handleSave();
                        setPersonalEditing(false);
                        toast({ title: "Personal information saved!" });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" /> Save Personal Info
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPersonalEditing(true)}
                    >
                      Edit Personal Info
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Academic Records</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAcademicRecords((prev) => [
                      ...prev,
                      {
                        id: `acad_${crypto.randomUUID()}`,
                        degree: "",
                        field: "",
                        institution: "",
                        cgpa: "",
                        graduationYear: "",
                        subjects: "",
                        transcript: "",
                        transcriptType: "",
                        transcriptSize: "",
                        transcriptUploadedAt: "",
                        _editing: true,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {academicRecords.map((record, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Degree</Label>
                        <Input
                          value={record.degree}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, degree: value } : r
                              )
                            );
                          }}
                          placeholder="Bachelor's, Master's, etc."
                          disabled={!record._editing}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Institution</Label>
                        <Input
                          value={record.institution}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, institution: value } : r
                              )
                            );
                          }}
                          placeholder="University name"
                          disabled={!record._editing}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CGPA</Label>
                        <Input
                          value={record.cgpa}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, cgpa: value } : r
                              )
                            );
                          }}
                          placeholder="e.g. 3.6"
                          disabled={!record._editing}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Subjects</Label>
                        <Input
                          value={record.subjects || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, subjects: value } : r
                              )
                            );
                          }}
                          placeholder="Major subjects (comma separated)"
                          disabled={!record._editing}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Transcript / Result Card</Label>
                        <Input
                          type="file"
                          disabled={!record._editing}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index
                                  ? {
                                      ...r,
                                      transcript: file.name,
                                      transcriptType: file.type || "",
                                      transcriptSize: `${(file.size / 1024).toFixed(1)} KB`,
                                      transcriptUploadedAt: new Date().toISOString().slice(0, 10),
                                    }
                                  : r
                              )
                            );
                          }}
                        />
                        {(record.transcript || record.transcriptSize) && (
                          <p className="text-[11px] text-muted-foreground">
                            {record.transcript || "—"}
                            {record.transcriptType ? ` · ${record.transcriptType}` : ""}
                            {record.transcriptSize ? ` · ${record.transcriptSize}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Graduation Year</Label>
                        <Input
                          value={record.graduationYear}
                          onChange={(e) => {
                            const value = e.target.value;
                            setAcademicRecords((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, graduationYear: value } : r
                              )
                            );
                          }}
                          placeholder="e.g. 2024"
                          disabled={!record._editing}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {record._editing ? (
                        <Button
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                          onClick={() => {
                            setAcademicRecords((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, _editing: false } : r))
                            );
                            updateProfile({ academicInfo: academicToPersist });
                            toast({ title: "Academic record saved!" });
                          }}
                        >
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAcademicRecords((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, _editing: true } : r))
                            )
                          }
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setAcademicRecords((prev) => {
                            const next = prev.filter((_, i) => i !== index);
                            updateProfile({ academicInfo: next.map(({ _editing, ...r }) => r) });
                            toast({ title: "Academic record removed" });
                            return next;
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {academicRecords.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No academic records added yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Study Preferences</CardTitle>
                {prefEditing ? (
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                    onClick={() => {
                      updateProfile({
                        preferences: {
                          countries: prefCountries,
                          subjects: prefSubjects,
                          degreeLevels: prefDegreeLevel ? [prefDegreeLevel] : [],
                        },
                      });
                      setPrefEditing(false);
                      toast({ title: "Preferences saved!" });
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrefEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Desired Countries</Label>
                  <div className="flex flex-wrap gap-2">
                    {countries.filter((c) => c !== "All Countries").map((c) => (
                      <Badge
                        key={c}
                        variant={prefCountries.includes(c) ? "default" : "outline"}
                        className={prefEditing ? "cursor-pointer" : "cursor-default opacity-70"}
                        onClick={() =>
                          prefEditing &&
                          setPrefCountries((prev) =>
                            prev.includes(c)
                              ? prev.filter((x) => x !== c)
                              : [...prev, c]
                          )
                        }
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subjects of Interest</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.filter((s) => s !== "All Subjects").map((s) => (
                      <Badge
                        key={s}
                        variant={prefSubjects.includes(s) ? "default" : "outline"}
                        className={prefEditing ? "cursor-pointer" : "cursor-default opacity-70"}
                        onClick={() =>
                          prefEditing &&
                          setPrefSubjects((prev) =>
                            prev.includes(s)
                              ? prev.filter((x) => x !== s)
                              : [...prev, s]
                          )
                        }
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Degree Levels</Label>
                  <div className="flex flex-wrap gap-2">
                    {degreeLevels.filter((d) => d !== "All Levels").map((d) => (
                      <Badge
                        key={d}
                        variant={prefDegreeLevel === d ? "default" : "outline"}
                        className={prefEditing ? "cursor-pointer" : "cursor-default opacity-70"}
                        onClick={() => prefEditing && setPrefDegreeLevel(d)}
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
