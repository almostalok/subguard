import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  Cadence,
  CommitmentCategory,
  CommitmentType,
  CommitmentStatus,
  VerificationState,
  MandateKind,
  MandateFrequency,
  MandateStatus,
  MandateVerificationState,
} from '@subguard/types';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding isolated demo account...');

  const demoEmail = 'demo@subguard.local';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existing) {
    console.log('[Seed] Demo user already exists. Cleaning existing data...');
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash('DemoPassword123!', 12);
  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash,
      name: 'Rohan Sharma',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      onboardingCompleted: true,
    },
  });

  console.log(`[Seed] Created user ${user.email} (${user.id})`);

  // Create commitments
  const netflix = await prisma.commitment.create({
    data: {
      userId: user.id,
      name: 'Netflix Premium (4K)',
      merchant: 'Netflix',
      category: CommitmentCategory.ENTERTAINMENT,
      type: CommitmentType.SUBSCRIPTION,
      amountMinor: BigInt(64900), // ₹649.00
      currency: 'INR',
      cadence: Cadence.MONTHLY,
      nextDueAt: new Date('2026-11-04'),
      status: CommitmentStatus.ACTIVE,
      verificationState: VerificationState.USER_VERIFIED,
      paymentMethodLabel: 'HDFC Infinia ending 1042',
      cancellationUrl: 'https://www.netflix.com/youraccount',
      notes: 'Family 4-screen plan',
    },
  });

  const prime = await prisma.commitment.create({
    data: {
      userId: user.id,
      name: 'Amazon Prime Annual',
      merchant: 'Amazon',
      category: CommitmentCategory.ENTERTAINMENT,
      type: CommitmentType.SUBSCRIPTION,
      amountMinor: BigInt(149900), // ₹1,499.00
      currency: 'INR',
      cadence: Cadence.ANNUALLY,
      nextDueAt: new Date('2026-12-15'),
      status: CommitmentStatus.ACTIVE,
      verificationState: VerificationState.USER_VERIFIED,
      paymentMethodLabel: 'ICICI Amazon Pay ending 8812',
      cancellationUrl: 'https://www.amazon.in/mc/manage',
    },
  });

  const broadband = await prisma.commitment.create({
    data: {
      userId: user.id,
      name: 'Airtel Xstream Fiber (300Mbps)',
      merchant: 'Airtel Broadband',
      category: CommitmentCategory.UTILITIES,
      type: CommitmentType.UTILITY_BILL,
      amountMinor: BigInt(117882), // ₹1,178.82
      currency: 'INR',
      cadence: Cadence.MONTHLY,
      nextDueAt: new Date('2026-10-28'),
      status: CommitmentStatus.ACTIVE,
      verificationState: VerificationState.USER_VERIFIED,
      paymentMethodLabel: 'Google Pay UPI AutoPay',
    },
  });

  const claudeTrial = await prisma.commitment.create({
    data: {
      userId: user.id,
      name: 'AI Pro Trial',
      merchant: 'Anthropic Claude',
      category: CommitmentCategory.PRODUCTIVITY,
      type: CommitmentType.FREE_TRIAL,
      amountMinor: BigInt(199900), // ₹1,999.00 after trial
      currency: 'INR',
      cadence: Cadence.MONTHLY,
      nextDueAt: new Date('2026-10-24'), // 4 days away
      status: CommitmentStatus.ACTIVE,
      verificationState: VerificationState.USER_VERIFIED,
      paymentMethodLabel: 'HDFC Infinia ending 1042',
      cancellationUrl: 'https://claude.ai/settings/billing',
      notes: '14-day promotional trial. Must cancel before Oct 24 to avoid ₹1,999 deduction.',
    },
  });

  // Create mandate
  await prisma.mandate.create({
    data: {
      userId: user.id,
      commitmentId: broadband.id,
      kind: MandateKind.UPI_AUTOPAY,
      providerReference: 'UMN-AIRTEL-98213891283',
      maximumAmountMinor: BigInt(200000), // ₹2,000 max limit
      currency: 'INR',
      frequency: MandateFrequency.MONTHLY,
      status: MandateStatus.ACTIVE,
      verificationState: MandateVerificationState.MANUAL_UNVERIFIED,
      nextExpectedAt: new Date('2026-10-28'),
      cancellationInstructions:
        'Open Google Pay > Settings > Autopay > Airtel Xstream > Revoke Mandate.',
    },
  });

  // Create initial notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      commitmentId: claudeTrial.id,
      title: 'Trial Expiring in 4 Days: AI Pro Trial',
      message:
        'Your promotional free trial ends on 2026-10-24. An auto-deduction of ₹1,999.00 will occur unless cancelled.',
      scheduledAt: new Date(),
      deliveredAt: new Date(),
      dedupeKey: `trial_exp_${claudeTrial.id}_20261024`,
      isRead: false,
    },
  });

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
