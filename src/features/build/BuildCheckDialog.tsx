import type { BuildSlot } from "@/types/builds";
import type { SuperStat } from "@/types/character";
import type { Power } from "@/types/powers";
import { ModalDialog } from "@/shared/ui";
import type { BuildRequirementResult } from "@/utils/buildValidation";
import {
  getCoreBuildRequirementResults,
  getMatchingRequirementPowerIds,
  getMissingScalingStats,
  getOptionalBuildRequirementResults,
} from "@/utils/buildValidation";
import { getPowerIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type BuildCheckDialogProps = {
  buildSlots: BuildSlot[];
  powers: Power[];
  powerVariantSlots: BuildSlot[];
  selectedSuperStats: (SuperStat | null)[];
  onClose: () => void;
  onSelectMissingRequirement: (requirement: BuildRequirementResult) => void;
};

export function BuildCheckDialog({
  buildSlots,
  powers,
  powerVariantSlots,
  selectedSuperStats,
  onClose,
  onSelectMissingRequirement,
}: BuildCheckDialogProps) {
  const coreRequirementResults = getCoreBuildRequirementResults(buildSlots);
  const optionalRequirementResults =
    getOptionalBuildRequirementResults(buildSlots, powerVariantSlots);

  return (
    <ModalDialog
      ariaLabel="Check build"
      className="build-check-dialog"
      description="Review common build components"
      title="Check Build"
      onClose={onClose}
    >
      <div className="build-check-dialog__content">
          <BuildCheckSection
            label="Core"
            powers={powers}
            requirements={coreRequirementResults}
            selectedSuperStats={selectedSuperStats}
            onSelectMissingRequirement={onSelectMissingRequirement}
          />
          <BuildCheckSection
            label="Optional"
            powers={powers}
            requirements={optionalRequirementResults}
            selectedSuperStats={selectedSuperStats}
            onSelectMissingRequirement={onSelectMissingRequirement}
          />
      </div>
    </ModalDialog>
  );
}

type BuildCheckSectionProps = {
  label: string;
  powers: Power[];
  requirements: BuildRequirementResult[];
  selectedSuperStats: (SuperStat | null)[];
  onSelectMissingRequirement: (requirement: BuildRequirementResult) => void;
};

function BuildCheckSection({
  label,
  powers,
  requirements,
  selectedSuperStats,
  onSelectMissingRequirement,
}: BuildCheckSectionProps) {
  return (
    <section className="build-check-dialog__section">
      <h4>{label}</h4>
      <div className="build-check-dialog__list">
        {requirements.map((requirement) => {
          const isPresent = requirement.power !== null;
          const hasMatchingPowers =
            getMatchingRequirementPowerIds(requirement, powers).size > 0;
          const missingScalingStats = getMissingScalingStats(
            requirement.power,
            selectedSuperStats,
          );
          const statusText =
            missingScalingStats.length > 0
              ? `Missing stat: ${missingScalingStats.join(" / ")}`
              : requirement.label;

          return (
            <button
              className={[
                "build-check-entry",
                isPresent
                  ? "build-check-entry--present"
                  : "build-check-entry--missing",
              ].join(" ")}
              disabled={isPresent || !hasMatchingPowers}
              key={requirement.key}
              type="button"
              onClick={() => onSelectMissingRequirement(requirement)}
            >
              <span
                aria-label={isPresent ? "Present" : "Missing"}
                className="build-check-entry__indicator"
              />
              <SpriteIcon name={getPowerIconName(requirement.power)} size={26} />
              <span
                className="build-check-entry__power-name"
                title={getPowerTooltipText(requirement.power)}
                data-power-tooltip={getPowerTooltipAttribute(requirement.power)}
              >
                {requirement.power?.name ?? requirement.label}
              </span>
              <span
                className={[
                  "build-check-entry__requirement",
                  missingScalingStats.length > 0
                    ? "build-check-entry__requirement--warning"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {statusText}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
