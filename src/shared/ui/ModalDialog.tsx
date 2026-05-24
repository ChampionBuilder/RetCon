import { useEffect, type ReactNode } from "react";

type ModalDialogProps = {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  description?: ReactNode;
  title: ReactNode;
  onClose: () => void;
};

export function ModalDialog({
  ariaLabel,
  children,
  className,
  description,
  title,
  onClose,
}: ModalDialogProps) {
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
        aria-label={ariaLabel}
        aria-modal="true"
        className={`selection-dialog ${className}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="selection-dialog__header">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>
            X
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
