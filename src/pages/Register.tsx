import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Building2, Award, User, Mail, Lock, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "student", label: "Student", description: "Find programs & scholarships", icon: <User className="h-6 w-6" /> },
  { value: "university", label: "University", description: "List programs & review applicants", icon: <Building2 className="h-6 w-6" /> },
  { value: "scholarship_org", label: "Scholarship Org", description: "Manage scholarships & applications", icon: <Award className="h-6 w-6" /> },
  { value: "admin", label: "Admin", description: "Manage the platform", icon: <User className="h-6 w-6" /> },
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = role === "student" ? 4 : 3;

  const validateStep2 = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return false;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return false;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !role) {
      toast({ title: "Please select a role", variant: "destructive" });
      return;
    }
    if (step === 2 && !validateStep2()) return;
    if (step === 2 && role !== "student") {
      handleRegister();
      return;
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    if (!role) return;
    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      role,
      institution: role === "student" ? undefined : name,
      nationality: role === "student" ? nationality : undefined,
      dateOfBirth: role === "student" ? dateOfBirth : undefined,
    });
    setLoading(false);
    
    if (!result.success) {
      toast({ 
        title: "Registration failed", 
        description: result.error || "Please try again later.",
        variant: "destructive" 
      });
      return;
    }
    
    if (step < totalSteps) {
      setStep(totalSteps); // go to verification step
    } else {
      navigate("/dashboard");
    }
  };

  const handleFinalStep = () => {
    // Verification notice — just redirect
    navigate("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-8">
      {/* Background pattern (match Hero) */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
          <span className="font-display text-2xl font-bold text-primary-foreground">EduDuctor</span>
        </Link>

        {/* Progress bar */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={cn("h-0.5 w-8", i + 1 < step ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <Card>
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Join EduDuctor</CardTitle>
                <CardDescription>Select your account type to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                      role === r.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg",
                      role === r.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {r.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{r.label}</p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </div>
                  </button>
                ))}
                <Button onClick={nextStep} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Create your {role === "student" ? "student" : "organization"} account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {role === "student"
                      ? "Full Name"
                      : role === "university"
                      ? "University Name"
                      : role === "scholarship_org"
                      ? "Organization Name"
                      : "Admin Name"}
                  </Label>
                  <Input
                    placeholder={
                      role === "student"
                        ? "John Doe"
                        : role === "university"
                        ? "Technical University of..."
                        : role === "scholarship_org"
                        ? "DAAD, Erasmus..."
                        : "Admin User"
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3 (Student): Basic Profile */}
          {step === 3 && role === "student" && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Basic Profile</CardTitle>
                <CardDescription>Help us personalize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    placeholder="e.g. Nigerian"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Institution (optional)</Label>
                  <Input placeholder="e.g. University of Lagos" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleRegister} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3 (Org) or Step 4 (Student): Verification */}
          {((step === 3 && role !== "student") || step === 4) && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>We've sent a verification link to <strong>{email}</strong></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Check your inbox and click the link to verify your account. You can start exploring while you wait.
                </p>
                <Button onClick={handleFinalStep} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Go to Dashboard
                </Button>
              </CardContent>
            </>
          )}

        </Card>

        <p className="mt-4 text-center text-sm text-primary-foreground/80">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-foreground font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
