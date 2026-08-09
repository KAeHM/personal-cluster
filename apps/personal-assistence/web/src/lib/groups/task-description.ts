const MIN_DESCRIPTION_LENGTH = 12;
const MIN_WORD_COUNT = 2;

export function buildTaskDescription(
  rawDescription: string,
  groupLabel?: string | null,
): string {
  const description = rawDescription.trim();
  if (!description) return description;

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const isTooShort =
    description.length < MIN_DESCRIPTION_LENGTH || wordCount < MIN_WORD_COUNT;

  if (!isTooShort || !groupLabel?.trim()) {
    return description;
  }

  const label = groupLabel.trim();
  if (
    description.toLowerCase().includes(label.toLowerCase()) ||
    label.toLowerCase().includes(description.toLowerCase())
  ) {
    return description;
  }

  return `${description} — ${label}`;
}
