// prisma/seed.js - fills the Color table with the 7 rainbow colors
// Run it with: npm run db:seed   (safe to run more than once)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COLORS = [
  { name: 'red',    hex: '#FF0000' },
  { name: 'orange', hex: '#FF7F00' },
  { name: 'yellow', hex: '#FFFF00' },
  { name: 'green',  hex: '#00FF00' },
  { name: 'blue',   hex: '#0000FF' },
  { name: 'indigo', hex: '#4B0082' },
  { name: 'violet', hex: '#8B00FF' }
];

async function main() {
  for (let color of COLORS) {
    // upsert = update the color if it exists, create it if it doesn't
    await prisma.color.upsert({
      where: { name: color.name },
      update: { hex: color.hex },
      create: color
    });
  }
  console.log('Seeded ' + COLORS.length + ' colors');
}

main()
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  })
  .finally(function () {
    return prisma.$disconnect();
  });
