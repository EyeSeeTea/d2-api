export type PatchOperation =
    | { op: "add"; path: string; value: unknown }
    | { op: "remove"; path: string }
    | { op: "replace"; path: string; value: unknown }
    | { op: "remove-by-id"; path: string; id: string };

export const PATCH_HEADERS = {
    "Content-Type": "application/json-patch+json",
};
