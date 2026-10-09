import { limitLineKeys } from "powerbi-visuals-core/settings";

// Line names to their `createLineGroup` keys
const lineKeys = { ...limitLineKeys, target: "target", alt_target: "alt_target" } as const;

export type LineName = keyof typeof lineKeys;

export default lineKeys;
