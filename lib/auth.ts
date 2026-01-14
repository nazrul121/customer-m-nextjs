import { betterAuth, boolean } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),

    trustedOrigins: [
        "http://localhost:300",
        "https://next.microdatasoft.com"
    ],
    
    emailAndPassword: {    
        enabled: true,
        autoSignIn: false,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user", // Matches your Prisma default
                input: false, // Important: prevents users from setting their own role during signup
            },
            status: {
                type: 'boolean'
            }
        },
    },
    plugins: [
        phoneNumber({
            // Optional: If you want to use OTP verification
            sendOTP: async ({ phoneNumber, code }, ctx) => {
                console.log(`Sending code ${code} to ${phoneNumber}`);
                // Integrate your SMS provider here (Twilio, Resend, etc.)
            },
        }),
    ],
    
});

