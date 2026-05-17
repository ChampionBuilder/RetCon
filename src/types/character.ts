export type StatBlock = {
  str: number;
  dex: number;
  con: number;
  int: number;
  ego: number;
  pre: number;
  rec: number;
  end: number;
};

export type SuperStat = {
  id: number;
  name: string;
  info: string;
  forms: string[] | null;
  primaryEUs: string[] | null;
  secondaryEUs: string[] | null;
};

export type InnateTalent = {
  id: number;
  name: string;
  overrideTip: string | null;
  stats: StatBlock;
};

export type Talent = {
  id: number;
  name: string;
  stats: StatBlock;
};

export type StatsTalentsData = {
  version: number;
  superStats: SuperStat[];
  innateTalents: InnateTalent[];
  talents: Talent[];
};

export type Archetype = {
  id: number;
  name: string | null;
  unlockType: number | number[];
  group: number;
  superStatList: number[];
  icon: string;
  innateTalent?: number;
  powerList: (number | number[])[] | null;
  specializationTreeList: number[];
  overview: string | null;
  concepts: string | null;
  extra: string | null;
};

export type ArchetypeGroup = {
  id: number;
  name: string | null;
  icon?: string;
  toolTip: string | null;
  extra?: string;
};

export type ArchetypeUnlock = {
  id: number;
  info: string | null;
};

export type ArchetypesData = {
  version: number;
  archetypeGroups: ArchetypeGroup[];
  archetypeUnlocks: ArchetypeUnlock[];
  archetypes: Archetype[];
};

export type Specialization = {
  id: number;
  tier: number;
  maxPoints: number;
  name: string;
  icon: string;
  tip: string;
};

export type SpecializationTree = {
  id: number;
  name: string;
  superStat: string | null;
  icon: string;
  tip: string;
  specializationList: Specialization[];
};

export type SpecializationTreesData = {
  version: number;
  specializationTrees: SpecializationTree[];
};
