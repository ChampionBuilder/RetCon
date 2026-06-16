import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type DialogAnchor = {
  x: number;
  y: number;
};

export type DialogPlacement = "default" | "below-centered" | "target-centered";

type AnchoredDialogProps = {
  anchor: DialogAnchor;
  ariaLabel: string;
  children: ReactNode;
  className: string;
  onClose: () => void;
  placement?: DialogPlacement;
};

export function AnchoredDialog({
  anchor,
  ariaLabel,
  children,
  className,
  onClose,
  placement = "default",
}: AnchoredDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const dialogPositionRef = useRef({
    left: anchor.x,
    top: anchor.y,
  });
  const [dialogPosition, setDialogPosition] = useState({
    left: anchor.x,
    top: anchor.y,
  });

  function setTrackedDialogPosition(position: { left: number; top: number }) {
    dialogPositionRef.current = position;
    setDialogPosition(position);
  }

  useLayoutEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    function updatePositionFromAnchor() {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const margin = 12;
      const gap = 12;
      const rect = dialog.getBoundingClientRect();
      const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
      const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

      const anchorTarget = dialog.querySelector<HTMLElement>(
        "[data-dialog-anchor-target='true']",
      );
      const anchorTargetRect = anchorTarget?.getBoundingClientRect();
      const anchorTargetCenter = anchorTargetRect
        ? {
            x: anchorTargetRect.left - rect.left + anchorTargetRect.width / 2,
            y: anchorTargetRect.top - rect.top + anchorTargetRect.height / 2,
          }
        : null;

      let left =
        placement === "target-centered" && anchorTargetCenter
          ? anchor.x - anchorTargetCenter.x
          : placement === "below-centered"
            ? anchor.x - rect.width / 2
            : anchor.x + gap;
      let top =
        placement === "target-centered" && anchorTargetCenter
          ? anchor.y - anchorTargetCenter.y - 8
          : placement === "below-centered"
            ? anchor.y - 14
            : anchor.y - rect.height / 2;

      if (placement === "default" && left > maxLeft) {
        left = anchor.x - rect.width - gap;
      }

      if (placement === "default" && top < margin) {
        top = anchor.y + gap;
      }

      if (placement === "default" && top > maxTop) {
        top = anchor.y - rect.height - gap;
      }

      setTrackedDialogPosition({
        left: Math.min(Math.max(left, margin), maxLeft),
        top: Math.min(Math.max(top, margin), maxTop),
      });
    }

    function keepVisibleAfterResize() {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const margin = 12;
      const rect = dialog.getBoundingClientRect();
      const currentPosition = dialogPositionRef.current;
      const bottomOverflow =
        currentPosition.top + rect.height + margin - window.innerHeight;

      if (bottomOverflow <= 0) {
        return;
      }

      setTrackedDialogPosition({
        left: currentPosition.left,
        top: Math.max(margin, currentPosition.top - bottomOverflow),
      });
    }

    updatePositionFromAnchor();
    if (dialogRef.current && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(keepVisibleAfterResize);
      resizeObserver.observe(dialogRef.current);
    }

    window.addEventListener("resize", updatePositionFromAnchor);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePositionFromAnchor);
    };
  }, [anchor.x, anchor.y, placement]);

  useLayoutEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-label={ariaLabel}
        aria-modal="true"
        className={className}
        ref={dialogRef}
        role="dialog"
        style={{
          left: dialogPosition.left,
          top: dialogPosition.top,
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
