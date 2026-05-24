import { useState, type FormEvent } from "react";
import { ModalDialog } from "@/shared/ui";

type ImportBuildDialogProps = {
  onClose: () => void;
  onImportBuild: (source: string) => Promise<string[]>;
};

export function ImportBuildDialog({
  onClose,
  onImportBuild,
}: ImportBuildDialogProps) {
  const [importSource, setImportSource] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSource = importSource.trim();

    if (!trimmedSource) {
      setErrorMessage("Paste an Aesica or BalakKnightfang URL");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setWarnings([]);

    try {
      const importWarnings = await onImportBuild(trimmedSource);

      if (importWarnings.length === 0) {
        onClose();
        return;
      }

      setWarnings(importWarnings);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown import error.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ModalDialog
      ariaLabel="Import legacy build"
      className="import-build-dialog"
      description="Most builds from Aesica or BalakKnightfang should import, but results are not guaranteed."
      title="Import Build"
      onClose={onClose}
    >
      <form className="import-build-dialog__content" onSubmit={handleImport}>
          <label className="import-build-dialog__label" htmlFor="import-build-source">
            Paste your build URL here:
          </label>
          <textarea
            className="import-build-dialog__input"
            id="import-build-source"
            placeholder={`https://aesica.net/co/herocreator.htm?v=...&n=...&d=...
OR
https://balaknightfang.dev/HeroCreator/?v=38&n=...&d=...&e=...`}
            value={importSource}
            onChange={(event) => setImportSource(event.target.value)}
          />

          {errorMessage ? (
            <p className="import-build-dialog__error">{errorMessage}</p>
          ) : null}

          {warnings.length > 0 ? (
            <div className="import-build-dialog__warnings">
              <p>Imported with warnings:</p>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="import-build-dialog__actions">
            <button className="utility-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={isImporting} type="submit">
              {isImporting ? "Importing..." : "Import"}
            </button>
          </div>
      </form>
    </ModalDialog>
  );
}
