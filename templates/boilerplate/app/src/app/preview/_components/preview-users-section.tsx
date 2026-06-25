import Link from "next/link";
import { LogInIcon } from "lucide-react";
import { getCurrentUser } from "@/modules/auth";
import { listUsers, type User } from "@/modules/users";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { PreviewUsers } from "./preview-users";

export async function PreviewUsersSection({ empty }: { empty?: boolean }) {
  const currentUser = await getCurrentUser();
  const users: User[] = empty ? [] : await listUsers();

  return (
    <section id="users" className="space-y-4">
      <PageHeader separator>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeaderContent>
            <PageHeaderTitle>Usuários</PageHeaderTitle>
            <PageHeaderDescription>
              CRUD real (Drizzle + Postgres). Criar/excluir exige sessão
              (NextAuth); a API externa equivalente vive em{" "}
              <code>/api/v1/users</code>.
            </PageHeaderDescription>
          </PageHeaderContent>
          {currentUser ? (
            <Badge variant="success">
              {currentUser.email ?? currentUser.id}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href="/login">
                <LogInIcon />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <PreviewUsers users={users} canManage={Boolean(currentUser)} />
    </section>
  );
}
