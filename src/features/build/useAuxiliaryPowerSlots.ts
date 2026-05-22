import { useState } from "react";
import {
  initialDeviceSlots,
  initialPowerVariantSlots,
  initialTravelPowerSlots,
} from "@/constants/buildSlots";
import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import {
  clearAdvantagesForSlot,
  toggleAdvantageForSlots,
} from "@/utils/advantageSlots";
import { clearBuildSlot } from "@/utils/buildSlots";
import {
  getDevicePlacementPreview,
  getPowerVariantPlacementPreview,
  getTravelPowerPlacementPreview,
} from "@/utils/powerSlots";

type HydratedAuxiliaryPowerSlots = {
  travelPowerSlots: BuildSlot[];
  powerVariantSlots: BuildSlot[];
  deviceSlots: BuildSlot[];
};

export function useAuxiliaryPowerSlots() {
  const [travelPowerSlots, setTravelPowerSlots] =
    useState<BuildSlot[]>(initialTravelPowerSlots);
  const [powerVariantSlots, setPowerVariantSlots] =
    useState<BuildSlot[]>(initialPowerVariantSlots);
  const [deviceSlots, setDeviceSlots] =
    useState<BuildSlot[]>(initialDeviceSlots);

  function placeTravelPower(power: Power, targetSlot: BuildSlot) {
    setTravelPowerSlots(
      getTravelPowerPlacementPreview(power, targetSlot, travelPowerSlots),
    );
  }

  function placePowerVariant(power: Power, targetSlot: BuildSlot) {
    setPowerVariantSlots(
      getPowerVariantPlacementPreview(power, targetSlot, powerVariantSlots),
    );
  }

  function placeDevice(power: Power, targetSlot: BuildSlot) {
    setDeviceSlots(getDevicePlacementPreview(power, targetSlot, deviceSlots));
  }

  function clearPowerVariantSlot(slotNumber: number) {
    setPowerVariantSlots((currentPowerVariantSlots) =>
      currentPowerVariantSlots.map((slot) =>
        slot.slot === slotNumber ? clearBuildSlot(slot) : slot,
      ),
    );
  }

  function clearTravelPowerSlot(slotNumber: number) {
    setTravelPowerSlots((currentTravelPowerSlots) =>
      currentTravelPowerSlots.map((slot) =>
        slot.slot === slotNumber ? clearBuildSlot(slot) : slot,
      ),
    );
  }

  function clearDeviceSlot(slotNumber: number) {
    setDeviceSlots((currentDeviceSlots) =>
      currentDeviceSlots.map((slot) =>
        slot.slot === slotNumber ? clearBuildSlot(slot) : slot,
      ),
    );
  }

  function resetTravelPowers() {
    setTravelPowerSlots(initialTravelPowerSlots);
  }

  function resetPowerVariants() {
    setPowerVariantSlots(initialPowerVariantSlots);
  }

  function resetDevices() {
    setDeviceSlots(initialDeviceSlots);
  }

  function resetAllAuxiliaryPowerSlots() {
    resetTravelPowers();
    resetPowerVariants();
    resetDevices();
  }

  function hydrateAuxiliaryPowerSlots({
    travelPowerSlots: nextTravelPowerSlots,
    powerVariantSlots: nextPowerVariantSlots,
    deviceSlots: nextDeviceSlots,
  }: HydratedAuxiliaryPowerSlots) {
    setTravelPowerSlots(nextTravelPowerSlots);
    setPowerVariantSlots(nextPowerVariantSlots);
    setDeviceSlots(nextDeviceSlots);
  }

  function replaceTravelPowerSlots(nextTravelPowerSlots: BuildSlot[]) {
    setTravelPowerSlots(nextTravelPowerSlots);
  }

  function clearTravelPowerAdvantages() {
    setTravelPowerSlots((currentTravelPowerSlots) =>
      currentTravelPowerSlots.map((slot) => ({
        ...slot,
        selectedAdvantages: [],
      })),
    );
  }

  function toggleTravelPowerAdvantage(
    slotNumber: number,
    advantageId: number,
    advantages: Advantage[],
    totalAdvantagePoints: number,
    advantagePointBudget: number,
  ) {
    setTravelPowerSlots((currentTravelPowerSlots) =>
      toggleAdvantageForSlots(
        currentTravelPowerSlots,
        slotNumber,
        advantageId,
        advantages,
        totalAdvantagePoints,
        advantagePointBudget,
      ),
    );
  }

  function clearTravelPowerSlotAdvantages(slotNumber: number) {
    setTravelPowerSlots((currentTravelPowerSlots) =>
      clearAdvantagesForSlot(currentTravelPowerSlots, slotNumber),
    );
  }

  return {
    clearDeviceSlot,
    clearPowerVariantSlot,
    clearTravelPowerSlot,
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
    resetDevices,
    resetPowerVariants,
    resetTravelPowers,
    toggleTravelPowerAdvantage,
    travelPowerSlots,
  };
}
