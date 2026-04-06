import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Mail, School, User, Calendar, CheckCircle2, XCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [application, setApplication] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [scholarship, setScholarship] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusToConfirm, setStatusToConfirm] = useState<"pending" | "under_review" | "accepted" | "rejected" | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchApp = async () => {
      try {
        const res = await api.get(`/applications/${id}`);
        const appData = res.data.data;
        setApplication(appData);

        if (appData.program || appData.programId) {
           const pid = appData.program?._id || appData.program || appData.programId;
           const pRes = await api.get(`/programs/${pid}`);
           setProgram(pRes.data.data);
        }
        if (appData.scholarship || appData.scholarshipId) {
           const sid = appData.scholarship?._id || appData.scholarship || appData.scholarshipId;
           const sRes = await api.get(`/scholarships/${sid}`);
           setScholarship(sRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load application details", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4 text-center">Loading application...</div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Application not found or has been removed.
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isAccepted = application.status === "accepted";
  const isRejected = application.status === "rejected";
  const canManageStatus = user?.role === "university" || user?.role === "scholarship_org";
  const statusLabelMap = {
    pending: "Pending",
    under_review: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  } as const;

  const requestStatusChange = (nextStatus: "pending" | "under_review" | "accepted" | "rejected") => {
    setStatusToConfirm(nextStatus);
  };

  const confirmStatusChange = async () => {
    if (!statusToConfirm || !id) return;
    setIsUpdatingStatus(true);
    try {
      await api.put(`/applications/${id}/status`, { status: statusToConfirm });
      setApplication((prev: any) => ({ ...prev, status: statusToConfirm }));
      toast({
        title: "Application status updated",
        description: `Status changed to ${statusLabelMap[statusToConfirm]}.`,
      });
      setStatusToConfirm(null);
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error?.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold">Application Detail</h2>
            <p className="text-sm text-muted-foreground">
              Full student profile and submitted information for this application.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {application.student?.name || application.studentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {application.student?.email || application.studentEmail}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <School className="h-3 w-3" />
                  CGPA: {application.student?.academicInfo?.[0]?.cgpa || application.studentCgpa}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied: {new Date(application.createdAt || application.appliedDate).toLocaleDateString()}
                </Badge>
                <Badge
                  className="flex items-center gap-1"
                  variant={
                    isAccepted ? "default" : isRejected ? "destructive" : "secondary"
                  }
                >
                  {isAccepted && <CheckCircle2 className="h-3 w-3" />}
                  {isRejected && <XCircle className="h-3 w-3" />}
                  Status: {application.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Submitted Documents</p>
                {application.documents && application.documents.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {application.documents.map((doc, idx) => (
                      <li key={`${doc?.name || "doc"}-${idx}`}>
                        {doc?.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            download={doc?.fileName || doc?.name || `document-${idx + 1}`}
                            className="text-primary underline break-all"
                          >
                            {doc?.name || doc?.fileName || doc.url}
                          </a>
                        ) : (
                          doc?.name || "Document"
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No specific documents listed for this application.</p>
                )}
              </div>

              {canManageStatus && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Quick Status Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-50"
                      onClick={() => requestStatusChange("accepted")}
                      disabled={isUpdatingStatus || application.status === "accepted"}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-700 hover:bg-red-50"
                      onClick={() => requestStatusChange("rejected")}
                      disabled={isUpdatingStatus || application.status === "rejected"}
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-amber-500 text-amber-700 hover:bg-amber-50"
                      onClick={() => requestStatusChange("pending")}
                      disabled={isUpdatingStatus || application.status === "pending"}
                    >
                      Pending
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-blue-500 text-blue-700 hover:bg-blue-50"
                      onClick={() => requestStatusChange("under_review")}
                      disabled={isUpdatingStatus || application.status === "under_review"}
                    >
                      Under Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Applied Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {program && (
                <div className="space-y-1">
                  <p className="font-semibold">{program.title}</p>
                  <p className="text-xs text-muted-foreground">{program.owner?.name || program.ownerName}</p>
                  <p className="text-xs text-muted-foreground">Deadline: {formatDate(program.deadline)}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{program.description}</p>
                </div>
              )}
              {scholarship && (
                <div className="space-y-1">
                  <p className="font-semibold">{scholarship.title}</p>
                  <p className="text-xs text-muted-foreground">{scholarship.owner?.name || scholarship.ownerName}</p>
                  <p className="text-xs text-muted-foreground">Deadline: {formatDate(scholarship.deadline)}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{scholarship.description}</p>
                </div>
              )}
              {!program && !scholarship && (
                <p className="text-xs text-muted-foreground">Linked program or scholarship could not be found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AlertDialog open={!!statusToConfirm} onOpenChange={(open) => !open && setStatusToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm status change</AlertDialogTitle>
            <AlertDialogDescription>
              {statusToConfirm
                ? `Are you sure you want to set this application to ${statusLabelMap[statusToConfirm]}?`
                : "Are you sure you want to update this status?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ApplicationDetail;
