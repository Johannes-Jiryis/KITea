import { getPrisma } from "@/lib/prisma";
import { databaseRead } from "@/lib/database/read";
import { cache } from "react";

export const getModuleByNumber = cache(async (moduleNumber: string) => {
  const prisma = getPrisma();
  const foundModule = await databaseRead(() =>
    prisma.module.findFirst({
      where: {
        OR: [{ moduleNumber: moduleNumber.toUpperCase() }, { id: moduleNumber }],
      },
      include: {
        semesters: {
          select: {
            id: true,
            name: true,
            year: true,
          },
          orderBy: [{ year: "desc" }, { name: "asc" }],
        },
      },
    }),
  );

  return foundModule;
});
