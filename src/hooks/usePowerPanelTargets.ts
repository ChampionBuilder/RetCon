import { useState } from "react";
import type { BuildSlot } from "../types/builds";
import type { SelectedFrameworks } from "../utils/powerFrameworks";

type PowerPanelTargetKind = "power" | "travelPower" | "powerVariant" | "device";

type UsePowerPanelTargetsOptions = {
  archetypeAlternativePowerSlotNumbers: Set<number>;
  buildSlots: BuildSlot[];
  deviceSlots: BuildSlot[];
  isFreeform: boolean;
  powerVariantSlots: BuildSlot[];
  travelPowerSlots: BuildSlot[];
};

export function usePowerPanelTargets({
  archetypeAlternativePowerSlotNumbers,
  buildSlots,
  deviceSlots,
  isFreeform,
  powerVariantSlots,
  travelPowerSlots,
}: UsePowerPanelTargetsOptions) {
  const [selectedFrameworks, setSelectedFrameworks] =
    useState<SelectedFrameworks>(null);
  const [selectedPowerTargetSlot, setSelectedPowerTargetSlot] =
    useState<number | null>(null);
  const [powerSearchResetKey, setPowerSearchResetKey] = useState(0);
  const [selectedTravelPowerTargetSlot, setSelectedTravelPowerTargetSlot] =
    useState<number | null>(null);
  const [selectedPowerVariantTargetSlot, setSelectedPowerVariantTargetSlot] =
    useState<number | null>(null);
  const [selectedDeviceTargetSlot, setSelectedDeviceTargetSlot] =
    useState<number | null>(null);

  const nextEmptyBuildSlot =
    buildSlots.find((slot) => slot.power === null) ?? null;
  const nextEmptyTravelPowerSlot =
    travelPowerSlots.find((slot) => slot.power === null) ?? null;
  const nextEmptyPowerVariantSlot =
    powerVariantSlots.find((slot) => slot.power === null) ?? null;
  const nextEmptyDeviceSlot =
    deviceSlots.find((slot) => slot.power === null) ?? null;

  const selectedPowerTargetBuildSlot =
    selectedPowerTargetSlot === null
      ? null
      : buildSlots.find((slot) => slot.slot === selectedPowerTargetSlot) ?? null;
  const powerPanelTargetBuildSlot =
    isFreeform
      ? selectedPowerTargetBuildSlot ?? nextEmptyBuildSlot
      : selectedPowerTargetBuildSlot &&
          archetypeAlternativePowerSlotNumbers.has(selectedPowerTargetBuildSlot.slot)
        ? selectedPowerTargetBuildSlot
        : null;
  const selectedTravelPowerTargetBuildSlot =
    selectedTravelPowerTargetSlot === null
      ? null
      : travelPowerSlots.find(
          (slot) => slot.slot === selectedTravelPowerTargetSlot,
        ) ?? null;
  const powerPanelTargetTravelPowerSlot =
    selectedTravelPowerTargetBuildSlot ?? nextEmptyTravelPowerSlot;
  const selectedPowerVariantTargetBuildSlot =
    selectedPowerVariantTargetSlot === null
      ? null
      : powerVariantSlots.find(
          (slot) => slot.slot === selectedPowerVariantTargetSlot,
        ) ?? null;
  const powerPanelTargetPowerVariantSlot =
    selectedPowerVariantTargetBuildSlot ?? nextEmptyPowerVariantSlot;
  const selectedDeviceTargetBuildSlot =
    selectedDeviceTargetSlot === null
      ? null
      : deviceSlots.find((slot) => slot.slot === selectedDeviceTargetSlot) ??
        null;
  const powerPanelTargetDeviceSlot =
    selectedDeviceTargetBuildSlot ?? nextEmptyDeviceSlot;

  function clearPowerPanelTargets() {
    setSelectedPowerTargetSlot(null);
    setSelectedTravelPowerTargetSlot(null);
    setSelectedPowerVariantTargetSlot(null);
    setSelectedDeviceTargetSlot(null);
  }

  function resetPowerSearch() {
    setPowerSearchResetKey((currentResetKey) => currentResetKey + 1);
  }

  function clearPowerTarget() {
    setSelectedPowerTargetSlot(null);
  }

  function clearTravelPowerTarget() {
    setSelectedTravelPowerTargetSlot(null);
  }

  function clearPowerVariantTarget() {
    setSelectedPowerVariantTargetSlot(null);
  }

  function clearDeviceTarget() {
    setSelectedDeviceTargetSlot(null);
  }

  function clearPowerVariantTargetIfSelected(slotNumber: number) {
    setSelectedPowerVariantTargetSlot((currentSlotNumber) =>
      currentSlotNumber === slotNumber ? null : currentSlotNumber,
    );
  }

  function clearDeviceTargetIfSelected(slotNumber: number) {
    setSelectedDeviceTargetSlot((currentSlotNumber) =>
      currentSlotNumber === slotNumber ? null : currentSlotNumber,
    );
  }

  function selectPowerPanelTarget(
    kind: PowerPanelTargetKind,
    slotNumber: number,
    frameworkId: string | null,
    resetSearch: boolean,
  ) {
    setSelectedFrameworks(frameworkId === null ? null : [frameworkId]);

    if (resetSearch) {
      setPowerSearchResetKey((currentResetKey) => currentResetKey + 1);
    }

    setSelectedPowerTargetSlot((currentSlotNumber) =>
      kind === "power"
        ? currentSlotNumber === slotNumber
          ? null
          : slotNumber
        : null,
    );
    setSelectedTravelPowerTargetSlot((currentSlotNumber) =>
      kind === "travelPower"
        ? currentSlotNumber === slotNumber
          ? null
          : slotNumber
        : null,
    );
    setSelectedPowerVariantTargetSlot((currentSlotNumber) =>
      kind === "powerVariant"
        ? currentSlotNumber === slotNumber
          ? null
          : slotNumber
        : null,
    );
    setSelectedDeviceTargetSlot((currentSlotNumber) =>
      kind === "device"
        ? currentSlotNumber === slotNumber
          ? null
          : slotNumber
        : null,
    );
  }

  return {
    clearDeviceTarget,
    clearDeviceTargetIfSelected,
    clearPowerPanelTargets,
    clearPowerTarget,
    clearPowerVariantTarget,
    clearPowerVariantTargetIfSelected,
    clearTravelPowerTarget,
    powerPanelTargetBuildSlot,
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
  };
}
