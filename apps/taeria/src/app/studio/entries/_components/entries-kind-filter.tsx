import type { Kind } from "@/modules/worldbuild/domain/kind";
import { Label } from "@/common/components/ui/label";
import { cn } from "@/common/utils/cn";

type EntriesKindFilterProps = {
  kinds: Kind[];
  defaultValue: string;
};

function EntriesKindFilter({ kinds, defaultValue }: EntriesKindFilterProps) {
  return (
    <div className="w-48 space-y-1">
      <Label htmlFor="entries-kind">Tipo</Label>
      <select
        id="entries-kind"
        name="kind"
        defaultValue={defaultValue}
        className={cn(
          "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        )}
      >
        <option value="all">Todos</option>
        {kinds.map((kind) => (
          <option key={kind.id} value={kind.slug}>
            {kind.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export { EntriesKindFilter };
