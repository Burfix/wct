"use client";

import { useState } from "react";
import { AlertTriangle, TrendingUp, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DrilldownMetrics {
  restaurantCriticals: number;
  highFootfallReds: number;
  expiringIn72h: number;
  overdueCriticalActions: number;
}

interface ZoneRisk {
  zone: string;
  totalStores: number;
  redStores: number;
  drilldown: DrilldownMetrics;
  riskScore: number;
}

interface DrilldownDetails {
  zone: string;
  restaurantCriticals: Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    category: string;
    expiryDate: Date | null;
  }>;
  highFootfallReds: Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    category: string;
  }>;
  expiringIn72h: Array<{
    storeCode: string;
    storeName: string;
    itemTitle: string;
    expiryDate: Date;
    hoursUntilExpiry: number;
  }>;
  overdueCriticalActions: Array<{
    storeCode: string;
    storeName: string;
    actionTitle: string;
    dueDate: Date;
    assignedTo: string | null;
  }>;
}

export function ExecutiveRiskRadar({ zones }: { zones: ZoneRisk[] }) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<DrilldownDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDrilldown = async (zone: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/zone-drilldown?zone=${encodeURIComponent(zone)}`);
      const data = await response.json();
      setDrilldownData(data);
      setSelectedZone(zone);
    } catch (error) {
      console.error("Failed to load drilldown:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Radar</h2>
          <p className="text-sm text-muted-foreground">
            Top 3 zones requiring executive attention
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Live Risk Assessment
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {zones.map((zone, index) => (
          <Card
            key={zone.zone}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              index === 0 ? "border-red-500 border-2" : ""
            }`}
            onClick={() => loadDrilldown(zone.zone)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{zone.zone}</CardTitle>
                <Badge variant={index === 0 ? "destructive" : "secondary"}>
                  #{index + 1}
                </Badge>
              </div>
              <CardDescription>
                {zone.redStores} of {zone.totalStores} stores at risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Restaurant Criticals */}
                {zone.drilldown.restaurantCriticals > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-muted-foreground">Restaurant Criticals</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {zone.drilldown.restaurantCriticals}
                    </span>
                  </div>
                )}

                {/* High-footfall Reds */}
                {zone.drilldown.highFootfallReds > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-muted-foreground">High-Traffic Issues</span>
                    </div>
                    <span className="font-semibold text-orange-600">
                      {zone.drilldown.highFootfallReds}
                    </span>
                  </div>
                )}

                {/* Next 72h Risk */}
                {zone.drilldown.expiringIn72h > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-muted-foreground">Expiring (72h)</span>
                    </div>
                    <span className="font-semibold text-amber-600">
                      {zone.drilldown.expiringIn72h}
                    </span>
                  </div>
                )}

                {/* Overdue Critical Actions */}
                {zone.drilldown.overdueCriticalActions > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-red-700" />
                      <span className="text-muted-foreground">Overdue Criticals</span>
                    </div>
                    <span className="font-semibold text-red-700">
                      {zone.drilldown.overdueCriticalActions}
                    </span>
                  </div>
                )}

                {/* No issues state */}
                {zone.drilldown.restaurantCriticals === 0 &&
                  zone.drilldown.highFootfallReds === 0 &&
                  zone.drilldown.expiringIn72h === 0 &&
                  zone.drilldown.overdueCriticalActions === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No critical issues detected
                    </p>
                  )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  loadDrilldown(zone.zone);
                }}
              >
                View Details →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drilldown Dialog */}
      <Dialog open={selectedZone !== null} onOpenChange={() => setSelectedZone(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedZone} - Risk Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of risk drivers requiring immediate attention
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && drilldownData && (
            <div className="space-y-6">
              {/* Restaurant Criticals */}
              {drilldownData.restaurantCriticals.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Restaurant Criticals ({drilldownData.restaurantCriticals.length})
                  </h3>
                  <div className="space-y-2">
                    {drilldownData.restaurantCriticals.map((item, idx) => (
                      <div key={idx} className="bg-red-50 p-3 rounded-md text-sm">
                        <div className="font-medium">
                          {item.storeCode} - {item.storeName}
                        </div>
                        <div className="text-muted-foreground">
                          {item.itemTitle} ({item.category})
                        </div>
                        {item.expiryDate && (
                          <div className="text-xs text-red-600 mt-1">
                            Expires: {new Date(item.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High-footfall Reds */}
              {drilldownData.highFootfallReds.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    High-Traffic Issues ({drilldownData.highFootfallReds.length})
                  </h3>
                  <div className="space-y-2">
                    {drilldownData.highFootfallReds.map((item, idx) => (
                      <div key={idx} className="bg-orange-50 p-3 rounded-md text-sm">
                        <div className="font-medium">
                          {item.storeCode} - {item.storeName}
                        </div>
                        <div className="text-muted-foreground">
                          {item.itemTitle} ({item.category})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring in 72h */}
              {drilldownData.expiringIn72h.length > 0 && (
                <div>
                  <h3 className="font-semibold text-amber-600 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Expiring in 72 Hours ({drilldownData.expiringIn72h.length})
                  </h3>
                  <div className="space-y-2">
                    {drilldownData.expiringIn72h.map((item, idx) => (
                      <div key={idx} className="bg-amber-50 p-3 rounded-md text-sm">
                        <div className="font-medium">
                          {item.storeCode} - {item.storeName}
                        </div>
                        <div className="text-muted-foreground">{item.itemTitle}</div>
                        <div className="text-xs text-amber-700 mt-1">
                          {item.hoursUntilExpiry}h remaining - Expires{" "}
                          {new Date(item.expiryDate).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue Critical Actions */}
              {drilldownData.overdueCriticalActions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overdue Critical Actions ({drilldownData.overdueCriticalActions.length})
                  </h3>
                  <div className="space-y-2">
                    {drilldownData.overdueCriticalActions.map((action, idx) => (
                      <div key={idx} className="bg-red-100 p-3 rounded-md text-sm">
                        <div className="font-medium">
                          {action.storeCode} - {action.storeName}
                        </div>
                        <div className="text-muted-foreground">{action.actionTitle}</div>
                        <div className="text-xs text-red-700 mt-1">
                          Due: {new Date(action.dueDate).toLocaleDateString()}
                          {action.assignedTo && ` • Assigned to: ${action.assignedTo}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
