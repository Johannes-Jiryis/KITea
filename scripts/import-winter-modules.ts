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

  // Import in batches of 20 with delays
  const batchSize = 20;
  let importedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < newModules.length; i += batchSize) {
    const batch = newModules.slice(i, i + batchSize);
    console.log(
      `\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newModules.length / batchSize)} (${batch.length} modules)`,
    );

    for (const moduleData of batch) {
      try {
        // Create the foundModule
        const foundModule = await prisma.module.create({
          data: {
            moduleNumber: moduleData.moduleNumber,
            moduleName: moduleData.moduleName,
            description: `Language: ${moduleData.language || "N/A"}, SWS: ${moduleData.sws || "N/A"}, Type: ${moduleData.type || "N/A"}`,
            semesters: {
              connect: {
                id: winterSemester.id,
              },
            },
          },
        });

        importedCount++;
        if (importedCount % 20 === 0) {
          console.log(`Progress: ${importedCount}/${newModules.length} modules imported`);
        }

        // Add a small delay to reduce database load
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to import ${moduleData.moduleNumber}:`, error);
        skippedCount++;
      }
    }

    console.log(
      `Batch ${Math.floor(i / batchSize) + 1} complete. Total imported: ${importedCount}`,
    );
  }

  console.log(`\nImport complete:`);
  console.log(`- Imported: ${importedCount} modules`);
  console.log(`- Skipped: ${skippedCount} modules`);
  console.log(`- Already existed: ${modulesData.length - newModules.length} modules`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
