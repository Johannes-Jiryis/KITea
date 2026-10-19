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

  // Import modules one by one with retry logic
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < newModules.length; i++) {
    const moduleData = newModules[i];
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
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
        if (importedCount % 10 === 0) {
          console.log(
            `Progress: ${importedCount}/${newModules.length} modules imported (${Math.round((importedCount / newModules.length) * 100)}%)`,
          );
        }
        break; // Success, move to next foundModule
      } catch (error: any) {
        retries++;
        if (error.code === "P2034" || error.message?.includes("timeout")) {
          console.log(`Timeout on ${moduleData.moduleNumber}, retry ${retries}/${maxRetries}...`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * retries)); // Exponential backoff
        } else {
          console.error(`Failed to import ${moduleData.moduleNumber}:`, error.message);
          errorCount++;
          break; // Non-timeout error, skip this foundModule
        }
      }
    }

    if (retries >= maxRetries) {
      console.error(`Failed to import ${moduleData.moduleNumber} after ${maxRetries} retries`);
      errorCount++;
    }

    // Add a small delay between imports to reduce database load
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`\nImport complete:`);
  console.log(`- Imported: ${importedCount} modules`);
  console.log(`- Errors: ${errorCount} modules`);
  console.log(`- Already existed: ${modulesData.length - newModules.length} modules`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
