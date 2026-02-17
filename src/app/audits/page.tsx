import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus, Calendar, User, Store } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

async function getAudits() {
  const audits = await prisma.audit.findMany({
    take: 50,
    orderBy: {
      auditDate: "desc",
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          storeCode: true,
          zone: true,
        },
      },
      conductedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          responses: true,
          comments: true,
        },
      },
    },
  });

  return audits;
}

function getStatusColor(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-green-100 text-green-800";
    case "COMPLETE":
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "SCHEDULED":
      return "bg-yellow-100 text-yellow-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function AuditsPage() {
  const session = await requireOfficerOrAdmin();
  const audits = await getAudits();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation session={session} />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audits & Inspections</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage compliance audits across all stores
            </p>
          </div>
          <Link href="/audits/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Audit
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audits.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits.filter((a) => a.status === "VERIFIED" || a.status === "COMPLETE").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits.filter((a) => a.status === "DRAFT" || a.status === "SUBMITTED").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits.filter(a => a.overallScore).length > 0
                  ? Math.round(audits.filter(a => a.overallScore).reduce((sum, a) => sum + (a.overallScore || 0), 0) / audits.filter(a => a.overallScore).length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audits List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No audits found</p>
                <p className="text-xs mt-1">Schedule your first audit to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {audits.map((audit) => (
                  <Link
                    key={audit.id}
                    href={`/audits/${audit.id}`}
                    className="block border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status.replace("_", " ")}
                          </Badge>
                          {audit.store && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Store className="h-4 w-4" />
                              {audit.store.name} ({audit.store.storeCode})
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(audit.auditDate), "PPP")}
                          </div>
                          {audit.conductedBy && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {audit.conductedBy.name || audit.conductedBy.email}
                            </div>
                          )}
                        </div>

                        {audit.generalComments && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {audit.generalComments}
                          </p>
                        )}

                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{audit._count.responses} responses</span>
                          <span>{audit._count.comments} comments</span>
                          {audit.overallScore && (
                            <span className="font-medium">Score: {audit.overallScore.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
