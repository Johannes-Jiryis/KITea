#!/usr/bin/env npx tsx
import "dotenv/config";
import { getPrisma } from "../lib/prisma";

const prisma = getPrisma();

async function main() {
  const modules = await prisma.module.findMany({
    take: 10,
    select: {
      moduleNumber: true,
      moduleName: true,
    },
  });

  console.log(`Found ${modules.length} modules in database`);
  console.log("Sample modules:");
  modules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.moduleNumber} - ${module.moduleName}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
