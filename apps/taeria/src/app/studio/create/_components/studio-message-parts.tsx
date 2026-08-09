"use client";

import type { StudioMessagePart } from "@/modules/worldbuild/domain/studio-message-part";
import { Button } from "@/common/components/ui/button";
import { useCodexDraft } from "./codex-draft-context";

type StudioMessagePartsProps = {
  parts: StudioMessagePart[];
};

function StudioMessageParts({ parts }: StudioMessagePartsProps) {
  const { sendMessage } = useCodexDraft();

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        switch (part.type) {
          case "text":
            return (
              <p key={index} className="whitespace-pre-wrap">
                {part.text}
              </p>
            );
          case "decision":
            return (
              <div key={index} className="space-y-2">
                <p className="font-medium">{part.label}</p>
                <div className="flex flex-wrap gap-2">
                  {part.options.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        sendMessage(`Escolho ${option.label}`, {
                          type: "decision",
                          key: part.key,
                          value: option.value,
                        })
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          case "validation":
            return (
              <div
                key={index}
                className="border-destructive/30 bg-destructive/10 rounded-md border p-2 text-xs"
              >
                <p className="font-medium">Validação — {part.facetType}</p>
                <ul className="mt-1 list-disc pl-4">
                  {part.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            );
          case "facet_editor":
          case "edges_editor":
          case "action":
            return null;
          default:
            return null;
        }
      })}
    </div>
  );
}

export { StudioMessageParts };
