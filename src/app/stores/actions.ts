"use server";

import { prisma } from "@/lib/db";

export async function getStores(filters?: {
  zone?: string;
  storeType?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {
    status: "active",
  };

  if (filters?.zone) {
    where.zone = filters.zone;
  }

  if (filters?.storeType) {
    where.storeType = filters.storeType;
  }

  if (filters?.status) {
    where.overallStatus = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { storeCode: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const stores = await prisma.store.findMany({
    where,
    include: {
      assignments: {
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          complianceItems: true,
          correctiveActions: {
            where: {
              status: { in: ["OPEN", "IN_PROGRESS"] },
            },
          },
        },
      },
    },
    orderBy: [
      { priorityScore: "desc" },
      { name: "asc" },
    ],
  });

  return stores;
}

export async function getStoreById(id: string) {
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      assignments: {
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      complianceItems: {
        include: {
          evidences: {
            orderBy: { createdAt: "desc" },
            include: {
              createdBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
              verifiedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      correctiveActions: {
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      audits: {
        include: {
          template: true,
          conductedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { auditDate: "desc" },
        take: 10,
      },
    },
  });

  return store;
}

export async function getZones() {
  return prisma.zone.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
}
