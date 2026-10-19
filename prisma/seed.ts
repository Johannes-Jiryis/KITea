import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data (optional - remove in production)
  await prisma.review.deleteMany();
  await prisma.module.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.tA.deleteMany();
  await prisma.user.deleteMany();

  // Create sample semesters
  const winter2023 = await prisma.semester.create({
    data: {
      name: "Wintersemester",
      year: 2023,
    },
  });

  const summer2024 = await prisma.semester.create({
    data: {
      name: "Sommersemester",
      year: 2024,
    },
  });

  // Create sample lecturers and TAs
  const lecturer1 = await prisma.lecturer.create({
    data: {
      name: "Prof. Dr. Anna Schmidt",
    },
  });

  const lecturer2 = await prisma.lecturer.create({
    data: {
      name: "Prof. Dr. Marcus Weber",
    },
  });

  const ta1 = await prisma.tA.create({
    data: {
      name: "Max Mustermann",
    },
  });

  const ta2 = await prisma.tA.create({
    data: {
      name: "Lisa Beispiel",
    },
  });

  // Create sample modules
  const ma101 = await prisma.module.create({
    data: {
      moduleNumber: "MA-101",
      moduleName: "Linear Algebra I",
      description: "Introduction to linear algebra with applications in engineering",
      semesters: {
        connect: [{ id: winter2023.id }, { id: summer2024.id }],
      },
    },
  });

  const cs100 = await prisma.module.create({
    data: {
      moduleNumber: "CS-100",
      moduleName: "Programming Fundamentals",
      description: "Introduction to programming concepts using Python",
      semesters: {
        connect: [{ id: winter2023.id }],
      },
    },
  });

  const ma102 = await prisma.module.create({
    data: {
      moduleNumber: "MA-102",
      moduleName: "Analysis I",
      description: "Differential and integral calculus of one variable",
      semesters: {
        connect: [{ id: summer2024.id }],
      },
    },
  });

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      name: "Max Mustermann",
      email: "max.mustermann@stud.kit.edu",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      studyProgram: "Computer Science",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Lisa Beispiel",
      email: "lisa.beispiel@stud.kit.edu",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      studyProgram: "Mathematics",
    },
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      moduleId: ma101.id,
      semesterTakenId: winter2023.id,
      lecturerName: lecturer1.name,
      lecturerReview: "Prof. Schmidt explains concepts clearly and provides excellent examples.",
      taName: ta1.name,
      taReview: "Max was very helpful during tutorials and responded quickly to questions.",
      homeworkReview:
        "Homework assignments were well-designed and helped reinforce lecture material.",
      examReview: "The exam was fair and covered exactly what was promised in the lectures.",
      summary: "Solid introduction to linear algebra with good balance of theory and practice.",
      overallRating: 4.5,
      difficultyRating: 3.0,
      workloadRating: 3.5,
    },
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      moduleId: ma101.id,
      semesterTakenId: winter2023.id,
      lecturerName: lecturer1.name,
      lecturerReview: "Good lectures but sometimes too fast-paced.",
      taName: ta1.name,
      taReview: "TA was okay but not particularly engaging.",
      homeworkReview: "Too many proof-based exercises for my taste.",
      examReview: "Exam was challenging but fair.",
      summary: "Good module but requires strong mathematical background.",
      overallRating: 3.5,
      difficultyRating: 4.0,
      workloadRating: 3.0,
    },
  });

  await prisma.review.create({
    data: {
      userId: user1.id,
      moduleId: cs100.id,
      semesterTakenId: winter2023.id,
      lecturerName: lecturer2.name,
      lecturerReview: "Prof. Weber makes programming fun and accessible to beginners.",
      taName: ta2.name,
      taReview: "Lisa was amazing - always available to help and gave great feedback.",
      homeworkReview: "Practical assignments that built up to a cool final project.",
      examReview: "Practical exam format worked well for this subject.",
      summary: "Excellent introduction to programming, highly recommended for beginners.",
      overallRating: 5.0,
      difficultyRating: 2.0,
      workloadRating: 4.0,
    },
  });

  console.log("Seeding completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
