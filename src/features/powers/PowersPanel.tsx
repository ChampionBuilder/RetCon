import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { getFrameworkIconName, getPowerIconName } from "@/shared/utils/icons";
import { getPowerType } from "@/shared/utils/powerTypes";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { getFrameworkGlossaryTooltipAttribute } from "@/utils/frameworkGlossary";
import {
  formatFrameworkName,
  getPowerDisplayFrameworkId,
  getPowerFrameworkSortIndex,
  type PowerFrameworkFilterGroup,
  type SelectedFrameworks,
  isCombatPower,
  isPowerVariantDevice,
  isStandardDevice,
  isTravelPower,
  isPowerVisibleInSelectedFrameworks,
  isUltimatePower,
  isUtilityFrameworkFilter,
  isUtilityFrameworkSelection,
  devicesFilterId,
  powerVariantsFilterId,
  travelPowerFilterId,
} from "@/utils/powerFrameworks";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type PowersPanelProps = {
  powers: Power[];
  advantages: Advantage[];
  frameworkGroups: PowerFrameworkFilterGroup[];
  selectedFrameworks: SelectedFrameworks;
  buildSlots: BuildSlot[];
  energyBuilderPanelRequestAction: "close" | "none" | "open";
  energyBuilderPanelRequestSelectionVersion: number;
  energyBuilderPanelRequestVersion: number;
  energyBuilderSelectionVersion: number;
  restrictedPowerIds: Set<number> | null;
  restrictedPowerSectionLabel: string | null;
  canAddPower: (power: Power) => boolean;
  onSelectFramework: (frameworkId: string | null, additive: boolean) => void;
  onAddPower: (power: Power, displayFrameworkId: string | null) => void;
};

const tierOrder = [-1, 0, 1, 2, 3, 4, null] as const;
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
    return "Variants";
  }

  if (tier === 4) {
    return "Ultimate";
  }

  return `Tier ${tier}`;
}

function sectionUnlockTooltip(sectionKey: string) {
  switch (sectionKey) {
    case "-1":
      return "You may have only one Energy Builder.";
    case "0":
      return "No unlock restrictions.";
    case "1":
      return "You need 1 power from the same framework, including Energy Builders, or 2 non-Energy Builder powers from any framework.";
    case "2":
      return "You need 3 powers from the same framework, including Energy Builders, or 4 non-Energy Builder powers from any framework.";
    case "3":
      return "You need 5 powers from the same framework, including Energy Builders, or 6 non-Energy Builder powers from any framework.";
    case "4":
      return "You may have only one Ultimate power. Ultimate PVD and Ultimate powers share the same cooldown.";
    case "framework-variants":
    case "__power_variants__":
      return "Power Variant Devices have lower values and go on cooldown when used without the parent power. Ultimate Power Variants can't be used without the parent power.";
    default:
      return undefined;
  }
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

function normalizeStrictSearchText(value: string | null | undefined) {
  return normalizeSearchText(value).replace(/[_-]+/g, " ");
}

function getSearchablePowerType(power: Power) {
  const powerType = getPowerType(power) ?? "";
  const tierType = isUltimatePower(power) ? "Ultimate" : "";

  return `${powerType} ${powerType.replace(/_/g, " ")} ${tierType}`;
}

type SearchPrefix = "adv" | "power" | "scale" | "type";

type ParsedPowerSearch = {
  advantageQueries: string[];
  normalQuery: string;
  powerQueries: string[];
  scaleQueries: string[];
  typeQueries: string[];
};

function parsePowerSearch(search: string): ParsedPowerSearch {
  const trimmedSearch = search.trim();
  const parsedSearch: ParsedPowerSearch = {
    advantageQueries: [],
    normalQuery: "",
    powerQueries: [],
    scaleQueries: [],
    typeQueries: [],
  };
  const prefixRegex = /\b(adv|power|scale|type)\s*:/giu;
  const matches = [...trimmedSearch.matchAll(prefixRegex)];

  if (matches.length === 0) {
    parsedSearch.normalQuery = trimmedSearch.toLowerCase();

    return parsedSearch;
  }

  parsedSearch.normalQuery = trimmedSearch
    .slice(0, matches[0]?.index ?? 0)
    .trim()
    .toLowerCase();

  matches.forEach((match, index) => {
    const prefix = match[1]?.toLowerCase() as SearchPrefix | undefined;
    const queryStart = (match.index ?? 0) + match[0].length;
    const queryEnd =
      index + 1 < matches.length
        ? matches[index + 1]?.index ?? trimmedSearch.length
        : trimmedSearch.length;
    const query = trimmedSearch.slice(queryStart, queryEnd).trim().toLowerCase();

    if (!prefix) {
      return;
    }

    if (prefix === "adv") {
      parsedSearch.advantageQueries.push(query);
      return;
    }

    if (prefix === "power") {
      parsedSearch.powerQueries.push(query);
      return;
    }

    if (prefix === "scale") {
      parsedSearch.scaleQueries.push(query);
      return;
    }

    parsedSearch.typeQueries.push(query);
  });

  return parsedSearch;
}

export function PowersPanel({
  powers,
  advantages,
  frameworkGroups,
  selectedFrameworks,
  buildSlots,
  energyBuilderPanelRequestAction,
  energyBuilderPanelRequestSelectionVersion,
  energyBuilderPanelRequestVersion,
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
    handledEnergyBuilderPanelRequestVersion,
    setHandledEnergyBuilderPanelRequestVersion,
  ] = useState(0);
  const [
    reopenedEnergyBuilderSelectionVersion,
    setReopenedEnergyBuilderSelectionVersion,
  ] = useState(0);
  const [frameworkStripColumns, setFrameworkStripColumns] = useState(1);
  const [frameworkGroupSeparatorColumns, setFrameworkGroupSeparatorColumns] =
    useState(1);
  const frameworkStripRef = useRef<HTMLDivElement | null>(null);
  const parsedSearch = useMemo(() => parsePowerSearch(search), [search]);
  const forceAdvancedPowerTooltip = parsedSearch.advantageQueries.length > 0;
  const advantageHighlightQueries = parsedSearch.advantageQueries.filter(Boolean);
  const hasEnergyBuilder = buildSlots.some((slot) => slot.power?.tier === -1);
  const hadEnergyBuilderRef = useRef(hasEnergyBuilder);
  const isTravelMode = isUtilityFrameworkSelection(
    selectedFrameworks,
    travelPowerFilterId,
  );
  const isPowerVariantsMode = isUtilityFrameworkSelection(
    selectedFrameworks,
    powerVariantsFilterId,
  );
  const isDevicesMode = isUtilityFrameworkSelection(
    selectedFrameworks,
    devicesFilterId,
  );
  const selectedPowerIds = new Set(
    buildSlots
      .map((slot) => slot.power?.power_id)
      .filter((powerId) => powerId !== undefined),
  );
  const advantagesById = useMemo(() => {
    return new Map(advantages.map((advantage) => [advantage.advantage_id, advantage]));
  }, [advantages]);

  const visiblePowers = useMemo(() => {
    function matchesGeneralSearch(power: Power, query: string) {
      return (
        normalizeSearchText(power.name).includes(query) ||
        normalizeSearchText(getSearchablePowerType(power)).includes(query) ||
        normalizeSearchText(power.range_tags?.join(" ")).includes(query) ||
        normalizeSearchText(power.tooltip).includes(query) ||
        power.advantages.some((advantageId) =>
          normalizeSearchText(advantagesById.get(advantageId)?.tooltip).includes(
            query,
          ),
        )
      );
    }

    function matchesAdvantageSearch(power: Power, query: string) {
      return power.advantages.some((advantageId) => {
        const advantage = advantagesById.get(advantageId);

        return (
          normalizeSearchText(advantage?.name).includes(query) ||
          normalizeSearchText(advantage?.tooltip).includes(query)
        );
      });
    }

    function matchesPowerSearch(power: Power, query: string) {
      return (
        normalizeSearchText(power.name).includes(query) ||
        normalizeSearchText(power.tooltip).includes(query)
      );
    }

    function matchesScalingStatSearch(power: Power, query: string) {
      const normalizedScalingStatSearch = query.replace(/[^a-z0-9]+/giu, "");

      if (!normalizedScalingStatSearch) {
        return true;
      }

      return (power.scaling_stats ?? []).some(
        (scalingStat) =>
          scalingStat.toLowerCase().replace(/[^a-z0-9]+/giu, "") ===
          normalizedScalingStatSearch,
      );
    }

    function matchesTypeSearch(power: Power, query: string) {
      return normalizeStrictSearchText(getSearchablePowerType(power)).includes(
        normalizeStrictSearchText(query),
      );
    }

    return powers.filter((power) => {
      if (
        restrictedPowerIds !== null &&
        !restrictedPowerIds.has(power.power_id)
      ) {
        return false;
      }

      if (restrictedPowerIds === null) {
        if (isPowerVariantsMode && !isPowerVariantDevice(power)) {
          return false;
        }

        if (isDevicesMode && !isStandardDevice(power)) {
          return false;
        }

        if (isTravelMode && !isTravelPower(power)) {
          return false;
        }

        if (
          !isPowerVariantsMode &&
          !isDevicesMode &&
          !isTravelMode &&
          !isPowerVisibleInSelectedFrameworks(power, selectedFrameworks)
        ) {
          return false;
        }
      }

      if (
        parsedSearch.normalQuery &&
        !matchesGeneralSearch(power, parsedSearch.normalQuery)
      ) {
        return false;
      }

      if (
        parsedSearch.advantageQueries.some(
          (query) => query && !matchesAdvantageSearch(power, query),
        )
      ) {
        return false;
      }

      if (
        parsedSearch.powerQueries.some(
          (query) => query && !matchesPowerSearch(power, query),
        )
      ) {
        return false;
      }

      if (
        parsedSearch.scaleQueries.some(
          (query) => query && !matchesScalingStatSearch(power, query),
        )
      ) {
        return false;
      }

      if (
        parsedSearch.typeQueries.some(
          (query) => query && !matchesTypeSearch(power, query),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    advantagesById,
    parsedSearch,
    powers,
    restrictedPowerIds,
    selectedFrameworks,
    isPowerVariantsMode,
    isDevicesMode,
    isTravelMode,
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
              Number(isUltimatePower(a)) - Number(isUltimatePower(b));

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

    const tierSections = tierOrder
      .map((tier) => ({
        key: tierKey(tier),
        label: tierLabel(tier),
        powers: visiblePowers.filter(
          (power) => isCombatPower(power) && power.tier === tier,
        ),
      }))
      .filter((section) => section.powers.length > 0);
    const variantPowers = visiblePowers
      .filter((power) => isPowerVariantDevice(power))
      .sort((a, b) => {
        const variantTypeDifference =
          Number(isUltimatePower(a)) - Number(isUltimatePower(b));

        return variantTypeDifference || a.name.localeCompare(b.name);
      });

    if (variantPowers.length === 0) {
      return tierSections;
    }

    return [
      ...tierSections,
      {
        key: "framework-variants",
        label: "Variants",
        powers: variantPowers,
      },
    ];
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

    const frameworkStrip = frameworkStripElement;

    function updateFrameworkStripColumns() {
      const width = frameworkStrip.clientWidth;
      const styles = window.getComputedStyle(frameworkStrip);
      const frameworkButtonWidth = Number.parseFloat(
        styles.getPropertyValue("--framework-button-width"),
      ) || 34;
      const frameworkStripGap = Number.parseFloat(
        styles.getPropertyValue("--framework-strip-gap"),
      ) || 5;
      const nextFrameworkGroupSeparatorColumns = Math.max(
        0,
        Math.round(
          Number.parseFloat(
            styles.getPropertyValue("--framework-group-separator-columns"),
          ) || 0,
        ),
      );
      const nextColumns = Math.max(
        1,
        Math.floor(
          (width + frameworkStripGap) /
            (frameworkButtonWidth + frameworkStripGap),
        ),
      );

      setFrameworkStripColumns(nextColumns);
      setFrameworkGroupSeparatorColumns(nextFrameworkGroupSeparatorColumns);
    }

    updateFrameworkStripColumns();

    const resizeObserver = new ResizeObserver(updateFrameworkStripColumns);

    resizeObserver.observe(frameworkStrip);

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
        setHandledEnergyBuilderPanelRequestVersion(
          energyBuilderPanelRequestVersion,
        );
        setReopenedEnergyBuilderSelectionVersion(
          energyBuilderSelectionVersion,
        );
        return;
      }

      setHandledEnergyBuilderPanelRequestVersion(
        energyBuilderPanelRequestVersion,
      );
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
    const hasActiveEnergyBuilderReopenRequest =
      key === "-1" &&
      energyBuilderPanelRequestVersion >
        handledEnergyBuilderPanelRequestVersion &&
      energyBuilderPanelRequestAction === "open" &&
      energyBuilderPanelRequestSelectionVersion >= energyBuilderSelectionVersion;

    if (hasActiveEnergyBuilderReopenRequest) {
      return false;
    }

    const hasActiveEnergyBuilderCloseRequest =
      key === "-1" &&
      energyBuilderPanelRequestVersion >
        handledEnergyBuilderPanelRequestVersion &&
      energyBuilderPanelRequestAction === "close";

    if (hasActiveEnergyBuilderCloseRequest) {
      return true;
    }

    return (
      closedSections.includes(key) ||
      (key === "-1" &&
        energyBuilderSelectionVersion > reopenedEnergyBuilderSelectionVersion)
    );
  }

  function renderFrameworkStripItems() {
    const frameworkStripRows = 2;
    const isCompactFrameworkStrip = frameworkGroupSeparatorColumns === 0;
    const firstFrameworkColumn = isCompactFrameworkStrip
      ? 1
      : Math.min(2, frameworkStripColumns);
    const firstFrameworkColumnByRow = (targetRow: number) =>
      isCompactFrameworkStrip && targetRow > 0 ? 0 : firstFrameworkColumn;
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
      onClick: (event: MouseEvent<HTMLButtonElement>) => void,
    ) {
      const frameworkTooltip = getFrameworkGlossaryTooltipAttribute(key);

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
          data-framework-tooltip={frameworkTooltip}
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
      selectedFrameworks === null,
      false,
      "Role_Freeform",
      "All frameworks",
      () => onSelectFramework(null, false),
    );

    const utilityButtons =
      utilityGroup?.filters.map((framework) =>
        createFrameworkButton(
          framework.id,
          isUtilityFrameworkSelection(selectedFrameworks, framework.id),
          !framework.selectable,
          framework.iconId ?? getFrameworkIconName(framework.id),
          framework.title,
          () => onSelectFramework(framework.id, false),
        ),
      ) ?? [];
    const utilityRow = frameworkStripRows - 1;
    const utilityPreGapColumns = isCompactFrameworkStrip ? 0 : 1;
    const reservedUtilityStartColumn = Math.max(
      firstFrameworkColumnByRow(utilityRow),
      frameworkStripColumns - utilityButtons.length - utilityPreGapColumns,
    );

    let row = 0;
    let column = firstFrameworkColumnByRow(row);
    let utilityRowNextColumn = firstFrameworkColumnByRow(utilityRow);
    const getAvailableColumns = (targetRow: number) =>
      targetRow === utilityRow
        ? reservedUtilityStartColumn
        : frameworkStripColumns;

    standardFrameworkGroups.forEach((frameworkGroup) => {
      const groupItems = frameworkGroup.filters.map((framework) =>
        createFrameworkButton(
          framework.id,
          selectedFrameworks?.includes(framework.id) ?? false,
          !framework.selectable,
          framework.iconId ?? getFrameworkIconName(framework.id),
          framework.title,
          (event) => onSelectFramework(framework.id, event.shiftKey),
        ),
      );
      const isAtRowStart = column === firstFrameworkColumnByRow(row);
      const separatorWidth = isAtRowStart ? 0 : frameworkGroupSeparatorColumns;
      const requiredWidth = separatorWidth + groupItems.length;

      if (!isCompactFrameworkStrip && column + requiredWidth > getAvailableColumns(row)) {
        row += 1;
        column = firstFrameworkColumnByRow(row);
      }

      if (row >= frameworkStripRows) {
        return;
      }

      if (!isCompactFrameworkStrip && column + groupItems.length > getAvailableColumns(row)) {
        return;
      }

      if (!isCompactFrameworkStrip && column !== firstFrameworkColumnByRow(row)) {
        column += 1;
      }

      groupItems.forEach((item) => {
        if (column >= getAvailableColumns(row)) {
          row += 1;
          column = firstFrameworkColumnByRow(row);
        }

        if (row >= frameworkStripRows) {
          return;
        }

        const cellIndex = row * frameworkStripColumns + column;

        cells[cellIndex] = item;
        column += 1;
      });

      if (row === utilityRow) {
        utilityRowNextColumn = column;
      }
    });

    const utilityStartColumn = Math.min(
      Math.max(
        utilityRowNextColumn + utilityPreGapColumns,
        firstFrameworkColumnByRow(utilityRow),
      ),
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

      <div className="search-field">
        <label htmlFor="powers-search">Search powers</label>
        <input
          id="powers-search"
          value={search}
          placeholder="Search powers..."
          onChange={(event) => setSearch(event.target.value)}
        />
        {search ? (
          <button
            aria-label="Clear power search"
            className="search-field__clear"
            type="button"
            onClick={() => setSearch("")}
          >
            X
          </button>
        ) : null}
      </div>

      <div className="power-tier-list">
        {powerSections.map((section) => {
          const isClosed = isSectionClosed(section.key);
          const unlockTooltip = sectionUnlockTooltip(section.key);

          return (
            <section className="power-tier" key={section.key}>
              <button
                className="power-tier__toggle"
                aria-expanded={!isClosed}
                onClick={() => toggleSection(section.key)}
                title={unlockTooltip}
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
                        data-power-tooltip={getPowerTooltipAttribute(
                          power,
                          advantagesById,
                        )}
                        data-power-tooltip-advanced={
                          forceAdvancedPowerTooltip ? "true" : undefined
                        }
                        data-power-tooltip-advantage-queries={
                          advantageHighlightQueries.length > 0
                            ? JSON.stringify(advantageHighlightQueries)
                            : undefined
                        }
                        onClick={() =>
                          onAddPower(
                            power,
                            getPowerDisplayFrameworkId(
                              power,
                              selectedFrameworks?.find(
                                (frameworkId) =>
                                  !isUtilityFrameworkFilter(frameworkId) &&
                                  isPowerVisibleInSelectedFrameworks(power, [
                                    frameworkId,
                                  ]),
                              ) ?? null,
                            ),
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
