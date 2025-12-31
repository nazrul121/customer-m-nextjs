// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql", 
  }),

  emailAndPassword: {
    enabled: true,
    // Add ": string" here to fix the "implicitly has an any type" error
    async findUser(email: string) {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { phone: email }
          ]
        }
      });
    }
  },
});