import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTodo, Plus, Calendar, AlertCircle, Store, User } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

async function getCorrectiveActions() {
  const actions = await prisma.correctiveAction.findMany({
    take: 100,
    orderBy: {
      dueDate: "asc",
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
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return actions;
}

function getStatusColor(status: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "CLOSED":
      return "bg-purple-100 text-purple-800";
    case "ESCALATED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "default";
    case "LOW":
      return "secondary";
    default:
      return "outline";
  }
}

export default async function ActionsPage() {
  const session = await requireOfficerOrAdmin();
  const actions = await getCorrectiveActions();

  const now = new Date();
  const overdueActions = actions.filter(
    (a) => a.dueDate && new Date(a.dueDate) < now && a.status !== "RESOLVED" && a.status !== "CLOSED"
  );
  const criticalActions = actions.filter(
    (a) => a.severity === "CRITICAL" && a.status !== "RESOLVED" && a.status !== "CLOSED"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation session={session} />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Corrective Actions</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage compliance corrective actions
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Action
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueActions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {criticalActions.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {actions.filter((a) => a.status === "IN_PROGRESS").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {actions.filter((a) => a.status === "RESOLVED" || a.status === "CLOSED").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Actions */}
        {(overdueActions.length > 0 || criticalActions.length > 0) && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Priority Actions Requiring Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueActions.slice(0, 5).map((action) => (
                  <Link
                    key={action.id}
                    href={`/actions/${action.id}`}
                    className="block border border-red-200 rounded-lg p-4 bg-white hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(action.severity)}>
                            {action.severity}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">OVERDUE</Badge>
                          {action.store && (
                            <span className="text-sm text-muted-foreground">
                              {action.store.name}
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{action.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {action.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {format(new Date(action.dueDate), "PPP")}
                            </div>
                          )}
                          {action.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {action.assignedTo.name || action.assignedTo.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Actions */}
        <Card>
          <CardHeader>
            <CardTitle>All Corrective Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No corrective actions found</p>
                <p className="text-xs mt-1">Create an action to track compliance issues</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => {
                  const isOverdue =
                    action.dueDate &&
                    new Date(action.dueDate) < now &&
                    action.status !== "RESOLVED" &&
                    action.status !== "CLOSED";

                  return (
                    <Link
                      key={action.id}
                      href={`/actions/${action.id}`}
                      className="block border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getStatusColor(action.status)}>
                              {action.status.replace("_", " ")}
                            </Badge>
                            <Badge variant={getSeverityColor(action.severity)}>
                              {action.severity}
                            </Badge>
                            {isOverdue && (
                              <Badge className="bg-red-100 text-red-800">OVERDUE</Badge>
                            )}
                            {action.store && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Store className="h-4 w-4" />
                                {action.store.name} • {action.store.zone}
                              </div>
                            )}
                          </div>

                          <p className="font-medium">{action.description}</p>

                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {action.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Due: {format(new Date(action.dueDate), "PPP")}
                              </div>
                            )}
                            {action.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {action.assignedTo.name || action.assignedTo.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
