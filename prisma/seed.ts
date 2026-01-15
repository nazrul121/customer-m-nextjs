import { auth } from "@/lib/auth";
import prisma from "../lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Starting Better-Auth compatible seeding...");

  const adminEmail = "admin@micro.com";
  const adminPassword = "12345678";
  const adminPhone = '01749015454';

  // 1. Check if user already exists in Prisma first to avoid errors
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    // 2. Use Better-Auth's internal API to create the user
    // This handles User creation, Account creation, and Password hashing automatically
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        phoneNumber:adminPhone,
        password: adminPassword,
        name: "Super Admin",
      },
    });

    // 3. Post-Signup Update: Set Role and Status (Better-Auth defaults to 'user')
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: "admin",
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    console.log(`✅ Admin created via Better-Auth: ${adminEmail}`);
  } else {
    console.log("ℹ️ Admin already exists, skipping signup.");
  }


  // 3. Create Service Types
  const appServiceType = await prisma.serviceType.upsert({
    where: { title: "Application" },
    update: {},
    create: {
      title: "Application",
      description: "Custom software and web development services.",
    },
  });

  // 4. Create a Service
  const defaultServices = [
    { name: 'Micro PoS', initCost: 100000.00, mmc: 8000.00, serviceTypeId: appServiceType.id },
    { name: 'Micro eCommerce', initCost: 75000.00, mmc: 4000.00, serviceTypeId: appServiceType.id },
  ];

  console.log(`📦 Seeding ${defaultServices.length} services...`);

  for (const service of defaultServices) {
    // 1. Check if it exists by name
    const existingService = await prisma.service.findFirst({
      where: { name: service.name }
    });

    if (!existingService) {
      // 2. If it doesn't exist, create it
      await prisma.service.create({
        data: service
      });
      console.log(`✅ Created: ${service.name}`);
    } else {
      // 3. Optional: Update it if it does exist
      await prisma.service.update({
        where: { id: existingService.id },
        data: service
      });
      console.log(`ℹ️ Updated: ${service.name}`);
    }
  }

  // 5. Create a Customer linked to User
  const custoemrEmail = 'contact@topmart.com';
  const custoemrPhone = '01987654321';
  const custoemrName = "Top Mart Ltd";

  // 1. Search for the customer's email (not adminEmail)
  let customerUser = await prisma.user.findUnique({
    where: { email: custoemrEmail },
  });

  if (!customerUser) {
    // 2. Use Better-Auth's internal API
    const authResponse = await auth.api.signUpEmail({
      body: {
        email: custoemrEmail,
        password: adminPassword, // Ensure this variable is defined above
        name: custoemrName,
      },
    });

    // Extract the user from the response
    customerUser = authResponse.user;

    // 3. Post-Signup Update: Set Role and Phone in the User table
    await prisma.user.update({
      where: { id: customerUser.id },
      data: {
        role: "customer",
        status: "ACTIVE",
        emailVerified: true,
        phoneNumber: custoemrPhone, // Better-Auth body often uses 'email'/'password' only
      },
    });

    console.log(`✅ Customer User created via Better-Auth: ${custoemrEmail}`);
  }

  // 4. Create/Update the Customer Profile
  await prisma.customer.upsert({
    where: { customerCode: "M-CUST-001" },
    update: {},
    create: {
      userId: customerUser.id,
      customerCode: "M-CUST-001",
      name: custoemrName,
      phone: custoemrPhone, // Fixed: was using email
      email: custoemrEmail, // Fixed: was using phone
      status: "ACTIVE",
    },
  });

  console.log(`✅ Customer Profile linked: ${custoemrName}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });