import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';

const SEED_USERS = [
  { email: 'manager@nard.io', password: 'Manager123!', role: UserRole.MANAGER },
  { email: 'employee@nard.io', password: 'Employee123!', role: UserRole.EMPLOYEE },
];

const SEED_CATEGORIES = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Produce', 'Frozen'];

/** Optional bulk volume for large-dataset performance testing: `SEED_PRODUCTS=50000 npm run seed`. */
const BULK_PRODUCT_COUNT = parseInt(process.env.SEED_PRODUCTS ?? '0', 10);
const INSERT_CHUNK = 1000;

async function seedUsers(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(User);
  for (const seedUser of SEED_USERS) {
    if (await repo.findOne({ where: { email: seedUser.email } })) {
      console.log(`✓ user ${seedUser.email} exists — skipping`);
      continue;
    }
    const passwordHash = await bcrypt.hash(seedUser.password, 10);
    await repo.save(repo.create({ email: seedUser.email, passwordHash, role: seedUser.role }));
    console.log(`+ user ${seedUser.email} (${seedUser.role})`);
  }
}

async function seedCategories(ds: DataSource): Promise<Category[]> {
  const repo = ds.getRepository(Category);
  for (const name of SEED_CATEGORIES) {
    if (!(await repo.findOne({ where: { name } }))) {
      await repo.save(repo.create({ name, description: `${name} products` }));
      console.log(`+ category ${name}`);
    }
  }
  return repo.find();
}

async function seedProducts(ds: DataSource, categories: Category[]): Promise<void> {
  const repo = ds.getRepository(Product);
  const existing = await repo.count();
  if (existing > 0) {
    console.log(`✓ ${existing} products already present — skipping product seed`);
    return;
  }

  // A small, readable demo set always present for manual testing.
  const demo: Partial<Product>[] = [
    {
      name: 'Cola 330ml',
      description: 'Chilled carbonated soft drink',
      price: 1.5,
      stockQuantity: 200,
    },
    {
      name: 'Sparkling Water 500ml',
      description: 'Natural mineral water',
      price: 0.9,
      stockQuantity: 150,
    },
    {
      name: 'Potato Chips Salted',
      description: 'Crispy salted potato chips',
      price: 2.2,
      stockQuantity: 120,
    },
    {
      name: 'Whole Milk 1L',
      description: 'Fresh pasteurised dairy milk',
      price: 1.1,
      stockQuantity: 80,
    },
    {
      name: 'Sourdough Loaf',
      description: 'Artisan baked sourdough bread',
      price: 3.5,
      stockQuantity: 40,
    },
  ];
  await repo.save(
    demo.map((p, i) => repo.create({ ...p, categoryId: categories[i % categories.length].id })),
  );
  console.log(`+ ${demo.length} demo products`);

  if (BULK_PRODUCT_COUNT > 0) {
    console.log(`Generating ${BULK_PRODUCT_COUNT} bulk products in chunks of ${INSERT_CHUNK}...`);
    let buffer: Partial<Product>[] = [];
    for (let i = 0; i < BULK_PRODUCT_COUNT; i++) {
      buffer.push({
        name: `Product ${i + 1}`,
        description: `Auto-generated demo product number ${i + 1}`,
        price: Math.round((Math.random() * 100 + 0.5) * 100) / 100,
        stockQuantity: Math.floor(Math.random() * 500),
        categoryId: categories[i % categories.length].id,
      });
      if (buffer.length === INSERT_CHUNK) {
        await repo.insert(buffer);
        buffer = [];
        process.stdout.write('.');
      }
    }
    if (buffer.length) {
      await repo.insert(buffer);
    }
    console.log(`\n+ ${BULK_PRODUCT_COUNT} bulk products`);
  }
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    await seedUsers(dataSource);
    const categories = await seedCategories(dataSource);
    await seedProducts(dataSource, categories);
    console.log('Seed complete.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
