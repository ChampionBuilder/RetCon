import {
  initialArchetypeBuildSlots,
  initialBuildSlots,
  initialDeviceSlots,
  initialPowerVariantSlots,
  initialTravelPowerSlots,
} from "../constants/buildSlots";
import type { BuildSlot } from "../types/builds";
import type { Power } from "../types/powers";
import type {
  SerializedBuildSlot,
  SerializedBuildV1,
} from "../types/share";
import {
  createEmptySpecializationPoints,
  type SpecializationTreePoints,
} from "./specializations";

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

export type HydratedBuild = Omit<
  BuildSerializationInput,
  "selectedMasterySlot"
> & {
  selectedMasterySlot: number | null;
};

const emptySuperStatIds = [0, 0, 0];
const emptyTalentIds = [0, 0, 0, 0, 0, 0];
const emptySpecializationTreeIds = [0, 0, 0];

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
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
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function serializeSlot(slot: BuildSlot): SerializedBuildSlot {
  return {
    s: slot.slot,
    p: slot.power?.power_id ?? 0,
    f: slot.displayFrameworkId ?? null,
    a: slot.selectedAdvantages,
  };
}

function isSerializedBuildSlot(value: unknown): value is SerializedBuildSlot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const slot = value as Record<string, unknown>;

  return (
    typeof slot.s === "number" &&
    typeof slot.p === "number" &&
    (typeof slot.f === "string" || slot.f === null) &&
    Array.isArray(slot.a) &&
    slot.a.every((advantageId) => typeof advantageId === "number")
  );
}

function isSerializedBuildV1(value: unknown): value is SerializedBuildV1 {
  if (!value || typeof value !== "object") {
    return false;
  }

  const build = value as Record<string, unknown>;

  return (
    build.v === 1 &&
    typeof build.n === "string" &&
    typeof build.at === "number" &&
    typeof build.r === "number" &&
    Array.isArray(build.ss) &&
    build.ss.every((statId) => typeof statId === "number") &&
    typeof build.it === "number" &&
    Array.isArray(build.t) &&
    build.t.every((talentId) => typeof talentId === "number") &&
    Array.isArray(build.p) &&
    build.p.every(isSerializedBuildSlot) &&
    Array.isArray(build.tp) &&
    build.tp.every(isSerializedBuildSlot) &&
    (build.pv === undefined ||
      (Array.isArray(build.pv) && build.pv.every(isSerializedBuildSlot))) &&
    (build.d === undefined ||
      (Array.isArray(build.d) && build.d.every(isSerializedBuildSlot))) &&
    Array.isArray(build.st) &&
    build.st.every((treeId) => typeof treeId === "number") &&
    Array.isArray(build.sp) &&
    build.sp.every(
      (points) =>
        Array.isArray(points) &&
        points.every((pointCount) => typeof pointCount === "number"),
    ) &&
    (typeof build.m === "number" || build.m === null) &&
    typeof build.c === "number"
  );
}

function normalizeFixedLengthIds(
  values: number[],
  fallbackValues: number[],
) {
  return fallbackValues.map((fallbackValue, index) => values[index] ?? fallbackValue);
}

function normalizeSpecializationPoints(points: number[][]) {
  return [0, 1, 2].map((slotIndex) => {
    const fallbackPoints = createEmptySpecializationPoints();
    const slotPoints = points[slotIndex] ?? [];

    return fallbackPoints.map(
      (fallbackPoint, pointIndex) => slotPoints[pointIndex] ?? fallbackPoint,
    );
  });
}

function hydrateSlots(
  templateSlots: BuildSlot[],
  serializedSlots: SerializedBuildSlot[],
  powersById: Map<number, Power>,
) {
  const serializedSlotsByNumber = new Map(
    serializedSlots.map((slot) => [slot.s, slot]),
  );

  return templateSlots.map((templateSlot) => {
    const serializedSlot = serializedSlotsByNumber.get(templateSlot.slot);
    const power = serializedSlot ? powersById.get(serializedSlot.p) ?? null : null;

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
      displayFrameworkId: serializedSlot.f,
      selectedAdvantages: serializedSlot.a,
    };
  });
}

export function serializeBuild(input: BuildSerializationInput) {
  const payload: SerializedBuildV1 = {
    v: 1,
    n: input.buildName,
    at: input.selectedArchetypeId,
    r: input.selectedRoleId,
    ss: input.selectedSuperStatIds,
    it: input.selectedInnateTalentId,
    t: input.selectedTalentIds,
    p: input.buildSlots.map(serializeSlot),
    tp: input.travelPowerSlots.map(serializeSlot),
    pv: input.powerVariantSlots.map(serializeSlot),
    d: input.deviceSlots.map(serializeSlot),
    st: input.selectedSpecializationTreeIds,
    sp: input.specializationPointsBySlot,
    m: input.selectedMasterySlot,
    c: input.camsLevel,
  };

  return base64UrlEncode(JSON.stringify(payload));
}

export function parseSerializedBuild(serializedBuild: string) {
  try {
    const payload = JSON.parse(base64UrlDecode(serializedBuild)) as unknown;

    return isSerializedBuildV1(payload) ? payload : null;
  } catch {
    return null;
  }
}

export function hydrateSerializedBuild(
  payload: SerializedBuildV1,
  powersById: Map<number, Power>,
): HydratedBuild {
  const buildTemplate =
    payload.at === 1 ? initialBuildSlots : initialArchetypeBuildSlots;

  return {
    buildName: payload.n,
    selectedArchetypeId: payload.at,
    selectedRoleId: payload.r,
    selectedSuperStatIds: normalizeFixedLengthIds(payload.ss, emptySuperStatIds),
    selectedInnateTalentId: payload.it,
    selectedTalentIds: normalizeFixedLengthIds(payload.t, emptyTalentIds),
    buildSlots: hydrateSlots(buildTemplate, payload.p, powersById),
    travelPowerSlots: hydrateSlots(
      initialTravelPowerSlots,
      payload.tp,
      powersById,
    ),
    powerVariantSlots: hydrateSlots(
      initialPowerVariantSlots,
      payload.pv ?? [],
      powersById,
    ),
    deviceSlots: hydrateSlots(
      initialDeviceSlots,
      payload.d ?? [],
      powersById,
    ),
    selectedSpecializationTreeIds: normalizeFixedLengthIds(
      payload.st,
      emptySpecializationTreeIds,
    ),
    specializationPointsBySlot: normalizeSpecializationPoints(payload.sp),
    selectedMasterySlot: payload.m,
    camsLevel: payload.c,
  };
}

export function createShareUrl(serializedBuild: string) {
  const url = new URL(window.location.href);

  url.searchParams.set("build", serializedBuild);

  return url.toString();
}
