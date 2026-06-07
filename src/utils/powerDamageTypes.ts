import type { Advantage } from "@/types/advantages";
import type { Power } from "@/types/powers";

type DamageTypeSource = Pick<Power, "damage_type" | "damage_types">;

const preferredDamageTypeOrder = [
  "Cold",
  "Crushing",
  "Dimensional",
  "Ego",
  "Electrical",
  "Fire",
  "Magic",
  "Particle",
  "Piercing",
  "Slashing",
  "Sonic",
  "Toxic",
];

const damageTypeAliases: Record<string, string> = {
  dimentional: "dimensional",
};

function normalizeDamageType(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return damageTypeAliases[normalizedValue] ?? normalizedValue;
}

function formatDamageType(value: string) {
  const normalizedValue = normalizeDamageType(value);

  return (
    preferredDamageTypeOrder.find(
      (damageType) => normalizeDamageType(damageType) === normalizedValue,
    ) ?? value.trim()
  );
}

function toDamageTypeValues(value: string | string[] | null | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((damageType) => String(damageType).split(":"))
    .map(formatDamageType)
    .filter(Boolean);
}

function getDamageTypes(source: DamageTypeSource) {
  return Array.from(
    new Set([
      ...toDamageTypeValues(source.damage_type),
      ...toDamageTypeValues(source.damage_types),
    ]),
  );
}

export function getPowerDamageTypes(power: Power) {
  return getDamageTypes(power);
}

export function getAdvantageDamageTypes(advantage: Advantage) {
  return getDamageTypes(advantage);
}

export function getDamageTypeOptions(
  powers: Power[],
  advantages: Advantage[] = [],
) {
  const availableDamageTypes = new Set(
    [
      ...powers.flatMap((power) => getPowerDamageTypes(power)),
      ...advantages.flatMap((advantage) => getAdvantageDamageTypes(advantage)),
    ],
  );
  const preferredOptions = preferredDamageTypeOrder.filter((damageType) =>
    availableDamageTypes.has(damageType),
  );
  const extraOptions = Array.from(availableDamageTypes)
    .filter((damageType) => !preferredDamageTypeOrder.includes(damageType))
    .sort((a, b) => a.localeCompare(b));

  return [...preferredOptions, ...extraOptions];
}
