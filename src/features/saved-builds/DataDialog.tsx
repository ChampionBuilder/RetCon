import { useRef, useState } from "react";
import type { ImportSavedBuildsResult } from "@/features/saved-builds/useSavedBuilds";
import { ModalDialog } from "@/shared/ui";
import type { SavedBuild } from "@/types/share";

type DataDialogProps = {
  currentBuildName: string;
  savedBuilds: SavedBuild[];
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
  currentBuildName,
  savedBuilds,
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
    const url = new URL(window.location.href);

    url.searchParams.delete("build");
    url.searchParams.set("b", savedBuild.data);

    return url.toString();
  }

  function saveDataFile() {
    const content = savedBuilds.map(getSavedBuildUrl).join("\n");
    const blob = new Blob([`${content}\n`], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "retcon-builds.txt";
    link.click();
    URL.revokeObjectURL(link.href);
    setDataMessage(
      `${savedBuilds.length} build URL${
        savedBuilds.length === 1 ? "" : "s"
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
                  <span className="data-dialog__saved-date">
                    {formatSavedBuildDate(savedBuild.updatedAt)}
                  </span>
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

        <div className="data-dialog__footer">
          <div className="data-dialog__data-actions">
            <button
              className="utility-button"
              disabled={savedBuilds.length === 0}
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
