import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create normal user
  const userPasswordHash = await bcrypt.hash('User@1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Normal User',
      email: 'user@example.com',
      passwordHash: userPasswordHash,
      role: 'user',
    },
  });
  console.log(`Created normal user: ${user.email}`);

  // Create sample projects for the normal user
  const project1 = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      title: 'Sample Project 1',
      description: 'This is a sample project in todo status',
      status: 'todo',
      ownerId: user.id,
    },
  });
  console.log(`Created project: ${project1.title}`);

  const project2 = await prisma.project.upsert({
    where: { id: 'sample-project-2' },
    update: {},
    create: {
      id: 'sample-project-2',
      title: 'Sample Project 2',
      description: 'This project is in progress',
      status: 'doing',
      ownerId: user.id,
    },
  });
  console.log(`Created project: ${project2.title}`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
