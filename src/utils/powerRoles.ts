import type { Power } from "@/types/powers";
import { getNormalizedPowerType } from "@/shared/utils/powerTypes";

const powerTypeRoleRules: Array<[string, string[]]> = [
  ["ACTIVE_DEFENSE", ["Active Defense"]],
  ["ACTIVE_OFFENSE", ["Active Offense"]],
  ["ACTIVE_POWERS", ["Active Offense", "Active Defense"]],
  ["ALLY_HEAL", ["Heal / Shield"]],
  ["BLOCK", ["Block"]],
  ["BUFF_SELF", ["Buff / Debuff"]],
  ["BUFF_TARGETS", ["Buff / Debuff"]],
  ["CIRCLE", ["Buff / Debuff"]],
  ["CONTROLLABLE_PET", ["Pet"]],
  ["CROWD_CONTROL", ["Crowd Control"]],
  ["DEBUFF", ["Buff / Debuff"]],
  ["DEVICE", ["Device"]],
  ["ENERGY_BUILDER", ["Energy Builder"]],
  ["ENERGY_UNLOCK", ["Energy Unlock"]],
  ["HEAL", ["Heal / Shield"]],
  ["HEAL_OVER_TIME", ["Heal / Shield"]],
  ["LUNGE", ["Lunge"]],
  ["MELEE_RANGED", ["Melee Damage", "Ranged Damage"]],
  ["MELEE_AOE_DAMAGE", ["Melee Damage"]],
  ["MELEE_DAMAGE", ["Melee Damage"]],
  ["ON_NEXT_HIT", ["Buff / Debuff"]],
  ["RANGED_AOE_DAMAGE", ["Ranged Damage"]],
  ["RANGED_DAMAGE", ["Ranged Damage"]],
  ["REVERSE_LUNGE", ["Lunge"]],
  ["REVIVE", ["Resurrection"]],
  ["SELF_HEAL", ["Heal / Shield"]],
  ["SELF_HEAL_OVER_TIME", ["Heal / Shield"]],
  ["SELF_RESURRECTION", ["Self Resurrection"]],
  ["SHIELD", ["Heal / Shield"]],
  ["SLOTTED_DEFENSIVE_PASSIVE", ["Slotted Passive"]],
  ["SLOTTED_HYBRID_PASSIVE", ["Slotted Passive"]],
  ["SLOTTED_OFFENSIVE_PASSIVE", ["Slotted Passive"]],
  ["SLOTTED_SUPPORT_PASSIVE", ["Slotted Passive"]],
  ["TEAM_HEAL", ["Heal / Shield"]],
  ["THREAT_WIPE", ["Threat Wipe"]],
  ["TOGGLE_FORM", ["Toggle Form"]],
  ["TRAVEL_POWER", ["Travel Power"]],
  ["UNCONTROLED_PET", ["Pet"]],
];

const powerTypeRoleMap = new Map(powerTypeRoleRules);
const crowdControlTags = new Set([
  "confuse",
  "hold",
  "incapacitate",
  "root",
  "sleep",
  "stun",
]);
const powerRoleOrder = Array.from(
  new Set(powerTypeRoleRules.flatMap(([, roles]) => roles)),
);

function normalizeRuleText(value: string | null | undefined) {
  return value?.replace(/[^a-z0-9]+/giu, " ").trim().toLowerCase() ?? "";
}

function hasAnyNormalizedValue(
  values: string[] | null | undefined,
  expectedValues: ReadonlySet<string>,
) {
  return (values ?? []).some((value) =>
    expectedValues.has(normalizeRuleText(value)),
  );
}

function hasLungeRangeTag(power: Power) {
  return (power.range_tags ?? []).some((rangeTag) =>
    normalizeRuleText(rangeTag).includes("lunge"),
  );
}

export function getPowerRoles(power: Power) {
  const roles = new Set<string>();
  const normalizedPowerType = getNormalizedPowerType(power);

  powerTypeRoleMap.get(normalizedPowerType)?.forEach((role) => roles.add(role));

  if (hasAnyNormalizedValue(power.tags, crowdControlTags)) {
    roles.add("Crowd Control");
  }

  if (hasLungeRangeTag(power)) {
    roles.add("Lunge");
  }

  return powerRoleOrder.filter((role) => roles.has(role));
}

export function getPowerRoleOptions(powers: Power[]) {
  const availableRoles = new Set(powers.flatMap((power) => getPowerRoles(power)));

  return powerRoleOrder
    .filter((role) => availableRoles.has(role))
    .map((role) => ({
      label: role,
      value: role,
    }));
}
