#!/usr/bin/env npx tsx
import "dotenv/config";
import { getPrisma } from "../lib/prisma";
import * as fs from "fs";

const prisma = getPrisma();

async function main() {
  // Read the parsed modules
  const modulesData = JSON.parse(fs.readFileSync("/tmp/winter_modules.json", "utf-8"));

  console.log(`Found ${modulesData.length} modules in parsed data`);

  // Get existing modules to avoid duplicates
  const existingModules = await prisma.module.findMany({
    select: {
      moduleNumber: true,
      moduleName: true,
    },
  });

  const existingModuleNumbers = new Set(existingModules.map((m) => m.moduleNumber));
  console.log(`Found ${existingModules.length} existing modules in database`);

  // Create or get Winter Semester 2025/26
  const winterSemester = await prisma.semester.upsert({
    where: {
      name_year: {
        name: "Wintersemester",
        year: 2025,
      },
    },
    update: {},
    create: {
      name: "Wintersemester",
      year: 2025,
    },
  });

  console.log(`Using semester: ${winterSemester.name} ${winterSemester.year}`);

  // Filter out modules that already exist
  const newModules = modulesData.filter((m: any) => !existingModuleNumbers.has(m.moduleNumber));
  console.log(`Found ${newModules.length} new modules to import`);

  // Prepare data for bulk insert
  const modulesToCreate = newModules.map((m: any) => ({
    moduleNumber: m.moduleNumber,
    moduleName: m.moduleName,
    description: `Language: ${m.language || "N/A"}, SWS: ${m.sws || "N/A"}, Type: ${m.type || "N/A"}`,
  }));

  console.log("Starting bulk insert in batches...");

  // Use createMany in smaller batches
  const batchSize = 20;
  let totalCreated = 0;

  for (let i = 0; i < modulesToCreate.length; i += batchSize) {
    const batch = modulesToCreate.slice(i, i + batchSize);
    const result = await prisma.module.createMany({
      data: batch,
      skipDuplicates: true,
    });
    totalCreated += result.count;
    console.log(
      `Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(modulesToCreate.length / batchSize)}: ${result.count} modules created (total: ${totalCreated})`,
    );
  }

  console.log(`Bulk insert complete: ${totalCreated} modules created`);

  // Now connect all modules to the winter semester
  console.log("Connecting modules to semester...");

  // Get all modules that should be in the winter semester
  const allModuleNumbers = modulesData.map((m: any) => m.moduleNumber);

  // Get the actual module IDs
  const modulesToConnect = await prisma.module.findMany({
    where: {
      moduleNumber: {
        in: allModuleNumbers,
      },
    },
    select: {
      id: true,
      moduleNumber: true,
    },
  });

  console.log(`Found ${modulesToConnect.length} modules to connect to semester`);

  // Connect modules to semester in batches
  const connectBatchSize = 100;
  for (let i = 0; i < modulesToConnect.length; i += connectBatchSize) {
    const batch = modulesToConnect.slice(i, i + connectBatchSize);

    await prisma.semester.update({
      where: { id: winterSemester.id },
      data: {
        modules: {
          connect: batch.map((m) => ({ id: m.id })),
        },
      },
    });

    console.log(
      `Connected batch ${Math.floor(i / connectBatchSize) + 1}/${Math.ceil(modulesToConnect.length / connectBatchSize)}`,
    );
  }

  console.log("Import complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
