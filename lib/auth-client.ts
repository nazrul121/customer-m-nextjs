import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:300",
    additionalFields: {
        user: {
            role: { type: "string" }
        }
    },
    plugins: [
        phoneNumberClient(), // 🔑 Add this to enable .signIn.phoneNumber types
        inferAdditionalFields({
            user: {
                role: {
                    type: "string", // or "admin" | "user" | "customer"
                },
            }
        })
    ]
})

export const { signIn, signUp, useSession } = createAuthClient()