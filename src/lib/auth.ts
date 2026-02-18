import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

// ---------------------------------------------------------------------------
// Demo allowlist — these users are upserted automatically if not in the DB.
// Password-less login is only permitted for these emails.
// ---------------------------------------------------------------------------
const DEMO_USERS: { email: string; name: string; role: UserRole }[] = [
  { email: "manager@vawaterfront.co.za", name: "Mall Manager", role: "ADMIN" },
  { email: "officer1@vawaterfront.co.za", name: "Compliance Officer 1", role: "OFFICER" },
  { email: "officer2@vawaterfront.co.za", name: "Compliance Officer 2", role: "OFFICER" },
  { email: "officer3@vawaterfront.co.za", name: "Compliance Officer 3", role: "OFFICER" },
];

const DEMO_EMAILS = new Set(DEMO_USERS.map((u) => u.email));

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
          const password = credentials?.password as string | undefined;

          if (!email) {
            if (process.env.NODE_ENV === "development") console.warn("[auth] No email provided");
            return null;
          }

          // ── PASSWORD-LESS PATH (demo allowlist only) ──────────────────────
          if (!password) {
            if (!DEMO_EMAILS.has(email)) {
              if (process.env.NODE_ENV === "development")
                console.warn("[auth] Passwordless attempt for non-demo email:", email);
              return null;
            }

            // Upsert demo user so it always exists, even before seeding.
            const demo = DEMO_USERS.find((u) => u.email === email)!;
            const user = await prisma.user.upsert({
              where: { email },
              update: { active: true },
              create: {
                email,
                name: demo.name,
                role: demo.role,
                active: true,
                password: null,
              },
            });

            return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
          }

          // ── PASSWORD PATH (any user with a hashed password) ───────────────
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            if (process.env.NODE_ENV === "development") console.warn("[auth] User not found:", email);
            return null;
          }

          if (!user.active) {
            if (process.env.NODE_ENV === "development") console.warn("[auth] Inactive user:", email);
            return null;
          }

          if (!user.password) {
            if (process.env.NODE_ENV === "development")
              console.warn("[auth] No password set for user:", email);
            return null;
          }

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            if (process.env.NODE_ENV === "development") console.warn("[auth] Invalid password for:", email);
            return null;
          }

          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
        } catch (error) {
          // Never expose stack trace to client
          if (process.env.NODE_ENV === "development") console.error("[auth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

// NextAuth v5 beta uses different module augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}
