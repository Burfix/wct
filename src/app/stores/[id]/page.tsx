import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import { getStoreById } from "../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText
} from "lucide-react";
import { getStoreTypeLabel, categoryLabel, getExpiryStatusText } from "@/lib/compliance";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default async function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireOfficerOrAdmin();

  const store = await getStoreById(params.id);

  if (!store) {
    notFound();
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
            <StatusBadge status={store.overallStatus} />
          </div>
          <p className="text-muted-foreground mt-1">
            {store.storeCode} • {getStoreTypeLabel(store.storeType)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-red-600">{store.priorityScore}</div>
          <div className="text-sm text-muted-foreground">Priority Score</div>
        </div>
      </div>

      {/* Store Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-semibold">{store.zone}</div>
            {store.floor && <div className="text-sm text-muted-foreground">Floor {store.floor}</div>}
            {store.precinct && <div className="text-sm text-muted-foreground">{store.precinct}</div>}
            {store.highFootTraffic && (
              <Badge variant="secondary" className="mt-2">High Traffic Zone</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned Officer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {store.assignments[0] ? (
              <div className="space-y-1">
                <div className="font-semibold">
                  {store.assignments[0].user.name || store.assignments[0].user.email}
                </div>
                <div className="text-sm text-muted-foreground">
                  {store.assignments[0].user.role}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not assigned</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Tenant Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {store.tenantContact ? (
              <>
                <div className="font-semibold">{store.tenantContact}</div>
                {store.tenantEmail && (
                  <div className="text-sm text-muted-foreground">{store.tenantEmail}</div>
                )}
                {store.tenantPhone && (
                  <div className="text-sm text-muted-foreground">{store.tenantPhone}</div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No contact info</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Items */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Current compliance across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {store.complianceItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <div>
                      <div className="font-semibold">{categoryLabel(item.category)}</div>
                      {item.subCategory && (
                        <div className="text-sm text-muted-foreground">{item.subCategory}</div>
                      )}
                    </div>
                  </div>

                  {item.expiryDate && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {getExpiryStatusText(item.expiryDate)}
                    </div>
                  )}

                  {item.evidences.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-medium">Latest Evidence:</div>
                      <div className="text-sm text-muted-foreground">
                        {item.evidences[0].title} • Uploaded {formatRelativeTime(item.evidences[0].createdAt)}
                      </div>
                      <Badge
                        variant={
                          item.evidences[0].verificationStatus === "VERIFIED"
                            ? "success"
                            : item.evidences[0].verificationStatus === "REJECTED"
                            ? "error"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.evidences[0].verificationStatus}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      No evidence uploaded
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Corrective Actions */}
      {store.correctiveActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Corrective Actions</CardTitle>
            <CardDescription>Open and recent actions for this store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {store.correctiveActions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            action.severity === "CRITICAL" || action.severity === "HIGH"
                              ? "error"
                              : action.severity === "MEDIUM"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {action.severity}
                        </Badge>
                        <Badge variant={action.status === "OPEN" ? "error" : "secondary"}>
                          {action.status}
                        </Badge>
                      </div>
                      <div className="font-semibold mt-2">{action.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Due: {formatDate(action.dueDate)}</span>
                        {action.assignedTo && (
                          <span>Assigned to: {action.assignedTo.name || action.assignedTo.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audits */}
      {store.audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Audit history for this store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {store.audits.map((audit) => (
                <div
                  key={audit.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{audit.template.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Conducted by {audit.conductedBy.name || audit.conductedBy.email} •{" "}
                      {formatDate(audit.auditDate)}
                    </div>
                    {audit.overallRating && (
                      <Badge
                        variant={
                          audit.overallRating === "Pass"
                            ? "success"
                            : audit.overallRating === "Fail"
                            ? "error"
                            : "warning"
                        }
                        className="mt-2"
                      >
                        {audit.overallRating}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{audit.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
