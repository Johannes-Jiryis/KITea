import { getPrisma } from "@/lib/prisma";
import { lockUser } from "@/lib/reviews/service";

/** Delete only the user identified by the trusted server session. Never retry this write. */
export const deleteOwnAccount = async (userId: string) =>
  getPrisma().$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    const affected = await tx.module.findMany({
      where: { reviews: { some: { OR: [{ userId }, { helpfulVotes: { some: { userId } } }] } } },
      select: { moduleNumber: true },
    });
    // Reviews restrict user deletion; deleting them first also cascades votes on those reviews.
    await tx.review.deleteMany({ where: { userId } });
    await tx.requestLimit.deleteMany({ where: { key: `write:${userId}` } });
    if (user.email) await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
    // OAuth accounts, database sessions, remaining votes and submission history cascade.
    await tx.user.delete({ where: { id: userId } });
    return affected.map((module) => module.moduleNumber);
  });
