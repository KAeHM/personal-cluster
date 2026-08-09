import { listUsers } from "@/modules/users/application/use-cases/list-users";

export type PlayerForShare = {
  id: string;
  email: string;
  name: string | null;
};

export async function listPlayersForShare(): Promise<PlayerForShare[]> {
  const users = await listUsers();
  return users
    .filter((user) => user.role === "user")
    .map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
    }));
}
