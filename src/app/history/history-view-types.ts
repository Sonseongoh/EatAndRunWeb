export type FilterMode = "all" | "walk" | "brisk" | "run";

export type ConfirmAction =
  | { type: "delete-one"; id: string; label: string }
  | { type: "clear-all" };
