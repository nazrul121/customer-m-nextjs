// prisma/seed.ts
import { prisma } from "../lib/prisma"; 
import bcrypt from "bcrypt";

async function main() {
  console.log("🚀 Starting seed...");

  // 1. Hash the password (10 is the standard salt rounds)
  const hashedPassword = await bcrypt.hash("12345678", 10);

  // 2. Clear existing data
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleaned.");

  // 3. Create the Admin User
  const adminId = "admin_user_01";
  
    const admin = await prisma.user.create({
        data: {
            id: "admin_user_01",
            name: "Admin User",
            email: "admin@email.com",
            phone: "01749015457",
            emailVerified: true,
            accounts: {
            create: {
                id: "acc_admin_01",
                accountId: "admin@email.com",
                providerId: "email",
                password: hashedPassword, 
                // userId: adminId,  <-- REMOVE THIS LINE
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            },
        },
    });

  console.log(`✅ Seeded user: ${admin.email}`);
  console.log(`🔑 Credentials: admin@email.com / 12345678`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });