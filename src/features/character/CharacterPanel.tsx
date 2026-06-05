import type { MouseEvent } from "react";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import type {
  InnateTalent,
  SuperStat,
  Talent,
} from "@/types/character";
import type { BuildSlot } from "@/types/builds";
import { getPowerIconName, getStatIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import {
  getInnateTalentStatEntries,
  getSelectedStatKeys,
} from "@/utils/innateTalents";
import { getTalentStatEntries } from "@/utils/talents";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type CharacterPanelProps = {
  superStats: (SuperStat | null)[];
  innateTalent: InnateTalent | null;
  talents: (Talent | null)[];
  deviceSlots: BuildSlot[];
  innateTalentLocked: boolean;
  superStatsLocked: boolean;
  onSelectInnateTalent: (anchor: DialogAnchor) => void;
  onSelectSuperStatSlot: (
    slotIndex: number,
    anchor: DialogAnchor,
  ) => void;
  onSelectTalentSlot: (slotIndex: number, anchor: DialogAnchor) => void;
  onSelectDeviceSlot: (slotNumber: number) => void;
  onSelectDeviceName: (slotNumber: number, anchor: DialogAnchor) => void;
  onToggleCollapse: () => void;
  highlightedDeviceTargetSlot: number | null;
};

export function CharacterPanel({
  superStats,
  innateTalent,
  talents,
  deviceSlots,
  innateTalentLocked,
  superStatsLocked,
  onSelectInnateTalent,
  onSelectSuperStatSlot,
  onSelectTalentSlot,
  onSelectDeviceSlot,
  onSelectDeviceName,
  onToggleCollapse,
  highlightedDeviceTargetSlot,
}: CharacterPanelProps) {
  const selectedStatKeys = getSelectedStatKeys(superStats);
  const innateTalentStats = innateTalent
    ? getInnateTalentStatEntries(innateTalent, selectedStatKeys)
    : [];
  const hasDenseInnateTalentStats = innateTalent?.name === "The Hero";

  return (
    <aside className="panel character-panel">
      <h2>
        <button
          className="panel-title-button"
          type="button"
          onClick={onToggleCollapse}
        >
          Character
        </button>
      </h2>

      <div className="character-panel__body">
        <section className="panel-section">
          <h3>Superstats</h3>
          <div className="stat-grid">
            {superStats.map((stat, index) => {
              const role = index === 0 ? "Primary" : `Secondary ${index}`;
              const label = stat
                ? stat.name.slice(0, 3).toUpperCase()
                : index === 0
                  ? "PRI"
                  : `S${index}`;

              return (
                <button
                  className={
                    superStatsLocked
                      ? "stat-token stat-token--locked"
                      : "stat-token"
                  }
                  disabled={superStatsLocked}
                  key={`${role}-${stat?.id ?? "empty"}`}
                  title={stat ? `${stat.name} (${role})` : role}
                  type="button"
                  onClick={(event: MouseEvent<HTMLButtonElement>) =>
                    onSelectSuperStatSlot(index, {
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }
                >
                  <SpriteIcon
                    name={stat ? getStatIconName(stat.name) : "Any_Generic"}
                    size={34}
                  />
                  <span className="stat-token__name">{label}</span>
                  <small>{index === 0 ? "Primary" : "Secondary"}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-section">
          <h3>Innate Talent</h3>
          <button
            className={
              innateTalent
                ? "inline-choice-button"
                : "inline-choice-button inline-choice-button--empty"
            }
            disabled={innateTalentLocked}
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              onSelectInnateTalent({
                x: event.clientX,
                y: event.clientY,
              })
            }
          >
            <span className="inline-choice-button__name">
              {innateTalent?.name ?? "Select innate talent"}
            </span>
            {innateTalent ? (
              <small
                className={[
                  "inline-choice-button__details",
                  hasDenseInnateTalentStats
                    ? "inline-choice-button__details--dense"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {innateTalentStats.map((stat, index) => (
                  <span key={stat.key}>
                    {index > 0 ? ", " : ""}
                    {stat.matchesSelectedStat ? (
                      <strong>{`${stat.label}: ${stat.value}`}</strong>
                    ) : (
                      `${stat.label}: ${stat.value}`
                    )}
                  </span>
                ))}
              </small>
            ) : null}
          </button>
        </section>

        <section className="panel-section">
          <h3>Talents</h3>
          <div className="talent-slot-list">
            {talents.map((talent, index) => {
              const talentStats = talent
                ? getTalentStatEntries(talent, selectedStatKeys)
                : [];
              const hasDenseTalentStats = talent?.name === "Jack of All Trades";

              return (
                <button
                  className={
                    talent
                      ? "talent-slot-button"
                      : "talent-slot-button talent-slot-button--empty"
                  }
                  key={`${index}-${talent?.id ?? "empty"}`}
                  type="button"
                  onClick={(event: MouseEvent<HTMLButtonElement>) =>
                    onSelectTalentSlot(index, {
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }
                >
                  <span className="talent-slot-button__name">
                    {talent?.name ?? `Talent ${index + 1}`}
                  </span>
                  {talent ? (
                    <small
                      className={[
                        "talent-slot-button__details",
                        hasDenseTalentStats
                          ? "talent-slot-button__details--dense"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {talentStats.map((stat, statIndex) => (
                        <span key={stat.key}>
                          {statIndex > 0 ? ", " : ""}
                          {stat.matchesSelectedStat ? (
                            <strong>{`${stat.label}: ${stat.value}`}</strong>
                          ) : (
                            `${stat.label}: ${stat.value}`
                          )}
                        </span>
                      ))}
                    </small>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-section">
          <h3>Devices</h3>
          <div className="device-slot-list">
            {deviceSlots.map((slot, index) => (
              <div
                className={[
                  "device-slot",
                  slot.power ? "" : "device-slot--empty",
                  highlightedDeviceTargetSlot === slot.slot
                    ? "device-slot--target"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={slot.slot}
                onClick={() => onSelectDeviceSlot(slot.slot)}
              >
                <SpriteIcon
                  name={slot.power ? getPowerIconName(slot.power) : "Icon_Bag"}
                  size={22}
                />
                <button
                  className="device-slot__name-button"
                  title={getPowerTooltipText(slot.power)}
                  data-power-tooltip={getPowerTooltipAttribute(slot.power)}
                  type="button"
                  onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    onSelectDeviceName(slot.slot, {
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                >
                  {slot.power?.name ?? `Device slot ${index + 1}`}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
