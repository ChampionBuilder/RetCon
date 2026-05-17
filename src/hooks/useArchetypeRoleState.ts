import { useState } from "react";
import type { DialogAnchor } from "../components/AnchoredDialog";
import type { Archetype, ArchetypesData } from "../types/character";

export function useArchetypeRoleState(archetypesData: ArchetypesData | null) {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState(1);
  const [archetypeDialogAnchor, setArchetypeDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [roleDialogAnchor, setRoleDialogAnchor] =
    useState<DialogAnchor | null>(null);

  const selectedArchetype =
    archetypesData?.archetypes.find(
      (archetype) => archetype.id === selectedArchetypeId,
    ) ?? null;
  const isFreeform = selectedArchetypeId === 1;
  const selectedRole =
    archetypesData?.archetypeGroups.find(
      (group) => group.id === selectedRoleId,
    ) ?? null;

  function openArchetypeDialog(anchor: DialogAnchor) {
    setArchetypeDialogAnchor(anchor);
  }

  function closeArchetypeDialog() {
    setArchetypeDialogAnchor(null);
  }

  function openRoleDialog(anchor: DialogAnchor) {
    if (!isFreeform) {
      return;
    }

    setRoleDialogAnchor(anchor);
  }

  function closeRoleDialog() {
    setRoleDialogAnchor(null);
  }

  function resetArchetypeRole() {
    setSelectedArchetypeId(1);
    setSelectedRoleId(1);
  }

  function hydrateArchetypeRole(
    nextSelectedArchetypeId: number,
    nextSelectedRoleId: number,
  ) {
    setSelectedArchetypeId(nextSelectedArchetypeId);
    setSelectedRoleId(nextSelectedRoleId);
  }

  function applySelectedArchetype(archetype: Archetype) {
    setSelectedArchetypeId(archetype.id);

    if (archetype.id !== 1) {
      setSelectedRoleId(archetype.group);
    }
  }

  function selectRole(roleId: number) {
    if (!isFreeform) {
      return;
    }

    if (
      !archetypesData?.archetypeGroups.some(
        (group) => group.id === roleId && group.id > 0,
      )
    ) {
      return;
    }

    setSelectedRoleId(roleId);
    closeRoleDialog();
  }

  return {
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
  };
}
