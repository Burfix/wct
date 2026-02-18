import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import { getStores, getZones } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
import Link from "next/link";
import { getStoreTypeLabel } from "@/lib/compliance";
import { Navigation } from "@/components/navigation";
import { StoreFilters } from "@/components/store-filters";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: { search?: string; zone?: string; status?: string; type?: string };
}) {
  const session = await requireOfficerOrAdmin();

  const stores = await getStores({
    search: searchParams.search,
    zone: searchParams.zone,
    status: searchParams.status,
    storeType: searchParams.type,
  });

  const zones = await getZones();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation session={session} />
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Stores</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage compliance for all stores
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <StoreFilters zones={zones} />
        </CardContent>
      </Card>

      {/* Store Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Link key={store.id} href={`/stores/${store.id}`}>
            <Card className="hover:bg-accent transition-colors h-full">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {store.storeCode}
                    </p>
                  </div>
                  <StatusBadge status={store.overallStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {store.zone}
                  {store.floor && ` • Floor ${store.floor}`}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {getStoreTypeLabel(store.storeType)}
                  </Badge>
                  {store.highFootTraffic && (
                    <Badge variant="secondary">High Traffic</Badge>
                  )}
                  {store.priorityScore > 50 && (
                    <Badge variant="error">High Priority</Badge>
                  )}
                </div>

                {store.assignments[0] && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {store.assignments[0].user.name || store.assignments[0].user.email}
                  </div>
                )}

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">
                    {store._count.complianceItems} items
                  </span>
                  {store._count.correctiveActions > 0 && (
                    <span className="text-red-600 font-medium">
                      {store._count.correctiveActions} open action
                      {store._count.correctiveActions !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {stores.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No stores found matching your filters.
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}
