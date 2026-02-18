import { PrismaClient, StoreType, ComplianceCategory, ActionSeverity, ActionStatus, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ZONES = [
  "Silo District",
  "Victoria Wharf - Upper Level",
  "Victoria Wharf - Lower Level",
  "Waterfront Food Court",
  "Quay 4",
  "Quay 5",
  "Quay 6",
  "Watershed",
  "Clock Tower Precinct",
  "Granger Bay",
  "Pierhead",
  "V&A Marina",
];

const FB_STORES = [
  "Ocean Basket", "Spur", "Col'Cacchio", "Cattle Baron", "Willoughby & Co",
  "Harbour House", "Tiger's Milk", "Knead", "Vida e Caffè", "Tashas",
  "Nando's", "Cape Town Fish Market", "Den Anker", "The Hussar Grill",
  "Newport Market & Deli", "Grand Café & Beach", "La Parada", "Loading Bay",
  "Sevruga", "Balducci", "Belthazar", "Baia Seafood", "Mitchell's Scottish Ale House",
];

const RETAIL_STORES = [
  "Woolworths", "H&M", "Zara", "Mr Price", "Edgars", "Truworths",
  "Cotton On", "Sportscene", "Foot Locker", "Nike", "Adidas", "Puma",
  "The Space", "Exclusive Books", "CNA", "Cape Union Mart", "Outdoor Warehouse",
  "Clicks", "Dis-Chem", "Sorbet", "The Body Shop", "MAC Cosmetics",
];

const LUXURY_STORES = [
  "Louis Vuitton", "Gucci", "Prada", "Burberry", "Montblanc",
  "Tag Heuer", "Omega", "Rolex", "Swarovski", "Pandora",
  "Tiffany & Co", "Cartier", "Hermès", "Chopard",
];

const SERVICES = [
  "FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec Bank",
  "Virgin Active", "Planet Fitness", "Dischem Pharmacy", "Clicks Pharmacy",
  "PostNet", "UPS Store", "Phone Repair Hub", "SIM Solutions",
];

const ATTRACTIONS = [
  "Two Oceans Aquarium", "Zeitz MOCAA", "V&A Market", "Watershed Craft Market",
  "Scratch Patch", "Cape Wheel", "Diamond Museum", "Clock Tower Museum",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysOffset: number, variance: number = 30): Date {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysOffset);
  baseDate.setDate(baseDate.getDate() + randomInt(-variance, variance));
  return baseDate;
}

export async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.auditComment.deleteMany();
  await prisma.auditSignature.deleteMany();
  await prisma.auditAcknowledgement.deleteMany();
  await prisma.auditPhoto.deleteMany();
  await prisma.auditResponse.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditQuestion.deleteMany();
  await prisma.auditSection.deleteMany();
  await prisma.auditTemplate.deleteMany();
  await prisma.storeQRCode.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.complianceItem.deleteMany();
  await prisma.storeAssignment.deleteMany();
  await prisma.store.deleteMany();
  await prisma.peakPeriod.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log("👥 Creating users...");
  const hashedPassword = await hash("password123", 12);

  const manager = await prisma.user.create({
    data: {
      email: "manager@vawaterfront.co.za",
      password: hashedPassword,
      name: "Sarah Williams",
      role: "ADMIN",
    },
  });

  const officers = await Promise.all([
    prisma.user.create({
      data: {
        email: "officer1@vawaterfront.co.za",
        password: hashedPassword,
        name: "James Thompson",
        role: "OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        email: "officer2@vawaterfront.co.za",
        password: hashedPassword,
        name: "Amara Ndlovu",
        role: "OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        email: "officer3@vawaterfront.co.za",
        password: hashedPassword,
        name: "David Chen",
        role: "OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        email: "officer4@vawaterfront.co.za",
        password: hashedPassword,
        name: "Priya Naidoo",
        role: "OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        email: "officer5@vawaterfront.co.za",
        password: hashedPassword,
        name: "Michael van der Merwe",
        role: "OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        email: "officer6@vawaterfront.co.za",
        password: hashedPassword,
        name: "Linda Botha",
        role: "OFFICER",
      },
    }),
  ]);

  console.log(`✅ Created 1 manager and ${officers.length} officers`);

  // Create Zones
  console.log("📍 Creating zones...");
  await Promise.all(
    ZONES.map((zoneName, index) =>
      prisma.zone.create({
        data: {
          name: zoneName,
          order: index,
        },
      })
    )
  );

  // Create System Settings
  console.log("⚙️  Creating system settings...");
  await prisma.systemSettings.createMany({
    data: [
      { key: "EXPIRY_THRESHOLD_DAYS", value: "30", description: "Days before expiry to show orange status" },
      { key: "CRITICAL_ACTION_ESCALATION_DAYS", value: "7", description: "Days before critical actions auto-escalate" },
    ],
  });

  // Create Peak Periods
  console.log("📅 Creating peak periods...");
  const now = new Date();
  await prisma.peakPeriod.createMany({
    data: [
      {
        name: "Summer Holiday Season",
        startDate: new Date(now.getFullYear(), 11, 15),
        endDate: new Date(now.getFullYear() + 1, 0, 15),
        tag: "Holiday",
      },
      {
        name: "Easter Weekend",
        startDate: new Date(now.getFullYear(), 3, 10),
        endDate: new Date(now.getFullYear(), 3, 13),
        tag: "Holiday",
      },
      {
        name: "Cruise Ship Week",
        startDate: new Date(now.getFullYear(), 1, 20),
        endDate: new Date(now.getFullYear(), 1, 27),
        tag: "Cruise Week",
      },
    ],
  });

  // Note: Audit Templates are seeded by separate script: prisma/seed-restaurant-audit.ts

  // Create 400 Stores
  console.log("🏪 Creating 400 stores...");
  const stores: Prisma.StoreUncheckedCreateInput[] = [];
  let storeCounter = 1;

  // F&B stores (60)
  for (let i = 0; i < 60; i++) {
    const zone = randomElement(ZONES);
    stores.push({
      storeCode: `FB${String(storeCounter).padStart(3, "0")}`,
      name: `${randomElement(FB_STORES)} ${i > 22 ? `(${randomElement(["Waterfront", "Marina", "Quay"])})` : ""}`,
      zone,
      floor: randomElement(["Ground", "Upper", "Lower", null]),
      storeType: "FB" as StoreType,
      highFootTraffic: ["Waterfront Food Court", "Victoria Wharf - Lower Level"].includes(zone) || Math.random() > 0.6,
      tradingHours: "09:00 - 21:00",
      status: "active",
      createdById: manager.id,
    });
    storeCounter++;
  }

  // Retail stores (250)
  for (let i = 0; i < 250; i++) {
    const zone = randomElement(ZONES);
    stores.push({
      storeCode: `RT${String(storeCounter).padStart(3, "0")}`,
      name: `${randomElement(RETAIL_STORES)} ${i > 21 ? `#${randomInt(1, 5)}` : ""}`,
      zone,
      floor: randomElement(["Ground", "Upper", "Lower", null]),
      storeType: "RETAIL" as StoreType,
      highFootTraffic: ["Victoria Wharf - Lower Level", "Victoria Wharf - Upper Level"].includes(zone) || Math.random() > 0.7,
      tradingHours: "09:00 - 20:00",
      status: "active",
      createdById: manager.id,
    });
    storeCounter++;
  }

  // Luxury stores (40)
  for (let i = 0; i < 40; i++) {
    stores.push({
      storeCode: `LX${String(storeCounter).padStart(3, "0")}`,
      name: `${randomElement(LUXURY_STORES)} ${i > 13 ? "Boutique" : ""}`,
      zone: randomElement(["Victoria Wharf - Upper Level", "Clock Tower Precinct"]),
      floor: "Upper",
      storeType: "LUXURY" as StoreType,
      highFootTraffic: false,
      tradingHours: "10:00 - 19:00",
      status: "active",
      createdById: manager.id,
    });
    storeCounter++;
  }

  // Services (40)
  for (let i = 0; i < 40; i++) {
    stores.push({
      storeCode: `SV${String(storeCounter).padStart(3, "0")}`,
      name: `${randomElement(SERVICES)} ${i > 12 ? `Branch ${randomInt(1, 3)}` : ""}`,
      zone: randomElement(ZONES),
      floor: randomElement(["Ground", "Upper", null]),
      storeType: "SERVICES" as StoreType,
      highFootTraffic: Math.random() > 0.5,
      tradingHours: "08:00 - 18:00",
      status: "active",
      createdById: manager.id,
    });
    storeCounter++;
  }

  // Attractions (10)
  for (let i = 0; i < 10; i++) {
    stores.push({
      storeCode: `AT${String(storeCounter).padStart(3, "0")}`,
      name: randomElement(ATTRACTIONS),
      zone: randomElement(ZONES),
      storeType: "ATTRACTION" as StoreType,
      highFootTraffic: true,
      tradingHours: "09:00 - 18:00",
      status: "active",
      createdById: manager.id,
    });
    storeCounter++;
  }

  // Insert stores in batches
  const createdStores = [];
  for (let i = 0; i < stores.length; i += 50) {
    const batch = stores.slice(i, i + 50);
    const result = await Promise.all(
      batch.map((store) => prisma.store.create({ data: store }))
    );
    createdStores.push(...result);
    console.log(`  Created stores ${i + 1}-${Math.min(i + 50, stores.length)}`);
  }

  console.log(`✅ Created ${createdStores.length} stores`);

  // Assign stores to officers (evenly distributed)
  console.log("🔗 Assigning stores to officers...");
  for (let i = 0; i < createdStores.length; i++) {
    const officer = officers[i % officers.length];
    await prisma.storeAssignment.create({
      data: {
        storeId: createdStores[i].id,
        userId: officer.id,
        assignedBy: manager.id,
      },
    });
  }

  console.log("✅ Assigned all stores to officers");

  // Create Compliance Items for each store
  console.log("📊 Creating compliance items...");
  for (const store of createdStores) {
    const categories: ComplianceCategory[] = store.storeType === "FB"
      ? [
          "OHS_RISK_ASSESSMENT",
          "EXTRACTION_CERT",
          "FIRE_SUPPRESSION_CERT",
          "FIRE_EQUIPMENT",
          "TRAINING",
          "FIRST_AID",
        ]
      : [
          "OHS_RISK_ASSESSMENT",
          "FIRE_EQUIPMENT",
          "TRAINING",
          "FIRST_AID",
        ];

    for (const category of categories) {
      // Randomly make some items red, orange, or green
      const statusRoll = Math.random();
      let status: "GREEN" | "ORANGE" | "RED";
      let expiryDate: Date | null = null;

      if (statusRoll < 0.65) {
        // 65% green
        status = "GREEN";
        expiryDate = randomDate(180, 90); // Expires 90-270 days from now
      } else if (statusRoll < 0.85) {
        // 20% orange
        status = "ORANGE";
        expiryDate = randomDate(15, 10); // Expires 5-25 days from now
      } else {
        // 15% red
        status = "RED";
        expiryDate = Math.random() > 0.5 ? randomDate(-30, 30) : null; // Expired or missing
      }

      await prisma.complianceItem.create({
        data: {
          storeId: store.id,
          category,
          status,
          expiryDate,
          required: true,
        },
      });
    }
  }

  console.log("✅ Created compliance items for all stores");

  console.log("🌱 Seed completed successfully!");
}

// Note: when used as a module, call `seed()` programmatically.
// For CLI usage, a small runner file `prisma/seed-run.ts` will invoke this.
