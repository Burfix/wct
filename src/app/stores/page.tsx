import { requireOfficerOrAdmin } from "@/lib/auth-helpers";
import { getStores, getZones } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, User } from "lucide-react";
import Link from "next/link";
import { getStoreTypeLabel } from "@/lib/compliance";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: { search?: string; zone?: string; status?: string; type?: string };
}) {
  await requireOfficerOrAdmin();

  const stores = await getStores({
    search: searchParams.search,
    zone: searchParams.zone,
    status: searchParams.status,
    storeType: searchParams.type,
  });

  const zones = await getZones();

  return (
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
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Store name or code..."
                defaultValue={searchParams.search}
                name="search"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Zone</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue={searchParams.zone}
                name="zone"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.name}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue={searchParams.status}
                name="status"
              >
                <option value="">All Statuses</option>
                <option value="GREEN">Compliant</option>
                <option value="ORANGE">Expiring Soon</option>
                <option value="RED">Non-Compliant</option>
                <option value="GREY">N/A</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Store Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue={searchParams.type}
                name="type"
              >
                <option value="">All Types</option>
                <option value="FB">Food & Beverage</option>
                <option value="RETAIL">Retail</option>
                <option value="LUXURY">Luxury</option>
                <option value="SERVICES">Services</option>
                <option value="ATTRACTION">Attraction</option>
                <option value="POPUP">Pop-up</option>
              </select>
            </div>
          </div>
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
  );
}
