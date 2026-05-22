import type { Power } from "@/types/powers";
import { getPowerTooltipData } from "./powerTooltip";

export function getPowerTooltipText(power: Power | null | undefined) {
  if (!power) {
    return undefined;
  }

  const tooltip = getPowerTooltipData(power);

  return tooltip?.fallbackText
    ? `${power.name}\n\n${tooltip.fallbackText}`
    : power.name;
}
