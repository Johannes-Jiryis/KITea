import "./load-env";
import { getPrisma } from "../lib/prisma";
const main = async () => {
  const prisma = getPrisma();
  try {
    const limits = await prisma.requestLimit.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 3600000) } },
    });
    const submissions = await prisma.reviewSubmission.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 30 * 86400000) } },
    });
    console.log(
      JSON.stringify({
        event: "maintenance",
        expiredLimits: limits.count,
        expiredSubmissionEvents: submissions.count,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
};
main().catch(() => {
  console.error(JSON.stringify({ event: "maintenance.failed" }));
  process.exitCode = 1;
});
