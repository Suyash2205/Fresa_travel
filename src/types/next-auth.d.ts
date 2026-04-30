import "next-auth";

type AppRole = "ADMIN" | "AGENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      email?: string | null;
      name?: string | null;
    };
  }

  interface User {
    role?: AppRole;
  }
}
