import type { Power } from "@/types/powers";

type PowerListProps = {
  powers: Power[];
  canAddPower: (power: Power) => boolean;
  onAddPower: (power: Power) => void;
};

export function PowerList({
  powers,
  canAddPower,
  onAddPower,
}: PowerListProps) {
  return (
    <div>
      <h2>Powers ({powers.length})</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {powers.map((power) => (
          <div
            key={power.power_id}
            style={{
              border: "1px solid gray",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{power.name}</h3>

            <p>Tier: {power.tier}</p>

            <button
              disabled={!canAddPower(power)}
              onClick={() => onAddPower(power)}
            >
              Add to Build
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
