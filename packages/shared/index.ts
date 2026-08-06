export type ModuleId =
  | "commercial"
  | "medical"
  | "clinical"
  | "heor"
  | "regulatory"
  | "safety";

export const DEMO_CREDENTIALS = {
  email: "admin@lsi.os",
  password: "demo1234",
} as const;
