import type { GearMod } from "@/types/gear";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";
import type { BasicGearStatCode } from "./useGearSlots";

type GearFillModsDialogProps = {
  anchor: DialogAnchor;
  mods: GearMod[];
  onClose: () => void;
  onSelectStat: (statCode: BasicGearStatCode) => void;
};

const basicGearStatCodes = [
  "STR",
  "DEX",
  "CON",
  "INT",
  "EGO",
  "PRE",
  "REC",
  "END",
] as const satisfies readonly BasicGearStatCode[];

function getStatIconName(mods: GearMod[], statCode: BasicGearStatCode) {
  const statMod = mods.find(
    (mod) =>
      mod.name === statCode &&
      mod.mod_types.includes("Armoring") &&
      mod.icon_override,
  );

  return statMod?.icon_override
    ? `/gear-icons/${statMod.icon_override}.png`
    : "Any_Generic";
}

export function GearFillModsDialog({
  anchor,
  mods,
  onClose,
  onSelectStat,
}: GearFillModsDialogProps) {
  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Fill gear mods"
      className="power-selection-dialog gear-fill-mods-dialog"
      closeAriaLabel="Close fill mods"
      menuChildren={
        <span className="power-selection-dialog__framework-title">
          Fill Mods
        </span>
      }
      onClose={onClose}
    >
      <div className="power-selection-list gear-fill-mods-dialog__body">
        <section className="power-selection-group">
          <div className="power-selection-grid">
            {basicGearStatCodes.map((statCode) => (
              <button
                className="power-selection-choice gear-fill-mods-dialog__choice"
                key={statCode}
                type="button"
                onClick={() => onSelectStat(statCode)}
              >
                <SpriteIcon name={getStatIconName(mods, statCode)} size={22} />
                <span className="power-selection-choice__label">
                  {statCode}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AnchoredSelectionDialog>
  );
}
