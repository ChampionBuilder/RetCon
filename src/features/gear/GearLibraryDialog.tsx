import { useState } from "react";
import { ModalDialog } from "@/shared/ui";
import type { SavedGearPreset } from "@/types/gear";

type GearLibraryDialogProps = {
  currentPresetName: string;
  savedGearPresets: SavedGearPreset[];
  onClose: () => void;
  onDeletePreset: (presetId: string) => void;
  onLoadPreset: (presetId: string) => void;
  onOverwritePreset: (presetId: string, presetName: string) => void;
  onSaveCurrentPreset: (presetName: string) => void;
};

const maxGearPresetNameLength = 16;

function formatSavedGearPresetDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function GearLibraryDialog({
  currentPresetName,
  savedGearPresets,
  onClose,
  onDeletePreset,
  onLoadPreset,
  onOverwritePreset,
  onSaveCurrentPreset,
}: GearLibraryDialogProps) {
  const [presetName, setPresetName] = useState(
    currentPresetName.slice(0, maxGearPresetNameLength),
  );

  return (
    <ModalDialog
      ariaLabel="Gear library"
      className="data-dialog gear-library-dialog"
      title="Gear Library"
      onClose={onClose}
    >
      <div className="data-dialog__toolbar">
        <button
          className="primary-button"
          type="button"
          onClick={() => onSaveCurrentPreset(presetName)}
        >
          Save Current Gear
        </button>
        <input
          aria-label="Gear preset name"
          className="gear-library-dialog__name-input"
          maxLength={maxGearPresetNameLength}
          placeholder="Unnamed gear preset"
          type="text"
          value={presetName}
          onChange={(event) => setPresetName(event.target.value)}
        />
      </div>

      <div className="data-dialog__list">
        {savedGearPresets.length === 0 ? (
          <p className="data-dialog__empty">No saved gear presets yet.</p>
        ) : (
          savedGearPresets.map((savedGearPreset) => (
            <article className="data-dialog__item" key={savedGearPreset.id}>
              <div className="data-dialog__summary">
                <strong>{savedGearPreset.name}</strong>
                <span className="data-dialog__saved-date">
                  {formatSavedGearPresetDate(savedGearPreset.updatedAt)}
                </span>
              </div>
              <div className="data-dialog__actions">
                <button
                  className="utility-button"
                  type="button"
                  onClick={() => onLoadPreset(savedGearPreset.id)}
                >
                  Load
                </button>
                <button
                  className="utility-button"
                  type="button"
                  onClick={() => onOverwritePreset(savedGearPreset.id, presetName)}
                >
                  Overwrite
                </button>
                <button
                  className="utility-button data-dialog__delete"
                  type="button"
                  onClick={() => onDeletePreset(savedGearPreset.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </ModalDialog>
  );
}
