import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ActionSeverity, AuditResult } from '@prisma/client';

/**
 * Admin endpoint to seed the database with audit templates
 * DELETE this file after running once in production!
 */
export async function POST(req: NextRequest) {
  try {
    // Allow a header `x-seed-secret` to trigger the seed without an authenticated session.
    const incomingSecret = req.headers.get('x-seed-secret');
    const configuredSecret = process.env.SEED_SECRET || process.env.VERCEL_SEED_SECRET;

    if (incomingSecret) {
      if (!configuredSecret || incomingSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Invalid seed secret' }, { status: 401 });
      }

      console.log('🌱 Running programmatic seed via header secret...');

      // Prefer the central `prisma/seed.ts` exported `seed()` if available.
      try {
        // Path from this file to the project root `prisma/seed.ts`.
        const seedModule = await import('../../../../../prisma/seed');
        if (typeof seedModule.seed === 'function') {
          await seedModule.seed();
          return NextResponse.json({ success: true, message: 'Seed executed (header secret).' });
        }
      } catch (e) {
        console.warn('No programmatic seed found, falling back to inline seeding', e);

        // Fallback: run the inline seed (same logic as admin path) so header-seeded runs succeed
        console.log('🌱 Fallback inline seeding (header path)...');

        const existing = await prisma.auditTemplate.findFirst({
          where: { name: 'Restaurant – Health & Safety (BOH)' },
        });

        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'Audit template already exists',
            templateId: existing.id,
          });
        }

        const template = await prisma.auditTemplate.create({
          data: {
            name: 'Restaurant – Health & Safety (BOH)',
            description: 'Back of House health and safety compliance audit for food & beverage outlets',
            storeTypes: ['FB'],
            active: true,
            sections: {
              create: [
                {
                  name: 'Fire Suppression & Emergency',
                  description: 'Fire safety equipment and emergency procedures',
                  order: 1,
                  weight: 2.0,
                  questions: {
                    create: [
                      {
                        question: 'Is the fire suppression system certificate current and displayed?',
                        description: 'Check certificate date and location',
                        order: 1,
                        critical: true,
                      },
                      {
                        question: 'Are fire extinguishers accessible and serviced (tag within 12 months)?',
                        order: 2,
                        critical: true,
                      },
                      {
                        question: 'Are emergency exits clearly marked and unobstructed?',
                        order: 3,
                        critical: true,
                      },
                      {
                        question: 'Is the fire alarm system functional (monthly test recorded)?',
                        order: 4,
                        critical: true,
                      },
                      {
                        question: 'Is the emergency evacuation plan visible and current?',
                        order: 5,
                      },
                    ],
                  },
                },
                {
                  name: 'Gas Safety',
                  description: 'Gas installation and safety compliance',
                  order: 2,
                  weight: 2.0,
                  questions: {
                    create: [
                      {
                        question: 'Is the gas installation certificate (COC) current and displayed?',
                        description: 'Certificate must be renewed annually',
                        order: 1,
                        critical: true,
                      },
                      {
                        question: 'Are all gas connections secure with no visible leaks or damage?',
                        order: 2,
                        critical: true,
                      },
                      {
                        question: 'Is the gas shut-off valve clearly labeled and accessible?',
                        order: 3,
                      },
                    ],
                  },
                },
                {
                  name: 'Electrical Safety',
                  description: 'Electrical installations and equipment',
                  order: 3,
                  weight: 1.5,
                  questions: {
                    create: [
                      {
                        question: 'Is the electrical installation certificate (COC) current?',
                        order: 1,
                        critical: true,
                      },
                      {
                        question: 'Are all electrical cords and plugs in good condition (no exposed wiring)?',
                        order: 2,
                      },
                      {
                        question: 'Are circuit breakers labeled and accessible?',
                        order: 3,
                      },
                      {
                        question: 'Are all high-risk areas (wet zones) fitted with earth leakage protection?',
                        order: 4,
                        critical: true,
                      },
                    ],
                  },
                },
                {
                  name: 'Kitchen Hygiene & Food Safety',
                  description: 'Food handling and kitchen cleanliness standards',
                  order: 4,
                  weight: 1.5,
                  questions: {
                    create: [
                      {
                        question: 'Are all food handlers wearing clean protective clothing (aprons, hairnets)?',
                        order: 1,
                      },
                      {
                        question: 'Are handwashing facilities stocked (soap, paper towels) and functional?',
                        order: 2,
                        critical: true,
                      },
                      {
                        question: 'Are food prep surfaces clean and sanitized?',
                        order: 3,
                      },
                      {
                        question: 'Is there evidence of pest control (no droppings, no visible pests)?',
                        order: 4,
                        critical: true,
                      },
                      {
                        question: 'Are refrigeration units maintaining safe temperatures (below 5°C)?',
                        description: 'Record temperature readings',
                        order: 5,
                        critical: true,
                      },
                      {
                        question: 'Are all food items properly labeled and dated?',
                        order: 6,
                      },
                      {
                        question: 'Is waste separated and stored in sealed containers?',
                        order: 7,
                      },
                    ],
                  },
                },
                {
                  name: 'Staff Training & First Aid',
                  description: 'Staff compliance and emergency preparedness',
                  order: 5,
                  weight: 1.0,
                  questions: {
                    create: [
                      {
                        question: 'Is there a designated first aider on duty with current certification?',
                        order: 1,
                        critical: true,
                      },
                      {
                        question: 'Is the first aid kit fully stocked and accessible?',
                        order: 2,
                      },
                      {
                        question: 'Have staff completed fire drill training in the past 6 months?',
                        order: 3,
                      },
                      {
                        question: 'Are emergency contact numbers displayed (security, management, paramedics)?',
                        order: 4,
                      },
                      {
                        question: 'Is there evidence of health and safety induction for new staff?',
                        order: 5,
                      },
                    ],
                  },
                },
              ],
            },
          },
        });

        console.log('✅ Audit template created successfully (fallback)');

        // Create test stores
        console.log('🏪 Creating test stores...');
        
        const stores = await prisma.store.createMany({
          data: [
            {
              storeCode: 'FB001',
              name: "Mitchell's Scottish Ale House",
              tradeName: "Mitchell's",
              zone: 'Victoria Wharf - Upper Level',
              storeType: 'FB',
              status: 'active',
            },
            {
              storeCode: 'FB002',
              name: "Ocean Basket",
              tradeName: "Ocean Basket V&A",
              zone: 'Victoria Wharf - Ground Level',
              storeType: 'FB',
              status: 'active',
            },
            {
              storeCode: 'FB003',
              name: "The Hussar Grill",
              tradeName: "Hussar Grill",
              zone: 'Silo District',
              storeType: 'FB',
              status: 'active',
            },
          ],
          skipDuplicates: true,
        });

        console.log(`✅ Created ${stores.count} test stores (fallback)`);

        return NextResponse.json({
          success: true,
          message: 'Database seeded successfully (fallback)',
          template: {
            id: template.id,
            name: template.name,
          },
          storesCreated: stores.count,
        });
      }
    }

    // If no secret header, require an authenticated ADMIN session
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌱 Starting audit template seed (admin session)...');

    // Check if template already exists
    const existing = await prisma.auditTemplate.findFirst({
      where: { name: 'Restaurant – Health & Safety (BOH)' },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Audit template already exists',
        templateId: existing.id,
      });
    }

    // (Inline seeding kept for compatibility; larger seeding should live in `prisma/seed.ts`)
    const template = await prisma.auditTemplate.create({
      data: {
        name: 'Restaurant – Health & Safety (BOH)',
        description: 'Back of House health and safety compliance audit for food & beverage outlets',
        storeTypes: ['FB'],
        active: true,
        sections: {
          create: [
            {
              name: 'Fire Suppression & Emergency',
              description: 'Fire safety equipment and emergency procedures',
              order: 1,
              weight: 2.0,
              questions: {
                create: [
                  {
                    question: 'Is the fire suppression system certificate current and displayed?',
                    description: 'Check certificate date and location',
                    order: 1,
                    critical: true,
                  },
                  {
                    question: 'Are fire extinguishers accessible and serviced (tag within 12 months)?',
                    order: 2,
                    critical: true,
                  },
                  {
                    question: 'Are emergency exits clearly marked and unobstructed?',
                    order: 3,
                    critical: true,
                  },
                  {
                    question: 'Is the fire alarm system functional (monthly test recorded)?',
                    order: 4,
                    critical: true,
                  },
                  {
                    question: 'Is the emergency evacuation plan visible and current?',
                    order: 5,
                  },
                ],
              },
            },
            {
              name: 'Gas Safety',
              description: 'Gas installation and safety compliance',
              order: 2,
              weight: 2.0,
              questions: {
                create: [
                  {
                    question: 'Is the gas installation certificate (COC) current and displayed?',
                    description: 'Certificate must be renewed annually',
                    order: 1,
                    critical: true,
                  },
                  {
                    question: 'Are all gas connections secure with no visible leaks or damage?',
                    order: 2,
                    critical: true,
                  },
                  {
                    question: 'Is the gas shut-off valve clearly labeled and accessible?',
                    order: 3,
                  },
                ],
              },
            },
            {
              name: 'Electrical Safety',
              description: 'Electrical installations and equipment',
              order: 3,
              weight: 1.5,
              questions: {
                create: [
                  {
                    question: 'Is the electrical installation certificate (COC) current?',
                    order: 1,
                    critical: true,
                  },
                  {
                    question: 'Are all electrical cords and plugs in good condition (no exposed wiring)?',
                    order: 2,
                  },
                  {
                    question: 'Are circuit breakers labeled and accessible?',
                    order: 3,
                  },
                  {
                    question: 'Are all high-risk areas (wet zones) fitted with earth leakage protection?',
                    order: 4,
                    critical: true,
                  },
                ],
              },
            },
            {
              name: 'Kitchen Hygiene & Food Safety',
              description: 'Food handling and kitchen cleanliness standards',
              order: 4,
              weight: 1.5,
              questions: {
                create: [
                  {
                    question: 'Are all food handlers wearing clean protective clothing (aprons, hairnets)?',
                    order: 1,
                  },
                  {
                    question: 'Are handwashing facilities stocked (soap, paper towels) and functional?',
                    order: 2,
                    critical: true,
                  },
                  {
                    question: 'Are food prep surfaces clean and sanitized?',
                    order: 3,
                  },
                  {
                    question: 'Is there evidence of pest control (no droppings, no visible pests)?',
                    order: 4,
                    critical: true,
                  },
                  {
                    question: 'Are refrigeration units maintaining safe temperatures (below 5°C)?',
                    description: 'Record temperature readings',
                    order: 5,
                    critical: true,
                  },
                  {
                    question: 'Are all food items properly labeled and dated?',
                    order: 6,
                  },
                  {
                    question: 'Is waste separated and stored in sealed containers?',
                    order: 7,
                  },
                ],
              },
            },
            {
              name: 'Staff Training & First Aid',
              description: 'Staff compliance and emergency preparedness',
              order: 5,
              weight: 1.0,
              questions: {
                create: [
                  {
                    question: 'Is there a designated first aider on duty with current certification?',
                    order: 1,
                    critical: true,
                  },
                  {
                    question: 'Is the first aid kit fully stocked and accessible?',
                    order: 2,
                  },
                  {
                    question: 'Have staff completed fire drill training in the past 6 months?',
                    order: 3,
                  },
                  {
                    question: 'Are emergency contact numbers displayed (security, management, paramedics)?',
                    order: 4,
                  },
                  {
                    question: 'Is there evidence of health and safety induction for new staff?',
                    order: 5,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Audit template created successfully');

    // Create test stores
    console.log('🏪 Creating test stores...');
    
    const stores = await prisma.store.createMany({
      data: [
        {
          storeCode: 'FB001',
          name: "Mitchell's Scottish Ale House",
          tradeName: "Mitchell's",
          zone: 'Victoria Wharf - Upper Level',
          storeType: 'FB',
          status: 'active',
        },
        {
          storeCode: 'FB002',
          name: "Ocean Basket",
          tradeName: "Ocean Basket V&A",
          zone: 'Victoria Wharf - Ground Level',
          storeType: 'FB',
          status: 'active',
        },
        {
          storeCode: 'FB003',
          name: "The Hussar Grill",
          tradeName: "Hussar Grill",
          zone: 'Silo District',
          storeType: 'FB',
          status: 'active',
        },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Created ${stores.count} test stores`);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      template: {
        id: template.id,
        name: template.name,
      },
      storesCreated: stores.count,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}
