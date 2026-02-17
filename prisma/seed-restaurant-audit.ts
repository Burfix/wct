/**
 * Seed Restaurant Audit Template
 * Based on Si Cantina BOH Audit (25.03.2025)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRestaurantAudit() {
  console.log('🍽️  Seeding Restaurant Audit Template...');

  // Create the template
  const template = await prisma.auditTemplate.upsert({
    where: { id: 'restaurant-boh-v1' },
    update: {},
    create: {
      id: 'restaurant-boh-v1',
      name: 'Restaurant – Health & Safety (BOH)',
      description: 'Comprehensive back-of-house health, safety, and compliance audit for food & beverage establishments',
      storeTypes: ['FB'],
      version: '1.0',
      active: true,
    },
  });

  console.log(`✅ Created template: ${template.name}`);

  // Section A: General Condition of Premises
  const sectionA = await prisma.auditSection.create({
    data: {
      templateId: template.id,
      name: 'General Condition of Premises',
      description: 'Physical condition, housekeeping, and maintenance standards',
      weight: 2,
      order: 1,
    },
  });

  const questionsA = [
    'Are floors clear of obstructions and free from trip hazards?',
    'Are tiles and carpets properly secured with no loose edges?',
    'Is all furniture and equipment in good working order?',
    'Are doors, hinges, and fittings in good condition and functional?',
    'Is stacking and storage done safely with no overloading or instability?',
  ];

  for (let i = 0; i < questionsA.length; i++) {
    await prisma.auditQuestion.create({
      data: {
        sectionId: sectionA.id,
        question: questionsA[i],
        critical: false,
        order: i + 1,
      },
    });
  }

  console.log(`✅ Section A: ${questionsA.length} questions`);

  // Section B: Fire, Emergency & Safety Management
  const sectionB = await prisma.auditSection.create({
    data: {
      templateId: template.id,
      name: 'Fire, Emergency & Safety Management',
      description: 'Fire safety systems, emergency equipment, and life safety compliance',
      weight: 3, // Higher weight - critical safety
      order: 2,
    },
  });

  const questionsB = [
    { q: 'Are fire extinguishers accessible, serviced (within 12 months), and compliant?', critical: true },
    { q: 'Is a first aid kit available, accessible, and adequately stocked?', critical: false },
    { q: 'Is photoluminescent signage (exit signs, fire equipment) compliant and visible?', critical: false },
    { q: 'Are fire doors intact, self-closing, and not tampered with or obstructed?', critical: true },
    { q: 'Are heat detectors clean and free from grease/dust buildup?', critical: false },
    { q: 'Are sprinkler heads clean and unobstructed?', critical: true },
    { q: 'Are smoke detectors clean, functional, and unobstructed?', critical: true },
    { q: 'Has the extraction system certificate been submitted and is it current?', critical: true },
    { q: 'Is the fire suppression system serviced within the last 6 months?', critical: true },
    { q: 'Is the ecology unit (grease trap) serviced and compliant?', critical: false },
  ];

  for (let i = 0; i < questionsB.length; i++) {
    await prisma.auditQuestion.create({
      data: {
        sectionId: sectionB.id,
        question: questionsB[i].q,
        critical: questionsB[i].critical,
        order: i + 1,
      },
    });
  }

  console.log(`✅ Section B: ${questionsB.length} questions (${questionsB.filter(q => q.critical).length} critical)`);

  // Section C: Electrical
  const sectionC = await prisma.auditSection.create({
    data: {
      templateId: template.id,
      name: 'Electrical',
      description: 'Electrical safety, wiring, and equipment compliance',
      weight: 2,
      order: 3,
    },
  });

  const questionsC = [
    { q: 'Is the distribution board compliant, labeled, and accessible?', critical: false },
    { q: 'Is there any exposed wiring or damaged electrical components?', critical: true },
    { q: 'Is lighting sufficient in all work areas?', critical: false },
    { q: 'Are there any overloaded multi-plug adapters or extension cords?', critical: true },
    { q: 'Are wall plugs and sockets in safe condition with no damage?', critical: true },
    { q: 'Are electrical cords safely channeled and not creating trip hazards?', critical: false },
    { q: 'Do cold rooms/fridges have emergency release mechanisms functional?', critical: true },
  ];

  for (let i = 0; i < questionsC.length; i++) {
    await prisma.auditQuestion.create({
      data: {
        sectionId: sectionC.id,
        question: questionsC[i].q,
        critical: questionsC[i].critical,
        order: i + 1,
      },
    });
  }

  console.log(`✅ Section C: ${questionsC.length} questions (${questionsC.filter(q => q.critical).length} critical)`);

  // Section D: Gas
  const sectionD = await prisma.auditSection.create({
    data: {
      templateId: template.id,
      name: 'Gas',
      description: 'LPG and gas safety systems compliance',
      weight: 2,
      order: 4,
    },
  });

  const questionsD = [
    { q: 'Are LPG gas bottles compliant, secured, and stored correctly?', critical: true },
    { q: 'Is a gas detection system installed and functional?', critical: true },
    { q: 'Is a protective bump rail fitted around gas bottles?', critical: false },
    { q: 'Is gas shutoff signage present, visible, and compliant?', critical: false },
  ];

  for (let i = 0; i < questionsD.length; i++) {
    await prisma.auditQuestion.create({
      data: {
        sectionId: sectionD.id,
        question: questionsD[i].q,
        critical: questionsD[i].critical,
        order: i + 1,
      },
    });
  }

  console.log(`✅ Section D: ${questionsD.length} questions (${questionsD.filter(q => q.critical).length} critical)`);

  // Section E: General Comments
  const sectionE = await prisma.auditSection.create({
    data: {
      templateId: template.id,
      name: 'General Comments',
      description: 'Additional observations and recommendations',
      weight: 1,
      order: 5,
    },
  });

  await prisma.auditQuestion.create({
    data: {
      sectionId: sectionE.id,
      question: 'General observations, additional findings, or recommendations',
      description: 'Free text field for any additional comments or concerns not covered above',
      critical: false,
      order: 1,
    },
  });

  console.log(`✅ Section E: General comments field`);

  // Summary
  const totalSections = await prisma.auditSection.count({
    where: { templateId: template.id },
  });

  const totalQuestions = await prisma.auditQuestion.count({
    where: {
      section: {
        templateId: template.id,
      },
    },
  });

  const criticalQuestions = await prisma.auditQuestion.count({
    where: {
      critical: true,
      section: {
        templateId: template.id,
      },
    },
  });

  console.log(`\n🍽️  Restaurant Audit Template Complete:`);
  console.log(`   📋 ${totalSections} sections`);
  console.log(`   ❓ ${totalQuestions} total questions`);
  console.log(`   🔴 ${criticalQuestions} critical items`);
  console.log(`   ⚖️  Weighted scoring: Fire/Emergency (3x), Other (2x)`);
}

// Run if called directly
if (require.main === module) {
  seedRestaurantAudit()
    .then(() => {
      console.log('\n✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
