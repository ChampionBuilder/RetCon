import {
  initialArchetypeBuildSlots,
  initialBuildSlots,
  initialDeviceSlots,
  initialPowerVariantSlots,
  initialTravelPowerSlots,
} from "../constants/buildSlots";
import type { BuildSlot } from "../types/builds";
import type { Power } from "../types/powers";
import {
  createEmptySpecializationPoints,
  type SpecializationTreePoints,
} from "./specializations";
import { getPowerDisplayFrameworkId } from "./powerFrameworks";

type BuildSerializationInput = {
  buildName: string;
  selectedArchetypeId: number;
  selectedRoleId: number;
  selectedSuperStatIds: number[];
  selectedInnateTalentId: number;
  selectedTalentIds: number[];
  buildSlots: BuildSlot[];
  travelPowerSlots: BuildSlot[];
  powerVariantSlots: BuildSlot[];
  deviceSlots: BuildSlot[];
  selectedSpecializationTreeIds: number[];
  specializationPointsBySlot: SpecializationTreePoints[];
  selectedMasterySlot: number | null;
  camsLevel: number;
};

type EncodedSlot = {
  powerId: number;
  advantageMask: number;
  displayFrameworkCode: number;
};

type ParsedSerializedBuild = {
  buildName: string;
  selectedArchetypeId: number;
  selectedRoleId: number;
  selectedSuperStatIds: number[];
  selectedInnateTalentId: number;
  selectedTalentIds: number[];
  buildSlots: EncodedSlot[];
  travelPowerSlots: EncodedSlot[];
  powerVariantPowerIds: number[];
  devicePowerIds: number[];
  selectedSpecializationTreeIds: number[];
  specializationPointsBySlot: SpecializationTreePoints[];
  selectedMasterySlot: number | null;
  camsLevel: number;
};

export type HydratedBuild = Omit<
  BuildSerializationInput,
  "selectedMasterySlot"
> & {
  selectedMasterySlot: number | null;
};

const serializationVersion = 3;
const maxSpecializationPointValue = 3;
const emptySuperStatIds = [0, 0, 0];
const emptyTalentIds = [0, 0, 0, 0, 0, 0];
const emptySpecializationTreeIds = [0, 0, 0];

// Append-only: changing existing positions would invalidate shared-power display codes.
const serializedDisplayFrameworkIds = [
  "Electricity",
  "Fire",
  "Force",
  "Wind",
  "Ice",
  "Archery",
  "Gadgeteering",
  "Munitions",
  "Power_Armor",
  "Laser_Sword",
  "Dual_Blades",
  "Fighting_Claws",
  "Single_Blade",
  "Unarmed",
  "Telekinesis",
  "Telepathy",
  "Earth",
  "Might",
  "Heavy_Weapon",
  "Celestial",
  "Darkness",
  "Sorcery",
  "Bestial_Supernatural",
  "Infernal_Supernatural",
] as const;

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const binary = window.atob(normalized + "=".repeat(paddingLength));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function writeVarint(bytes: number[], value: number) {
  let remaining = Math.max(0, Math.floor(value));

  do {
    const byte = remaining & 0x7f;
    remaining = Math.floor(remaining / 128);
    bytes.push(remaining > 0 ? byte | 0x80 : byte);
  } while (remaining > 0);
}

function readVarint(bytes: Uint8Array, cursor: { index: number }) {
  let result = 0;
  let shift = 0;

  while (cursor.index < bytes.length && shift <= 28) {
    const byte = bytes[cursor.index];
    cursor.index += 1;
    result += (byte & 0x7f) * 2 ** shift;

    if ((byte & 0x80) === 0) {
      return result;
    }

    shift += 7;
  }

  throw new Error("Invalid varint");
}

function writeString(bytes: number[], value: string) {
  const encodedValue = new TextEncoder().encode(value);

  writeVarint(bytes, encodedValue.length);
  bytes.push(...encodedValue);
}

function readString(bytes: Uint8Array, cursor: { index: number }) {
  const length = readVarint(bytes, cursor);
  const end = cursor.index + length;

  if (end > bytes.length) {
    throw new Error("Invalid string length");
  }

  const value = new TextDecoder().decode(bytes.slice(cursor.index, end));
  cursor.index = end;

  return value;
}

function getAdvantageMask(slot: BuildSlot) {
  const powerAdvantageIds = slot.power?.advantages ?? [];

  return powerAdvantageIds.reduce((mask, advantageId, index) => {
    return slot.selectedAdvantages.includes(advantageId)
      ? mask | (1 << index)
      : mask;
  }, 0);
}

function getSelectedAdvantageIds(power: Power, advantageMask: number) {
  return power.advantages.filter(
    (_advantageId, index) => (advantageMask & (1 << index)) !== 0,
  );
}

function getDisplayFrameworkCode(slot: BuildSlot) {
  const power = slot.power;

  if (!power || !slot.displayFrameworkId) {
    return 0;
  }

  if (slot.displayFrameworkId === getPowerDisplayFrameworkId(power)) {
    return 0;
  }

  const frameworkIndex = serializedDisplayFrameworkIds.indexOf(
    slot.displayFrameworkId as (typeof serializedDisplayFrameworkIds)[number],
  );

  return frameworkIndex >= 0 ? frameworkIndex + 1 : 0;
}

function getDisplayFrameworkId(power: Power, displayFrameworkCode: number) {
  return (
    serializedDisplayFrameworkIds[displayFrameworkCode - 1] ??
    getPowerDisplayFrameworkId(power)
  );
}

function writeCombatSlot(bytes: number[], slot: BuildSlot) {
  const powerId = slot.power?.power_id ?? 0;

  writeVarint(bytes, powerId);

  if (powerId === 0) {
    return;
  }

  const meta = getAdvantageMask(slot) * 32 + getDisplayFrameworkCode(slot);
  writeVarint(bytes, meta);
}

function readCombatSlot(bytes: Uint8Array, cursor: { index: number }) {
  const powerId = readVarint(bytes, cursor);

  if (powerId === 0) {
    return {
      powerId,
      advantageMask: 0,
      displayFrameworkCode: 0,
    };
  }

  const meta = readVarint(bytes, cursor);

  return {
    powerId,
    advantageMask: Math.floor(meta / 32),
    displayFrameworkCode: meta % 32,
  };
}

function writeTravelPowerSlot(bytes: number[], slot: BuildSlot) {
  const powerId = slot.power?.power_id ?? 0;

  writeVarint(bytes, powerId);

  if (powerId !== 0) {
    writeVarint(bytes, getAdvantageMask(slot));
  }
}

function readTravelPowerSlot(bytes: Uint8Array, cursor: { index: number }) {
  const powerId = readVarint(bytes, cursor);

  return {
    powerId,
    advantageMask: powerId === 0 ? 0 : readVarint(bytes, cursor),
    displayFrameworkCode: 0,
  };
}

function writePowerIds(bytes: number[], slots: BuildSlot[]) {
  slots.forEach((slot) => {
    writeVarint(bytes, slot.power?.power_id ?? 0);
  });
}

function readPowerIds(bytes: Uint8Array, cursor: { index: number }, count: number) {
  return Array.from({ length: count }, () => readVarint(bytes, cursor));
}

function packSpecializationPoints(points: SpecializationTreePoints) {
  return createEmptySpecializationPoints().reduce((packedPoints, _point, index) => {
    const pointCount = Math.max(
      0,
      Math.min(maxSpecializationPointValue, points[index] ?? 0),
    );

    return packedPoints | (pointCount << (index * 2));
  }, 0);
}

function unpackSpecializationPoints(packedPoints: number) {
  return createEmptySpecializationPoints().map((_point, index) => {
    return (packedPoints >> (index * 2)) & maxSpecializationPointValue;
  });
}

function writeSpecializationPoints(
  bytes: number[],
  pointsBySlot: SpecializationTreePoints[],
) {
  [0, 1, 2].forEach((slotIndex) => {
    const packedPoints = packSpecializationPoints(
      pointsBySlot[slotIndex] ?? createEmptySpecializationPoints(),
    );

    bytes.push(packedPoints & 0xff, (packedPoints >> 8) & 0xff);
  });
}

function readSpecializationPoints(
  bytes: Uint8Array,
  cursor: { index: number },
) {
  return [0, 1, 2].map(() => {
    if (cursor.index + 1 >= bytes.length) {
      throw new Error("Invalid specialization points");
    }

    const packedPoints = bytes[cursor.index] | (bytes[cursor.index + 1] << 8);
    cursor.index += 2;

    return unpackSpecializationPoints(packedPoints);
  });
}

function hydrateSlots(
  templateSlots: BuildSlot[],
  serializedSlots: EncodedSlot[],
  powersById: Map<number, Power>,
) {
  return templateSlots.map((templateSlot, index) => {
    const serializedSlot = serializedSlots[index];
    const power = serializedSlot
      ? powersById.get(serializedSlot.powerId) ?? null
      : null;

    if (!serializedSlot || !power) {
      return {
        ...templateSlot,
        power: null,
        displayFrameworkId: null,
        selectedAdvantages: [],
      };
    }

    return {
      ...templateSlot,
      power,
      displayFrameworkId: getDisplayFrameworkId(
        power,
        serializedSlot.displayFrameworkCode,
      ),
      selectedAdvantages: getSelectedAdvantageIds(
        power,
        serializedSlot.advantageMask,
      ),
    };
  });
}

function hydratePowerIdSlots(
  templateSlots: BuildSlot[],
  powerIds: number[],
  powersById: Map<number, Power>,
) {
  return templateSlots.map((templateSlot, index) => {
    const power = powersById.get(powerIds[index] ?? 0) ?? null;

    return {
      ...templateSlot,
      power,
      displayFrameworkId: power ? getPowerDisplayFrameworkId(power) : null,
      selectedAdvantages: [],
    };
  });
}

export function serializeBuild(input: BuildSerializationInput) {
  const bytes: number[] = [];

  bytes.push(serializationVersion);
  writeString(bytes, input.buildName);
  writeVarint(bytes, input.selectedArchetypeId);
  writeVarint(bytes, input.selectedRoleId);
  input.selectedSuperStatIds.forEach((statId) => writeVarint(bytes, statId));
  writeVarint(bytes, input.selectedInnateTalentId);
  input.selectedTalentIds.forEach((talentId) => writeVarint(bytes, talentId));
  input.buildSlots.forEach((slot) => writeCombatSlot(bytes, slot));
  input.travelPowerSlots.forEach((slot) => writeTravelPowerSlot(bytes, slot));
  writePowerIds(bytes, input.powerVariantSlots);
  writePowerIds(bytes, input.deviceSlots);
  input.selectedSpecializationTreeIds.forEach((treeId) =>
    writeVarint(bytes, treeId),
  );
  writeSpecializationPoints(bytes, input.specializationPointsBySlot);
  writeVarint(bytes, input.selectedMasterySlot === null ? 0 : input.selectedMasterySlot + 1);
  writeVarint(bytes, input.camsLevel);

  return base64UrlEncode(Uint8Array.from(bytes));
}

export function parseSerializedBuild(serializedBuild: string) {
  try {
    const bytes = base64UrlDecode(serializedBuild);
    const cursor = { index: 0 };

    if (bytes[cursor.index] !== serializationVersion) {
      return null;
    }

    cursor.index += 1;
    const buildName = readString(bytes, cursor);
    const selectedArchetypeId = readVarint(bytes, cursor);
    const selectedRoleId = readVarint(bytes, cursor);
    const selectedSuperStatIds = emptySuperStatIds.map(() =>
      readVarint(bytes, cursor),
    );
    const selectedInnateTalentId = readVarint(bytes, cursor);
    const selectedTalentIds = emptyTalentIds.map(() => readVarint(bytes, cursor));
    const buildSlotCount =
      selectedArchetypeId === 1
        ? initialBuildSlots.length
        : initialArchetypeBuildSlots.length;
    const buildSlots = Array.from({ length: buildSlotCount }, () =>
      readCombatSlot(bytes, cursor),
    );
    const travelPowerSlots = initialTravelPowerSlots.map(() =>
      readTravelPowerSlot(bytes, cursor),
    );
    const powerVariantPowerIds = readPowerIds(
      bytes,
      cursor,
      initialPowerVariantSlots.length,
    );
    const devicePowerIds = readPowerIds(bytes, cursor, initialDeviceSlots.length);
    const selectedSpecializationTreeIds = emptySpecializationTreeIds.map(() =>
      readVarint(bytes, cursor),
    );
    const specializationPointsBySlot = readSpecializationPoints(bytes, cursor);
    const selectedMasteryCode = readVarint(bytes, cursor);
    const camsLevel = readVarint(bytes, cursor);

    if (cursor.index !== bytes.length) {
      return null;
    }

    return {
      buildName,
      selectedArchetypeId,
      selectedRoleId,
      selectedSuperStatIds,
      selectedInnateTalentId,
      selectedTalentIds,
      buildSlots,
      travelPowerSlots,
      powerVariantPowerIds,
      devicePowerIds,
      selectedSpecializationTreeIds,
      specializationPointsBySlot,
      selectedMasterySlot:
        selectedMasteryCode === 0 ? null : selectedMasteryCode - 1,
      camsLevel,
    } satisfies ParsedSerializedBuild;
  } catch {
    return null;
  }
}

export function hydrateSerializedBuild(
  payload: ParsedSerializedBuild,
  powersById: Map<number, Power>,
): HydratedBuild {
  const buildTemplate =
    payload.selectedArchetypeId === 1
      ? initialBuildSlots
      : initialArchetypeBuildSlots;

  return {
    buildName: payload.buildName,
    selectedArchetypeId: payload.selectedArchetypeId,
    selectedRoleId: payload.selectedRoleId,
    selectedSuperStatIds: payload.selectedSuperStatIds,
    selectedInnateTalentId: payload.selectedInnateTalentId,
    selectedTalentIds: payload.selectedTalentIds,
    buildSlots: hydrateSlots(buildTemplate, payload.buildSlots, powersById),
    travelPowerSlots: hydrateSlots(
      initialTravelPowerSlots,
      payload.travelPowerSlots,
      powersById,
    ),
    powerVariantSlots: hydratePowerIdSlots(
      initialPowerVariantSlots,
      payload.powerVariantPowerIds,
      powersById,
    ),
    deviceSlots: hydratePowerIdSlots(
      initialDeviceSlots,
      payload.devicePowerIds,
      powersById,
    ),
    selectedSpecializationTreeIds: payload.selectedSpecializationTreeIds,
    specializationPointsBySlot: payload.specializationPointsBySlot,
    selectedMasterySlot: payload.selectedMasterySlot,
    camsLevel: payload.camsLevel,
  };
}

export function createShareUrl(serializedBuild: string) {
  const url = new URL(window.location.href);

  url.searchParams.delete("build");
  url.searchParams.set("b", serializedBuild);

  return url.toString();
}
