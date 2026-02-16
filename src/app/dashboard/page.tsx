import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import {
  getDashboardStats,
  getPriorityStores,
  getZoneHotspots,
  getCategoryBreakdown,
  getOfficerWorkload,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getStoreTypeLabel } from "@/lib/compliance";

export default async function DashboardPage() {
  await requireOfficerOrAdmin();

  const [stats, priorityStores, zoneHotspots, categoryBreakdown, officerWorkload] =
    await Promise.all([
      getDashboardStats(),
      getPriorityStores(20),
      getZoneHotspots(),
      getCategoryBreakdown(),
      getOfficerWorkload(),
    ]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          V&A Waterfront Compliance Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          High-level overview of compliance status across all stores
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <div className="flex gap-2 mt-2">
              <StatusDot status="GREEN" />
              <span className="text-xs text-muted-foreground">{stats.green} Compliant</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.red}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {stats.orange} expiring soon
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringIn30}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.expiringIn7} within 7 days • {stats.expiringIn14} within 14 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueActions}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.criticalOverdueActions} overdue &gt;7 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Today's Focus — High Priority Stores</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked by risk score with actionable insights
          </p>
        </CardHeader>
        <CardContent>
          {priorityStores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No high priority items. All stores are compliant!
            </div>
          ) : (
            <div className="space-y-3">
              {priorityStores.map((store, index) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.id}`}
                  className="block border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-semibold">{store.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {store.storeCode} • {store.zone}
                            {store.floor && ` • Floor ${store.floor}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {getStoreTypeLabel(store.storeType)}
                        </Badge>
                        <StatusBadge status={store.calculatedStatus} />
                        {store.highFootTraffic && (
                          <Badge variant="secondary">High Traffic</Badge>
                        )}
                      </div>

                      {/* Priority Reasons */}
                      {store.priorityReasons.length > 0 && (
                        <div className="text-sm space-y-1">
                          <div className="font-medium text-muted-foreground">
                            Why high priority:
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {store.priorityReasons.map((reason, i) => (
                              <li key={i}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-2">
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {store.priorityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                      </div>
                      {store.assignedOfficer && (
                        <div className="text-sm text-muted-foreground">
                          Assigned: {store.assignedOfficer.name || store.assignedOfficer.email}
                        </div>
                      )}
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          {store.correctiveActions.length} open action
                          {store.correctiveActions.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Hotspots & Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zone Hotspots</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compliance by zone/precinct
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zoneHotspots.slice(0, 8).map((zone) => (
                <div key={zone.zone} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{zone.zone}</span>
                    <Badge variant={zone.riskScore > 50 ? "error" : "secondary"}>
                      Risk: {zone.riskScore}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{zone.green} ✓</span>
                    <span className="text-orange-600">{zone.orange} ⚠</span>
                    <span className="text-red-600">{zone.red} ✗</span>
                    <span className="text-muted-foreground ml-auto">
                      {zone.total} stores
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${(zone.green / zone.total) * 100}%` }}
                    />
                    <div
                      className="bg-orange-500"
                      style={{ width: `${(zone.orange / zone.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${(zone.red / zone.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Risk Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              What's driving non-compliance
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((cat: any) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {cat.category.replace(/_/g, " ")}
                    </span>
                    <div className="flex gap-2">
                      {cat.red > 0 && (
                        <Badge variant="error" className="text-xs">
                          {cat.red} RED
                        </Badge>
                      )}
                      {cat.orange > 0 && (
                        <Badge variant="warning" className="text-xs">
                          {cat.orange} ORANGE
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(cat.red / (cat.red + cat.orange)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-orange-500"
                      style={{
                        width: `${(cat.orange / (cat.red + cat.orange)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Officer Workload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload & Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Officer assignments and capacity
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {officerWorkload.map((officer) => (
              <div
                key={officer.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <div className="font-medium">{officer.name}</div>
                  <div className="text-sm text-muted-foreground">{officer.email}</div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{officer.assignedStores}</div>
                    <div className="text-muted-foreground">Stores</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold ${officer.redStores > 0 ? "text-red-600" : ""}`}>
                      {officer.redStores}
                    </div>
                    <div className="text-muted-foreground">Red</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{officer.openActions}</div>
                    <div className="text-muted-foreground">Actions</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold ${officer.overdueActions > 0 ? "text-red-600" : ""}`}>
                      {officer.overdueActions}
                    </div>
                    <div className="text-muted-foreground">Overdue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
