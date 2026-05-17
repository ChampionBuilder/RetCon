import type { Advantage } from "../types/advantages";
import type { BuildSlot } from "../types/builds";

type BuildSlotCardProps = {
  slot: BuildSlot;
  advantages: Advantage[];
  onRemovePower: (slotNumber: number) => void;
  onToggleAdvantage: (slotNumber: number, advantageId: number) => void;
};

export function BuildSlotCard({
  slot,
  advantages,
  onRemovePower,
  onToggleAdvantage,
}: BuildSlotCardProps) {
  return (
    <div
      style={{
        border: "1px solid gray",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <strong>Slot {slot.slot}</strong>

      <p>Level {slot.level}</p>

      {slot.power ? (
        <>
          <p>{slot.power.name}</p>

          <div style={{ marginTop: "10px" }}>
            {advantages.map((advantage) => {
              const selected = slot.selectedAdvantages.includes(
                advantage.advantage_id,
              );

              return (
                <div key={advantage.advantage_id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        onToggleAdvantage(slot.slot, advantage.advantage_id)
                      }
                    />

                    {" "}
                    {advantage.name}
                    {" ("}
                    {advantage.points_cost}
                    {" pts)"}
                  </label>
                </div>
              );
            })}
          </div>

          <button onClick={() => onRemovePower(slot.slot)}>Remove</button>
        </>
      ) : (
        <p>Empty Slot</p>
      )}
    </div>
  );
}
