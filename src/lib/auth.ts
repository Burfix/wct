import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { User, UserRole } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            // Implement rate limiting by tracking failed attempts
            // In production, use Redis or similar for distributed rate limiting
            return null;
          }

          if (!user.active) {
            throw new Error("Account is inactive");
          }

          // Check if account is locked (more than 5 failed attempts in last 15 minutes)
          if (user.failedLoginAttempts >= 5) {
            const lockoutTime = user.lastFailedLoginAt ? new Date(user.lastFailedLoginAt.getTime() + 15 * 60 * 1000) : new Date();
            if (new Date() < lockoutTime) {
              throw new Error("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.");
            } else {
              // Reset failed attempts after lockout period
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: 0,
                  lastFailedLoginAt: null,
                },
              });
            }
          }

          const isPasswordValid = await compare(password, user.password);

          if (!isPasswordValid) {
            // Increment failed login attempts
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
                lastFailedLoginAt: new Date(),
              },
            });
            return null;
          }

          // Reset failed attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lastFailedLoginAt: null,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          if (error instanceof Error && error.message.includes("locked")) {
            throw error; // Re-throw lockout errors so they reach the UI
          }
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
