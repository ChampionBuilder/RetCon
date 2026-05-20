const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "src", "legacy-import-data", "json");

const SOURCE_PATHS = {
  hcDataV37: path.join(ROOT, "work_data", "HeroCreator", "js", "hc-data.js"),
  hcDataV38: path.join(ROOT, "work_data", "HeroBuilder", "hc-data.js"),
  phCore: path.join(ROOT, "work_data", "powerhouse-master", "powerhouse.js"),
  phData: path.join(ROOT, "work_data", "powerhouse-master", "powerhouse-data.js"),
  phVersion: path.join(
    ROOT,
    "work_data",
    "HeroCreator",
    "js",
    "powerhouse-version.js",
  ),
  powerMatchTsv: path.join(
    ROOT,
    "work_data",
    "matching",
    "powerhouse_to_retcon_power_name_match.tsv",
  ),
  advantageMatchTsv: path.join(
    ROOT,
    "work_data",
    "matching",
    "powerhouse_to_retcon_advantage_name_match.tsv",
  ),
};

function numToUrlCode(num) {
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

function urlCodeToNum(code) {
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

function buildPowerCodeLookup(legacyData) {
  const dataPowerIdFromCode = {};

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

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadHeroCreatorData(filePath) {
  return new Function(`${readSource(filePath)}\n; return HCData;`)();
}

function loadPowerhouseData() {
  return new Function(
    `${readSource(SOURCE_PATHS.phData)}
      ; return {
        dataPower,
        dataTravelPower,
        dataFramework,
        dataArchetype,
        dataSuperStat,
        dataInnateTalent,
        dataTalent,
        dataArchetypeGroup,
        dataSpecializationTree
      };`,
  )();
}

function simplifyAdvantages(advantageList) {
  return (advantageList ?? []).map((advantage) =>
    advantage
      ? {
          id: advantage.id,
          name: advantage.name ?? null,
        }
      : null,
  );
}

function simplifyLegacyData(legacyData, version) {
  return {
    version,
    superStat: (legacyData.superStat ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    innateTalent: (legacyData.innateTalent ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    talent: (legacyData.talent ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    travelPower: (legacyData.travelPower ?? []).map((entry) =>
      entry
        ? {
            id: entry.id,
            name: entry.name ?? null,
            advantageList: simplifyAdvantages(entry.advantageList),
          }
        : null,
    ),
    power: (legacyData.power ?? []).map((entry) =>
      entry
        ? {
            id: entry.id,
            name: entry.name ?? null,
            framework: entry.framework,
            power: entry.power,
            tier: entry.tier ?? null,
            advantageList: simplifyAdvantages(entry.advantageList),
            isMultiFrameworkPower: entry.isMultiFrameworkPower ?? false,
          }
        : null,
    ),
    device: (legacyData.device ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    framework: (legacyData.framework ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    archetype: (legacyData.archetype ?? []).map((entry) =>
      entry
        ? {
            id: entry.id,
            name: entry.name ?? null,
            powerList: entry.powerList ?? null,
          }
        : null,
    ),
    archetypeGroup: (legacyData.archetypeGroup ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
    specializationTree: (legacyData.specializationTree ?? []).map((entry) =>
      entry ? { id: entry.id, name: entry.name ?? null } : null,
    ),
  };
}

function getFunctionSource(script, signature) {
  const signatureIndex = script.indexOf(signature);

  if (signatureIndex < 0) {
    throw new Error(`Could not find function signature: ${signature}`);
  }

  const blockStart = script.indexOf("{", signatureIndex);

  if (blockStart < 0) {
    throw new Error(`Could not find function body: ${signature}`);
  }

  let blockDepth = 0;

  for (let index = blockStart; index < script.length; index += 1) {
    const character = script[index];

    if (character === "{") {
      blockDepth += 1;
    } else if (character === "}") {
      blockDepth -= 1;

      if (blockDepth === 0) {
        return script.slice(signatureIndex, index + 1);
      }
    }
  }

  throw new Error(`Could not find function end: ${signature}`);
}

function buildVersionFunctionSources(legacyDataV37) {
  const dataPowerIdFromCodeV37 = buildPowerCodeLookup(legacyDataV37);
  const versionFactory = new Function(
    "numToUrlCode",
    "urlCodeToNum",
    "dataPower",
    "dataArchetype",
    "dataPowerIdFromCode",
    "debug",
    `${readSource(SOURCE_PATHS.phVersion)}\n; return getDataVersionUpdate();`,
  );
  const dataVersionUpdate = versionFactory(
    numToUrlCode,
    urlCodeToNum,
    legacyDataV37.power,
    legacyDataV37.archetype,
    dataPowerIdFromCodeV37,
    false,
  );

  return dataVersionUpdate.map((entry) => String(entry.funct));
}

function parseTsv(filePath) {
  const lines = readSource(filePath)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split("\t");

  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    return record;
  });
}

function parsePipeSeparatedIds(value) {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((part) => Number.parseInt(part, 10))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function buildMatchMaps() {
  const powerByLegacyId = {};
  const powerByName = {};
  const advantageByName = {};

  for (const row of parseTsv(SOURCE_PATHS.powerMatchTsv)) {
    const sourceType = row.source_type;
    const sourceLegacyPowerId = Number.parseInt(
      row.source_powerhouse_id ?? "",
      10,
    );
    const normalizedName = row.normalized_name;
    const targetIds = parsePipeSeparatedIds(row.target_retcon_power_ids);

    if (
      (sourceType !== "combat" &&
        sourceType !== "travel" &&
        sourceType !== "device") ||
      !normalizedName ||
      targetIds.length === 0
    ) {
      continue;
    }

    if (Number.isFinite(sourceLegacyPowerId) && sourceLegacyPowerId > 0) {
      powerByLegacyId[`${sourceType}:${sourceLegacyPowerId}`] = {
        sourceNormalizedName: normalizedName,
        targetIds,
      };
    }

    powerByName[`${sourceType}:${normalizedName}`] = targetIds;
  }

  for (const row of parseTsv(SOURCE_PATHS.advantageMatchTsv)) {
    const normalizedName = row.normalized_name;
    const targetIds = parsePipeSeparatedIds(row.target_retcon_advantage_ids);

    if (!normalizedName || targetIds.length === 0) {
      continue;
    }

    advantageByName[normalizedName] = targetIds;
  }

  return {
    advantageByName,
    powerByLegacyId,
    powerByName,
  };
}

function writeJson(fileName, value) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, fileName),
    `${JSON.stringify(value)}\n`,
    "utf8",
  );
}

function main() {
  const legacyDataV37 = loadHeroCreatorData(SOURCE_PATHS.hcDataV37);
  const legacyDataV38 = loadHeroCreatorData(SOURCE_PATHS.hcDataV38);
  const powerhouseData = loadPowerhouseData();
  const legacyDataPowerhouse = {
    archetype: powerhouseData.dataArchetype,
    archetypeGroup: powerhouseData.dataArchetypeGroup,
    device: [],
    framework: powerhouseData.dataFramework,
    innateTalent: powerhouseData.dataInnateTalent,
    power: powerhouseData.dataPower,
    specializationTree: powerhouseData.dataSpecializationTree,
    superStat: powerhouseData.dataSuperStat,
    talent: powerhouseData.dataTalent,
    travelPower: powerhouseData.dataTravelPower,
    version: 2,
  };

  writeJson("legacy-import-data.json", {
    hcDataV37: simplifyLegacyData(legacyDataV37, legacyDataV37.version),
    hcDataV38: simplifyLegacyData(legacyDataV38, legacyDataV38.version),
    phBalakParser: {
      source: getFunctionSource(
        readSource(SOURCE_PATHS.phCore),
        "function parseBalakUrlParams(url)",
      ),
    },
    phData: simplifyLegacyData(legacyDataPowerhouse, 2),
    phMatchMaps: buildMatchMaps(),
    phVersionFunctions: {
      functionSources: buildVersionFunctionSources(legacyDataV37),
    },
  });

  console.log(`Generated legacy import JSON in ${OUTPUT_DIR}`);
}

main();
