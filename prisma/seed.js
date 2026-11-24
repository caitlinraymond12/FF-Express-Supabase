require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const countries = require('./countries');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.country.createMany({
    data: countries,
    skipDuplicates: true
  });
  console.log('Added ' + result.count + ' countries');
}

main()
  .catch(function (err) {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(function () {
    return prisma.$disconnect();
  });
