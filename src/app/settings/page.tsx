import { requireAdmin } from "@/lib/auth-helpers";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Building2,
  Bell,
  Shield,
  Database,
  Mail,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/db";

async function getSystemSettings() {
  const [users, stores, zones] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    }),
    prisma.store.count(),
    prisma.zone.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    }),
  ]);

  return { users, stores, zones };
}

export default async function SettingsPage() {
  const session = await requireAdmin();
  const { users, stores, zones } = await getSystemSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation session={session} />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage system configuration and user access
          </p>
        </div>

        {/* System Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {users.filter((u) => u.active).length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {zones.length} zones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts and permissions
                </p>
              </div>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        user.role === "ADMIN"
                          ? "destructive"
                          : user.role === "OFFICER"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure system notifications and alerts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email alerts for critical compliance issues
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Expiry Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Alert users 30 days before certificate expiration
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Summary Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Send daily compliance summary to managers
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.example.com"
                  defaultValue=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  defaultValue="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="compliance@vawaterfront.co.za"
                  defaultValue=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  placeholder="V&A Compliance Team"
                  defaultValue=""
                />
              </div>
            </div>
            <Button>Save Email Settings</Button>
          </CardContent>
        </Card>

        {/* Compliance Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Compliance Thresholds</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure warning periods and risk scoring
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orange-threshold">Orange Warning (days)</Label>
                <Input
                  id="orange-threshold"
                  type="number"
                  placeholder="30"
                  defaultValue="30"
                />
                <p className="text-xs text-muted-foreground">
                  Items expiring within this period show as ORANGE
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="red-threshold">Red Alert (days)</Label>
                <Input
                  id="red-threshold"
                  type="number"
                  placeholder="7"
                  defaultValue="7"
                />
                <p className="text-xs text-muted-foreground">
                  Items expiring within this period show as RED
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-frequency">Audit Frequency (days)</Label>
                <Input
                  id="audit-frequency"
                  type="number"
                  placeholder="90"
                  defaultValue="90"
                />
                <p className="text-xs text-muted-foreground">
                  Default time between scheduled audits
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-sla">Action SLA (days)</Label>
                <Input
                  id="action-sla"
                  type="number"
                  placeholder="14"
                  defaultValue="14"
                />
                <p className="text-xs text-muted-foreground">
                  Default deadline for corrective actions
                </p>
              </div>
            </div>
            <Button>Save Threshold Settings</Button>
          </CardContent>
        </Card>

        {/* Zones Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Zone Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  V&A Waterfront zones and precincts
                </p>
              </div>
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      {zone.description && (
                        <p className="text-sm text-muted-foreground">{zone.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admin accounts
                </p>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 30 minutes
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Password Policy</Label>
                <p className="text-sm text-muted-foreground">
                  Minimum 8 characters with complexity requirements
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
