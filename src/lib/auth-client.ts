import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Atajo para el botón "Continuar con Google": redirige a Google y vuelve a
// callbackURL con la sesión ya creada.
export function signInWithGoogle(callbackURL = "/") {
  return authClient.signIn.social({ provider: "google", callbackURL });
}
