import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

interface SeedUser {
  email: string;
  password: string;
  role: UserRole;
}

const SEED_USERS: SeedUser[] = [
  { email: 'manager@nard.io', password: 'Manager123!', role: UserRole.MANAGER },
  { email: 'employee@nard.io', password: 'Employee123!', role: UserRole.EMPLOYEE },
];

/**
 * Idempotent seed for demo accounts. Safe to run repeatedly — existing users
 * are skipped. Product/category/sale seeding is added in later steps.
 */
async function seed(): Promise<void> {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  for (const seedUser of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: seedUser.email } });
    if (existing) {
      console.log(`✓ ${seedUser.email} already exists — skipping`);
      continue;
    }
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    await userRepo.save(
      userRepo.create({ email: seedUser.email, passwordHash, role: seedUser.role }),
    );
    console.log(`+ created ${seedUser.email} (${seedUser.role})`);
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
