import type { PowerTooltipData } from "@/shared/utils/powerTooltip";
import type { FrameworkGlossaryTooltip } from "@/utils/frameworkGlossary";

export type StatTooltipData = {
  info: string | null;
  forms: string[];
  primaryEUs: string[];
  secondaryEUs: string[];
};

export type AdvantageTooltipData = {
  name: string;
  pointsCost: number | null;
  tags: string[];
  tooltip: string | null;
  lockedReason: string | null;
};

export type TooltipContent =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "advantage";
      data: AdvantageTooltipData;
    }
  | {
      kind: "power";
      data: PowerTooltipData;
    }
  | {
      kind: "stat";
      data: StatTooltipData;
    }
  | {
      kind: "framework";
      data: FrameworkGlossaryTooltip;
    };

export type TooltipState = {
  advantageHighlightQueries: string[];
  content: TooltipContent;
  cursorX: number;
  cursorY: number;
  forceAdvancedPowerTooltip: boolean;
  left: number;
  top: number;
  positioned: boolean;
};
