import {
  initialArchetypeBuildSlots,
  initialBuildSlots,
  initialDeviceSlots,
  initialPowerVariantSlots,
  initialTravelPowerSlots,
} from "@/constants/buildSlots";
import type { BuildSlot } from "@/types/builds";
import type {
  ArchetypesData,
  SpecializationTreesData,
  StatsTalentsData,
} from "@/types/character";
import type { Advantage } from "@/types/advantages";
import type { Power } from "@/types/powers";
import { isPowerVariantDevice, isStandardDevice, isTravelPower } from "@/utils/powerFrameworks";
import { getPowerDisplayFrameworkId } from "@/utils/powerFrameworks";
import { createEmptySpecializationPoints } from "@/features/specializations";

type LegacyVersionUpdate = {
  funct: (thing: string, value: Record<string, unknown>) => unknown;
};

type LegacyPowerEntry = {
  id: number;
  name: string | null;
  framework: number;
  power: number;
  tier?: number | null;
  advantageList?: Array<{ name: string | null } | null> | null;
  isMultiFrameworkPower?: boolean;
};

type LegacyHCData = {
  version: number;
  superStat: Array<{ id: number; name: string }>;
  innateTalent: Array<{ id: number; name: string | null }>;
  talent: Array<{ id: number; name: string | null }>;
  travelPower: Array<{
    id: number;
    name: string | null;
    advantageList?: Array<{ name: string | null } | null> | null;
  }>;
  power: LegacyPowerEntry[];
  device: Array<{ id: number; name: string | null }>;
  framework: Array<{ id: number; name: string | null }>;
  archetype: Array<{ id: number; name: string | null }>;
  archetypeGroup: Array<{ id: number; name: string | null }>;
  specializationTree: Array<{
    id: number;
    name: string | null;
  }>;
};

type ParsedLegacyBuild = {
  legacyDataVersion: number;
  sourceVersion: number;
  sourceDataLength: number;
  balakConversionApplied: boolean;
  balakConversionReason: string;
  buildName: string;
  archetypeId: number;
  superStatIds: [number, number, number];
  innateTalentId: number;
  talentIds: [number, number, number, number, number, number];
  travelPowers: Array<{ id: number; mask: number }>;
  travelPowersRaw: Array<{
    codes: string;
    legacyId: number;
    mask: number;
  } | null>;
  powers: Array<{ id: number; mask: number }>;
  powersRaw: Array<{
    codes: string;
    powerCode: string;
    framework: number;
    power: number;
    mask: number;
    legacyId: number;
  } | null>;
  specializationMasks: [number, number, number];
  specializationSecondaryTreeIds: [number, number];
  specializationMasterySlot: number;
  roleId: number;
  deviceIds: [number, number, number, number, number];
  deviceIdsRaw: Array<{
    codes: string;
    legacyId: number;
  } | null>;
};

export type LegacyImportBuild = {
  buildName: string;
  selectedArchetypeId: number;
  selectedRoleId: number;
  selectedSuperStatIds: [number, number, number];
  selectedInnateTalentId: number;
  selectedTalentIds: [number, number, number, number, number, number];
  buildSlots: BuildSlot[];
  travelPowerSlots: BuildSlot[];
  powerVariantSlots: BuildSlot[];
  deviceSlots: BuildSlot[];
  selectedSpecializationTreeIds: [number, number, number];
  specializationPointsBySlot: [number[], number[], number[]];
  selectedMasterySlot: number | null;
  camsLevel: number;
};

export type LegacyImportResult = {
  build: LegacyImportBuild;
  warnings: string[];
};

type LegacyEngine = {
  legacyDataV37: LegacyHCData;
  legacyDataV38: LegacyHCData;
  legacyDataPowerhouse: LegacyHCData;
  dataPowerIdFromCodeV37: Record<string, number>;
  dataPowerIdFromCodeV38: Record<string, number>;
  dataPowerIdFromCodePowerhouse: Record<string, number>;
  dataVersionUpdate: LegacyVersionUpdate[];
  parseBalakUrlParams: ((source: string) => string[]) | null;
  powerIdsBySourceTypeAndLegacyId: Map<
    string,
    {
      sourceNormalizedName: string;
      targetIds: number[];
    }
  >;
  powerIdsBySourceTypeAndNormalizedName: Map<string, number[]>;
  advantageIdsByNormalizedName: Map<string, number[]>;
};

type LegacyPowerIdConversion = {
  combatPowerIdByLegacyId: Record<number, number>;
  travelPowerIdByLegacyId: Record<number, number>;
  devicePowerIdByLegacyId: Record<number, number>;
};

type LegacyMatchMapsData = {
  advantageByName: Record<string, number[]>;
  powerByLegacyId: Record<
    string,
    {
      sourceNormalizedName: string;
      targetIds: number[];
    }
  >;
  powerByName: Record<string, number[]>;
};

type LegacyPowerSourceType = "combat" | "travel" | "device";

const defaultImportedBuildName = "Imported HeroCreator Build";
const combatPowerSlotCount = 14;
const travelPowerSlotCount = 2;
const deviceSlotCount = 5;

const importNameAliases = new Map<string, string>([
  ["call to battle", "Call To Battle"],
  ["chainsaw gauntlet", "Gauntlet Chainsaw"],
  ["flashfire", "Flash Fire"],
  ["rise from the ashes", "Rise From the Ashes"],
  ["will-o'-the-wisp", "Will-o'-the-Wisp"],
]);

const roleNameAliases = new Map<string, string>([
  ["freeform", "Any / Multiple"],
  ["melee", "Melee Damage"],
  ["ranged", "Ranged Damage"],
]);

let legacyEnginePromise: Promise<LegacyEngine> | null = null;

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toAliasedName(name: string) {
  const aliasedName = importNameAliases.get(name.toLowerCase());

  return aliasedName ?? name;
}

function numToUrlCode(num: number) {
  if (num >= 0 && num <= 9) {
    return String.fromCharCode(num + 48);
  }

  if (num >= 10 && num <= 35) {
    return String.fromCharCode(num + 55);
  }

  if (num >= 36 && num <= 61) {
    return String.fromCharCode(num + 61);
  }

  throw new Error(`numToUrlCode: num is out of valid range: ${num}`);
}

function numToUrlCode2(num: number) {
  return numToUrlCode(Math.floor(num / 61)) + numToUrlCode(num % 61);
}

function numToUrlCode4(num: number) {
  let result = "";
  let remaining = num;

  for (let index = 3; index >= 0; index -= 1) {
    const divisor = 61 ** index;
    result += numToUrlCode(Math.floor(remaining / divisor));
    remaining %= divisor;
  }

  return result;
}

function urlCodeToNum(code: string) {
  const characterCode = code.charCodeAt(0);

  if (characterCode >= 48 && characterCode <= 57) {
    return characterCode - 48;
  }

  if (characterCode >= 65 && characterCode <= 90) {
    return characterCode - 55;
  }

  if (characterCode >= 97 && characterCode <= 122) {
    return characterCode - 61;
  }

  throw new Error(
    `urlCodeToNum: code is out of valid range: ${code} (${characterCode})`,
  );
}

function urlCodeToNum2(code: string) {
  return urlCodeToNum(code[0] ?? "0") * 61 + urlCodeToNum(code[1] ?? "0");
}

function urlCodeToNum4(code: string) {
  return (
    urlCodeToNum(code[0] ?? "0") * 226981 +
    urlCodeToNum(code[1] ?? "0") * 3721 +
    urlCodeToNum(code[2] ?? "0") * 61 +
    urlCodeToNum(code[3] ?? "0")
  );
}

function buildPowerCodeLookup(legacyData: LegacyHCData) {
  const dataPowerIdFromCode: Record<string, number> = {};

  legacyData.power.forEach((power, index) => {
    if (
      !power ||
      typeof power.framework !== "number" ||
      typeof power.power !== "number"
    ) {
      return;
    }

    const powerCode = numToUrlCode(power.framework) + numToUrlCode(power.power);
    dataPowerIdFromCode[powerCode] = index;
  });

  return dataPowerIdFromCode;
}

function parseBalakOverrideFlag(value: string | null) {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (
    normalizedValue === "1" ||
    normalizedValue === "true" ||
    normalizedValue === "on"
  ) {
    return true;
  }

  if (
    normalizedValue === "0" ||
    normalizedValue === "false" ||
    normalizedValue === "off"
  ) {
    return false;
  }

  return null;
}

function getLegacyDataForVersion(engine: LegacyEngine, version: number) {
  return version >= engine.legacyDataV38.version
    ? engine.legacyDataV38
    : engine.legacyDataV37;
}

function getPowerCodeLookupForVersion(engine: LegacyEngine, version: number) {
  return version >= engine.legacyDataV38.version
    ? engine.dataPowerIdFromCodeV38
    : engine.dataPowerIdFromCodeV37;
}

function getImportLegacyData(engine: LegacyEngine, parsedBuild: ParsedLegacyBuild) {
  if (parsedBuild.balakConversionApplied) {
    return engine.legacyDataPowerhouse;
  }

  return getLegacyDataForVersion(engine, parsedBuild.legacyDataVersion);
}

function getDirectSourceLegacyData(engine: LegacyEngine, parsedBuild: ParsedLegacyBuild) {
  return getLegacyDataForVersion(engine, parsedBuild.sourceVersion);
}

async function loadLegacyEngine() {
  if (legacyEnginePromise) {
    return legacyEnginePromise;
  }

  legacyEnginePromise = import("@/legacy-import-data/index").then(({
    legacyImportData,
  }) => {
    const legacyDataV37 = legacyImportData.hcDataV37 as unknown as LegacyHCData;
    const legacyDataV38 = legacyImportData.hcDataV38 as unknown as LegacyHCData;
    const legacyDataPowerhouse =
      legacyImportData.phData as unknown as LegacyHCData;
    const dataPowerIdFromCodeV37 = buildPowerCodeLookup(legacyDataV37);
    const dataPowerIdFromCodeV38 = buildPowerCodeLookup(legacyDataV38);
    const dataPowerIdFromCodePowerhouse = buildPowerCodeLookup(
      legacyDataPowerhouse,
    );

    const dataVersionUpdate =
      legacyImportData.phVersionFunctions.functionSources.map(
        (functionSource): LegacyVersionUpdate => ({
          funct: new Function(
            "numToUrlCode",
            "urlCodeToNum",
            "dataPower",
            "dataArchetype",
            "dataPowerIdFromCode",
            "debug",
            `return (${functionSource});`,
          )(
            numToUrlCode,
            urlCodeToNum,
            legacyDataV37.power,
            legacyDataV37.archetype,
            dataPowerIdFromCodeV37,
            false,
          ) as LegacyVersionUpdate["funct"],
        }),
      );
    const parseBalakSource = legacyImportData.phBalakParser.source;
    const parseBalakUrlParams = parseBalakSource
      ? (new Function(
          "numToUrlCode",
          "numToUrlCode2",
          "numToUrlCode4",
          "urlCodeToNum",
          "urlCodeToNum2",
          "urlCodeToNum4",
          "dataPowerIdFromCode",
          "dataArchetype",
          `
            let phName = "";
            let phArchetype = null;
            const document = { getElementById: () => ({ firstChild: { data: "" } }) };
            ${parseBalakSource}
            return parseBalakUrlParams;
          `,
        )(
          numToUrlCode,
          numToUrlCode2,
          numToUrlCode4,
          urlCodeToNum,
          urlCodeToNum2,
          urlCodeToNum4,
          dataPowerIdFromCodeV37,
          legacyDataV37.archetype,
        ) as (source: string) => string[])
      : null;
    const matchMaps =
      legacyImportData.phMatchMaps as unknown as LegacyMatchMapsData;
    const powerIdsBySourceTypeAndLegacyId = new Map<
      string,
      {
        sourceNormalizedName: string;
        targetIds: number[];
      }
    >(
      Object.entries(matchMaps.powerByLegacyId),
    );
    const powerIdsBySourceTypeAndNormalizedName = new Map<string, number[]>(
      Object.entries(matchMaps.powerByName),
    );
    const advantageIdsByNormalizedName = new Map<string, number[]>(
      Object.entries(matchMaps.advantageByName),
    );

    return {
      advantageIdsByNormalizedName,
      dataPowerIdFromCodePowerhouse,
      dataPowerIdFromCodeV37,
      dataPowerIdFromCodeV38,
      dataVersionUpdate,
      legacyDataPowerhouse,
      legacyDataV37,
      legacyDataV38,
      parseBalakUrlParams,
      powerIdsBySourceTypeAndLegacyId,
      powerIdsBySourceTypeAndNormalizedName,
    };
  });

  return legacyEnginePromise;
}

function applyVersionUpdate(
  engine: LegacyEngine,
  legacyData: LegacyHCData,
  version: number,
  thing: string,
  value: Record<string, unknown>,
) {
  let result = value[thing];

  if (version < legacyData.version && version < engine.dataVersionUpdate.length) {
    const updateFunction = engine.dataVersionUpdate[version]?.funct;

    if (typeof updateFunction === "function") {
      result = updateFunction(thing, value);
      value[thing] = result;
    }
  }

  return result;
}

function getLegacyQueryParams(source: string) {
  const trimmedSource = source.trim();

  if (trimmedSource.length === 0) {
    return null;
  }

  if (/^[0-9A-Za-z]+$/u.test(trimmedSource)) {
    return new URLSearchParams(`d=${trimmedSource}`);
  }

  const sourceWithoutHash = trimmedSource.split("#")[0] ?? trimmedSource;

  if (sourceWithoutHash.includes("://")) {
    try {
      const url = new URL(sourceWithoutHash);

      return url.searchParams;
    } catch {
      return null;
    }
  }

  const querySegment = sourceWithoutHash.includes("?")
    ? sourceWithoutHash.split("?")[1]
    : sourceWithoutHash;

  if (!querySegment) {
    return null;
  }

  return new URLSearchParams(querySegment);
}

function parseLegacyBuildWithMode(
  source: string,
  engine: LegacyEngine,
  forcedBalakOverride: boolean | null = null,
): ParsedLegacyBuild {
  const params = getLegacyQueryParams(source);

  if (!params) {
    throw new Error("Invalid import input.");
  }

  const dataParam = params.get("d");

  if (!dataParam) {
    throw new Error("Missing `d` parameter in legacy build URL.");
  }

  const parsedVersion = Number.parseInt(params.get("v") ?? "", 10);
  const sourceVersion = Number.isFinite(parsedVersion)
    ? parsedVersion
    : engine.legacyDataV37.version;
  let version = sourceVersion;
  const buildName = params.get("n") ?? defaultImportedBuildName;
  let archetype = Number.parseInt(params.get("a") ?? "1", 10);

  if (!Number.isFinite(archetype) || archetype < 0) {
    archetype = 1;
  }

  let data = dataParam.split("");
  let legacyData = getLegacyDataForVersion(engine, version);
  let dataPowerIdFromCode = getPowerCodeLookupForVersion(engine, version);
  const balakOverrideFromSource = parseBalakOverrideFlag(params.get("balak"));
  const balakOverride =
    forcedBalakOverride === null ? balakOverrideFromSource : forcedBalakOverride;

  const parseBalakUrlParams = engine.parseBalakUrlParams;
  const canUseBalakParser = version === 38 && parseBalakUrlParams !== null;
  const shouldApplyBalakConversion =
    canUseBalakParser && balakOverride === true;
  let balakConversionReason: string;

  if (!canUseBalakParser) {
    balakConversionReason =
      version !== 38 ? `sourceVersion=${version} (not 38)` : "balak parser unavailable";
  } else if (balakOverride !== null) {
    balakConversionReason = `forced by balak=${balakOverride ? "1" : "0"}`;
  } else {
    balakConversionReason = "default off (set balak=1 to force)";
  }

  if (shouldApplyBalakConversion) {
    const balakSource = source.includes("?")
      ? source
      : `?${params.toString()}`;

    version = 2;
    data = parseBalakUrlParams(balakSource);
    legacyData = engine.legacyDataPowerhouse;
    dataPowerIdFromCode = engine.dataPowerIdFromCodePowerhouse;
  } else if (version > legacyData.version) {
    version = legacyData.version;
  }

  const parsedBuild: ParsedLegacyBuild = {
    legacyDataVersion: legacyData.version,
    sourceVersion,
    sourceDataLength: dataParam.length,
    balakConversionApplied: shouldApplyBalakConversion,
    balakConversionReason,
    archetypeId: archetype,
    buildName,
    deviceIds: [0, 0, 0, 0, 0],
    deviceIdsRaw: Array.from({ length: deviceSlotCount }, () => null),
    innateTalentId: 0,
    powers: Array.from({ length: combatPowerSlotCount }, () => ({ id: 0, mask: 0 })),
    powersRaw: Array.from({ length: combatPowerSlotCount }, () => null),
    roleId: 0,
    specializationMasks: [0, 0, 0],
    specializationMasterySlot: 0,
    specializationSecondaryTreeIds: [0, 0],
    superStatIds: [0, 0, 0],
    talentIds: [0, 0, 0, 0, 0, 0],
    travelPowers: Array.from({ length: travelPowerSlotCount }, () => ({ id: 0, mask: 0 })),
    travelPowersRaw: Array.from({ length: travelPowerSlotCount }, () => null),
  };

  while (version <= legacyData.version) {
    const isFinalVersion = version === legacyData.version;
    let position = 0;
    let dataIndex = 0;
    let increment = 1;
    let activeArchetype = parsedBuild.archetypeId || 1;
    let specializationMasterySlot = 0;

    data = applyVersionUpdate(engine, legacyData, version, "data", {
      type: "init",
      data,
      pos: position,
      i: dataIndex,
      inc: increment,
      archetype: activeArchetype,
    }) as string[];

    while (dataIndex < data.length) {
      position = applyVersionUpdate(engine, legacyData, version, "pos", {
        type: "start",
        pos: position,
        i: dataIndex,
        inc: increment,
        archetype: activeArchetype,
      }) as number;
      dataIndex = applyVersionUpdate(engine, legacyData, version, "i", {
        type: "start",
        pos: position,
        i: dataIndex,
        inc: increment,
        archetype: activeArchetype,
      }) as number;

      switch (position) {
        case 0: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "archetype",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            archetype: activeArchetype,
          }) as string;
          activeArchetype = urlCodeToNum(code1);
          activeArchetype = applyVersionUpdate(engine, legacyData, version, "archetype", {
            type: "archetype",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            archetype: activeArchetype,
          }) as number;
          data[dataIndex] = numToUrlCode(activeArchetype);

          if (isFinalVersion) {
            parsedBuild.archetypeId = activeArchetype;
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "archetype",
            pos: position,
            i: dataIndex,
            inc: 1,
            code1,
            archetype: activeArchetype,
          }) as number;
          break;
        }
        case 1:
        case 2:
        case 3: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "superStat",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            archetype: activeArchetype,
          }) as string;
          let superStatId = urlCodeToNum(code1);
          superStatId = applyVersionUpdate(engine, legacyData, version, "superStat", {
            type: "superStat",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            archetype: activeArchetype,
            superStat: superStatId,
          }) as number;
          data[dataIndex] = numToUrlCode(superStatId);

          if (isFinalVersion) {
            parsedBuild.superStatIds[position - 1] = superStatId;
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "superStat",
            pos: position,
            i: dataIndex,
            inc: 1,
            code1,
            archetype: activeArchetype,
            superStat: superStatId,
          }) as number;
          break;
        }
        case 4: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "innateTalent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code2 = applyVersionUpdate(engine, legacyData, version, "code2", {
            type: "innateTalent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            archetype: activeArchetype,
          }) as string;
          let innateTalentId = urlCodeToNum2(code1 + code2);
          innateTalentId = applyVersionUpdate(engine, legacyData, version, "innateTalent", {
            type: "innateTalent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            archetype: activeArchetype,
            innateTalent: innateTalentId,
          }) as number;
          const innateTalentCode = numToUrlCode2(innateTalentId);
          data[dataIndex] = innateTalentCode[0] ?? "0";
          data[dataIndex + 1] = innateTalentCode[1] ?? "0";
          increment = 2;

          if (isFinalVersion) {
            parsedBuild.innateTalentId = innateTalentId;
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "innateTalent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            archetype: activeArchetype,
            innateTalent: innateTalentId,
          }) as number;
          break;
        }
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "talent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            archetype: activeArchetype,
          }) as string;
          let talentId = urlCodeToNum(code1);
          talentId = applyVersionUpdate(engine, legacyData, version, "talent", {
            type: "talent",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            archetype: activeArchetype,
            talent: talentId,
          }) as number;
          data[dataIndex] = numToUrlCode(talentId);

          if (isFinalVersion) {
            parsedBuild.talentIds[position - 5] = talentId;
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "talent",
            pos: position,
            i: dataIndex,
            inc: 1,
            code1,
            archetype: activeArchetype,
            talent: talentId,
          }) as number;
          break;
        }
        case 11:
        case 12: {
          let code1: string;
          let code2: string;
          let travelPowerId: number;
          let mask: number;

          if (version < 20) {
            code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1: data[dataIndex] ?? "0",
              code2: data[dataIndex + 1] ?? "0",
              archetype: activeArchetype,
            }) as string;
            code2 = applyVersionUpdate(engine, legacyData, version, "code2", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1: data[dataIndex] ?? "0",
              code2: data[dataIndex + 1] ?? "0",
              archetype: activeArchetype,
            }) as string;
            travelPowerId = urlCodeToNum(code1);
            travelPowerId = applyVersionUpdate(engine, legacyData, version, "travelPower", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1,
              code2,
              archetype: activeArchetype,
              travelPower: travelPowerId,
            }) as number;
            mask = urlCodeToNum(code2) << 1;
            mask = applyVersionUpdate(engine, legacyData, version, "mask", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1,
              code2,
              archetype: activeArchetype,
              travelPower: travelPowerId,
              mask,
            }) as number;

            data[dataIndex] = numToUrlCode(travelPowerId);
            data[dataIndex + 1] = numToUrlCode(mask >> 1);
            increment = 2;
          } else {
            code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1: data[dataIndex] ?? "0",
              code2: data[dataIndex + 1] ?? "0",
              code3: data[dataIndex + 2] ?? "0",
              archetype: activeArchetype,
            }) as string;
            code2 = applyVersionUpdate(engine, legacyData, version, "code2", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1: data[dataIndex] ?? "0",
              code2: data[dataIndex + 1] ?? "0",
              code3: data[dataIndex + 2] ?? "0",
              archetype: activeArchetype,
            }) as string;
            const code3 = applyVersionUpdate(engine, legacyData, version, "code3", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1: data[dataIndex] ?? "0",
              code2: data[dataIndex + 1] ?? "0",
              code3: data[dataIndex + 2] ?? "0",
              archetype: activeArchetype,
            }) as string;
            travelPowerId = urlCodeToNum2(code1 + code2);
            travelPowerId = applyVersionUpdate(engine, legacyData, version, "travelPower", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1,
              code2,
              archetype: activeArchetype,
              travelPower: travelPowerId,
            }) as number;
            mask = urlCodeToNum(code3) << 1;
            mask = applyVersionUpdate(engine, legacyData, version, "mask", {
              type: "travelPower",
              pos: position,
              i: dataIndex,
              inc: increment,
              code1,
              code2,
              code3,
              archetype: activeArchetype,
              travelPower: travelPowerId,
              mask,
            }) as number;
            const travelPowerCode = numToUrlCode2(travelPowerId);
            data[dataIndex] = travelPowerCode[0] ?? "0";
            data[dataIndex + 1] = travelPowerCode[1] ?? "0";
            data[dataIndex + 2] = numToUrlCode(mask >> 1);
            increment = 3;
          }

          if (isFinalVersion) {
            const travelCodes = version < 20 ? `${code1}${code2}` : `${code1}${code2}${data[dataIndex + 2] ?? "0"}`;
            const travelSlotIndex = position - 11;

            parsedBuild.travelPowers[travelSlotIndex] = {
              id: travelPowerId,
              mask,
            };
            parsedBuild.travelPowersRaw[travelSlotIndex] = {
              codes: travelCodes,
              legacyId: travelPowerId,
              mask,
            };
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "travelPower",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            archetype: activeArchetype,
            travelPower: travelPowerId,
            mask,
          }) as number;
          break;
        }
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
        case 23:
        case 24:
        case 25:
        case 26: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code2 = applyVersionUpdate(engine, legacyData, version, "code2", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code3 = applyVersionUpdate(engine, legacyData, version, "code3", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code4 = applyVersionUpdate(engine, legacyData, version, "code4", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const framework = applyVersionUpdate(engine, legacyData, version, "framework", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            framework: Number.parseInt(String(urlCodeToNum(code1)), 10),
            power: Number.parseInt(String(urlCodeToNum(code2)), 10),
            mask: urlCodeToNum2(code3 + code4) << 1,
          }) as number;
          const power = applyVersionUpdate(engine, legacyData, version, "power", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            framework: Number.parseInt(String(urlCodeToNum(code1)), 10),
            power: Number.parseInt(String(urlCodeToNum(code2)), 10),
            mask: urlCodeToNum2(code3 + code4) << 1,
          }) as number;
          const mask = applyVersionUpdate(engine, legacyData, version, "mask", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            framework: Number.parseInt(String(urlCodeToNum(code1)), 10),
            power: Number.parseInt(String(urlCodeToNum(code2)), 10),
            mask: urlCodeToNum2(code3 + code4) << 1,
          }) as number;
          const powerCode = numToUrlCode(framework) + numToUrlCode(power);
          const powerId = dataPowerIdFromCode[powerCode] ?? 0;
          const maskCode = numToUrlCode2(mask >> 1);

          data[dataIndex] = numToUrlCode(framework);
          data[dataIndex + 1] = numToUrlCode(power);
          data[dataIndex + 2] = maskCode[0] ?? "0";
          data[dataIndex + 3] = maskCode[1] ?? "0";

          if (isFinalVersion) {
            const powerSlotIndex = position - 13;
            parsedBuild.powers[powerSlotIndex] = { id: powerId, mask };
            parsedBuild.powersRaw[powerSlotIndex] = {
              codes: `${code1}${code2}${code3}${code4}`,
              powerCode,
              framework,
              power,
              mask,
              legacyId: powerId,
            };
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "power",
            pos: position,
            i: dataIndex,
            inc: 4,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            framework,
            power,
            mask,
          }) as number;
          break;
        }
        case 27:
        case 28:
        case 29: {
          const code1 = applyVersionUpdate(engine, legacyData, version, "code1", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code2 = applyVersionUpdate(engine, legacyData, version, "code2", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code3 = applyVersionUpdate(engine, legacyData, version, "code3", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const code4 = applyVersionUpdate(engine, legacyData, version, "code4", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1: data[dataIndex] ?? "0",
            code2: data[dataIndex + 1] ?? "0",
            code3: data[dataIndex + 2] ?? "0",
            code4: data[dataIndex + 3] ?? "0",
            archetype: activeArchetype,
          }) as string;
          const decodedNumber = Number.parseInt(
            String(urlCodeToNum4(code1 + code2 + code3 + code4)),
            10,
          );
          let specializationMask = decodedNumber >> 4;
          let specializationTreeCode = decodedNumber & ~(specializationMask << 4);

          specializationTreeCode = applyVersionUpdate(engine, legacyData, version, "specializationTree", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            specializationTree: specializationTreeCode,
            specialization: specializationMask,
          }) as number;
          specializationMask = applyVersionUpdate(engine, legacyData, version, "specialization", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: increment,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            specializationTree: specializationTreeCode,
            specialization: specializationMask,
          }) as number;

          const specializationCode = numToUrlCode4(
            (specializationMask << 4) + specializationTreeCode,
          );
          data[dataIndex] = specializationCode[0] ?? "0";
          data[dataIndex + 1] = specializationCode[1] ?? "0";
          data[dataIndex + 2] = specializationCode[2] ?? "0";
          data[dataIndex + 3] = specializationCode[3] ?? "0";

          if (isFinalVersion) {
            const specializationSlot = position - 27;
            parsedBuild.specializationMasks[specializationSlot] = specializationMask;

            if (specializationSlot === 0) {
              specializationMasterySlot = specializationTreeCode;
            } else {
              parsedBuild.specializationSecondaryTreeIds[
                specializationSlot - 1
              ] = specializationTreeCode === 0 ? 0 : specializationTreeCode + 8;
            }
          }

          increment = applyVersionUpdate(engine, legacyData, version, "inc", {
            type: "specialization",
            pos: position,
            i: dataIndex,
            inc: 4,
            code1,
            code2,
            code3,
            code4,
            archetype: activeArchetype,
            specializationTree: specializationTreeCode,
            specialization: specializationMask,
          }) as number;
          break;
        }
        case 30: {
          if (isFinalVersion) {
            parsedBuild.roleId = urlCodeToNum(data[dataIndex] ?? "0");
          }

          increment = 1;
          break;
        }
        case 31:
        case 32:
        case 33:
        case 34:
        case 35: {
          if (isFinalVersion) {
            const code1 = data[dataIndex] ?? "0";
            const code2 = data[dataIndex + 1] ?? "0";
            const deviceId = urlCodeToNum2(code1 + code2);
            const deviceSlotIndex = position - 31;
            parsedBuild.deviceIds[deviceSlotIndex] = deviceId;
            parsedBuild.deviceIdsRaw[deviceSlotIndex] = {
              codes: `${code1}${code2}`,
              legacyId: deviceId,
            };
          }

          increment = 2;
          break;
        }
        default: {
          increment = 1;
          break;
        }
      }

      dataIndex += increment;
      position += 1;
    }

    if (isFinalVersion) {
      parsedBuild.specializationMasterySlot = specializationMasterySlot;
    }

    version += 1;
  }

  return parsedBuild;
}

function getParsedBuildSignalScore(parsedBuild: ParsedLegacyBuild) {
  const nonEmptyPowerCount = parsedBuild.powers.reduce((count, powerSlot) => {
    return powerSlot.id > 0 ? count + 1 : count;
  }, 0);
  const nonEmptyTravelCount = parsedBuild.travelPowers.reduce((count, powerSlot) => {
    return powerSlot.id > 0 ? count + 1 : count;
  }, 0);
  const nonEmptyDeviceCount = parsedBuild.deviceIds.reduce((count, deviceId) => {
    return deviceId > 0 ? count + 1 : count;
  }, 0);

  return nonEmptyPowerCount * 10 + nonEmptyTravelCount * 3 + nonEmptyDeviceCount;
}

function getParsedBuildPowerCount(parsedBuild: ParsedLegacyBuild) {
  return parsedBuild.powers.reduce((count, powerSlot) => {
    return powerSlot.id > 0 ? count + 1 : count;
  }, 0);
}

function mergeDirectOnlyLegacyDetails(
  targetBuild: ParsedLegacyBuild,
  directBuild: ParsedLegacyBuild,
) {
  targetBuild.travelPowers = directBuild.travelPowers;
  targetBuild.travelPowersRaw = directBuild.travelPowersRaw;
  targetBuild.deviceIds = directBuild.deviceIds;
  targetBuild.deviceIdsRaw = directBuild.deviceIdsRaw;
}

function parseLegacyBuild(source: string, engine: LegacyEngine): ParsedLegacyBuild {
  const params = getLegacyQueryParams(source);

  if (!params) {
    throw new Error("Invalid import input.");
  }

  const hasExplicitBalakOverride = params.has("balak");

  if (hasExplicitBalakOverride) {
    return parseLegacyBuildWithMode(source, engine, null);
  }

  const parsedVersion = Number.parseInt(params.get("v") ?? "", 10);
  const sourceVersion = Number.isFinite(parsedVersion)
    ? parsedVersion
    : engine.legacyDataV37.version;

  if (sourceVersion !== 38 || engine.parseBalakUrlParams === null) {
    return parseLegacyBuildWithMode(source, engine, null);
  }

  const parsedWithBalakOff = parseLegacyBuildWithMode(source, engine, false);
  const parsedWithBalakOn = parseLegacyBuildWithMode(source, engine, true);
  const balakOffScore = getParsedBuildSignalScore(parsedWithBalakOff);
  const balakOnScore = getParsedBuildSignalScore(parsedWithBalakOn);
  const balakOffPowerCount = getParsedBuildPowerCount(parsedWithBalakOff);
  const balakOnPowerCount = getParsedBuildPowerCount(parsedWithBalakOn);

  if (balakOnPowerCount >= balakOffPowerCount && balakOnPowerCount > 0) {
    mergeDirectOnlyLegacyDetails(parsedWithBalakOn, parsedWithBalakOff);
    parsedWithBalakOn.balakConversionReason =
      `auto selected balak=1 (powers on=${balakOnPowerCount}, off=${balakOffPowerCount}; score on=${balakOnScore}, off=${balakOffScore})`;
    return parsedWithBalakOn;
  }

  parsedWithBalakOff.balakConversionReason =
    `auto selected balak=0 (powers off=${balakOffPowerCount}, on=${balakOnPowerCount}; score off=${balakOffScore}, on=${balakOnScore})`;
  return parsedWithBalakOff;
}

function isEmptyRawLegacySlot(codes: string, legacyId: number, mask = 0) {
  return /^0+$/u.test(codes) && legacyId <= 0 && mask <= 0;
}

function getDirectSlotLegacyData(
  parsedBuild: ParsedLegacyBuild,
  legacyData: LegacyHCData,
  directLegacyData: LegacyHCData,
) {
  return parsedBuild.balakConversionApplied ? directLegacyData : legacyData;
}

function appendRawImportDebugWarnings(
  warnings: string[],
  parsedBuild: ParsedLegacyBuild,
  legacyData: LegacyHCData,
  directLegacyData: LegacyHCData,
) {
  warnings.push(
    `[debug] legacyDataVersion=${parsedBuild.legacyDataVersion}`,
  );
  warnings.push(
    `[debug][raw] parser sourceVersion=${parsedBuild.sourceVersion} dataLength=${parsedBuild.sourceDataLength} balakConversion=${parsedBuild.balakConversionApplied ? "on" : "off"} reason="${parsedBuild.balakConversionReason}"`,
  );

  parsedBuild.powersRaw.forEach((rawPower, slotIndex) => {
    if (
      !rawPower ||
      isEmptyRawLegacySlot(rawPower.codes, rawPower.legacyId, rawPower.mask)
    ) {
      return;
    }

    const rawLegacyName = legacyData.power[rawPower.legacyId]?.name ?? "(none)";
    warnings.push(
      `[debug][raw] power slot ${slotIndex + 1}: code=${rawPower.codes} fw=${rawPower.framework} p=${rawPower.power} mask=${rawPower.mask} -> legacy(${rawPower.legacyId}) "${rawLegacyName}"`,
    );
  });

  const directSlotLegacyData = getDirectSlotLegacyData(
    parsedBuild,
    legacyData,
    directLegacyData,
  );

  parsedBuild.travelPowersRaw.forEach((rawTravelPower, slotIndex) => {
    if (
      !rawTravelPower ||
      isEmptyRawLegacySlot(
        rawTravelPower.codes,
        rawTravelPower.legacyId,
        rawTravelPower.mask,
      )
    ) {
      return;
    }

    const rawLegacyName =
      directSlotLegacyData.travelPower[rawTravelPower.legacyId]?.name ??
      "(none)";
    warnings.push(
      `[debug][raw] travel slot ${slotIndex + 1}: code=${rawTravelPower.codes} mask=${rawTravelPower.mask} -> legacy(${rawTravelPower.legacyId}) "${rawLegacyName}"`,
    );
  });

  parsedBuild.deviceIdsRaw.forEach((rawDevice, slotIndex) => {
    if (
      !rawDevice ||
      isEmptyRawLegacySlot(rawDevice.codes, rawDevice.legacyId)
    ) {
      return;
    }

    const rawLegacyName =
      directSlotLegacyData.device[rawDevice.legacyId]?.name ?? "(none)";
    warnings.push(
      `[debug][raw] device slot ${slotIndex + 1}: code=${rawDevice.codes} -> legacy(${rawDevice.legacyId}) "${rawLegacyName}"`,
    );
  });
}

function mapLegacyAdvantageMaskToCurrent(
  mask: number,
  legacyAdvantages: Array<{ name: string | null } | null> | null | undefined,
  currentPower: Power,
  advantagesById: Map<number, Advantage>,
  advantageIdsByNormalizedName: Map<string, number[]>,
) {
  const selectedLegacyNames = new Set<string>();
  const selectedLegacyMappedAdvantageIds = new Set<number>();

  (legacyAdvantages ?? []).forEach((legacyAdvantage, index) => {
    if (index === 0 || !legacyAdvantage?.name) {
      return;
    }

    if ((mask & (1 << index)) !== 0) {
      const normalizedLegacyAdvantageName = normalizeText(legacyAdvantage.name);
      selectedLegacyNames.add(normalizedLegacyAdvantageName);
      const mappedAdvantageIds =
        advantageIdsByNormalizedName.get(normalizedLegacyAdvantageName) ?? [];

      mappedAdvantageIds.forEach((mappedAdvantageId) => {
        selectedLegacyMappedAdvantageIds.add(mappedAdvantageId);
      });
    }
  });

  if (
    selectedLegacyNames.size === 0 &&
    selectedLegacyMappedAdvantageIds.size === 0
  ) {
    return [];
  }

  return currentPower.advantages.filter((advantageId) => {
    if (selectedLegacyMappedAdvantageIds.has(advantageId)) {
      return true;
    }

    const advantageName = advantagesById.get(advantageId)?.name;

    return advantageName
      ? selectedLegacyNames.has(normalizeText(advantageName))
      : false;
  });
}

function findPowerByLegacyName(
  powersByName: Map<string, Power[]>,
  powerName: string,
  expectedFrameworkName: string | null,
  expectedType: "combat" | "travel" | "device",
) {
  const aliasedName = toAliasedName(powerName);
  const candidates = powersByName.get(normalizeText(aliasedName)) ?? [];
  const typedCandidates = candidates.filter((candidate) => {
    if (expectedType === "travel") {
      return isTravelPower(candidate);
    }

    if (expectedType === "device") {
      return isStandardDevice(candidate);
    }

    return (
      !isTravelPower(candidate) &&
      !isStandardDevice(candidate) &&
      !isPowerVariantDevice(candidate) &&
      candidate.tier !== null
    );
  });

  if (typedCandidates.length === 0) {
    return null;
  }

  if (!expectedFrameworkName) {
    return typedCandidates[0] ?? null;
  }

  const normalizedExpectedFramework = normalizeText(expectedFrameworkName);

  return (
    typedCandidates.find(
      (candidate) =>
        normalizeText(candidate.framework_id ?? "") ===
        normalizedExpectedFramework,
    ) ??
    typedCandidates[0] ??
    null
  );
}

function getMatchedPowerId(
  sourceType: LegacyPowerSourceType,
  legacyId: number,
  legacyName: string,
  powerIdsBySourceTypeAndLegacyId: LegacyEngine["powerIdsBySourceTypeAndLegacyId"],
  powerIdsBySourceTypeAndNormalizedName: LegacyEngine["powerIdsBySourceTypeAndNormalizedName"],
) {
  const normalizedName = normalizeText(legacyName);
  const mappedPowerEntryByLegacyId =
    powerIdsBySourceTypeAndLegacyId.get(`${sourceType}:${legacyId}`) ?? null;

  if (
    mappedPowerEntryByLegacyId !== null &&
    mappedPowerEntryByLegacyId.targetIds.length > 0 &&
    mappedPowerEntryByLegacyId.sourceNormalizedName === normalizedName
  ) {
    return mappedPowerEntryByLegacyId.targetIds[0];
  }

  return (
    powerIdsBySourceTypeAndNormalizedName.get(
      `${sourceType}:${normalizedName}`,
    )?.[0] ?? 0
  );
}

function buildLegacyPowerIdConversion(
  powerIdsBySourceTypeAndLegacyId: Map<
    string,
    {
      sourceNormalizedName: string;
      targetIds: number[];
    }
  >,
  powerIdsBySourceTypeAndNormalizedName: Map<string, number[]>,
  legacyData: LegacyHCData,
  powersByName: Map<string, Power[]>,
): LegacyPowerIdConversion {
  const combatPowerIdByLegacyId: Record<number, number> = {};
  const travelPowerIdByLegacyId: Record<number, number> = {};
  const devicePowerIdByLegacyId: Record<number, number> = {};

  legacyData.power.forEach((legacyPower, legacyId) => {
    if (!legacyPower?.name) {
      return;
    }

    const mappedPowerId = getMatchedPowerId(
      "combat",
      legacyId,
      legacyPower.name,
      powerIdsBySourceTypeAndLegacyId,
      powerIdsBySourceTypeAndNormalizedName,
    );
    const expectedFrameworkName =
      legacyData.framework[legacyPower.framework]?.name ?? null;
    const currentPower = findPowerByLegacyName(
      powersByName,
      legacyPower.name,
      expectedFrameworkName,
      "combat",
    );

    if (mappedPowerId > 0) {
      combatPowerIdByLegacyId[legacyId] = mappedPowerId;
    } else if (currentPower) {
      combatPowerIdByLegacyId[legacyId] = currentPower.power_id;
    }
  });

  legacyData.travelPower.forEach((legacyTravelPower, legacyId) => {
    if (!legacyTravelPower?.name) {
      return;
    }

    const mappedPowerId = getMatchedPowerId(
      "travel",
      legacyId,
      legacyTravelPower.name,
      powerIdsBySourceTypeAndLegacyId,
      powerIdsBySourceTypeAndNormalizedName,
    );
    const currentPower = findPowerByLegacyName(
      powersByName,
      legacyTravelPower.name,
      null,
      "travel",
    );

    if (mappedPowerId > 0) {
      travelPowerIdByLegacyId[legacyId] = mappedPowerId;
    } else if (currentPower) {
      travelPowerIdByLegacyId[legacyId] = currentPower.power_id;
    }
  });

  legacyData.device.forEach((legacyDevice, legacyId) => {
    if (!legacyDevice?.name) {
      return;
    }

    const mappedPowerId = getMatchedPowerId(
      "device",
      legacyId,
      legacyDevice.name,
      powerIdsBySourceTypeAndLegacyId,
      powerIdsBySourceTypeAndNormalizedName,
    );
    const currentPower = findPowerByLegacyName(
      powersByName,
      legacyDevice.name,
      null,
      "device",
    );

    if (mappedPowerId > 0) {
      devicePowerIdByLegacyId[legacyId] = mappedPowerId;
    } else if (currentPower) {
      devicePowerIdByLegacyId[legacyId] = currentPower.power_id;
    }
  });

  return {
    combatPowerIdByLegacyId,
    travelPowerIdByLegacyId,
    devicePowerIdByLegacyId,
  };
}

function unpackSpecializationPoints(mask: number) {
  const points = createEmptySpecializationPoints();

  for (let index = 0; index < points.length; index += 1) {
    points[index] = (mask >> (index * 2)) & 3;
  }

  return points;
}

function cloneSlots(slots: BuildSlot[]) {
  return slots.map(
    (slot): BuildSlot => ({
      ...slot,
      power: null,
      displayFrameworkId: null,
      selectedAdvantages: [],
    }),
  );
}

function findTreeIdByName(
  specializationTreesData: SpecializationTreesData,
  name: string | null | undefined,
) {
  if (!name) {
    return 0;
  }

  const normalizedName = normalizeText(name);

  return (
    specializationTreesData.specializationTrees.find(
      (tree) => normalizeText(tree.name) === normalizedName,
    )?.id ?? 0
  );
}

export async function importLegacyHeroCreatorBuild(
  source: string,
  {
    advantages,
    archetypesData,
    powers,
    specializationTreesData,
    statsTalentsData,
  }: {
    powers: Power[];
    advantages: Advantage[];
    archetypesData: ArchetypesData | null;
    statsTalentsData: StatsTalentsData | null;
    specializationTreesData: SpecializationTreesData | null;
  },
) {
  if (!archetypesData || !statsTalentsData || !specializationTreesData) {
    throw new Error("Builder data is still loading.");
  }

  const engine = await loadLegacyEngine();
  const debugMode = getLegacyQueryParams(source)?.get("dbg") === "1";
  const parsedBuild = parseLegacyBuild(source, engine);
  const legacyData = getImportLegacyData(engine, parsedBuild);
  const directLegacyData = getDirectSourceLegacyData(engine, parsedBuild);
  const warnings: string[] = [];
  const powersByName = new Map<string, Power[]>();
  const powersById = new Map<number, Power>();
  const advantagesById = new Map(
    advantages.map((advantage) => [advantage.advantage_id, advantage] as const),
  );

  powers.forEach((power) => {
    powersById.set(power.power_id, power);
    const normalizedName = normalizeText(power.name);
    const existingPowers = powersByName.get(normalizedName);

    if (existingPowers) {
      existingPowers.push(power);
      return;
    }

    powersByName.set(normalizedName, [power]);
  });
  const legacyPowerIdConversion = buildLegacyPowerIdConversion(
    engine.powerIdsBySourceTypeAndLegacyId,
    engine.powerIdsBySourceTypeAndNormalizedName,
    legacyData,
    powersByName,
  );

  if (debugMode) {
    appendRawImportDebugWarnings(
      warnings,
      parsedBuild,
      legacyData,
      directLegacyData,
    );
  }

  const currentArchetypesByName = new Map(
    archetypesData.archetypes
      .filter((archetype) => archetype.name !== null)
      .map((archetype) => [
        normalizeText(archetype.name),
        archetype,
      ] as const),
  );
  const legacyArchetypeName =
    legacyData.archetype[parsedBuild.archetypeId]?.name;
  const currentArchetype =
    legacyArchetypeName
      ? currentArchetypesByName.get(normalizeText(legacyArchetypeName))
      : null;
  const selectedArchetypeId = currentArchetype?.id ?? 1;
  const combatSlotsTemplate =
    selectedArchetypeId === 1 ? initialBuildSlots : initialArchetypeBuildSlots;
  const buildSlots = cloneSlots(combatSlotsTemplate);
  const travelPowerSlots = cloneSlots(initialTravelPowerSlots);
  const powerVariantSlots = cloneSlots(initialPowerVariantSlots);
  const deviceSlots = cloneSlots(initialDeviceSlots);

  buildSlots.forEach((slot, slotIndex) => {
    const parsedPower = parsedBuild.powers[slotIndex];

    if (!parsedPower || parsedPower.id <= 0) {
      return;
    }

    const legacyPower = legacyData.power[parsedPower.id];

    if (!legacyPower?.name) {
      warnings.push(`Power slot ${slotIndex + 1}: legacy power id ${parsedPower.id} was not found.`);
      return;
    }

    const mappedCurrentPowerId =
      legacyPowerIdConversion.combatPowerIdByLegacyId[parsedPower.id];
    const expectedFrameworkName =
      legacyData.framework[legacyPower.framework]?.name ?? null;
    const mappedCurrentPower =
      mappedCurrentPowerId > 0 ? (powersById.get(mappedCurrentPowerId) ?? null) : null;
    const currentPower =
      mappedCurrentPower ??
      findPowerByLegacyName(
        powersByName,
        legacyPower.name,
        expectedFrameworkName,
        "combat",
      );

    if (!currentPower) {
      warnings.push(`Power slot ${slotIndex + 1}: "${legacyPower.name}" could not be mapped.`);
      return;
    }

    if (debugMode) {
      warnings.push(
        `[debug] power slot ${slotIndex + 1}: legacy(${parsedPower.id}) "${legacyPower.name}" -> retcon(${currentPower.power_id}) "${currentPower.name}"`,
      );
    }

    slot.power = currentPower;
    slot.displayFrameworkId = getPowerDisplayFrameworkId(currentPower);
    slot.selectedAdvantages = mapLegacyAdvantageMaskToCurrent(
      parsedPower.mask,
      legacyPower.advantageList,
      currentPower,
      advantagesById,
      engine.advantageIdsByNormalizedName,
    );
  });

  const directSlotLegacyData = getDirectSlotLegacyData(
    parsedBuild,
    legacyData,
    directLegacyData,
  );

  travelPowerSlots.forEach((slot, slotIndex) => {
    const parsedTravelPower = parsedBuild.travelPowers[slotIndex];

    if (!parsedTravelPower || parsedTravelPower.id <= 0) {
      return;
    }

    const legacyTravelPower =
      directSlotLegacyData.travelPower[parsedTravelPower.id];

    if (!legacyTravelPower?.name) {
      warnings.push(
        `Travel slot ${slotIndex + 1}: legacy travel power id ${parsedTravelPower.id} was not found.`,
      );
      return;
    }

    const mappedCurrentPowerId =
      legacyPowerIdConversion.travelPowerIdByLegacyId[parsedTravelPower.id];
    const mappedCurrentPower =
      mappedCurrentPowerId > 0 ? (powersById.get(mappedCurrentPowerId) ?? null) : null;
    const currentPower =
      mappedCurrentPower ??
      findPowerByLegacyName(
        powersByName,
        legacyTravelPower.name,
        null,
        "travel",
      );

    if (!currentPower) {
      warnings.push(`Travel slot ${slotIndex + 1}: "${legacyTravelPower.name}" could not be mapped.`);
      return;
    }

    if (debugMode) {
      warnings.push(
        `[debug] travel slot ${slotIndex + 1}: legacy(${parsedTravelPower.id}) "${legacyTravelPower.name}" -> retcon(${currentPower.power_id}) "${currentPower.name}"`,
      );
    }

    slot.power = currentPower;
    slot.displayFrameworkId = getPowerDisplayFrameworkId(currentPower);
    slot.selectedAdvantages = mapLegacyAdvantageMaskToCurrent(
      parsedTravelPower.mask,
      legacyTravelPower.advantageList,
      currentPower,
      advantagesById,
      engine.advantageIdsByNormalizedName,
    );
  });

  deviceSlots.forEach((slot, slotIndex) => {
    const parsedDeviceId = parsedBuild.deviceIds[slotIndex];

    if (!parsedDeviceId || parsedDeviceId <= 0) {
      return;
    }

    const legacyDevice = directSlotLegacyData.device[parsedDeviceId];

    if (!legacyDevice?.name) {
      warnings.push(`Device slot ${slotIndex + 1}: legacy device id ${parsedDeviceId} was not found.`);
      return;
    }

    const mappedCurrentPowerId =
      legacyPowerIdConversion.devicePowerIdByLegacyId[parsedDeviceId];
    const mappedCurrentPower =
      mappedCurrentPowerId > 0 ? (powersById.get(mappedCurrentPowerId) ?? null) : null;
    const currentPower =
      mappedCurrentPower ??
      findPowerByLegacyName(
        powersByName,
        legacyDevice.name,
        null,
        "device",
      );

    if (!currentPower) {
      warnings.push(`Device slot ${slotIndex + 1}: "${legacyDevice.name}" could not be mapped.`);
      return;
    }

    if (debugMode) {
      warnings.push(
        `[debug] device slot ${slotIndex + 1}: legacy(${parsedDeviceId}) "${legacyDevice.name}" -> retcon(${currentPower.power_id}) "${currentPower.name}"`,
      );
    }

    slot.power = currentPower;
    slot.displayFrameworkId = getPowerDisplayFrameworkId(currentPower);
    slot.selectedAdvantages = [];
  });

  const currentStatsByName = new Map(
    statsTalentsData.superStats.map((stat) => [
      normalizeText(stat.name),
      stat.id,
    ] as const),
  );
  const selectedSuperStatIds = parsedBuild.superStatIds.map((legacyStatId) => {
    const legacyStatName = legacyData.superStat[legacyStatId]?.name;

    return legacyStatName
      ? (currentStatsByName.get(normalizeText(legacyStatName)) ?? 0)
      : 0;
  }) as [number, number, number];
  const currentInnateTalentsByName = new Map(
    statsTalentsData.innateTalents.map((talent) => [
      normalizeText(talent.name),
      talent.id,
    ] as const),
  );
  const legacyInnateTalentName =
    legacyData.innateTalent[parsedBuild.innateTalentId]?.name ?? null;
  const selectedInnateTalentId = legacyInnateTalentName
    ? (currentInnateTalentsByName.get(normalizeText(legacyInnateTalentName)) ?? 0)
    : 0;
  const currentTalentsByName = new Map(
    statsTalentsData.talents.map((talent) => [
      normalizeText(talent.name),
      talent.id,
    ] as const),
  );
  const selectedTalentIds = parsedBuild.talentIds.map((legacyTalentId) => {
    const legacyTalentName = legacyData.talent[legacyTalentId]?.name ?? null;

    return legacyTalentName
      ? (currentTalentsByName.get(normalizeText(legacyTalentName)) ?? 0)
      : 0;
  }) as [number, number, number, number, number, number];

  const legacyPrimaryStatName =
    legacyData.superStat[parsedBuild.superStatIds[0]]?.name ?? null;
  const primarySpecializationTreeId = legacyPrimaryStatName
    ? (
        specializationTreesData.specializationTrees.find(
          (tree) => normalizeText(tree.superStat) === normalizeText(legacyPrimaryStatName),
        )?.id ?? 0
      )
    : 0;
  const secondaryTreeNames = parsedBuild.specializationSecondaryTreeIds.map(
    (treeId) => legacyData.specializationTree[treeId]?.name ?? null,
  ) as [string | null, string | null];
  const selectedSpecializationTreeIds: [number, number, number] = [
    primarySpecializationTreeId,
    findTreeIdByName(specializationTreesData, secondaryTreeNames[0]),
    findTreeIdByName(specializationTreesData, secondaryTreeNames[1]),
  ];
  const specializationPointsBySlot: [number[], number[], number[]] = [
    unpackSpecializationPoints(parsedBuild.specializationMasks[0] ?? 0),
    unpackSpecializationPoints(parsedBuild.specializationMasks[1] ?? 0),
    unpackSpecializationPoints(parsedBuild.specializationMasks[2] ?? 0),
  ];
  const selectedMasterySlot =
    parsedBuild.specializationMasterySlot > 0 &&
    parsedBuild.specializationMasterySlot <= 3
      ? parsedBuild.specializationMasterySlot - 1
      : null;
  const legacyRoleName =
    legacyData.archetypeGroup[parsedBuild.roleId]?.name ?? null;
  const resolvedRoleName = legacyRoleName
    ? (roleNameAliases.get(legacyRoleName.toLowerCase()) ?? legacyRoleName)
    : null;
  const selectedRoleId =
    resolvedRoleName
      ? (
          archetypesData.archetypeGroups.find(
            (group) =>
              normalizeText(group.name) === normalizeText(resolvedRoleName),
          )?.id ?? 0
        )
      : 0;

  if (legacyArchetypeName && !currentArchetype) {
    warnings.push(`Archetype "${legacyArchetypeName}" was not found. Imported as Freeform.`);
  }

  return {
    build: {
      buildName: parsedBuild.buildName || defaultImportedBuildName,
      camsLevel: 0,
      buildSlots,
      deviceSlots,
      powerVariantSlots,
      selectedArchetypeId,
      selectedInnateTalentId,
      selectedMasterySlot,
      selectedRoleId,
      selectedSpecializationTreeIds,
      selectedSuperStatIds,
      selectedTalentIds,
      specializationPointsBySlot,
      travelPowerSlots,
    },
    warnings,
  } satisfies LegacyImportResult;
}
