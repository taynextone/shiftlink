import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shiftlink.dev';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Super Admin (idempotent) ──────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { email: SEED_ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(SEED_ADMIN_PASSWORD);
    await prisma.user.create({
      data: {
        email: SEED_ADMIN_EMAIL,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        verificationStatus: 'VERIFIED',
      },
    });
    console.log(`✅ Super admin created: ${SEED_ADMIN_EMAIL}`);
    console.log(`   ⚠️  Default password: ${SEED_ADMIN_PASSWORD}`);
    console.log('   → MUST be changed on first login!');
  } else {
    console.log(`⏭️  Super admin already exists: ${SEED_ADMIN_EMAIL} — skipping`);
  }

  // ── Demo data (non-production only) ────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    await seedDemoData();
  } else {
    console.log('🔒 Production mode — skipping demo data');
  }

  console.log('🌱 Seed complete.');
}

async function seedDemoData() {
  // ── Demo Nurse ─────────────────────────────────────────────────
  const demoNurseEmail = 'nurse@shiftlink.dev';
  const existingNurse = await prisma.user.findUnique({
    where: { email: demoNurseEmail },
  });

  if (!existingNurse) {
    const nursePasswordHash = await argon2.hash('NurseDemo123!');
    const nurseUser = await prisma.user.create({
      data: {
        email: demoNurseEmail,
        passwordHash: nursePasswordHash,
        role: UserRole.NURSE,
        verificationStatus: 'VERIFIED',
        nurseProfile: {
          create: {
            publicId: 'DEMO-NURSE-001',
            displayName: 'Maria Schmidt',
            firstName: 'Maria',
            lastName: 'Schmidt',
            iban: 'DE89370400440532013000',
            minHourlyRate: 45.0,
            phoneNumber: '+49 30 12345678',
            whatsappOptIn: true,
            preferredShiftType: 'FLEXIBLE',
            minAssignmentHours: 4,
            maxAssignmentHours: 12,
            preferredRegionsNote: 'Berlin, Brandenburg',
            isReleasedForMatching: true,
            releasedAt: new Date(),
            specializations: {
              create: [
                { tag: 'Intensivpflege' },
                { tag: 'Chirurgie' },
              ],
            },
          },
        },
      },
    });
    console.log(`✅ Demo nurse created: ${demoNurseEmail} (password: NurseDemo123!)`);
    console.log(`   User ID: ${nurseUser.id}`);
  } else {
    console.log(`⏭️  Demo nurse already exists: ${demoNurseEmail} — skipping`);
  }

  // ── Demo Hospital ──────────────────────────────────────────────
  const demoHospitalEmail = 'hospital@shiftlink.dev';
  const existingHospital = await prisma.user.findUnique({
    where: { email: demoHospitalEmail },
  });

  if (!existingHospital) {
    const hospitalPasswordHash = await argon2.hash('HospitalDemo123!');
    const hospitalUser = await prisma.user.create({
      data: {
        email: demoHospitalEmail,
        passwordHash: hospitalPasswordHash,
        role: UserRole.HOSPITAL_ADMIN,
        verificationStatus: 'VERIFIED',
        hospitalProfile: {
          create: {
            clinicName: 'Charité – Universitätsmedizin Berlin (Demo)',
            billingAddress: 'Charitéplatz 1, 10117 Berlin',
            taxNumber: 'DE123456789',
          },
        },
      },
    });
    console.log(`✅ Demo hospital created: ${demoHospitalEmail} (password: HospitalDemo123!)`);
    console.log(`   User ID: ${hospitalUser.id}`);
  } else {
    console.log(`⏭️  Demo hospital already exists: ${demoHospitalEmail} — skipping`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
