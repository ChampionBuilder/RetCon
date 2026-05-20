import { useEffect, useState, type FormEvent } from "react";

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSource = importSource.trim();

    if (!trimmedSource) {
      setErrorMessage("Paste a HeroCreator URL or legacy code.");
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
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Import legacy build"
        aria-modal="true"
        className="selection-dialog import-build-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="selection-dialog__header">
          <div>
            <h3>Import Build</h3>
            <p>
              Beta import from HeroCreator/Aesica. Most builds should import,
              but results are not guaranteed.
            </p>
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>X</button>
        </div>

        <form className="import-build-dialog__content" onSubmit={handleImport}>
          <label className="import-build-dialog__label" htmlFor="import-build-source">
            HeroCreator URL or legacy code
          </label>
          <textarea
            className="import-build-dialog__input"
            id="import-build-source"
            placeholder="https://aesica.net/co/herocreator.htm?v=...&n=...&d=..."
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
      </section>
    </div>
  );
}
