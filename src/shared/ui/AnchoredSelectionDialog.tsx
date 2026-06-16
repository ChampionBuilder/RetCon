import type { ReactNode } from "react";
import {
  AnchoredDialog,
  type DialogAnchor,
  type DialogPlacement,
} from "./AnchoredDialog";

type AnchoredSelectionDialogProps = {
  anchor: DialogAnchor;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  closeAriaLabel: string;
  menuChildren?: ReactNode;
  onClose: () => void;
  placement?: DialogPlacement;
};

export function AnchoredSelectionDialog({
  anchor,
  ariaLabel,
  children,
  className,
  closeAriaLabel,
  menuChildren,
  onClose,
  placement,
}: AnchoredSelectionDialogProps) {
  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel={ariaLabel}
      className={["selection-dialog", className].filter(Boolean).join(" ")}
      onClose={onClose}
      placement={placement}
    >
      <div className="selection-dialog__menu">
        {menuChildren}
        <button
          aria-label={closeAriaLabel}
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          X
        </button>
      </div>

      {children}
    </AnchoredDialog>
  );
}
