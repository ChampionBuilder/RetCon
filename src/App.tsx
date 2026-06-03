import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./styles/tooltips.css";
import { AboutDialog } from "@/components/AboutDialog";
import { AppHeader } from "@/components/AppHeader";
import { ArchetypePowerSelectionDialog } from "@/components/ArchetypePowerSelectionDialog";
import { ArchetypeSelectionDialog } from "@/components/ArchetypeSelectionDialog";
import { RoleSelectionDialog } from "@/components/RoleSelectionDialog";
import {
  BuildCheckDialog,
  BuildPanel,
  useAuxiliaryPowerSlots,
  useBuildPowerState,
  useCombatPowerSlots,
} from "@/features/build";
import {
  SpecializationMasteryDialog,
  SpecializationSelectionDialog,
  SpecializationsPanel,
  useSpecializations,
} from "@/features/specializations";
import {
  CharacterPanel,
  InnateTalentSelectionDialog,
  StatSelectionDialog,
  TalentSelectionDialog,
  useStatsTalents,
} from "@/features/character";
import {
  AdvantageSelectionDialog,
  DeviceSelectionDialog,
  PowerSelectionDialog,
  PowerVariantSelectionDialog,
  PowersPanel,
  TravelPowerSelectionDialog,
  usePowerPanelTargets,
} from "@/features/powers";
import { ImportBuildDialog } from "@/features/import-build";
import { DataDialog, useSavedBuilds } from "@/features/saved-builds";
import { InstantTooltip, type DialogAnchor } from "@/shared/ui";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import type { BuildRequirementResult } from "@/utils/buildValidation";
import {
  maxCamsLevel,
} from "@/utils/advantagerules";
import {
  getVisiblePowerFrameworkGroups,
  isCombatPower,
  isPowerVariantDevice,
  isStandardDevice,
  isTravelPower,
  isUtilityFrameworkFilter,
  isUtilityFrameworkSelection,
  devicesFilterId,
  powerVariantsFilterId,
  travelPowerFilterId,
} from "@/utils/powerFrameworks";
import {
  canPlacePowerInSlot,
  getFirstValidPowerSlot,
} from "@/utils/powerSlots";
import { isPowerEnabled } from "@/utils/powerrules";
import { createRandomFreeformBuild } from "@/utils/randomizer";
import {
  createShareUrl,
  hydrateSerializedBuild,
  parseSerializedBuild,
  serializeBuild,
} from "@/utils/buildSerialization";
import { useShareUrlSync } from "@/hooks/useShareUrlSync";
import { useBuilderData } from "@/hooks/useBuilderData";
import { usePowerDialogs } from "@/hooks/usePowerDialogs";
import { useArchetypeRoleState } from "@/hooks/useArchetypeRoleState";
import { useArchetypePowerState } from "@/hooks/useArchetypePowerState";
import { useAdvantageActions } from "@/hooks/useAdvantageActions";
import { getMatchingRequirementPowerIds } from "@/utils/buildValidation";
function App() {
  const [buildName, setBuildName] = useState("My Awesome Build");
  const [energyBuilderSelectionVersion, setEnergyBuilderSelectionVersion] =
    useState(0);
  const [energyBuilderPanelRequest, setEnergyBuilderPanelRequest] = useState<{
    action: "close" | "none" | "open";
    selectionVersion: number;
    version: number;
  }>({
    action: "none",
    selectionVersion: 0,
    version: 0,
  });
  const [buildCheckDialogOpen, setBuildCheckDialogOpen] = useState(false);
  const [buildScrollTargetSlot, setBuildScrollTargetSlot] = useState<number | null>(
    null,
  );
  const [buildCheckPowerFilter, setBuildCheckPowerFilter] = useState<{
    ids: Set<number>;
    label: string;
  } | null>(null);
  const {
    advantages,
    archetypesData,
    dataReady,
    powers,
    specializationTreesData,
    statsTalentsData,
  } = useBuilderData();
  const {
    applySelectedArchetype,
    archetypeDialogAnchor,
    closeArchetypeDialog,
    closeRoleDialog,
    hydrateArchetypeRole,
    isFreeform,
    openArchetypeDialog,
    openRoleDialog,
    resetArchetypeRole,
    roleDialogAnchor,
    selectedArchetype,
    selectedArchetypeId,
    selectedRole,
    selectedRoleId,
    selectRole,
  } = useArchetypeRoleState(archetypesData);
  const {
    activeSpecializationTreeSlot,
    applyArchetypeSpecializations,
    changeSpecializationPoints,
    clearSpecializationSlot,
    closeMasteryDialog,
    closeSpecializationTreeDialog,
    hydrateSpecializations,
    masteryDialogAnchor,
    openMasteryDialog,
    openSpecializationTreeDialog,
    resetAllSpecializations,
    resetSpecializations: resetSpecializationState,
    selectedMasterySlot,
    selectedSpecializationTreeIds,
    selectedSpecializationTrees,
    selectMastery,
    selectSpecializationTree,
    specializationPointsBySlot,
    specializationTreeDialogAnchor,
    specializationTrees,
    updatePrimarySpecializationTree,
  } = useSpecializations(specializationTreesData);
  const {
    activeSuperStatSlot,
    activeTalentSlot,
    applyArchetypeStatsTalents,
    autofillTalents,
    closeInnateTalentDialog,
    closeStatsTalentDialogs,
    closeSuperStatDialog,
    closeTalentDialog,
    hydrateStatsTalents,
    innateTalentDialogAnchor,
    openInnateTalentDialog,
    openSuperStatDialog,
    openTalentDialog,
    resetAllStatsTalents,
    resetSuperStats: resetSuperStatState,
    resetTalents: resetTalentState,
    selectedInnateTalent,
    selectedInnateTalentId,
    selectedSuperStatIds,
    selectedSuperStats,
    selectedTalentIds,
    selectedTalents,
    selectInnateTalent,
    selectSuperStat,
    selectTalent,
    superStatDialogAnchor,
    talentDialogAnchor,
  } = useStatsTalents({
    onPrimarySuperStatChange: updatePrimarySpecializationTree,
    statsTalentsData,
  });
  const {
    activeAdvantageSlot,
    activeDeviceSlot,
    activePowerSlot,
    activePowerVariantSlot,
    activeTravelPowerSlot,
    advantageDialogAnchor,
    closeAdvantageDialog,
    closeDeviceDialog,
    closePowerDialog,
    closePowerDialogs,
    closePowerVariantDialog,
    closeTravelPowerDialog,
    deviceDialogAnchor,
    lastPowerDialogFrameworkId,
    openAdvantageDialog,
    openDeviceDialog,
    openPowerDialog: openPowerDialogState,
    openPowerVariantDialog,
    openTravelPowerDialog,
    powerDialogAnchor,
    powerVariantDialogAnchor,
    travelPowerDialogAnchor,
    setLastPowerDialogFrameworkId,
  } = usePowerDialogs();
  const {
    applyArchetypeBuildSlots,
    applyFreeformBuildSlots,
    buildSlots,
    clearPowerAdvantages,
    clearPowerSlotAdvantages,
    placeArchetypePower,
    placePower,
    removePower: removeCombatPower,
    replaceBuildSlots,
    resetArchetypePowers,
    resetFreeformPowers,
    togglePowerAdvantage,
  } = useCombatPowerSlots();
  const {
    clearDeviceSlot: clearAuxiliaryDeviceSlot,
    clearPowerVariantSlot: clearAuxiliaryPowerVariantSlot,
    clearTravelPowerSlot: clearAuxiliaryTravelPowerSlot,
    clearTravelPowerAdvantages,
    clearTravelPowerSlotAdvantages,
    deviceSlots,
    hydrateAuxiliaryPowerSlots,
    placeDevice,
    placePowerVariant,
    placeTravelPower,
    powerVariantSlots,
    replaceTravelPowerSlots,
    resetAllAuxiliaryPowerSlots,
    resetDevices: resetAuxiliaryDevices,
    resetPowerVariants: resetAuxiliaryPowerVariants,
    resetTravelPowers: resetAuxiliaryTravelPowers,
    toggleTravelPowerAdvantage,
    travelPowerSlots,
  } = useAuxiliaryPowerSlots();
  const [camsLevel, setCamsLevel] = useState(0);
  const [camsIconName, setCamsIconName] = useState("CAMS_Generic");
  const [camsMenuOpen, setCamsMenuOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [importBuildDialogOpen, setImportBuildDialogOpen] = useState(false);

  const selectablePowers = useMemo(() => {
    return powers.filter((power) => isPowerEnabled(power));
  }, [powers]);

  const combatPowers = useMemo(() => {
    return selectablePowers.filter((power) => isCombatPower(power));
  }, [selectablePowers]);

  const frameworkGroups = useMemo(() => {
    return getVisiblePowerFrameworkGroups(combatPowers);
  }, [combatPowers]);

  const powersById = useMemo(() => {
    return new Map(powers.map((power) => [power.power_id, power]));
  }, [powers]);
  const serializedBuild = useMemo(
    () =>
      serializeBuild({
        buildName,
        selectedArchetypeId,
        selectedRoleId,
        selectedSuperStatIds,
        selectedInnateTalentId,
        selectedTalentIds,
        buildSlots,
        travelPowerSlots,
        powerVariantSlots,
        deviceSlots,
        selectedSpecializationTreeIds,
        specializationPointsBySlot,
        selectedMasterySlot,
        camsLevel,
        camsIconName,
      }),
    [
      buildName,
      buildSlots,
      camsIconName,
      camsLevel,
      selectedArchetypeId,
      selectedInnateTalentId,
      selectedMasterySlot,
      selectedRoleId,
      selectedSpecializationTreeIds,
      selectedSuperStatIds,
      selectedTalentIds,
      specializationPointsBySlot,
      travelPowerSlots,
      powerVariantSlots,
      deviceSlots,
    ],
  );
  const shareUrl = useMemo(
    () => createShareUrl(serializedBuild),
    [serializedBuild],
  );

  function closeAllPopupsExceptCams() {
    closePowerDialogs();
    closeArchetypeDialog();
    closeRoleDialog();
    closeStatsTalentDialogs();
    closeSpecializationTreeDialog();
    closeMasteryDialog();
    setBuildCheckDialogOpen(false);
    setDataDialogOpen(false);
    setAboutDialogOpen(false);
    setImportBuildDialogOpen(false);
  }

  function closeCamsMenu() {
    setCamsMenuOpen(false);
  }

  function toggleCamsMenu() {
    if (camsMenuOpen) {
      setCamsMenuOpen(false);
      return;
    }

    closeAllPopupsExceptCams();
    setCamsMenuOpen(true);
  }

  useEffect(() => {
    if (!camsMenuOpen) {
      return;
    }

    function closeCamsMenuOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest(".cams-control")
      ) {
        return;
      }

      closeCamsMenu();
    }

    document.addEventListener("pointerdown", closeCamsMenuOnOutsidePointer);

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeCamsMenuOnOutsidePointer,
      );
    };
  }, [camsMenuOpen]);

  const {
    deleteSavedBuild,
    getSavedBuildData,
    importSavedBuildsFromText,
    overwriteSavedBuild,
    savedBuilds,
    saveCurrentBuild,
  } = useSavedBuilds({
    buildName,
    serializedBuild,
  });
  const {
    archetypeAlternativePowerIdsBySlot,
    archetypeAlternativePowerSlotNumbers,
    lockedPowerSlotNumbers,
  } = useArchetypePowerState({
    buildSlots,
    isFreeform,
    selectedArchetype,
  });
  const {
    clearDeviceTarget,
    clearDeviceTargetIfSelected,
    clearPowerPanelTargets,
    clearPowerTarget,
    clearPowerVariantTarget,
    clearPowerVariantTargetIfSelected,
    clearTravelPowerTarget,
    powerPanelTargetDeviceSlot,
    powerPanelTargetPowerVariantSlot,
    powerPanelTargetTravelPowerSlot,
    powerSearchResetKey,
    resetPowerSearch,
    selectedDeviceTargetBuildSlot,
    selectedFrameworks,
    selectedPowerTargetBuildSlot,
    selectedPowerTargetSlot,
    selectedTravelPowerTargetBuildSlot,
    selectedPowerVariantTargetBuildSlot,
    selectPowerPanelTarget,
    setSelectedFrameworks,
  } = usePowerPanelTargets({
    archetypeAlternativePowerSlotNumbers,
    buildSlots,
    deviceSlots,
    isFreeform,
    powerVariantSlots,
    travelPowerSlots,
  });
  const {
    activeAdvantageBuildSlot,
    activeArchetypePowerOptions,
    activeBuildSlot,
    activeDeviceBuildSlot,
    activePowerVariantBuildSlot,
    activeTravelPowerBuildSlot,
    allPowerSlots,
    invalidPowerSlotNumbers,
    invalidPowerVariantSlotNumbers,
    restrictedPowerIds,
    restrictedPowerSectionLabel,
  } = useBuildPowerState({
    activeAdvantageSlot,
    activeDeviceSlot,
    activePowerSlot,
    activePowerVariantSlot,
    activeTravelPowerSlot,
    archetypeAlternativePowerIdsBySlot,
    buildSlots,
    deviceSlots,
    invalidPowerVariantTargetSlot: selectedPowerVariantTargetBuildSlot,
    isFreeform,
    powersById,
    powerVariantSlots,
    selectedPowerTargetSlot,
    travelPowerSlots,
  });
  const activeRestrictedPowerIds =
    buildCheckPowerFilter?.ids ?? restrictedPowerIds;
  const activeRestrictedPowerSectionLabel =
    buildCheckPowerFilter?.label ?? restrictedPowerSectionLabel;
  const {
    advantagePointBudget,
    clearSlotAdvantages,
    resetAdvantages: resetAdvantageState,
    toggleAdvantage,
    totalAdvantagePoints,
  } = useAdvantageActions({
    advantages,
    allPowerSlots,
    buildSlots,
    camsLevel,
    clearPowerAdvantages,
    clearPowerSlotAdvantages,
    clearTravelPowerAdvantages,
    clearTravelPowerSlotAdvantages,
    togglePowerAdvantage,
    toggleTravelPowerAdvantage,
  });

  function addPower(power: Power, displayFrameworkId?: string | null) {
    if (isStandardDevice(power)) {
      addDevice(power);
      return;
    }

    if (isPowerVariantDevice(power)) {
      addPowerVariant(power);
      return;
    }

    if (isTravelPower(power)) {
      addTravelPower(power);
      return;
    }

    const existingSlot =
      buildSlots.find((slot) => slot.power?.power_id === power.power_id) ??
      null;

    if (existingSlot && selectedPowerTargetBuildSlot === null) {
      return;
    }

    const targetSlot =
      selectedPowerTargetBuildSlot ??
      getFirstValidPowerSlot(power, buildSlots);

    if (!targetSlot) {
      return;
    }

    if (!isFreeform) {
      const allowedPowerIds =
        archetypeAlternativePowerIdsBySlot.get(targetSlot.slot) ?? [];

      if (!allowedPowerIds.includes(power.power_id)) {
        return;
      }

      selectArchetypePowerForSlot(targetSlot.slot, power.power_id);
      setBuildCheckPowerFilter(null);
      clearPowerTarget();
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearPowerTarget();
      return;
    }

    if (!canPlacePowerInSlot(power, targetSlot, buildSlots)) {
      return;
    }

    placePower(power, displayFrameworkId, targetSlot);

    if (power.tier === -1) {
      setEnergyBuilderSelectionVersion((currentVersion) => currentVersion + 1);
    }

    setBuildScrollTargetSlot(targetSlot.slot);
    setBuildCheckPowerFilter(null);
    clearPowerTarget();
  }

  function filterPowersForMissingRequirement(
    requirement: BuildRequirementResult,
  ) {
    setBuildCheckPowerFilter({
      ids: getMatchingRequirementPowerIds(requirement, selectablePowers),
      label: requirement.label,
    });
    clearPowerPanelTargets();
    resetPowerSearch();
    setSelectedFrameworks(null);
    setBuildCheckDialogOpen(false);
  }

  function addTravelPower(power: Power) {
    const existingSlot =
      travelPowerSlots.find((slot) => slot.power?.power_id === power.power_id) ??
      null;

    if (existingSlot && selectedTravelPowerTargetBuildSlot === null) {
      return;
    }

    const targetSlot = powerPanelTargetTravelPowerSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearTravelPowerTarget();
      return;
    }

    placeTravelPower(power, targetSlot);
    setBuildScrollTargetSlot(targetSlot.slot);
    clearTravelPowerTarget();
  }

  function addPowerVariant(power: Power) {
    const existingSlot =
      powerVariantSlots.find(
        (slot) => slot.power?.power_id === power.power_id,
      ) ?? null;

    if (existingSlot && selectedPowerVariantTargetBuildSlot === null) {
      return;
    }

    const targetSlot = powerPanelTargetPowerVariantSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearPowerVariantTarget();
      return;
    }

    placePowerVariant(power, targetSlot);
    setBuildScrollTargetSlot(targetSlot.slot);
    setBuildCheckPowerFilter(null);
    clearPowerVariantTarget();
  }

  function addDevice(power: Power) {
    const existingSlot =
      deviceSlots.find((slot) => slot.power?.power_id === power.power_id) ??
      null;

    if (existingSlot && selectedDeviceTargetBuildSlot === null) {
      return;
    }

    const targetSlot = powerPanelTargetDeviceSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearDeviceTarget();
      return;
    }

    placeDevice(power, targetSlot);
    clearDeviceTarget();
  }

  function selectPowerVariantForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      powerVariantSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placePowerVariant(power, targetSlot);
    setBuildScrollTargetSlot(targetSlot.slot);
    closePowerVariantDialog();
  }

  function selectTravelPowerForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      travelPowerSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placeTravelPower(power, targetSlot);
    setBuildScrollTargetSlot(targetSlot.slot);
    closeTravelPowerDialog();
  }

  function selectDeviceForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      deviceSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placeDevice(power, targetSlot);
    closeDeviceDialog();
  }

  function removePower(slotNumber: number) {
    if (!isFreeform) {
      return;
    }

    const powerSlotsWillBeEmpty = buildSlots.every(
      (slot) => slot.slot === slotNumber || slot.power === null,
    );

    removeCombatPower(slotNumber);

    if (powerSlotsWillBeEmpty) {
      requestOpenEnergyBuilderSection();
    }
  }

  function clearPowerVariantSlot(slotNumber: number) {
    clearAuxiliaryPowerVariantSlot(slotNumber);
    clearPowerVariantTargetIfSelected(slotNumber);
    closePowerVariantDialog();
  }

  function clearTravelPowerSlot(slotNumber: number) {
    clearAuxiliaryTravelPowerSlot(slotNumber);
    clearTravelPowerTarget();
    closeTravelPowerDialog();
  }

  function clearDeviceSlot(slotNumber: number) {
    clearAuxiliaryDeviceSlot(slotNumber);
    clearDeviceTargetIfSelected(slotNumber);
    closeDeviceDialog();
  }

  function openPowerDialog(slotNumber: number, anchor: DialogAnchor) {
    if (
      !isFreeform &&
      !archetypeAlternativePowerSlotNumbers.has(slotNumber)
    ) {
      return;
    }

    closeCamsMenu();
    resetUtilityPowerFilterForCombatSlot();
    updateEnergyBuilderPanelForPowerSlot(slotNumber);
    openPowerDialogState(slotNumber, anchor);
  }

  function getCombatPowerSlotFrameworkTarget() {
    return selectedFrameworks?.some(isUtilityFrameworkFilter) ? null : undefined;
  }

  function resetUtilityPowerFilterForCombatSlot() {
    if (selectedFrameworks?.some(isUtilityFrameworkFilter)) {
      setSelectedFrameworks(null);
    }
  }

  function updateEnergyBuilderPanelForPowerSlot(slotNumber: number) {
    const targetSlot =
      buildSlots.find((slot) => slot.slot === slotNumber) ?? null;
    const targetIsEnergyBuilder = targetSlot?.power?.tier === -1;
    const isDeselectingEnergyBuilderSlot =
      selectedPowerTargetBuildSlot?.slot === slotNumber &&
      targetIsEnergyBuilder;
    const shouldOpenEnergyBuilderSection =
      targetSlot?.slot === 1 || targetIsEnergyBuilder;
    const isLeavingEnergyBuilderSlot =
      selectedPowerTargetBuildSlot?.power?.tier === -1 &&
      selectedPowerTargetBuildSlot.slot !== slotNumber &&
      !targetIsEnergyBuilder;

    if (isDeselectingEnergyBuilderSlot) {
      requestCloseEnergyBuilderSection();
      return;
    }

    if (shouldOpenEnergyBuilderSection) {
      requestOpenEnergyBuilderSection();
      return;
    }

    if (isLeavingEnergyBuilderSlot) {
      requestCloseEnergyBuilderSection();
    }
  }

  const requestCloseEnergyBuilderSection = useCallback(() => {
    setEnergyBuilderPanelRequest((currentRequest) => ({
      action: "close",
      selectionVersion: energyBuilderSelectionVersion,
      version: currentRequest.version + 1,
    }));
  }, [energyBuilderSelectionVersion]);

  const requestOpenEnergyBuilderSection = useCallback(() => {
    setEnergyBuilderPanelRequest((currentRequest) => ({
      action: "open",
      selectionVersion: energyBuilderSelectionVersion,
      version: currentRequest.version + 1,
    }));
  }, [energyBuilderSelectionVersion]);

  const syncEnergyBuilderPanelForBuildSlots = useCallback((nextBuildSlots: BuildSlot[]) => {
    const hasEnergyBuilder = nextBuildSlots.some(
      (slot) => slot.power?.tier === -1,
    );
    const hasAnyPower = nextBuildSlots.some((slot) => slot.power !== null);

    if (hasEnergyBuilder) {
      setEnergyBuilderSelectionVersion((currentVersion) => currentVersion + 1);
      requestCloseEnergyBuilderSection();
      return;
    }

    if (!hasAnyPower) {
      requestOpenEnergyBuilderSection();
    }
  }, [requestCloseEnergyBuilderSection, requestOpenEnergyBuilderSection]);

  function closeEnergyBuilderSectionWhenLeavingPowerTarget() {
    if (selectedPowerTargetBuildSlot?.power?.tier === -1) {
      requestCloseEnergyBuilderSection();
    }
  }

  function selectBuildSlotAsPowerTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    updateEnergyBuilderPanelForPowerSlot(slotNumber);

    if (!isFreeform) {
      if (archetypeAlternativePowerSlotNumbers.has(slotNumber)) {
        selectArchetypePowerSlotAsTarget(slotNumber);
      }

      return;
    }

    selectPowerPanelTarget(
      "power",
      slotNumber,
      getCombatPowerSlotFrameworkTarget(),
      false,
    );
  }

  function selectPowerVariantSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    closeEnergyBuilderSectionWhenLeavingPowerTarget();
    selectPowerPanelTarget(
      "powerVariant",
      slotNumber,
      powerVariantsFilterId,
      true,
    );
  }

  function selectArchetypePowerSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    selectPowerPanelTarget(
      "power",
      slotNumber,
      getCombatPowerSlotFrameworkTarget(),
      false,
    );
  }

  function selectTravelPowerSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    closeEnergyBuilderSectionWhenLeavingPowerTarget();
    selectPowerPanelTarget(
      "travelPower",
      slotNumber,
      travelPowerFilterId,
      false,
    );
  }

  function selectDeviceSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    closeEnergyBuilderSectionWhenLeavingPowerTarget();
    selectPowerPanelTarget("device", slotNumber, devicesFilterId, true);
  }

  function selectPowerForSlot(
    slotNumber: number,
    power: Power,
    displayFrameworkId: string | null,
  ) {
    const targetSlot =
      buildSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot || !canPlacePowerInSlot(power, targetSlot, buildSlots)) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      closePowerDialog();
      return;
    }

    setLastPowerDialogFrameworkId(displayFrameworkId);
    placePower(power, displayFrameworkId, targetSlot);

    if (power.tier === -1) {
      setEnergyBuilderSelectionVersion((currentVersion) => currentVersion + 1);
    }

    setBuildScrollTargetSlot(targetSlot.slot);
    closePowerDialog();
  }

  function selectArchetypePowerForSlot(slotNumber: number, powerId: number) {
    const allowedPowerIds =
      archetypeAlternativePowerIdsBySlot.get(slotNumber) ?? [];

    if (!allowedPowerIds.includes(powerId)) {
      return;
    }

    const power = powersById.get(powerId);

    if (!power) {
      return;
    }

    placeArchetypePower(slotNumber, power);
    closePowerDialog();
  }

  function clearPowerSlot(slotNumber: number) {
    removePower(slotNumber);
    closePowerDialog();
    closeAdvantageDialog();
  }

  function resetPowers() {
    if (!isFreeform && selectedArchetype) {
      resetArchetypePowers(selectedArchetype, powersById);
    } else {
      resetFreeformPowers();
      requestOpenEnergyBuilderSection();
    }

    clearPowerTarget();
    closePowerDialog();
    closeAdvantageDialog();
  }

  function resetTravelPowers() {
    resetAuxiliaryTravelPowers();
    clearTravelPowerTarget();
    closeAdvantageDialog();
  }

  function resetPowerVariants() {
    resetAuxiliaryPowerVariants();
    clearPowerVariantTarget();
  }

  function resetDevices() {
    resetAuxiliaryDevices();
    clearDeviceTarget();
    closeDeviceDialog();
  }

  function resetSuperStats() {
    if (!isFreeform && selectedArchetype) {
      resetSuperStatState(selectedArchetype.superStatList);
    } else {
      resetSuperStatState([0, 0, 0]);
    }
  }

  function resetTalents() {
    resetTalentState(
      !isFreeform && selectedArchetype
        ? selectedArchetype.innateTalent ?? 0
        : 0,
    );
  }

  function resetSpecializations(primaryTreeId = selectedSuperStatIds[0] ?? 0) {
    resetSpecializationState(
      !isFreeform && selectedArchetype
        ? selectedArchetype.specializationTreeList
        : [primaryTreeId, 0, 0],
    );
  }

  function resetAdvantages() {
    resetAdvantageState();
    closeAdvantageDialog();
  }

  function resetAll() {
    setBuildName("My Awesome Build");
    resetFreeformPowers();
    requestOpenEnergyBuilderSection();
    resetAllAuxiliaryPowerSlots();
    setCamsLevel(0);
    setCamsIconName("CAMS_Generic");
    resetArchetypeRole();
    setSelectedFrameworks(null);
    clearPowerPanelTargets();
    resetAllStatsTalents();
    resetAllSpecializations();
    closePowerDialog();
    closePowerVariantDialog();
    closeDeviceDialog();
    closeAdvantageDialog();
    closeArchetypeDialog();
    closeRoleDialog();
    resetPowerVariants();
    resetDevices();
  }

  const applyHydratedBuild = useCallback((serializedData: string) => {
    const payload = parseSerializedBuild(serializedData);

    if (!payload) {
      return false;
    }

    const hydratedBuild = hydrateSerializedBuild(payload, powersById);

    setBuildName(hydratedBuild.buildName);
    hydrateArchetypeRole(
      hydratedBuild.selectedArchetypeId,
      hydratedBuild.selectedRoleId,
    );
    hydrateStatsTalents({
      selectedSuperStatIds: hydratedBuild.selectedSuperStatIds,
      selectedInnateTalentId: hydratedBuild.selectedInnateTalentId,
      selectedTalentIds: hydratedBuild.selectedTalentIds,
    });
    replaceBuildSlots(hydratedBuild.buildSlots);
    syncEnergyBuilderPanelForBuildSlots(hydratedBuild.buildSlots);
    hydrateAuxiliaryPowerSlots({
      travelPowerSlots: hydratedBuild.travelPowerSlots,
      powerVariantSlots: hydratedBuild.powerVariantSlots,
      deviceSlots: hydratedBuild.deviceSlots,
    });
    hydrateSpecializations({
      selectedSpecializationTreeIds:
        hydratedBuild.selectedSpecializationTreeIds,
      specializationPointsBySlot: hydratedBuild.specializationPointsBySlot,
      selectedMasterySlot: hydratedBuild.selectedMasterySlot,
    });
    setCamsLevel(hydratedBuild.camsLevel);
    setCamsIconName(hydratedBuild.camsIconName);
    setSelectedFrameworks(null);
    clearPowerPanelTargets();
    closePowerDialogs();
    closeArchetypeDialog();
    closeRoleDialog();

    return true;
  }, [
    clearPowerPanelTargets,
    closeArchetypeDialog,
    closePowerDialogs,
    closeRoleDialog,
    hydrateArchetypeRole,
    hydrateAuxiliaryPowerSlots,
    hydrateSpecializations,
    hydrateStatsTalents,
    powersById,
    replaceBuildSlots,
    setSelectedFrameworks,
    syncEnergyBuilderPanelForBuildSlots,
  ]);

  function loadSavedBuild(buildId: string) {
    const savedBuildData = getSavedBuildData(buildId);

    if (!savedBuildData || !applyHydratedBuild(savedBuildData)) {
      return;
    }

    setDataDialogOpen(false);
  }

  function randomizeFreeformBuild() {
    if (!isFreeform || !statsTalentsData) {
      return;
    }

    const randomizedBuild = createRandomFreeformBuild({
      combatPowers,
      powers: selectablePowers,
      statsTalentsData,
    });
    const randomizedSuperStats = randomizedBuild.superStats;
    const randomizedSuperStatIds = randomizedSuperStats.map((stat) => stat.id);

    updatePrimarySpecializationTree(randomizedSuperStatIds[0] ?? 0);
    hydrateStatsTalents({
      selectedSuperStatIds: [
        randomizedSuperStatIds[0] ?? 0,
        randomizedSuperStatIds[1] ?? 0,
        randomizedSuperStatIds[2] ?? 0,
      ],
      selectedInnateTalentId: randomizedBuild.innateTalent?.id ?? 0,
      selectedTalentIds: Array.from(
        { length: 6 },
        (_, index) => randomizedBuild.talents[index]?.id ?? 0,
      ),
    });
    replaceBuildSlots(randomizedBuild.buildSlots);
    syncEnergyBuilderPanelForBuildSlots(randomizedBuild.buildSlots);
    replaceTravelPowerSlots(randomizedBuild.travelPowerSlots);
    clearPowerTarget();
    clearTravelPowerTarget();
    closePowerDialog();
    closeAdvantageDialog();
  }

  function changeCamsLevel(delta: 1 | -1) {
    setCamsLevel((currentCamsLevel) =>
      Math.max(0, Math.min(maxCamsLevel, currentCamsLevel + delta)),
    );
  }

  async function importHeroCreatorBuild(importInput: string) {
    const { importLegacyHeroCreatorBuild } = await import(
      "@/features/import-build/legacyHeroCreatorImport"
    );
    const importResult = await importLegacyHeroCreatorBuild(importInput, {
      advantages,
      archetypesData,
      powers,
      specializationTreesData,
      statsTalentsData,
    });
    const importedBuildData = serializeBuild(importResult.build);

    if (!applyHydratedBuild(importedBuildData)) {
      throw new Error("Unsupported or invalid build data.");
    }

    return importResult.warnings;
  }

  function selectArchetype(archetypeId: number) {
    const archetype =
      archetypesData?.archetypes.find(
        (candidateArchetype) => candidateArchetype.id === archetypeId,
      ) ?? null;

    if (!archetype) {
      return;
    }

    if (archetype.id === selectedArchetypeId) {
      closeArchetypeDialog();
      return;
    }

    if (archetype.id !== 1 && powersById.size === 0) {
      return;
    }

    applySelectedArchetype(archetype);
    clearPowerTarget();
    closePowerDialog();

    if (archetype.id === 1) {
      applyFreeformBuildSlots();
      closeArchetypeDialog();
      return;
    }

    applyArchetypeStatsTalents(
      archetype.superStatList,
      archetype.innateTalent ?? 0,
    );
    applyArchetypeBuildSlots(archetype, powersById);
    applyArchetypeSpecializations(archetype.specializationTreeList);
    closeArchetypeDialog();
    closeRoleDialog();
    closeStatsTalentDialogs();
    closeSpecializationTreeDialog();
    closeMasteryDialog();
  }

  function openCurrentSuperStatDialog(
    slotIndex: number,
    anchor: DialogAnchor,
  ) {
    closeCamsMenu();
    openSuperStatDialog(slotIndex, anchor, isFreeform);
  }

  function openCurrentInnateTalentDialog(anchor: DialogAnchor) {
    closeCamsMenu();
    openInnateTalentDialog(anchor, isFreeform);
  }

  function openCurrentTalentDialog(slotIndex: number, anchor: DialogAnchor) {
    closeCamsMenu();
    openTalentDialog(slotIndex, anchor);
  }

  function openCurrentArchetypeDialog(anchor: DialogAnchor) {
    closeCamsMenu();
    openArchetypeDialog(anchor);
  }

  function openCurrentRoleDialog(anchor: DialogAnchor) {
    closeCamsMenu();
    openRoleDialog(anchor);
  }

  function openCurrentDeviceDialog(slotNumber: number, anchor: DialogAnchor) {
    closeCamsMenu();
    openDeviceDialog(slotNumber, anchor);
  }

  function openCurrentTravelPowerDialog(
    slotNumber: number,
    anchor: DialogAnchor,
  ) {
    closeCamsMenu();
    openTravelPowerDialog(slotNumber, anchor);
  }

  function openCurrentPowerVariantDialog(
    slotNumber: number,
    anchor: DialogAnchor,
  ) {
    closeCamsMenu();
    openPowerVariantDialog(slotNumber, anchor);
  }

  function openCurrentAdvantageDialog(
    slotNumber: number,
    anchor: DialogAnchor,
  ) {
    closeCamsMenu();
    openAdvantageDialog(slotNumber, anchor);
  }

  function openCurrentSpecializationTreeDialog(
    slotIndex: 0 | 1 | 2,
    anchor: DialogAnchor,
  ) {
    closeCamsMenu();
    openSpecializationTreeDialog(slotIndex, anchor);
  }

  function openCurrentMasteryDialog(anchor: DialogAnchor) {
    closeCamsMenu();
    openMasteryDialog(anchor);
  }

  function selectCurrentSuperStat(slotIndex: number, statId: number) {
    selectSuperStat(slotIndex, statId, isFreeform);
  }

  function selectCurrentInnateTalent(talentId: number) {
    selectInnateTalent(talentId, isFreeform);
  }

  function clearCurrentSpecializationSlot(slotIndex: 0 | 1 | 2) {
    clearSpecializationSlot(slotIndex, isFreeform);
  }

  function selectCurrentSpecializationTree(slotIndex: number, treeId: number) {
    selectSpecializationTree(slotIndex, treeId, isFreeform);
  }

  useShareUrlSync({
    applyHydratedBuild,
    dataReady,
    shareUrl,
  });

  return (
    <div className="app-shell">
      <AppHeader
        buildName={buildName}
        shareUrl={shareUrl}
        resetSuperStatsDisabled={!isFreeform}
        onBuildNameChange={setBuildName}
        onOpenAbout={() => {
          closeCamsMenu();
          setAboutDialogOpen(true);
        }}
        onOpenBuildCheck={() => {
          closeCamsMenu();
          setBuildCheckDialogOpen(true);
        }}
        onOpenData={() => {
          closeCamsMenu();
          setDataDialogOpen(true);
        }}
        onImportBuild={() => {
          closeCamsMenu();
          setImportBuildDialogOpen(true);
        }}
        onSave={saveCurrentBuild}
        onResetAll={resetAll}
        onResetSuperStats={resetSuperStats}
        onResetTalents={resetTalents}
        onResetPowers={resetPowers}
        onResetTravelPowers={resetTravelPowers}
        onResetPowerVariants={resetPowerVariants}
        onResetDevices={resetDevices}
        onResetAdvantages={resetAdvantages}
        onResetSpecializations={resetSpecializations}
        onRandomize={randomizeFreeformBuild}
      />

      {dataDialogOpen ? (
        <DataDialog
          currentBuildName={buildName}
          savedBuilds={savedBuilds}
          onClose={() => setDataDialogOpen(false)}
          onDeleteBuild={deleteSavedBuild}
          onImportBuildsFromText={importSavedBuildsFromText}
          onLoadBuild={loadSavedBuild}
          onOverwriteBuild={overwriteSavedBuild}
          onSaveCurrentBuild={saveCurrentBuild}
        />
      ) : null}

      {aboutDialogOpen ? (
        <AboutDialog onClose={() => setAboutDialogOpen(false)} />
      ) : null}

      {importBuildDialogOpen ? (
        <ImportBuildDialog
          onClose={() => setImportBuildDialogOpen(false)}
          onImportBuild={importHeroCreatorBuild}
        />
      ) : null}

      {buildCheckDialogOpen ? (
        <BuildCheckDialog
          buildSlots={buildSlots}
          powers={selectablePowers}
          powerVariantSlots={powerVariantSlots}
          selectedSuperStats={selectedSuperStats}
          onClose={() => setBuildCheckDialogOpen(false)}
          onSelectMissingRequirement={filterPowersForMissingRequirement}
        />
      ) : null}

      <main className="workspace-grid">
        <CharacterPanel
          innateTalent={selectedInnateTalent}
          innateTalentLocked={!isFreeform}
          superStats={selectedSuperStats}
          superStatsLocked={!isFreeform}
          talents={selectedTalents}
          deviceSlots={deviceSlots}
          highlightedDeviceTargetSlot={
            isUtilityFrameworkSelection(selectedFrameworks, devicesFilterId)
              ? selectedDeviceTargetBuildSlot?.slot ?? null
              : null
          }
          onSelectInnateTalent={openCurrentInnateTalentDialog}
          onSelectSuperStatSlot={openCurrentSuperStatDialog}
          onSelectTalentSlot={openCurrentTalentDialog}
          onSelectDeviceSlot={selectDeviceSlotAsTarget}
          onSelectDeviceName={openCurrentDeviceDialog}
        />

        <PowersPanel
          key={`powers-${powerSearchResetKey}`}
          advantages={advantages}
          buildSlots={allPowerSlots}
          energyBuilderPanelRequestAction={energyBuilderPanelRequest.action}
          energyBuilderPanelRequestSelectionVersion={
            energyBuilderPanelRequest.selectionVersion
          }
          energyBuilderPanelRequestVersion={energyBuilderPanelRequest.version}
          energyBuilderSelectionVersion={energyBuilderSelectionVersion}
          canAddPower={(power) =>
            isStandardDevice(power)
              ? powerPanelTargetDeviceSlot !== null &&
                (selectedDeviceTargetBuildSlot !== null ||
                  !deviceSlots.some(
                    (slot) => slot.power?.power_id === power.power_id,
                  ))
              : isPowerVariantDevice(power)
              ? powerPanelTargetPowerVariantSlot !== null &&
                (selectedPowerVariantTargetBuildSlot !== null ||
                  !powerVariantSlots.some(
                    (slot) => slot.power?.power_id === power.power_id,
                  ))
              : isTravelPower(power)
              ? powerPanelTargetTravelPowerSlot !== null &&
                (selectedTravelPowerTargetBuildSlot !== null ||
                  !travelPowerSlots.some(
                    (slot) => slot.power?.power_id === power.power_id,
                  ))
              : selectedPowerTargetBuildSlot
                ? isFreeform
                  ? canPlacePowerInSlot(
                      power,
                      selectedPowerTargetBuildSlot,
                      buildSlots,
                    )
                  : restrictedPowerIds?.has(power.power_id) ?? false
                : isFreeform
                  ? getFirstValidPowerSlot(power, buildSlots) !== null
                  : false
          }          frameworkGroups={frameworkGroups}
          powers={selectablePowers}
          restrictedPowerIds={activeRestrictedPowerIds}
          restrictedPowerSectionLabel={activeRestrictedPowerSectionLabel}
          selectedFrameworks={selectedFrameworks}
          onAddPower={addPower}
          onSelectFramework={(frameworkId, additive) => {
            setBuildCheckPowerFilter(null);
            setSelectedFrameworks((currentFrameworks) => {
              if (frameworkId === null) {
                return null;
              }

              if (isUtilityFrameworkFilter(frameworkId)) {
                return [frameworkId];
              }

              if (!additive) {
                return [frameworkId];
              }

              const currentStandardFrameworks =
                currentFrameworks?.filter(
                  (currentFrameworkId) =>
                    !isUtilityFrameworkFilter(currentFrameworkId),
                ) ?? [];

              if (currentStandardFrameworks.includes(frameworkId)) {
                const nextFrameworks = currentStandardFrameworks.filter(
                  (currentFrameworkId) =>
                    currentFrameworkId !== frameworkId,
                );

                return nextFrameworks.length > 0 ? nextFrameworks : null;
              }

              return [...currentStandardFrameworks, frameworkId];
            });
          }}
        />

        <BuildPanel
          advantagePointBudget={advantagePointBudget}
          advantages={advantages}
          archetype={selectedArchetype}
          role={selectedRole}
          roleLocked={!isFreeform}
          buildSlots={buildSlots}
          travelPowerSlots={travelPowerSlots}
          powerVariantSlots={powerVariantSlots}
          camsLevel={camsLevel}
          camsIconName={camsIconName}
          camsMenuOpen={camsMenuOpen}
          totalAdvantagePoints={totalAdvantagePoints}
          onChangeCamsLevel={changeCamsLevel}
          onSelectCamsIcon={setCamsIconName}
          onToggleCamsMenu={toggleCamsMenu}
          onSelectArchetype={openCurrentArchetypeDialog}
          onSelectRole={openCurrentRoleDialog}
          onSelectBuildSlot={selectBuildSlotAsPowerTarget}
          onSelectTravelPowerSlot={selectTravelPowerSlotAsTarget}
          onSelectTravelPowerName={openCurrentTravelPowerDialog}
          onSelectPowerVariantSlot={selectPowerVariantSlotAsTarget}
          onSelectPowerVariantName={openCurrentPowerVariantDialog}
          onSelectAdvantageSlot={openCurrentAdvantageDialog}
          onSelectPowerSlot={openPowerDialog}
          highlightedPowerTargetSlot={
            selectedPowerTargetBuildSlot?.slot ?? null
          }
          highlightedTravelPowerTargetSlot={
            isUtilityFrameworkSelection(selectedFrameworks, travelPowerFilterId)
              ? powerPanelTargetTravelPowerSlot?.slot ?? null
              : null
          }
          highlightedPowerVariantTargetSlot={
            isUtilityFrameworkSelection(selectedFrameworks, powerVariantsFilterId)
              ? selectedPowerVariantTargetBuildSlot?.slot ?? null
              : null
          }
          scrollTargetSlot={buildScrollTargetSlot}
          invalidPowerSlotNumbers={invalidPowerSlotNumbers}
          invalidPowerVariantSlotNumbers={invalidPowerVariantSlotNumbers}
          lockedPowerSlotNumbers={lockedPowerSlotNumbers}
        />

        <SpecializationsPanel
          masterySlot={selectedMasterySlot}
          pointsBySlot={specializationPointsBySlot}
          trees={selectedSpecializationTrees}
          onOpenSpecialization={openCurrentSpecializationTreeDialog}
          onSelectMastery={openCurrentMasteryDialog}
        />
      </main>

      {activeSuperStatSlot !== null && statsTalentsData && superStatDialogAnchor ? (
        <StatSelectionDialog
          anchor={superStatDialogAnchor}
          selectedStatIds={selectedSuperStatIds}
          slotIndex={activeSuperStatSlot}
          stats={statsTalentsData.superStats}
          onClose={closeSuperStatDialog}
          onSelectStat={selectCurrentSuperStat}
        />
      ) : null}

      {statsTalentsData && innateTalentDialogAnchor ? (
        <InnateTalentSelectionDialog
          anchor={innateTalentDialogAnchor}
          selectedTalentId={selectedInnateTalentId}
          selectedSuperStats={selectedSuperStats}
          talents={statsTalentsData.innateTalents}
          onClose={closeInnateTalentDialog}
          onSelectTalent={selectCurrentInnateTalent}
        />
      ) : null}

      {activeTalentSlot !== null && statsTalentsData && talentDialogAnchor ? (
        <TalentSelectionDialog
          anchor={talentDialogAnchor}
          selectedSuperStats={selectedSuperStats}
          selectedTalentIds={selectedTalentIds}
          slotIndex={activeTalentSlot}
          talents={statsTalentsData.talents}
          onClose={closeTalentDialog}
          onAutofillTalents={autofillTalents}
          onSelectTalent={selectTalent}
        />
      ) : null}

      {isFreeform && activeBuildSlot && powerDialogAnchor ? (
        <PowerSelectionDialog
          anchor={powerDialogAnchor}
          buildSlots={buildSlots}
          buildSlot={activeBuildSlot}
          initialFrameworkId={lastPowerDialogFrameworkId}
          powers={combatPowers}
          canSelectPower={(power) =>
            canPlacePowerInSlot(power, activeBuildSlot, buildSlots)
          }
          onClearPower={clearPowerSlot}
          onClose={closePowerDialog}
          onSelectFramework={setLastPowerDialogFrameworkId}
          onSelectPower={selectPowerForSlot}
        />
      ) : null}

      {activePowerVariantBuildSlot && powerVariantDialogAnchor ? (
        <PowerVariantSelectionDialog
          anchor={powerVariantDialogAnchor}
          buildSlot={activePowerVariantBuildSlot}
          powerVariantSlots={powerVariantSlots}
          powers={selectablePowers}
          onClearPowerVariant={clearPowerVariantSlot}
          onClose={closePowerVariantDialog}
          onSelectPowerVariant={selectPowerVariantForSlot}
        />
      ) : null}

      {activeTravelPowerBuildSlot && travelPowerDialogAnchor ? (
        <TravelPowerSelectionDialog
          anchor={travelPowerDialogAnchor}
          buildSlot={activeTravelPowerBuildSlot}
          powers={selectablePowers}
          onClearTravelPower={clearTravelPowerSlot}
          onClose={closeTravelPowerDialog}
          onSelectTravelPower={selectTravelPowerForSlot}
        />
      ) : null}

      {activeDeviceBuildSlot && deviceDialogAnchor ? (
        <DeviceSelectionDialog
          anchor={deviceDialogAnchor}
          buildSlot={activeDeviceBuildSlot}
          powers={selectablePowers}
          onClearDevice={clearDeviceSlot}
          onClose={closeDeviceDialog}
          onSelectDevice={selectDeviceForSlot}
        />
      ) : null}

      {!isFreeform &&
      activeBuildSlot &&
      powerDialogAnchor &&
      activeArchetypePowerOptions.length > 0 ? (
        <ArchetypePowerSelectionDialog
          anchor={powerDialogAnchor}
          currentPowerId={activeBuildSlot.power?.power_id ?? null}
          powers={activeArchetypePowerOptions}
          slotNumber={activeBuildSlot.slot}
          onClose={closePowerDialog}
          onSelectPower={selectArchetypePowerForSlot}
        />
      ) : null}

      {activeAdvantageBuildSlot?.power && advantageDialogAnchor ? (
        <AdvantageSelectionDialog
          anchor={advantageDialogAnchor}
          advantagePointBudget={advantagePointBudget}
          advantages={advantages}
          buildSlot={activeAdvantageBuildSlot}
          totalAdvantagePoints={totalAdvantagePoints}
          onClearAdvantages={clearSlotAdvantages}
          onClose={closeAdvantageDialog}
          onToggleAdvantage={toggleAdvantage}
        />
      ) : null}

      {activeSpecializationTreeSlot !== null &&
      specializationTreesData &&
      specializationTreeDialogAnchor ? (
        <SpecializationSelectionDialog
          anchor={specializationTreeDialogAnchor}
          points={specializationPointsBySlot[activeSpecializationTreeSlot] ?? []}
          selectedRoleTreeIds={selectedSpecializationTreeIds.slice(1)}
          slotIndex={activeSpecializationTreeSlot}
          tree={selectedSpecializationTrees[activeSpecializationTreeSlot]}
          trees={specializationTrees}
          canChangeTree={isFreeform}
          onChangeSpecializationPoints={changeSpecializationPoints}
          onClearSlot={clearCurrentSpecializationSlot}
          onClose={closeSpecializationTreeDialog}
          onSelectTree={selectCurrentSpecializationTree}
        />
      ) : null}

      {masteryDialogAnchor ? (
        <SpecializationMasteryDialog
          anchor={masteryDialogAnchor}
          selectedMasterySlot={selectedMasterySlot}
          trees={selectedSpecializationTrees}
          onClose={closeMasteryDialog}
          onSelectMastery={selectMastery}
        />
      ) : null}

      {archetypesData && archetypeDialogAnchor ? (
        <ArchetypeSelectionDialog
          anchor={archetypeDialogAnchor}
          archetypes={archetypesData.archetypes}
          groups={archetypesData.archetypeGroups}
          selectedArchetypeId={selectedArchetypeId}
          unlocks={archetypesData.archetypeUnlocks}
          onClose={closeArchetypeDialog}
          onSelectArchetype={selectArchetype}
        />
      ) : null}

      {archetypesData && roleDialogAnchor ? (
        <RoleSelectionDialog
          anchor={roleDialogAnchor}
          groups={archetypesData.archetypeGroups}
          selectedRoleId={selectedRoleId}
          onClose={closeRoleDialog}
          onSelectRole={selectRole}
        />
      ) : null}

      <InstantTooltip />
    </div>
  );
}

export default App;
