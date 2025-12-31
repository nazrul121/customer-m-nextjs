import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // Use environment variable for production, fallback to localhost for dev
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:2000",
    
    // If you plan to use more features later (like 2FA or social logins), 
    // you would add plugins here.
    plugins: [
        // example: usernameClient() 
    ],
    
    // This helper allows you to use the client in Server Components if needed
    fetchOptions: {
        auth: {
            type: "Bearer",
            token: process.env.BETTER_AUTH_SECRET,
        },
    },
});

// Export hooks for easy use in your components
export const { useSession, signIn, signOut, signUp } = authClient;