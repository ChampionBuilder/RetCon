import { useState } from "react";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";

export function usePowerDialogs() {
  const [activePowerSlot, setActivePowerSlot] = useState<number | null>(null);
  const [powerDialogAnchor, setPowerDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [activePowerVariantSlot, setActivePowerVariantSlot] = useState<
    number | null
  >(null);
  const [powerVariantDialogAnchor, setPowerVariantDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [activeTravelPowerSlot, setActiveTravelPowerSlot] =
    useState<number | null>(null);
  const [travelPowerDialogAnchor, setTravelPowerDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [activeDeviceSlot, setActiveDeviceSlot] = useState<number | null>(null);
  const [deviceDialogAnchor, setDeviceDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [activeAdvantageSlot, setActiveAdvantageSlot] =
    useState<number | null>(null);
  const [advantageDialogAnchor, setAdvantageDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [lastPowerDialogFrameworkId, setLastPowerDialogFrameworkId] =
    useState<string | null>("Electricity");

  function openPowerDialog(slotNumber: number, anchor: DialogAnchor) {
    setActivePowerSlot(slotNumber);
    setPowerDialogAnchor(anchor);
  }

  function closePowerDialog() {
    setActivePowerSlot(null);
    setPowerDialogAnchor(null);
  }

  function openPowerVariantDialog(slotNumber: number, anchor: DialogAnchor) {
    setActivePowerVariantSlot(slotNumber);
    setPowerVariantDialogAnchor(anchor);
  }

  function openTravelPowerDialog(slotNumber: number, anchor: DialogAnchor) {
    setActiveTravelPowerSlot(slotNumber);
    setTravelPowerDialogAnchor(anchor);
  }

  function closeTravelPowerDialog() {
    setActiveTravelPowerSlot(null);
    setTravelPowerDialogAnchor(null);
  }

  function closePowerVariantDialog() {
    setActivePowerVariantSlot(null);
    setPowerVariantDialogAnchor(null);
  }

  function openDeviceDialog(slotNumber: number, anchor: DialogAnchor) {
    setActiveDeviceSlot(slotNumber);
    setDeviceDialogAnchor(anchor);
  }

  function closeDeviceDialog() {
    setActiveDeviceSlot(null);
    setDeviceDialogAnchor(null);
  }

  function openAdvantageDialog(slotNumber: number, anchor: DialogAnchor) {
    setActiveAdvantageSlot(slotNumber);
    setAdvantageDialogAnchor(anchor);
  }

  function closeAdvantageDialog() {
    setActiveAdvantageSlot(null);
    setAdvantageDialogAnchor(null);
  }

  function closePowerDialogs() {
    closePowerDialog();
    closePowerVariantDialog();
    closeTravelPowerDialog();
    closeDeviceDialog();
    closeAdvantageDialog();
  }

  return {
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
    openPowerDialog,
    openPowerVariantDialog,
    openTravelPowerDialog,
    powerDialogAnchor,
    powerVariantDialogAnchor,
    travelPowerDialogAnchor,
    setLastPowerDialogFrameworkId,
  };
}
