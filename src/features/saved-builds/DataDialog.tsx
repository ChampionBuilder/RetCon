import { useRef, useState } from "react";
import type { ImportSavedBuildsResult } from "@/features/saved-builds/useSavedBuilds";
import { maxBuildNameLength, trimBuildNameForUrl } from "@/constants/buildName";
import { ModalDialog } from "@/shared/ui";
import type { SavedBuild } from "@/types/share";
import { createShareUrl } from "@/utils/buildSerialization";
import { isAutosaveBuild } from "@/features/saved-builds/savedBuilds";

type DataDialogProps = {
  autosaveHasContent: boolean;
  currentBuildName: string;
  savedBuilds: SavedBuild[];
  onBuildNameChange: (buildName: string) => void;
  onClose: () => void;
  onDeleteBuild: (buildId: string) => void;
  onLoadBuild: (buildId: string) => void;
  onImportBuildsFromText: (text: string) => ImportSavedBuildsResult;
  onOverwriteBuild: (buildId: string) => void;
  onSaveCurrentBuild: () => void;
};

function formatSavedBuildDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function DataDialog({
  autosaveHasContent,
  currentBuildName,
  savedBuilds,
  onBuildNameChange,
  onClose,
  onDeleteBuild,
  onLoadBuild,
  onImportBuildsFromText,
  onOverwriteBuild,
  onSaveCurrentBuild,
}: DataDialogProps) {
  const loadDataInputRef = useRef<HTMLInputElement | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  function getSavedBuildUrl(savedBuild: SavedBuild) {
    return createShareUrl(savedBuild.data, savedBuild.name);
  }

  function saveDataFile() {
    const exportableBuilds = savedBuilds.filter(
      (savedBuild) => !isAutosaveBuild(savedBuild),
    );
    const content = exportableBuilds.map(getSavedBuildUrl).join("\n");
    const blob = new Blob([`${content}\n`], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "retcon-builds.txt";
    link.click();
    URL.revokeObjectURL(link.href);
    setDataMessage(
      `${exportableBuilds.length} build URL${
        exportableBuilds.length === 1 ? "" : "s"
      } saved. Your download should start soon.`,
    );
  }

  async function loadDataFile(file: File | null) {
    if (!file) {
      return;
    }

    const result = onImportBuildsFromText(await file.text());
    setDataMessage(
      `${result.imported} build${result.imported === 1 ? "" : "s"} imported` +
        (result.skipped > 0
          ? `, ${result.skipped} skipped.`
          : "."),
    );

    if (loadDataInputRef.current) {
      loadDataInputRef.current.value = "";
    }
  }

  return (
    <ModalDialog
      ariaLabel="Saved builds"
      className="data-dialog"
      title="My Builds"
      onClose={onClose}
    >
        <div className="data-dialog__toolbar">
          <button className="primary-button" type="button" onClick={onSaveCurrentBuild}>
            Save Current Build
          </button>
          <input
            aria-label="Build name"
            className="data-dialog__name-input"
            maxLength={maxBuildNameLength}
            placeholder="Unnamed build"
            type="text"
            value={currentBuildName}
            onChange={(event) =>
              onBuildNameChange(trimBuildNameForUrl(event.target.value))
            }
          />
        </div>

        <div className="data-dialog__list">
          {savedBuilds.length === 0 ? (
            <p className="data-dialog__empty">No saved builds yet.</p>
          ) : (
            savedBuilds.map((savedBuild) => (
              <article className="data-dialog__item" key={savedBuild.id}>
                <div className="data-dialog__summary">
                  <strong>
                    {isAutosaveBuild(savedBuild)
                      ? `Autosave${savedBuild.name ? ` — ${savedBuild.name}` : ""}`
                      : savedBuild.name || "Unnamed build"}
                  </strong>
                  <span className="data-dialog__saved-date">
                    {formatSavedBuildDate(savedBuild.updatedAt)}
                  </span>
                </div>
                <div className="data-dialog__actions">
                  <span
                    className="data-dialog__action-wrapper"
                    data-text-tooltip={
                      isAutosaveBuild(savedBuild) && !autosaveHasContent
                        ? "No autosaved build yet."
                        : undefined
                    }
                  >
                    <button
                      className="utility-button"
                      disabled={
                        isAutosaveBuild(savedBuild) && !autosaveHasContent
                      }
                      type="button"
                      onClick={() => onLoadBuild(savedBuild.id)}
                    >
                      Load
                    </button>
                  </span>
                  {!isAutosaveBuild(savedBuild) ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="data-dialog__footer">
          <div className="data-dialog__data-actions">
            <button
              className="utility-button"
              disabled={savedBuilds.every(isAutosaveBuild)}
              type="button"
              onClick={saveDataFile}
            >
              Save data
            </button>
            <button
              className="utility-button"
              type="button"
              onClick={() => loadDataInputRef.current?.click()}
            >
              Load data
            </button>
            <input
              ref={loadDataInputRef}
              accept=".txt,text/plain"
              className="data-dialog__file-input"
              type="file"
              onChange={(event) => void loadDataFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {dataMessage ? (
            <p className="data-dialog__data-message">{dataMessage}</p>
          ) : null}
        </div>
    </ModalDialog>
  );
}
