"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  ListTodo,
  Settings,
  LogOut,
  User,
} from "lucide-react";

interface NavigationProps {
  session: {
    user: {
      name?: string | null;
      email?: string;
      role: string;
    };
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OFFICER"] },
  { name: "Stores", href: "/stores", icon: Building2, roles: ["ADMIN", "OFFICER"] },
  { name: "My Stores", href: "/my-stores", icon: Building2, roles: ["OFFICER"] },
  { name: "Audits", href: "/audits", icon: ClipboardCheck, roles: ["ADMIN", "OFFICER"] },
  { name: "Actions", href: "/actions", icon: ListTodo, roles: ["ADMIN", "OFFICER"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

export function Navigation({ session }: NavigationProps) {
  const pathname = usePathname();
  const userRole = session.user.role;

  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <nav className="bg-white border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V&A</span>
                </div>
                <span className="font-semibold text-gray-900">
                  Compliance Tracker
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium text-gray-900">
                {session.user.name || session.user.email}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {session.user.role}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
