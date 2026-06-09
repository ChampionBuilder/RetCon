import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { getFrameworkIconName, getPowerIconName } from "@/shared/utils/icons";
import {
  getNormalizedPowerType,
  getPowerType,
} from "@/shared/utils/powerTypes";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { getEffectGroupTags } from "@/utils/effectGroups";
import { getFrameworkGlossaryTooltipAttribute } from "@/utils/frameworkGlossary";
import {
  powerActivationTypeOptions,
  powerMatchesActivationTypeFilter,
  type PowerActivationTypeFilter,
} from "@/utils/powerActivationTypes";
import {
  getAdvantageDamageTypes,
  getDamageTypeOptions,
  getPowerDamageTypes,
} from "@/utils/powerDamageTypes";
import {
  formatPowerRangeFilterLabel,
  powerMatchesExactRange,
  powerRangeSteps,
} from "@/utils/powerRange";
import { getPowerRoleOptions, getPowerRoles } from "@/utils/powerRoles";
import {
  powerMatchesTargetingFilter,
  powerTargetingOptions,
  type PowerTargetingFilter,
} from "@/utils/powerTargeting";
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
  onToggleCollapse: () => void;
};

type FrameworkStripCell = {
  content: ReactNode;
  isEmpty: boolean;
};

const tierOrder = [-1, 0, 1, 2, 3, 4, null] as const;
const maxFrameworkStripColumns = 14;
const keptTogetherFrameworkGroupIds = new Set(["martial-arts"]);
const powerVariantsUnlockTooltip =
  "Power Variant Devices have lower values and go on cooldown for 90 sec if you don't own the parent power. Ultimate Power Variants can't be used without the parent power.";
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
const scalingStatFilterOptions = [
  "STR",
  "DEX",
  "CON",
  "INT",
  "EGO",
  "PRE",
  "REC",
  "END",
];

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
      return powerVariantsUnlockTooltip;
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
  return normalizeSearchText(value)
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchablePowerType(power: Power) {
  const powerType = getPowerType(power) ?? "";
  const normalizedPowerType = getNormalizedPowerType(power) ?? "";
  const activationType = power.activation_type ?? "";
  const tierType = isUltimatePower(power) ? "Ultimate" : "";
  const powerRoles = getPowerRoles(power).join(" ");
  const powerTypeAliases =
    normalizedPowerType === "TOGGLE_FORM" ? ["Toggle Forms"] : [];

  return [
    powerType,
    powerType.replace(/_/g, " "),
    normalizedPowerType,
    normalizedPowerType.replace(/_/g, " "),
    activationType,
    activationType.replace(/_/g, " "),
    tierType,
    powerRoles,
    ...powerTypeAliases,
  ]
    .filter(Boolean)
    .join(" ");
}

function getSearchableRawPowerType(power: Power) {
  const powerType = getPowerType(power) ?? "";
  const normalizedPowerType = getNormalizedPowerType(power) ?? "";

  return [
    powerType,
    powerType.replace(/_/g, " "),
    normalizedPowerType,
    normalizedPowerType.replace(/_/g, " "),
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeScalingStat(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/giu, "");
}

function isDebugMode() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dbg") === "1"
  );
}

type SearchPrefix =
  | "activation"
  | "damage"
  | "range"
  | "scale"
  | "tag"
  | "type";

type ParsedPowerSearch = {
  activationQueries: string[];
  damageQueries: string[];
  normalQuery: string;
  rangeQueries: string[];
  scaleQueries: string[];
  tagQueries: string[];
  typeQueries: string[];
};

function parsePowerSearch(search: string): ParsedPowerSearch {
  const trimmedSearch = search.trim();
  const parsedSearch: ParsedPowerSearch = {
    activationQueries: [],
    damageQueries: [],
    normalQuery: "",
    rangeQueries: [],
    scaleQueries: [],
    tagQueries: [],
    typeQueries: [],
  };
  const prefixRegex =
    /\b(activation|damage|range|scale|tag|type)\s*:/giu;
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

    if (prefix === "activation") {
      parsedSearch.activationQueries.push(query);
      return;
    }

    if (prefix === "damage") {
      parsedSearch.damageQueries.push(query);
      return;
    }

    if (prefix === "range") {
      parsedSearch.rangeQueries.push(query);
      return;
    }

    if (prefix === "scale") {
      parsedSearch.scaleQueries.push(query);
      return;
    }

    if (prefix === "tag") {
      parsedSearch.tagQueries.push(query);
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
  onToggleCollapse,
}: PowersPanelProps) {
  const [search, setSearch] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isScalingStatMenuOpen, setIsScalingStatMenuOpen] = useState(false);
  const [isDamageTypeMenuOpen, setIsDamageTypeMenuOpen] = useState(false);
  const [selectedPowerRoleFilter, setSelectedPowerRoleFilter] = useState("");
  const [selectedScalingStats, setSelectedScalingStats] = useState<string[]>([]);
  const [selectedDamageTypes, setSelectedDamageTypes] = useState<string[]>([]);
  const [selectedRangeStepIndex, setSelectedRangeStepIndex] = useState(0);
  const [selectedTargetingFilter, setSelectedTargetingFilter] = useState<
    PowerTargetingFilter | ""
  >("");
  const [selectedActivationTypeFilter, setSelectedActivationTypeFilter] =
    useState<PowerActivationTypeFilter | "">("");
  const [searchInPowers, setSearchInPowers] = useState(true);
  const [searchInAdvantages, setSearchInAdvantages] = useState(false);
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
  const frameworkStripRef = useRef<HTMLDivElement | null>(null);
  const parsedSearch = useMemo(() => parsePowerSearch(search), [search]);
  const forceAdvancedPowerTooltip = searchInAdvantages;
  const advantageHighlightQueries = [
    ...(searchInAdvantages ? parsedSearch.tagQueries : []),
    searchInAdvantages ? parsedSearch.normalQuery : "",
    ...(searchInAdvantages ? selectedDamageTypes : []),
  ].filter(Boolean);
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
  const powersById = useMemo(() => {
    return new Map(powers.map((power) => [power.power_id, power]));
  }, [powers]);
  const powerRoleFilterOptions = useMemo(
    () => getPowerRoleOptions(powers),
    [powers],
  );
  const damageTypeFilterOptions = useMemo(
    () => getDamageTypeOptions(powers, advantages),
    [advantages, powers],
  );
  const targetingFilterOptions = useMemo(
    () =>
      isDebugMode()
        ? powerTargetingOptions
        : powerTargetingOptions.filter((option) => option !== "Special"),
    [],
  );
  const selectedMinimumRange = powerRangeSteps[selectedRangeStepIndex] ?? null;
  const hasActivePowerSearchOrFilter =
    Boolean(parsedSearch.normalQuery) ||
    parsedSearch.activationQueries.some(Boolean) ||
    parsedSearch.damageQueries.some(Boolean) ||
    parsedSearch.rangeQueries.some(Boolean) ||
    parsedSearch.scaleQueries.some(Boolean) ||
    parsedSearch.tagQueries.some(Boolean) ||
    parsedSearch.typeQueries.some(Boolean) ||
    Boolean(selectedPowerRoleFilter) ||
    selectedScalingStats.length > 0 ||
    selectedDamageTypes.length > 0 ||
    selectedMinimumRange !== null ||
    Boolean(selectedTargetingFilter) ||
    Boolean(selectedActivationTypeFilter);
  const includeAllFrameworkPowerVariants =
    selectedFrameworks === null && searchInPowers && hasActivePowerSearchOrFilter;

  const visiblePowers = useMemo(() => {
    function matchesEffectGroupSearch(values: string[] | undefined, query: string) {
      const effectGroupTags = getEffectGroupTags(query);

      if (effectGroupTags.length === 0) {
        return false;
      }

      return effectGroupTags.some((effectGroupTag) =>
        normalizeSearchText(values?.join(" ")).includes(
          normalizeSearchText(effectGroupTag),
        ),
      );
    }

    function matchesGeneralPowerSearch(power: Power, query: string) {
      return (
        normalizeSearchText(power.name).includes(query) ||
        normalizeSearchText(getSearchablePowerType(power)).includes(query) ||
        normalizeSearchText(power.range_tags?.join(" ")).includes(query) ||
        normalizeSearchText(power.tags?.join(" ")).includes(query) ||
        matchesEffectGroupSearch(power.tags, query) ||
        matchesEffectGroupSearch(getPowerDamageTypes(power), query) ||
        normalizeSearchText(power.tooltip).includes(query)
      );
    }

    function matchesGeneralAdvantageSearch(power: Power, query: string) {
      return power.advantages.some((advantageId) => {
        const advantage = advantagesById.get(advantageId);

        return (
          normalizeSearchText(advantage?.name).includes(query) ||
          normalizeSearchText(advantage?.tags?.join(" ")).includes(query) ||
          matchesEffectGroupSearch(advantage?.tags, query) ||
          matchesEffectGroupSearch(
            advantage ? getAdvantageDamageTypes(advantage) : [],
            query,
          ) ||
          normalizeSearchText(advantage?.tooltip).includes(query)
        );
      });
    }

    function matchesGeneralSearch(power: Power, query: string) {
      return (
        (searchInPowers && matchesGeneralPowerSearch(power, query)) ||
        (searchInAdvantages && matchesGeneralAdvantageSearch(power, query))
      );
    }

    function matchesScalingStatSearch(power: Power, query: string) {
      const normalizedScalingStatSearch = normalizeScalingStat(query);

      if (!normalizedScalingStatSearch) {
        return true;
      }

      return (power.scaling_stats ?? []).some(
        (scalingStat) =>
          normalizeScalingStat(scalingStat) === normalizedScalingStatSearch,
      );
    }

    function matchesTagSearch(power: Power, query: string) {
      const normalizedTagSearch = normalizeStrictSearchText(query);

      if (!normalizedTagSearch) {
        return true;
      }

      const matchesPowerTags =
        searchInPowers &&
        normalizeStrictSearchText(power.tags?.join(" ")).includes(
          normalizedTagSearch,
        );

      if (matchesPowerTags) {
        return true;
      }

      if (!searchInAdvantages) {
        return false;
      }

      return power.advantages.some((advantageId) => {
        const advantage = advantagesById.get(advantageId);

        return normalizeStrictSearchText(advantage?.tags?.join(" ")).includes(
          normalizedTagSearch,
        );
      });
    }

    function matchesRangeSearch(power: Power, query: string) {
      return normalizeStrictSearchText(power.range_tags?.join(" ")).includes(
        normalizeStrictSearchText(query),
      );
    }

    function matchesTypeSearch(power: Power, query: string) {
      return normalizeStrictSearchText(getSearchableRawPowerType(power)).includes(
        normalizeStrictSearchText(query),
      );
    }

    function matchesActivationSearch(power: Power, query: string) {
      return normalizeStrictSearchText(power.activation_type).includes(
        normalizeStrictSearchText(query),
      );
    }

    function matchesDamageTypeFilter(power: Power, damageType: string) {
      if (searchInPowers && getPowerDamageTypes(power).includes(damageType)) {
        return true;
      }

      if (!searchInAdvantages) {
        return false;
      }

      return power.advantages.some((advantageId) => {
        const advantage = advantagesById.get(advantageId);

        return advantage
          ? getAdvantageDamageTypes(advantage).includes(damageType)
          : false;
      });
    }

    function matchesDamageSearch(power: Power, query: string) {
      const normalizedDamageSearch = normalizeStrictSearchText(query);

      if (!normalizedDamageSearch) {
        return true;
      }

      const matchesPowerDamage =
        searchInPowers &&
        normalizeStrictSearchText(getPowerDamageTypes(power).join(" ")).includes(
          normalizedDamageSearch,
        );

      if (matchesPowerDamage) {
        return true;
      }

      if (!searchInAdvantages) {
        return false;
      }

      return power.advantages.some((advantageId) => {
        const advantage = advantagesById.get(advantageId);

        return advantage
          ? normalizeStrictSearchText(
              getAdvantageDamageTypes(advantage).join(" "),
            ).includes(normalizedDamageSearch)
          : false;
      });
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
          !isPowerVisibleInSelectedFrameworks(power, selectedFrameworks) &&
          !(includeAllFrameworkPowerVariants && isPowerVariantDevice(power))
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
        selectedPowerRoleFilter &&
        !getPowerRoles(power).includes(selectedPowerRoleFilter)
      ) {
        return false;
      }

      if (
        selectedScalingStats.length > 0 &&
        !selectedScalingStats.some((stat) => matchesScalingStatSearch(power, stat))
      ) {
        return false;
      }

      if (
        selectedDamageTypes.length > 0 &&
        !selectedDamageTypes.some((damageType) =>
          matchesDamageTypeFilter(power, damageType),
        )
      ) {
        return false;
      }

      if (
        selectedMinimumRange !== null &&
        !powerMatchesExactRange(power, selectedMinimumRange)
      ) {
        return false;
      }

      if (!powerMatchesTargetingFilter(power, selectedTargetingFilter)) {
        return false;
      }

      if (
        !powerMatchesActivationTypeFilter(power, selectedActivationTypeFilter)
      ) {
        return false;
      }

      if (
        parsedSearch.activationQueries.some(
          (query) => query && !matchesActivationSearch(power, query),
        )
      ) {
        return false;
      }

      if (
        parsedSearch.damageQueries.some(
          (query) => query && !matchesDamageSearch(power, query),
        )
      ) {
        return false;
      }

      if (
        parsedSearch.rangeQueries.some(
          (query) => query && !matchesRangeSearch(power, query),
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
        parsedSearch.tagQueries.some(
          (query) => query && !matchesTagSearch(power, query),
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
    searchInAdvantages,
    searchInPowers,
    selectedDamageTypes,
    selectedScalingStats,
    selectedMinimumRange,
    selectedTargetingFilter,
    selectedActivationTypeFilter,
    selectedPowerRoleFilter,
    selectedFrameworks,
    includeAllFrameworkPowerVariants,
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
        styles.getPropertyValue("--framework-layout-gap") ||
          styles.getPropertyValue("--framework-strip-gap"),
      ) || 5;
      const nextColumns = Math.min(
        maxFrameworkStripColumns,
        Math.max(
          1,
          Math.floor(
            (width + frameworkStripGap) /
              (frameworkButtonWidth + frameworkStripGap),
          ),
        ),
      );

      setFrameworkStripColumns(nextColumns);
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

  function toggleScalingStatFilter(stat: string, isSelected: boolean) {
    setSelectedScalingStats((currentStats) => {
      if (isSelected) {
        return currentStats.includes(stat)
          ? currentStats
          : [...currentStats, stat];
      }

      return currentStats.filter((currentStat) => currentStat !== stat);
    });
  }

  function toggleDamageTypeFilter(damageType: string, isSelected: boolean) {
    setSelectedDamageTypes((currentDamageTypes) => {
      if (isSelected) {
        return currentDamageTypes.includes(damageType)
          ? currentDamageTypes
          : [...currentDamageTypes, damageType];
      }

      return currentDamageTypes.filter(
        (currentDamageType) => currentDamageType !== damageType,
      );
    });
  }

  function selectedScalingStatsLabel() {
    return selectedScalingStats.length > 0
      ? selectedScalingStats.join(";")
      : "Any stats";
  }

  function selectedDamageTypesLabel() {
    return selectedDamageTypes.length > 0
      ? selectedDamageTypes.join(";")
      : "Any damage";
  }

  function selectedRangeLabel() {
    return formatPowerRangeFilterLabel(selectedMinimumRange);
  }

  function resetAdvancedFilters() {
    setSelectedPowerRoleFilter("");
    setSelectedScalingStats([]);
    setSelectedDamageTypes([]);
    setSelectedRangeStepIndex(0);
    setSelectedTargetingFilter("");
    setSelectedActivationTypeFilter("");
    setIsScalingStatMenuOpen(false);
    setIsDamageTypeMenuOpen(false);
  }

  function renderFrameworkStripItems() {
    const frameworkStripRows = 2;
    const firstFrameworkColumn = () => 0;
    const utilityGroup = frameworkGroups.find(
      (frameworkGroup) => frameworkGroup.id === "utility",
    );
    const standardFrameworkGroups = frameworkGroups.filter(
      (frameworkGroup) => frameworkGroup.id !== "utility",
    );
    const cells: FrameworkStripCell[] = Array.from(
      { length: frameworkStripColumns * frameworkStripRows },
      (_, index) => ({
        content: (
          <span
            className="framework-spacer"
            aria-hidden="true"
            key={`framework-empty-${index}`}
          />
        ),
        isEmpty: true,
      }),
    );

    function createFrameworkButton(
      key: string,
      isActive: boolean,
      isDisabled: boolean,
      iconName: string,
      title: string,
      onClick: (event: MouseEvent<HTMLButtonElement>) => void,
      showMultiSelectHint = false,
    ) {
      const isPowerVariantsButton = key === powerVariantsFilterId;
      const hint =
        showMultiSelectHint && !isPowerVariantsButton
          ? "Hold Shift to select multiple framework."
          : null;
      const frameworkTooltip = isPowerVariantsButton
        ? undefined
        : getFrameworkGlossaryTooltipAttribute(key, title, hint);

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
          title={isPowerVariantsButton ? powerVariantsUnlockTooltip : title}
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

    let row = 0;
    let column = firstFrameworkColumn();

    standardFrameworkGroups.forEach((frameworkGroup) => {
      if (
        keptTogetherFrameworkGroupIds.has(frameworkGroup.id) &&
        column + frameworkGroup.filters.length > frameworkStripColumns
      ) {
        row += 1;
        column = firstFrameworkColumn();
      }

      frameworkGroup.filters.forEach((framework) => {
        if (column >= frameworkStripColumns) {
          row += 1;
          column = firstFrameworkColumn();
        }

        if (row >= frameworkStripRows) {
          return;
        }

        const cellIndex = row * frameworkStripColumns + column;

        cells[cellIndex] = {
          content: createFrameworkButton(
            framework.id,
            selectedFrameworks?.includes(framework.id) ?? false,
            !framework.selectable,
            framework.iconId ?? getFrameworkIconName(framework.id),
            framework.title,
            (event) => {
              const isActive = selectedFrameworks?.includes(framework.id) ?? false;
              onSelectFramework(
                isActive && !event.shiftKey ? null : framework.id,
                event.shiftKey,
              );
            },
            true,
          ),
          isEmpty: false,
        };
        column += 1;
      });
    });

    if (utilityGroup && column < frameworkStripColumns) {
      column += 1;
    } else if (utilityGroup) {
      row += 1;
      column = firstFrameworkColumn() + 1;
    }

    utilityGroup?.filters.forEach((framework) => {
      if (column >= frameworkStripColumns) {
        row += 1;
        column = firstFrameworkColumn();
      }

      if (row >= frameworkStripRows) {
        return;
      }

      const cellIndex = row * frameworkStripColumns + column;

      cells[cellIndex] = {
        content: createFrameworkButton(
          framework.id,
          isUtilityFrameworkSelection(selectedFrameworks, framework.id),
          !framework.selectable,
          framework.iconId ?? getFrameworkIconName(framework.id),
          framework.title,
          () => {
            const isActive = isUtilityFrameworkSelection(
              selectedFrameworks,
              framework.id,
            );

            onSelectFramework(isActive ? null : framework.id, false);
          },
          false,
        ),
        isEmpty: false,
      };
      column += 1;
    });

    return cells.map((cell, index) => {
      const cellRow = Math.floor(index / frameworkStripColumns);
      const cellColumn = index % frameworkStripColumns;
      const cellStyle = {
        gridColumn: cellColumn + 1,
        gridRow: cellRow + 1,
      } satisfies CSSProperties;

      return (
        <span
          className={[
            "framework-cell",
            cell.isEmpty ? "framework-cell--empty" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={`framework-cell-${index}`}
          style={cellStyle}
        >
          {cell.content}
        </span>
      );
    });
  }

  return (
    <section className="panel powers-panel">
      <h2>
        <button
          className="panel-title-button"
          type="button"
          onClick={onToggleCollapse}
        >
          Powers
        </button>
      </h2>

      <div
        className="framework-strip"
        aria-label="Power frameworks"
        ref={frameworkStripRef}
        style={
          {
            "--framework-strip-columns": frameworkStripColumns,
          } as CSSProperties
        }
      >
        {renderFrameworkStripItems()}
      </div>

      <div className="search-row">
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
        <label className="search-scope-checkbox">
          <input
            checked={searchInPowers}
            type="checkbox"
            onChange={(event) => setSearchInPowers(event.target.checked)}
          />
          <span>Powers</span>
        </label>
        <label className="search-scope-checkbox">
          <input
            checked={searchInAdvantages}
            type="checkbox"
            onChange={(event) => setSearchInAdvantages(event.target.checked)}
          />
          <span>Adv.</span>
        </label>
        <button
          aria-label="Expand advanced power filters"
          aria-expanded={isFilterPanelOpen}
          className={
            isFilterPanelOpen
              ? "search-filter-button search-filter-button--active"
              : "search-filter-button"
          }
          type="button"
          onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
        >
          Filter
        </button>
      </div>

      {isFilterPanelOpen ? (
        <div className="search-filter-panel">
          <label className="search-filter-panel__field search-filter-panel__field--type">
            <span className="search-filter-panel__label">Power type</span>
            <select
              value={selectedPowerRoleFilter}
              onChange={(event) => setSelectedPowerRoleFilter(event.target.value)}
            >
              <option value="">Any type</option>
              {powerRoleFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="search-filter-panel__field search-filter-panel__field--targeting">
            <span className="search-filter-panel__label">Targeting</span>
            <select
              value={selectedTargetingFilter}
              onChange={(event) =>
                setSelectedTargetingFilter(
                  event.target.value as PowerTargetingFilter | "",
                )
              }
            >
              <option value="">Any targeting</option>
              {targetingFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="search-filter-panel__field search-filter-panel__field--activation">
            <span className="search-filter-panel__label">Activation type</span>
            <select
              value={selectedActivationTypeFilter}
              onChange={(event) =>
                setSelectedActivationTypeFilter(
                  event.target.value as PowerActivationTypeFilter | "",
                )
              }
            >
              <option value="">Any activation</option>
              {powerActivationTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="search-filter-panel__field search-filter-panel__field--range">
            <span className="search-filter-panel__label">Range</span>
            <div className="search-filter-range">
              <span className="search-filter-range__value">
                {selectedRangeLabel()}
              </span>
              <input
                max={powerRangeSteps.length - 1}
                min={0}
                type="range"
                value={selectedRangeStepIndex}
                onChange={(event) =>
                  setSelectedRangeStepIndex(Number(event.target.value))
                }
              />
            </div>
          </label>

          <div className="search-filter-panel__field search-filter-panel__field--damage">
            <span className="search-filter-panel__label">Damage type</span>
            <div className="search-filter-dropdown">
              <button
                aria-expanded={isDamageTypeMenuOpen}
                className="search-filter-dropdown__button"
                type="button"
                onClick={() => setIsDamageTypeMenuOpen((isOpen) => !isOpen)}
              >
                <span>{selectedDamageTypesLabel()}</span>
                <span className="search-filter-dropdown__arrow" />
              </button>

              {isDamageTypeMenuOpen ? (
                <div className="search-filter-dropdown__menu search-filter-dropdown__menu--damage">
                  {damageTypeFilterOptions.map((damageType) => (
                    <label
                      className="search-filter-panel__checkbox search-filter-panel__checkbox--stat"
                      key={damageType}
                    >
                      <input
                        checked={selectedDamageTypes.includes(damageType)}
                        type="checkbox"
                        onChange={(event) =>
                          toggleDamageTypeFilter(
                            damageType,
                            event.target.checked,
                          )
                        }
                      />
                      <span>{damageType}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="search-filter-panel__field search-filter-panel__field--stats">
            <span className="search-filter-panel__label">Scaling stats</span>
            <div className="search-filter-dropdown">
              <button
                aria-expanded={isScalingStatMenuOpen}
                className="search-filter-dropdown__button"
                type="button"
                onClick={() => setIsScalingStatMenuOpen((isOpen) => !isOpen)}
              >
                <span>{selectedScalingStatsLabel()}</span>
                <span className="search-filter-dropdown__arrow" />
              </button>

              {isScalingStatMenuOpen ? (
                <div className="search-filter-dropdown__menu">
                  {scalingStatFilterOptions.map((stat) => (
                    <label
                      className="search-filter-panel__checkbox search-filter-panel__checkbox--stat"
                      key={stat}
                    >
                      <input
                        checked={selectedScalingStats.includes(stat)}
                        type="checkbox"
                        onChange={(event) =>
                          toggleScalingStatFilter(stat, event.target.checked)
                        }
                      />
                      <span>{stat}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="search-filter-panel__actions">
            <button
              className="search-filter-reset-button"
              type="button"
              onClick={resetAdvancedFilters}
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

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
                          powersById,
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
