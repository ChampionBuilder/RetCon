import type { Power } from "./powers";

export type BuildSlot = {
  slot: number;

  level: number;

  power: Power | null;

  displayFrameworkId?: string | null;

  selectedAdvantages: number[];
};
