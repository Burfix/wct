"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const USERS = [
  {
    id: "manager",
    email: "manager@vawaterfront.co.za",
    name: "Mall Manager",
    role: "ADMIN",
    description: "Full access to all features and reports"
  },
  {
    id: "officer1",
    email: "officer1@vawaterfront.co.za",
    name: "Compliance Officer 1",
    role: "OFFICER",
    description: "Conduct audits and inspections"
  },
  {
    id: "officer2",
    email: "officer2@vawaterfront.co.za",
    name: "Compliance Officer 2",
    role: "OFFICER",
    description: "Conduct audits and inspections"
  },
  {
    id: "officer3",
    email: "officer3@vawaterfront.co.za",
    name: "Compliance Officer 3",
    role: "OFFICER",
    description: "Conduct audits and inspections"
  },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserSelect = async (email: string) => {
    setLoading(true);
    setSelectedUser(email);

    try {
      const result = await signIn("credentials", {
        email,
        redirect: false,
      });

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setLoading(false);
        setSelectedUser(null);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Authentication error:", err);
      setLoading(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-bold text-gray-900 mb-2">
            V&A Waterfront
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Mall Risk Compliance Tracker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Select Your Role
            </h2>
            <p className="text-gray-600">
              Choose your user profile to access the system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.email)}
                disabled={loading}
                className={`
                  p-6 rounded-lg border-2 text-left transition-all
                  hover:border-blue-500 hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedUser === user.email 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.email}
                    </p>
                  </div>
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                    }
                  `}>
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {user.description}
                </p>
                {selectedUser === user.email && loading && (
                  <div className="mt-3 text-sm text-blue-600 font-medium">
                    Signing in...
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>No password required • Quick access demo mode</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
