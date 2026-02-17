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
    const session = await auth();

    // Security: Only allow ADMIN users
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌱 Starting audit template seed...');

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

    // Create Restaurant BOH Audit Template
    const template = await prisma.auditTemplate.create({
      data: {
        name: 'Restaurant – Health & Safety (BOH)',
        description: 'Back of House health and safety compliance audit for food & beverage outlets',
        category: 'SHOP_AUDIT',
        active: true,
        requiresPhotos: true,
        requiresSignature: true,
        allowOfflineMode: true,
        sections: {
          create: [
            {
              name: 'Fire Suppression & Emergency',
              description: 'Fire safety equipment and emergency procedures',
              order: 1,
              weight: 2.0, // Critical section
              questions: {
                create: [
                  {
                    question: 'Is the fire suppression system certificate current and displayed?',
                    description: 'Check certificate date and location',
                    order: 1,
                    required: true,
                    critical: true,
                    requiresPhoto: true,
                    requiresNote: true,
                  },
                  {
                    question: 'Are fire extinguishers accessible and serviced (tag within 12 months)?',
                    order: 2,
                    required: true,
                    critical: true,
                    requiresPhoto: true,
                  },
                  {
                    question: 'Are emergency exits clearly marked and unobstructed?',
                    order: 3,
                    required: true,
                    critical: true,
                  },
                  {
                    question: 'Is the fire alarm system functional (monthly test recorded)?',
                    order: 4,
                    required: true,
                    critical: true,
                  },
                  {
                    question: 'Is the emergency evacuation plan visible and current?',
                    order: 5,
                    required: true,
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
                    required: true,
                    critical: true,
                    requiresPhoto: true,
                  },
                  {
                    question: 'Are all gas connections secure with no visible leaks or damage?',
                    order: 2,
                    required: true,
                    critical: true,
                  },
                  {
                    question: 'Is the gas shut-off valve clearly labeled and accessible?',
                    order: 3,
                    required: true,
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
                    required: true,
                    critical: true,
                    requiresPhoto: true,
                  },
                  {
                    question: 'Are all electrical cords and plugs in good condition (no exposed wiring)?',
                    order: 2,
                    required: true,
                  },
                  {
                    question: 'Are circuit breakers labeled and accessible?',
                    order: 3,
                    required: true,
                  },
                  {
                    question: 'Are all high-risk areas (wet zones) fitted with earth leakage protection?',
                    order: 4,
                    required: true,
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
                    required: true,
                  },
                  {
                    question: 'Are handwashing facilities stocked (soap, paper towels) and functional?',
                    order: 2,
                    required: true,
                    critical: true,
                  },
                  {
                    question: 'Are food prep surfaces clean and sanitized?',
                    order: 3,
                    required: true,
                  },
                  {
                    question: 'Is there evidence of pest control (no droppings, no visible pests)?',
                    order: 4,
                    required: true,
                    critical: true,
                    requiresPhoto: true,
                  },
                  {
                    question: 'Are refrigeration units maintaining safe temperatures (below 5°C)?',
                    description: 'Record temperature readings',
                    order: 5,
                    required: true,
                    critical: true,
                    requiresNote: true,
                  },
                  {
                    question: 'Are all food items properly labeled and dated?',
                    order: 6,
                    required: true,
                  },
                  {
                    question: 'Is waste separated and stored in sealed containers?',
                    order: 7,
                    required: true,
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
                    required: true,
                    critical: true,
                    requiresNote: true,
                  },
                  {
                    question: 'Is the first aid kit fully stocked and accessible?',
                    order: 2,
                    required: true,
                  },
                  {
                    question: 'Have staff completed fire drill training in the past 6 months?',
                    order: 3,
                    required: true,
                  },
                  {
                    question: 'Are emergency contact numbers displayed (security, management, paramedics)?',
                    order: 4,
                    required: true,
                  },
                  {
                    question: 'Is there evidence of health and safety induction for new staff?',
                    order: 5,
                    required: true,
                    requiresNote: true,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Audit template created successfully');

    return NextResponse.json({
      success: true,
      message: 'Audit template seeded successfully',
      template: {
        id: template.id,
        name: template.name,
      },
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
