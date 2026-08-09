"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/common/components/ui/input";

function WikiSearchForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultQuery = searchParams.get("q") ?? "";

  const kindBrowseMatch = pathname.match(/^\/wiki\/kinds\/([^/]+)$/);
  const action = kindBrowseMatch ? pathname : "/wiki";

  return (
    <form
      action={action}
      method="get"
      className="relative ml-auto max-w-md flex-1"
    >
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        name="q"
        defaultValue={defaultQuery}
        placeholder="Buscar no worldbuild…"
        className="bg-background/70 pl-9"
      />
    </form>
  );
}

export { WikiSearchForm };
