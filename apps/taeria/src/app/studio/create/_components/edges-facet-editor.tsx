"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import type { CodexDraftEdge } from "@/modules/worldbuild/domain/codex-draft";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { EntrySearchCombobox } from "./entry-search-combobox";

type EdgesFacetEditorProps = {
  relationTypes: string[];
  edges: CodexDraftEdge[];
  onChange: (edges: CodexDraftEdge[]) => void;
};

function edgeRankValue(edge: CodexDraftEdge): string {
  const rank = edge.payload?.rank;
  return rank === undefined || rank === null ? "" : String(rank);
}

function EdgesFacetEditor({
  relationTypes,
  edges,
  onChange,
}: EdgesFacetEditorProps) {
  function updateEdge(index: number, patch: Partial<CodexDraftEdge>) {
    onChange(
      edges.map((edge, edgeIndex) =>
        edgeIndex === index ? { ...edge, ...patch } : edge,
      ),
    );
  }

  function updateRank(index: number, raw: string) {
    const edge = edges[index];
    if (!edge) {
      return;
    }

    const restPayload = { ...edge.payload };
    delete restPayload.rank;
    const trimmed = raw.trim();

    if (!trimmed) {
      updateEdge(index, {
        payload: Object.keys(restPayload).length > 0 ? restPayload : undefined,
      });
      return;
    }

    const parsed = Number(trimmed);
    updateEdge(index, {
      payload: {
        ...restPayload,
        rank: Number.isFinite(parsed) ? parsed : trimmed,
      },
    });
  }

  function removeEdge(index: number) {
    onChange(edges.filter((_, edgeIndex) => edgeIndex !== index));
  }

  function addEdge() {
    onChange([
      ...edges,
      { type: relationTypes[0] ?? "related_to", toSlug: "" },
    ]);
  }

  return (
    <div className="space-y-2">
      {edges.map((edge, index) => (
        <div key={`edge-${index}`} className="flex items-start gap-2">
          <Select
            value={edge.type}
            onValueChange={(value) => updateEdge(index, { type: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {relationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EntrySearchCombobox
            value={edge.toSlug}
            onSelect={(slug) => updateEdge(index, { toSlug: slug })}
            placeholder={
              edge.type === "classified_as" ? "taxon (classe…)" : "slug-destino"
            }
            kindSlug={edge.type === "classified_as" ? "taxon" : undefined}
          />
          {edge.type === "taxonomy" ? (
            <Input
              type="number"
              value={edgeRankValue(edge)}
              onChange={(event) => updateRank(index, event.target.value)}
              placeholder="ordem"
              aria-label="Ordem na árvore (rank)"
              className="w-20 text-sm"
            />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEdge(index)}
            aria-label="Remover relação"
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addEdge}>
        <PlusIcon />
        Adicionar relação
      </Button>
    </div>
  );
}

export { EdgesFacetEditor };
