import {
  initialArchetypeBuildSlots,
  initialBuildSlots,
  initialDeviceSlots,
  initialPowerVariantSlots,
  initialTravelPowerSlots,
} from "@/constants/buildSlots";
import { trimBuildNameForUrl } from "@/constants/buildName";
import type { BuildSlot } from "@/types/builds";
import type {
  GearBuildSlot,
  GearItem,
  GearMod,
  GearModRank,
} from "@/types/gear";
import type { Power } from "@/types/powers";
import {
  createEmptySpecializationPoints,
  type SpecializationTreePoints,
} from "@/features/specializations";
import { initialGearSlots } from "@/features/gear/useGearSlots";
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
  camsIconName: string;
  gearSlots: GearBuildSlot[];
};

type EncodedSlot = {
  powerId: number;
  advantageMask: number;
  displayFrameworkCode: number;
};

type EncodedGearModSlot = {
  modId: number;
  rank: number;
};

type EncodedGearSlot = {
  gearId: number;
  selectedMods: EncodedGearModSlot[];
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
  camsIconName: string;
  gearSlots: EncodedGearSlot[];
};

export type HydratedBuild = Omit<
  BuildSerializationInput,
  "selectedMasterySlot"
> & {
  selectedMasterySlot: number | null;
};

const serializationVersion = 5;
const minimumSupportedSerializationVersion = 3;
const maxSpecializationPointValue = 3;
const emptySuperStatIds = [0, 0, 0];
const emptyTalentIds = [0, 0, 0, 0, 0, 0];
const emptySpecializationTreeIds = [0, 0, 0];
const camsLevelBitMask = 0b111;
const serializedArchetypeIdBitCount = 6;
const serializedRoleIdBitCount = 3;
const serializedStatIdBitCount = 4;
const serializedInnateTalentIdBitCount = 7;
const serializedTalentIdBitCount = 6;
const serializedSpecializationTreeIdBitCount = 5;
const serializedMasterySlotBitCount = 2;
const serializedCamsLevelBitCount = 3;
const serializedCamsIconBitCount = 2;
const serializedPowerIdBitCount = 11;
const serializedAdvantageMaskBitCount = 10;
const serializedDisplayFrameworkBitCount = 5;
const serializedGearSlotCount = 6;
const serializedPrimaryGearModSlotCount = 4;
const serializedSecondaryGearModSlotCount = 1;
const serializedGearIdBitCount = 7;
const serializedGearModIdBitCount = 8;
const serializedGearModRankBitCount = 2;
const serializedCamsIconNames = [
  "CAMS_Generic",
  "CAMS_Green",
  "CAMS_blue",
] as const;

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

class BitWriter {
  private bytes: number[] = [];
  private currentByte = 0;
  private bitOffset = 0;

  write(value: number, bitCount: number) {
    const safeValue = Math.max(0, Math.floor(value));

    for (let bitIndex = 0; bitIndex < bitCount; bitIndex += 1) {
      const bit = (safeValue >> bitIndex) & 1;

      this.currentByte |= bit << this.bitOffset;
      this.bitOffset += 1;

      if (this.bitOffset === 8) {
        this.bytes.push(this.currentByte);
        this.currentByte = 0;
        this.bitOffset = 0;
      }
    }
  }

  toBytes() {
    if (this.bitOffset > 0) {
      this.bytes.push(this.currentByte);
      this.currentByte = 0;
      this.bitOffset = 0;
    }

    return this.bytes;
  }
}

class BitReader {
  private readonly bytes: Uint8Array;
  private byteIndex: number;
  private bitOffset = 0;

  constructor(bytes: Uint8Array, startIndex: number) {
    this.bytes = bytes;
    this.byteIndex = startIndex;
  }

  read(bitCount: number) {
    let value = 0;

    for (let bitIndex = 0; bitIndex < bitCount; bitIndex += 1) {
      if (this.byteIndex >= this.bytes.length) {
        throw new Error("Invalid bit-packed payload");
      }

      const bit = (this.bytes[this.byteIndex] >> this.bitOffset) & 1;

      value |= bit << bitIndex;
      this.bitOffset += 1;

      if (this.bitOffset === 8) {
        this.byteIndex += 1;
        this.bitOffset = 0;
      }
    }

    return value;
  }

  getCursorIndex() {
    return this.byteIndex + (this.bitOffset > 0 ? 1 : 0);
  }
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

function writeCharacterBasics(bytes: number[], input: BuildSerializationInput) {
  const bitWriter = new BitWriter();

  bitWriter.write(input.selectedArchetypeId, serializedArchetypeIdBitCount);
  bitWriter.write(input.selectedRoleId, serializedRoleIdBitCount);
  emptySuperStatIds.forEach((_statId, index) => {
    bitWriter.write(
      input.selectedSuperStatIds[index] ?? 0,
      serializedStatIdBitCount,
    );
  });
  bitWriter.write(
    input.selectedInnateTalentId,
    serializedInnateTalentIdBitCount,
  );
  emptyTalentIds.forEach((_talentId, index) => {
    bitWriter.write(
      input.selectedTalentIds[index] ?? 0,
      serializedTalentIdBitCount,
    );
  });

  bytes.push(...bitWriter.toBytes());
}

function readCharacterBasics(bytes: Uint8Array, cursor: { index: number }) {
  const bitReader = new BitReader(bytes, cursor.index);
  const selectedArchetypeId = bitReader.read(serializedArchetypeIdBitCount);
  const selectedRoleId = bitReader.read(serializedRoleIdBitCount);
  const selectedSuperStatIds = emptySuperStatIds.map(() =>
    bitReader.read(serializedStatIdBitCount),
  );
  const selectedInnateTalentId = bitReader.read(
    serializedInnateTalentIdBitCount,
  );
  const selectedTalentIds = emptyTalentIds.map(() =>
    bitReader.read(serializedTalentIdBitCount),
  );

  cursor.index = bitReader.getCursorIndex();

  return {
    selectedArchetypeId,
    selectedInnateTalentId,
    selectedRoleId,
    selectedSuperStatIds,
    selectedTalentIds,
  };
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

function writeCombatSlots(bytes: number[], slots: BuildSlot[]) {
  const bitWriter = new BitWriter();
  const slotMask = getSlotMask(slots);
  const advantageMaskSlotMask = slots.reduce((mask, slot, slotIndex) => {
    return slot.power && getAdvantageMask(slot) !== 0
      ? mask | (1 << slotIndex)
      : mask;
  }, 0);
  const displayFrameworkSlotMask = slots.reduce((mask, slot, slotIndex) => {
    return slot.power && getDisplayFrameworkCode(slot) !== 0
      ? mask | (1 << slotIndex)
      : mask;
  }, 0);

  bitWriter.write(slotMask, slots.length);
  bitWriter.write(advantageMaskSlotMask, slots.length);
  bitWriter.write(displayFrameworkSlotMask, slots.length);

  slots.forEach((slot, slotIndex) => {
    if ((slotMask & (1 << slotIndex)) === 0) {
      return;
    }

    bitWriter.write(slot.power?.power_id ?? 0, serializedPowerIdBitCount);
  });

  slots.forEach((slot, slotIndex) => {
    if ((advantageMaskSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    bitWriter.write(getAdvantageMask(slot), serializedAdvantageMaskBitCount);
  });

  slots.forEach((slot, slotIndex) => {
    if ((displayFrameworkSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    bitWriter.write(
      getDisplayFrameworkCode(slot),
      serializedDisplayFrameworkBitCount,
    );
  });

  bytes.push(...bitWriter.toBytes());
}

function readCombatSlots(
  bytes: Uint8Array,
  cursor: { index: number },
  slotCount: number,
) {
  const bitReader = new BitReader(bytes, cursor.index);
  const slotMask = bitReader.read(slotCount);
  const advantageMaskSlotMask = bitReader.read(slotCount);
  const displayFrameworkSlotMask = bitReader.read(slotCount);
  const slots = Array.from({ length: slotCount }, (): EncodedSlot => ({
    powerId: 0,
    advantageMask: 0,
    displayFrameworkCode: 0,
  }));

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    if ((slotMask & (1 << slotIndex)) === 0) {
      continue;
    }

    slots[slotIndex].powerId = bitReader.read(serializedPowerIdBitCount);
  }

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    if ((advantageMaskSlotMask & (1 << slotIndex)) === 0) {
      continue;
    }

    slots[slotIndex].advantageMask = bitReader.read(
      serializedAdvantageMaskBitCount,
    );
  }

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    if ((displayFrameworkSlotMask & (1 << slotIndex)) === 0) {
      continue;
    }

    slots[slotIndex].displayFrameworkCode = bitReader.read(
      serializedDisplayFrameworkBitCount,
    );
  }

  cursor.index = bitReader.getCursorIndex();

  return slots;
}

function readTravelPowerSlot(bytes: Uint8Array, cursor: { index: number }) {
  const powerId = readVarint(bytes, cursor);

  return {
    powerId,
    advantageMask: powerId === 0 ? 0 : readVarint(bytes, cursor),
    displayFrameworkCode: 0,
  };
}

function readPowerIds(bytes: Uint8Array, cursor: { index: number }, count: number) {
  return Array.from({ length: count }, () => readVarint(bytes, cursor));
}

function getSlotMask(slots: BuildSlot[]) {
  return slots.reduce((mask, slot, slotIndex) => {
    return slot.power ? mask | (1 << slotIndex) : mask;
  }, 0);
}

function writeUtilityPowerSlots(bitWriter: BitWriter, slots: BuildSlot[]) {
  const slotMask = getSlotMask(slots);

  bitWriter.write(slotMask, slots.length);

  slots.forEach((slot, slotIndex) => {
    if ((slotMask & (1 << slotIndex)) === 0) {
      return;
    }

    bitWriter.write(slot.power?.power_id ?? 0, serializedPowerIdBitCount);
  });
}

function readUtilityPowerSlots(
  bitReader: BitReader,
  count: number,
) {
  const slotMask = bitReader.read(count);
  const powerIds = Array.from({ length: count }, () => 0);

  for (let slotIndex = 0; slotIndex < count; slotIndex += 1) {
    if ((slotMask & (1 << slotIndex)) === 0) {
      continue;
    }

    powerIds[slotIndex] = bitReader.read(serializedPowerIdBitCount);
  }

  return powerIds;
}

function writeUtilitySlots(
  bytes: number[],
  travelPowerSlots: BuildSlot[],
  powerVariantSlots: BuildSlot[],
  deviceSlots: BuildSlot[],
) {
  const bitWriter = new BitWriter();
  const travelSlotMask = getSlotMask(travelPowerSlots);

  bitWriter.write(travelSlotMask, initialTravelPowerSlots.length);

  travelPowerSlots.forEach((slot, slotIndex) => {
    if ((travelSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    bitWriter.write(slot.power?.power_id ?? 0, serializedPowerIdBitCount);
    bitWriter.write(getAdvantageMask(slot), serializedAdvantageMaskBitCount);
  });

  writeUtilityPowerSlots(bitWriter, powerVariantSlots);
  writeUtilityPowerSlots(bitWriter, deviceSlots);

  bytes.push(...bitWriter.toBytes());
}

function readUtilitySlots(bytes: Uint8Array, cursor: { index: number }) {
  const bitReader = new BitReader(bytes, cursor.index);
  const travelSlotMask = bitReader.read(initialTravelPowerSlots.length);
  const travelPowerSlots = initialTravelPowerSlots.map<EncodedSlot>(() => ({
    powerId: 0,
    advantageMask: 0,
    displayFrameworkCode: 0,
  }));

  initialTravelPowerSlots.forEach((_slot, slotIndex) => {
    if ((travelSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    travelPowerSlots[slotIndex] = {
      powerId: bitReader.read(serializedPowerIdBitCount),
      advantageMask: bitReader.read(serializedAdvantageMaskBitCount),
      displayFrameworkCode: 0,
    };
  });

  const powerVariantPowerIds = readUtilityPowerSlots(
    bitReader,
    initialPowerVariantSlots.length,
  );
  const devicePowerIds = readUtilityPowerSlots(
    bitReader,
    initialDeviceSlots.length,
  );

  cursor.index = bitReader.getCursorIndex();

  return {
    devicePowerIds,
    powerVariantPowerIds,
    travelPowerSlots,
  };
}

function getGearModRankCode(rank: GearModRank | null) {
  if (rank === 5) {
    return 1;
  }

  if (rank === 7) {
    return 2;
  }

  if (rank === 9) {
    return 3;
  }

  return 0;
}

function getGearModRankFromCode(code: number) {
  if (code === 1) {
    return 5;
  }

  if (code === 2) {
    return 7;
  }

  if (code === 3) {
    return 9;
  }

  return 0;
}

function getSerializedGearModSlotCount(slot: GearBuildSlot) {
  return slot.gearSlot === "Primary"
    ? serializedPrimaryGearModSlotCount
    : serializedSecondaryGearModSlotCount;
}

function writeGearSlots(bytes: number[], gearSlots: GearBuildSlot[]) {
  const bitWriter = new BitWriter();
  const gearSlotMask = initialGearSlots.reduce((mask, templateSlot, slotIndex) => {
    const slot = gearSlots[slotIndex] ?? templateSlot;
    const gearId = slot.gear?.gear_id ?? 0;

    return gearId === 0 ? mask : mask | (1 << slotIndex);
  }, 0);

  bitWriter.write(gearSlotMask, serializedGearSlotCount);

  initialGearSlots.forEach((templateSlot, slotIndex) => {
    if ((gearSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    const slot = gearSlots[slotIndex] ?? templateSlot;
    const gearId = slot.gear?.gear_id ?? 0;

    bitWriter.write(gearId, serializedGearIdBitCount);

    const modSlotCount = Math.min(
      slot.gear?.mod_slots.length ?? 0,
      getSerializedGearModSlotCount(slot),
    );
    let modSlotMask = 0;

    for (let modSlotIndex = 0; modSlotIndex < modSlotCount; modSlotIndex += 1) {
      if (slot.selectedMods[modSlotIndex]?.mod) {
        modSlotMask |= 1 << modSlotIndex;
      }
    }

    bitWriter.write(modSlotMask, getSerializedGearModSlotCount(slot));

    Array.from({ length: modSlotCount }).forEach((_slot, modSlotIndex) => {
      const selectedMod = slot.selectedMods[modSlotIndex] ?? null;

      if (selectedMod?.mod) {
        bitWriter.write(selectedMod.mod.mod_id, serializedGearModIdBitCount);
        bitWriter.write(
          getGearModRankCode(selectedMod.rank),
          serializedGearModRankBitCount,
        );
      }
    });
  });

  bytes.push(...bitWriter.toBytes());
}

function readLegacyGearSlots(bytes: Uint8Array, cursor: { index: number }) {
  return initialGearSlots.map<EncodedGearSlot>(() => {
    const gearId = readVarint(bytes, cursor);

    if (gearId === 0) {
      return {
        gearId,
        selectedMods: [],
      };
    }

    const modSlotCount = readVarint(bytes, cursor);
    const selectedMods = Array.from({ length: modSlotCount }, () => {
      const modId = readVarint(bytes, cursor);

      return {
        modId,
        rank: modId === 0 ? 0 : readVarint(bytes, cursor),
      };
    });

    return {
      gearId,
      selectedMods,
    };
  });
}

function readGearSlots(bytes: Uint8Array, cursor: { index: number }) {
  const bitReader = new BitReader(bytes, cursor.index);
  const gearSlotMask = bitReader.read(serializedGearSlotCount);
  const gearSlots = initialGearSlots.map<EncodedGearSlot>(() => ({
    gearId: 0,
    selectedMods: [],
  }));

  initialGearSlots.forEach((templateSlot, slotIndex) => {
    if ((gearSlotMask & (1 << slotIndex)) === 0) {
      return;
    }

    const gearId = bitReader.read(serializedGearIdBitCount);
    const modSlotCount = getSerializedGearModSlotCount(templateSlot);
    const modSlotMask = bitReader.read(modSlotCount);
    const selectedMods: EncodedGearModSlot[] = [];

    for (let modSlotIndex = 0; modSlotIndex < modSlotCount; modSlotIndex += 1) {
      if ((modSlotMask & (1 << modSlotIndex)) === 0) {
        continue;
      }

      selectedMods[modSlotIndex] = {
        modId: bitReader.read(serializedGearModIdBitCount),
        rank: getGearModRankFromCode(
          bitReader.read(serializedGearModRankBitCount),
        ),
      };
    }

    gearSlots[slotIndex] = {
      gearId,
      selectedMods,
    };
  });

  cursor.index = bitReader.getCursorIndex();

  return gearSlots;
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

function isGearModRank(value: number): value is GearModRank {
  return value === 5 || value === 7 || value === 9;
}

function hydrateGearSlots(
  serializedGearSlots: EncodedGearSlot[],
  gearsById: Map<number, GearItem>,
  modsById: Map<number, GearMod>,
) {
  return initialGearSlots.map((templateSlot, slotIndex) => {
    const serializedSlot = serializedGearSlots[slotIndex];
    const gear = gearsById.get(serializedSlot?.gearId ?? 0) ?? null;

    if (!serializedSlot || !gear) {
      return {
        ...templateSlot,
        gear: null,
        selectedMods: [],
      };
    }

    return {
      ...templateSlot,
      gear,
      selectedMods: gear.mod_slots.map((_slotTypes, modSlotIndex) => {
        const serializedMod = serializedSlot.selectedMods[modSlotIndex];
        const mod = modsById.get(serializedMod?.modId ?? 0) ?? null;

        if (!serializedMod || !mod) {
          return null;
        }

        return {
          mod,
          rank: isGearModRank(serializedMod.rank)
            ? serializedMod.rank
            : null,
        };
      }),
    };
  });
}

function getCamsIconCode(camsIconName: string) {
  const iconIndex = serializedCamsIconNames.indexOf(
    camsIconName as (typeof serializedCamsIconNames)[number],
  );

  return iconIndex >= 0 ? iconIndex : 0;
}

function unpackCamsSettings(encodedCamsSettings: number) {
  const camsLevel = encodedCamsSettings & camsLevelBitMask;
  const camsIconName =
    serializedCamsIconNames[encodedCamsSettings >> 3] ?? "CAMS_Generic";

  return {
    camsIconName,
    camsLevel,
  };
}

function writeSpecializationMeta(
  bytes: number[],
  selectedSpecializationTreeIds: number[],
  selectedMasterySlot: number | null,
  camsLevel: number,
  camsIconName: string,
) {
  const bitWriter = new BitWriter();

  emptySpecializationTreeIds.forEach((_treeId, index) => {
    bitWriter.write(
      selectedSpecializationTreeIds[index] ?? 0,
      serializedSpecializationTreeIdBitCount,
    );
  });
  bitWriter.write(
    selectedMasterySlot === null ? 0 : selectedMasterySlot + 1,
    serializedMasterySlotBitCount,
  );
  bitWriter.write(
    Math.max(0, Math.min(camsLevelBitMask, camsLevel)),
    serializedCamsLevelBitCount,
  );
  bitWriter.write(getCamsIconCode(camsIconName), serializedCamsIconBitCount);

  bytes.push(...bitWriter.toBytes());
}

function readSpecializationMeta(bytes: Uint8Array, cursor: { index: number }) {
  const bitReader = new BitReader(bytes, cursor.index);
  const selectedSpecializationTreeIds = emptySpecializationTreeIds.map(() =>
    bitReader.read(serializedSpecializationTreeIdBitCount),
  );
  const selectedMasteryCode = bitReader.read(serializedMasterySlotBitCount);
  const camsLevel = bitReader.read(serializedCamsLevelBitCount);
  const camsIconName =
    serializedCamsIconNames[bitReader.read(serializedCamsIconBitCount)] ??
    "CAMS_Generic";

  cursor.index = bitReader.getCursorIndex();

  return {
    camsIconName,
    camsLevel,
    selectedMasterySlot:
      selectedMasteryCode === 0 ? null : selectedMasteryCode - 1,
    selectedSpecializationTreeIds,
  };
}

export function serializeBuild(input: BuildSerializationInput) {
  const bytes: number[] = [];

  bytes.push(serializationVersion);
  writeString(bytes, "");
  writeCharacterBasics(bytes, input);
  writeCombatSlots(bytes, input.buildSlots);
  writeUtilitySlots(
    bytes,
    input.travelPowerSlots,
    input.powerVariantSlots,
    input.deviceSlots,
  );
  writeSpecializationMeta(
    bytes,
    input.selectedSpecializationTreeIds,
    input.selectedMasterySlot,
    input.camsLevel,
    input.camsIconName,
  );
  writeSpecializationPoints(bytes, input.specializationPointsBySlot);
  writeGearSlots(bytes, input.gearSlots);

  return base64UrlEncode(Uint8Array.from(bytes));
}

export function parseSerializedBuild(serializedBuild: string) {
  try {
    const bytes = base64UrlDecode(serializedBuild);
    const cursor = { index: 0 };

    const version = bytes[cursor.index];

    if (
      version < minimumSupportedSerializationVersion ||
      version > serializationVersion
    ) {
      return null;
    }

    cursor.index += 1;
    const buildName = readString(bytes, cursor);
    const characterBasics =
      version >= 5
        ? readCharacterBasics(bytes, cursor)
        : {
            selectedArchetypeId: readVarint(bytes, cursor),
            selectedRoleId: readVarint(bytes, cursor),
            selectedSuperStatIds: emptySuperStatIds.map(() =>
              readVarint(bytes, cursor),
            ),
            selectedInnateTalentId: readVarint(bytes, cursor),
            selectedTalentIds: emptyTalentIds.map(() =>
              readVarint(bytes, cursor),
            ),
          };
    const buildSlotCount =
      characterBasics.selectedArchetypeId === 1
        ? initialBuildSlots.length
        : initialArchetypeBuildSlots.length;
    const buildSlots =
      version >= 5
        ? readCombatSlots(bytes, cursor, buildSlotCount)
        : Array.from({ length: buildSlotCount }, () =>
            readCombatSlot(bytes, cursor),
          );
    const legacyTravelPowerSlots =
      version >= 5
        ? null
        : initialTravelPowerSlots.map(() =>
            readTravelPowerSlot(bytes, cursor),
          );
    const utilitySlots =
      version >= 5
        ? readUtilitySlots(bytes, cursor)
        : {
            travelPowerSlots: legacyTravelPowerSlots ?? [],
            powerVariantPowerIds: readPowerIds(
              bytes,
              cursor,
              initialPowerVariantSlots.length,
            ),
            devicePowerIds: readPowerIds(
              bytes,
              cursor,
              initialDeviceSlots.length,
            ),
          };
    const specializationMeta =
      version >= 5
        ? readSpecializationMeta(bytes, cursor)
        : null;
    const selectedSpecializationTreeIds =
      specializationMeta?.selectedSpecializationTreeIds ??
      emptySpecializationTreeIds.map(() => readVarint(bytes, cursor));
    const specializationPointsBySlot = readSpecializationPoints(bytes, cursor);
    const selectedMasteryCode =
      specializationMeta === null ? readVarint(bytes, cursor) : 0;
    const camsSettings =
      specializationMeta === null
        ? unpackCamsSettings(readVarint(bytes, cursor))
        : {
            camsIconName: specializationMeta.camsIconName,
            camsLevel: specializationMeta.camsLevel,
          };
    const gearSlots =
      version >= 5
        ? readGearSlots(bytes, cursor)
        : version >= 4
          ? readLegacyGearSlots(bytes, cursor)
          : [];

    if (cursor.index !== bytes.length) {
      return null;
    }

    return {
      buildName,
      selectedArchetypeId: characterBasics.selectedArchetypeId,
      selectedRoleId: characterBasics.selectedRoleId,
      selectedSuperStatIds: characterBasics.selectedSuperStatIds,
      selectedInnateTalentId: characterBasics.selectedInnateTalentId,
      selectedTalentIds: characterBasics.selectedTalentIds,
      buildSlots,
      travelPowerSlots: utilitySlots.travelPowerSlots,
      powerVariantPowerIds: utilitySlots.powerVariantPowerIds,
      devicePowerIds: utilitySlots.devicePowerIds,
      selectedSpecializationTreeIds,
      specializationPointsBySlot,
      selectedMasterySlot:
        specializationMeta?.selectedMasterySlot ??
        (selectedMasteryCode === 0 ? null : selectedMasteryCode - 1),
      camsIconName: camsSettings.camsIconName,
      camsLevel: camsSettings.camsLevel,
      gearSlots,
    } satisfies ParsedSerializedBuild;
  } catch {
    return null;
  }
}

export function hydrateSerializedBuild(
  payload: ParsedSerializedBuild,
  powersById: Map<number, Power>,
  gearsById = new Map<number, GearItem>(),
  modsById = new Map<number, GearMod>(),
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
    camsIconName: payload.camsIconName,
    camsLevel: payload.camsLevel,
    gearSlots: hydrateGearSlots(payload.gearSlots, gearsById, modsById),
  };
}

export function createShareUrl(serializedBuild: string, buildName = "") {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  const shareBuildName = trimBuildNameForUrl(buildName);

  url.searchParams.set("b", serializedBuild);

  if (shareBuildName) {
    url.searchParams.set("n", shareBuildName);
  } else {
    url.searchParams.delete("n");
  }

  return url.toString();
}
