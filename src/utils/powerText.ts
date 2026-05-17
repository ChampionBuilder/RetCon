import type { Power } from "../types/powers";

export function getPowerTooltipText(power: Power | null | undefined) {
  const tooltip = power?.tooltip?.trim();

  if (!power) {
    return undefined;
  }

  return tooltip ? `${power.name}\n\n${tooltip}` : power.name;
}
