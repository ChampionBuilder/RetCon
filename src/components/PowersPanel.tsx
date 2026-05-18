import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Advantage } from "../types/advantages";
import type { BuildSlot } from "../types/builds";
import type { Power } from "../types/powers";
import { getFrameworkIconName, getPowerIconName } from "../utils/icons";
import { getPowerTooltipText } from "../utils/powerText";
import { getPowerTooltipAttribute } from "../utils/powerTooltip";
import {
  formatFrameworkName,
  getPowerDisplayFrameworkId,
  getPowerFrameworkSortIndex,
  type PowerFrameworkFilterGroup,
  isUltimatePowerVariantDevice,
  isPowerVisibleInFramework,
  devicesFilterId,
  powerVariantsFilterId,
  travelPowerFilterId,
} from "../utils/powerFrameworks";
import { SpriteIcon } from "./SpriteIcon";

type PowersPanelProps = {
  powers: Power[];
  advantages: Advantage[];
  frameworkGroups: PowerFrameworkFilterGroup[];
  selectedFramework: string | null;
  buildSlots: BuildSlot[];
  energyBuilderSelectionVersion: number;
  restrictedPowerIds: Set<number> | null;
  restrictedPowerSectionLabel: string | null;
  canAddPower: (power: Power) => boolean;
  onSelectFramework: (frameworkId: string | null) => void;
  onAddPower: (power: Power, displayFrameworkId: string | null) => void;
};

const tierOrder = [-1, 0, 1, 2, 3, 4, null] as const;
const frameworkButtonWidth = 34;
const frameworkStripGap = 5;
const travelFrameworkOrder = [
  "Flight",
  "Superspeed",
  "Superjump",
  "Athletics",
  "Swinging",
  "Teleportation",
];

const travelFrameworkLabels: Record<string, string> = {
  Superjump: "Super Jump",
  Superspeed: "Super Speed",
};

function tierKey(tier: Power["tier"]) {
  return tier === null ? "travel" : String(tier);
}

function tierLabel(tier: Power["tier"]) {
  if (tier === -1) {
    return "Energy builder";
  }

  if (tier === null) {
    return "Travel and variants";
  }

  if (tier === 4) {
    return "Ultimate";
  }

  return `Tier ${tier}`;
}

function travelFrameworkLabel(frameworkId: string | null) {
  if (!frameworkId) {
    return "Travel";
  }

  return travelFrameworkLabels[frameworkId] ?? formatFrameworkName(frameworkId);
}

function travelFrameworkSortIndex(frameworkId: string | null) {
  const index = travelFrameworkOrder.indexOf(frameworkId ?? "");

  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function normalizeSearchText(value: string | null | undefined) {
  return value?.replace(/<br\s*\/?>/gi, " ").toLowerCase() ?? "";
}

function getSearchablePowerType(power: Power) {
  const powerType = power.Power_Type ?? power.POWER_TYPE ?? "";

  return `${powerType} ${powerType.replace(/_/g, " ")}`;
}

export function PowersPanel({
  powers,
  advantages,
  frameworkGroups,
  selectedFramework,
  buildSlots,
  energyBuilderSelectionVersion,
  restrictedPowerIds,
  restrictedPowerSectionLabel,
  canAddPower,
  onSelectFramework,
  onAddPower,
}: PowersPanelProps) {
  const [search, setSearch] = useState("");
  const [closedSections, setClosedSections] = useState<string[]>([]);
  const [
    reopenedEnergyBuilderSelectionVersion,
    setReopenedEnergyBuilderSelectionVersion,
  ] = useState(0);
  const [frameworkStripColumns, setFrameworkStripColumns] = useState(1);
  const frameworkStripRef = useRef<HTMLDivElement | null>(null);
  const hasEnergyBuilder = buildSlots.some((slot) => slot.power?.tier === -1);
  const hadEnergyBuilderRef = useRef(hasEnergyBuilder);
  const isTravelMode = selectedFramework === travelPowerFilterId;
  const isPowerVariantsMode = selectedFramework === powerVariantsFilterId;
  const isDevicesMode = selectedFramework === devicesFilterId;
  const selectedPowerIds = new Set(
    buildSlots
      .map((slot) => slot.power?.power_id)
      .filter((powerId) => powerId !== undefined),
  );
  const advantagesById = useMemo(() => {
    return new Map(advantages.map((advantage) => [advantage.advantage_id, advantage]));
  }, [advantages]);

  const visiblePowers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return powers.filter((power) => {
      if (
        restrictedPowerIds !== null &&
        !restrictedPowerIds.has(power.power_id)
      ) {
        return false;
      }

      if (
        restrictedPowerIds === null &&
        !isPowerVisibleInFramework(power, selectedFramework)
      ) {
        return false;
      }

      if (normalizedSearch === "") {
        return true;
      }

      return (
        normalizeSearchText(power.name).includes(normalizedSearch) ||
        normalizeSearchText(getSearchablePowerType(power)).includes(
          normalizedSearch,
        ) ||
        normalizeSearchText(power.range_tags?.join(" ")).includes(
          normalizedSearch,
        ) ||
        normalizeSearchText(power.tooltip).includes(normalizedSearch) ||
        power.advantages.some((advantageId) =>
          normalizeSearchText(advantagesById.get(advantageId)?.tooltip).includes(
            normalizedSearch,
          ),
        )
      );
    });
  }, [
    advantagesById,
    powers,
    restrictedPowerIds,
    search,
    selectedFramework,
  ]);

  const powerSections = useMemo(() => {
    if (restrictedPowerIds !== null) {
      return [
        {
          key: "restricted-powers",
          label: restrictedPowerSectionLabel ?? "Restricted powers",
          powers: [...visiblePowers].sort((a, b) => a.name.localeCompare(b.name)),
        },
      ];
    }

    if (isTravelMode) {
      const uniqueFrameworkIds = Array.from(
        new Set(visiblePowers.map((power) => power.framework_id)),
      ).sort((a, b) => {
        const orderDifference =
          travelFrameworkSortIndex(a) - travelFrameworkSortIndex(b);

        return (
          orderDifference ||
          travelFrameworkLabel(a).localeCompare(travelFrameworkLabel(b))
        );
      });

      return uniqueFrameworkIds.map((frameworkId) => ({
        key: `travel-${frameworkId ?? "unknown"}`,
        label: travelFrameworkLabel(frameworkId),
        powers: visiblePowers
          .filter((power) => power.framework_id === frameworkId)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
    }

    if (isPowerVariantsMode) {
      const uniqueFrameworkIds = Array.from(
        new Set(visiblePowers.map((power) => power.framework_id)),
      ).sort((a, b) => {
        const orderDifference =
          getPowerFrameworkSortIndex(a) - getPowerFrameworkSortIndex(b);

        return (
          orderDifference ||
          formatFrameworkName(a).localeCompare(formatFrameworkName(b))
        );
      });

      return uniqueFrameworkIds.map((frameworkId) => ({
        key: `power-variant-${frameworkId ?? "unknown"}`,
        label: formatFrameworkName(frameworkId) || "Unknown",
        powers: visiblePowers
          .filter((power) => power.framework_id === frameworkId)
          .sort((a, b) => {
            const variantTypeDifference =
              Number(isUltimatePowerVariantDevice(a)) -
              Number(isUltimatePowerVariantDevice(b));

            return variantTypeDifference || a.name.localeCompare(b.name);
          }),
      }));
    }

    if (isDevicesMode) {
      const uniqueFrameworkIds = Array.from(
        new Set(visiblePowers.map((power) => power.framework_id)),
      ).sort((a, b) =>
        formatFrameworkName(a).localeCompare(formatFrameworkName(b)),
      );

      return uniqueFrameworkIds.map((frameworkId) => ({
        key: `device-${frameworkId ?? "unknown"}`,
        label: formatFrameworkName(frameworkId) || "Unknown",
        powers: visiblePowers
          .filter((power) => power.framework_id === frameworkId)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
    }

    return tierOrder
      .map((tier) => ({
        key: tierKey(tier),
        label: tierLabel(tier),
        powers: visiblePowers.filter((power) => power.tier === tier),
      }))
      .filter((section) => section.powers.length > 0);
  }, [
    isPowerVariantsMode,
    isDevicesMode,
    isTravelMode,
    restrictedPowerIds,
    restrictedPowerSectionLabel,
    visiblePowers,
  ]);

  useEffect(() => {
    const frameworkStripElement = frameworkStripRef.current;

    if (!frameworkStripElement) {
      return;
    }

    function updateFrameworkStripColumns() {
      const width = frameworkStripElement?.clientWidth ?? 0;
      const nextColumns = Math.max(
        1,
        Math.floor(
          (width + frameworkStripGap) /
            (frameworkButtonWidth + frameworkStripGap),
        ),
      );

      setFrameworkStripColumns(nextColumns);
    }

    updateFrameworkStripColumns();

    const resizeObserver = new ResizeObserver(updateFrameworkStripColumns);

    resizeObserver.observe(frameworkStripElement);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (hasEnergyBuilder && !hadEnergyBuilderRef.current) {
      setClosedSections((currentClosedSections) =>
        currentClosedSections.includes("-1")
          ? currentClosedSections
          : [...currentClosedSections, "-1"],
      );
    }

    hadEnergyBuilderRef.current = hasEnergyBuilder;
  }, [hasEnergyBuilder]);

  function toggleSection(key: string) {
    if (key === "-1") {
      if (isSectionClosed(key)) {
        setClosedSections((currentClosedSections) =>
          currentClosedSections.filter((closedSection) => closedSection !== key),
        );
        setReopenedEnergyBuilderSelectionVersion(
          energyBuilderSelectionVersion,
        );
        return;
      }

      setClosedSections((currentClosedSections) => [
        ...currentClosedSections,
        key,
      ]);
      return;
    }

    setClosedSections((currentClosedSections) => {
      if (currentClosedSections.includes(key)) {
        return currentClosedSections.filter(
          (closedSection) => closedSection !== key,
        );
      }

      return [...currentClosedSections, key];
    });
  }

  function isSectionClosed(key: string) {
    return (
      closedSections.includes(key) ||
      (key === "-1" &&
        energyBuilderSelectionVersion > reopenedEnergyBuilderSelectionVersion)
    );
  }

  function renderFrameworkStripItems() {
    const frameworkStripRows = 2;
    const firstFrameworkColumn = Math.min(2, frameworkStripColumns);
    const utilityGroup = frameworkGroups.find(
      (frameworkGroup) => frameworkGroup.id === "utility",
    );
    const standardFrameworkGroups = frameworkGroups.filter(
      (frameworkGroup) => frameworkGroup.id !== "utility",
    );
    const cells: ReactNode[] = Array.from(
      { length: frameworkStripColumns * frameworkStripRows },
      (_, index) => (
        <span
          className="framework-spacer"
          aria-hidden="true"
          key={`framework-empty-${index}`}
        />
      ),
    );

    function createFrameworkButton(
      key: string,
      isActive: boolean,
      isDisabled: boolean,
      iconName: string,
      title: string,
      onClick: () => void,
    ) {
      return (
        <button
          className={
            isActive
              ? "framework-button framework-button--active"
              : "framework-button"
          }
          disabled={isDisabled}
          key={key}
          onClick={onClick}
          title={title}
        >
          <SpriteIcon
            className="framework-button__icon"
            name={iconName}
            size={40}
          />
        </button>
      );
    }

    cells[0] = createFrameworkButton(
      "all-frameworks",
      selectedFramework === null,
      false,
      "Any_Generic",
      "All frameworks",
      () => onSelectFramework(null),
    );

    const utilityButtons =
      utilityGroup?.filters.map((framework) =>
        createFrameworkButton(
          framework.id,
          selectedFramework === framework.id,
          !framework.selectable,
          framework.iconId ?? getFrameworkIconName(framework.id),
          framework.title,
          () => onSelectFramework(framework.id),
        ),
      ) ?? [];
    const utilityRow = frameworkStripRows - 1;
    const reservedUtilityStartColumn = Math.max(
      firstFrameworkColumn,
      frameworkStripColumns - utilityButtons.length - 1,
    );

    let row = 0;
    let column = firstFrameworkColumn;
    let utilityRowNextColumn = firstFrameworkColumn;
    const getAvailableColumns = (targetRow: number) =>
      targetRow === utilityRow
        ? reservedUtilityStartColumn
        : frameworkStripColumns;

    standardFrameworkGroups.forEach((frameworkGroup) => {
      const groupItems = frameworkGroup.filters.map((framework) =>
        createFrameworkButton(
          framework.id,
          selectedFramework === framework.id,
          !framework.selectable,
          framework.iconId ?? getFrameworkIconName(framework.id),
          framework.title,
          () => onSelectFramework(framework.id),
        ),
      );
      const isAtRowStart = column === firstFrameworkColumn;
      const separatorWidth = isAtRowStart ? 0 : 1;
      const requiredWidth = separatorWidth + groupItems.length;

      if (column + requiredWidth > getAvailableColumns(row)) {
        row += 1;
        column = firstFrameworkColumn;
      }

      if (row >= frameworkStripRows) {
        return;
      }

      if (column + groupItems.length > getAvailableColumns(row)) {
        return;
      }

      if (column !== firstFrameworkColumn) {
        column += 1;
      }

      groupItems.forEach((item) => {
        const cellIndex = row * frameworkStripColumns + column;

        cells[cellIndex] = item;
        column += 1;
      });

      if (row === utilityRow) {
        utilityRowNextColumn = column;
      }
    });

    const utilityStartColumn = Math.min(
      Math.max(utilityRowNextColumn + 1, firstFrameworkColumn),
      frameworkStripColumns - utilityButtons.length,
    );

    utilityButtons.forEach((button, index) => {
      cells[utilityRow * frameworkStripColumns + utilityStartColumn + index] =
        button;
    });

    return cells;
  }

  return (
    <section className="panel powers-panel">
      <h2>Powers</h2>

      <div
        className="framework-strip"
        aria-label="Power frameworks"
        ref={frameworkStripRef}
      >
        {renderFrameworkStripItems()}
      </div>

      <label className="search-field">
        <span>Search powers</span>
        <input
          value={search}
          placeholder="Search powers..."
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="power-tier-list">
        {powerSections.map((section) => {
          const isClosed = isSectionClosed(section.key);

          return (
            <section className="power-tier" key={section.key}>
              <button
                className="power-tier__toggle"
                aria-expanded={!isClosed}
                onClick={() => toggleSection(section.key)}
              >
                <span>{section.label}</span>
                <span
                  className={
                    isClosed
                      ? "tier-toggle-icon tier-toggle-icon--closed"
                      : "tier-toggle-icon"
                  }
                />
              </button>

              {!isClosed && (
                <div className="power-grid">
                  {section.powers.map((power) => {
                    const canAdd = canAddPower(power);
                    const selected = selectedPowerIds.has(power.power_id);

                    return (
                      <button
                        className={
                          selected
                            ? "power-choice power-choice--selected"
                            : "power-choice"
                        }
                        disabled={!canAdd}
                        key={power.power_id}
                        data-power-tooltip={getPowerTooltipAttribute(power)}
                        onClick={() =>
                          onAddPower(
                            power,
                            getPowerDisplayFrameworkId(power, selectedFramework),
                          )
                        }
                        title={getPowerTooltipText(power)}
                      >
                        <SpriteIcon name={getPowerIconName(power)} size={34} />
                        <span>{power.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
