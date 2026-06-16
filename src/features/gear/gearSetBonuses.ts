import type { GearBonus, GearItem, GearSetBonusTier } from "@/types/gear";

function parseTieredBonusEntry(entry: string): GearBonus | null {
  const separatorIndex = entry.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const type = entry.slice(0, separatorIndex).trim();
  const value = entry.slice(separatorIndex + 1).trim();

  if (!type || !value) {
    return null;
  }

  return { type, value };
}

export function parseTieredGearBonuses(
  value: string | null | undefined,
): GearSetBonusTier[] {
  if (!value) {
    return [];
  }

  return String(value)
    .split("|")
    .map((tierText) => tierText.trim())
    .filter(Boolean)
    .flatMap((tierText) => {
      const tierMatch = /^(\d+)\s*=\s*(.+)$/u.exec(tierText);

      if (!tierMatch) {
        return [];
      }

      const pieces = Number(tierMatch[1]);
      const tierBody = tierMatch[2] ?? "";

      if (!Number.isFinite(pieces)) {
        return [];
      }

      const bonuses: GearBonus[] = [];
      const text: string[] = [];

      tierBody
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => {
          const bonus = parseTieredBonusEntry(entry);

          if (bonus) {
            bonuses.push(bonus);
            return;
          }

          text.push(entry);
        });

      return [{ bonuses, pieces, text }];
    });
}

export function getSetPieceBonusTiers(gear: GearItem) {
  return parseTieredGearBonuses(gear.set_piece_bonus);
}

export function getBonusSignature(bonus: GearBonus) {
  return `${bonus.type.trim().toLowerCase()}=${String(bonus.value ?? "")
    .trim()
    .toLowerCase()}`;
}
