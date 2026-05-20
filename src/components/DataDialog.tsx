import { useEffect } from "react";
import type { SavedBuild } from "../types/share";

type DataDialogProps = {
  currentBuildName: string;
  savedBuilds: SavedBuild[];
  onClose: () => void;
  onDeleteBuild: (buildId: string) => void;
  onLoadBuild: (buildId: string) => void;
  onOverwriteBuild: (buildId: string) => void;
  onSaveCurrentBuild: () => void;
};

export function DataDialog({
  currentBuildName,
  savedBuilds,
  onClose,
  onDeleteBuild,
  onLoadBuild,
  onOverwriteBuild,
  onSaveCurrentBuild,
}: DataDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Saved builds"
        aria-modal="true"
        className="selection-dialog data-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="selection-dialog__header">
          <h3>My Builds</h3>
          <button className="dialog-close" type="button" onClick={onClose}>X</button>
        </div>

        <div className="data-dialog__toolbar">
          <button className="primary-button" type="button" onClick={onSaveCurrentBuild}>
            Save Current Build
          </button>
          <span>{currentBuildName || "Unnamed build"}</span>
        </div>

        <div className="data-dialog__list">
          {savedBuilds.length === 0 ? (
            <p className="data-dialog__empty">No saved builds yet.</p>
          ) : (
            savedBuilds.map((savedBuild) => (
              <article className="data-dialog__item" key={savedBuild.id}>
                <div className="data-dialog__summary">
                  <strong>{savedBuild.name || "Unnamed build"}</strong>
                </div>
                <div className="data-dialog__actions">
                  <button
                    className="utility-button"
                    type="button"
                    onClick={() => onLoadBuild(savedBuild.id)}
                  >
                    Load
                  </button>
                  <button
                    className="utility-button"
                    type="button"
                    onClick={() => onOverwriteBuild(savedBuild.id)}
                  >
                    Overwrite
                  </button>
                  <button
                    className="utility-button data-dialog__delete"
                    type="button"
                    onClick={() => onDeleteBuild(savedBuild.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
