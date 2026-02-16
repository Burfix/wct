"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

interface Zone {
  id: string;
  name: string;
}

interface StoreFiltersProps {
  zones: Zone[];
}

export function StoreFilters({ zones }: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [zone, setZone] = useState(searchParams.get("zone") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [type, setType] = useState(searchParams.get("type") || "");

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (zone) params.set("zone", zone);
    if (status) params.set("status", status);
    if (type) params.set("type", type);

    router.push(`/stores?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setZone("");
    setStatus("");
    setType("");
    router.push("/stores");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Store name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Zone</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            value={type}
            onChange={(e) => setType(e.target.value)}
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
      <div className="flex gap-2">
        <Button onClick={handleFilter} className="gap-2">
          <Search className="w-4 h-4" />
          Apply Filters
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  );
}
