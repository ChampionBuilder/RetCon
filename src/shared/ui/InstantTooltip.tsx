import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PowerTooltip } from "@/shared/ui/PowerTooltip";
import type { PowerTooltipData } from "@/shared/utils/powerTooltip";

type TooltipContent =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "power";
      data: PowerTooltipData;
    };

type TooltipState = {
  content: TooltipContent;
  cursorX: number;
  cursorY: number;
  left: number;
  top: number;
  positioned: boolean;
};

function getTooltipElement(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  if (target.closest("[data-no-instant-tooltip]")) {
    return null;
  }

  const element = target.closest<HTMLElement>("[title], [data-power-tooltip]");

  if (!element) {
    return null;
  }

  if (!element.title.trim() && !element.dataset.powerTooltip) {
    return null;
  }

  return element;
}

function releaseTooltipElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  const storedTitle = element.dataset.instantTooltipTitle;

  if (storedTitle !== undefined) {
    if (!element.title.trim()) {
      element.title = storedTitle;
    }

    delete element.dataset.instantTooltipTitle;
  }
}

export function InstantTooltip() {
  const activeElementRef = useRef<HTMLElement | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useLayoutEffect(() => {
    const tooltipElement = tooltipRef.current;

    if (!tooltip || !tooltipElement) {
      return;
    }

    const margin = 12;
    const gap = 14;
    const rect = tooltipElement.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    const preferredLeft = tooltip.cursorX + gap;
    const preferredTop = tooltip.cursorY + gap;
    const nextLeft =
      preferredLeft > maxLeft
        ? tooltip.cursorX - rect.width - gap
        : preferredLeft;
    const nextTop =
      preferredTop > maxTop
        ? tooltip.cursorY - rect.height - gap
        : preferredTop;
    const clampedLeft = Math.min(Math.max(nextLeft, margin), maxLeft);
    const clampedTop = Math.min(Math.max(nextTop, margin), maxTop);

    if (
      clampedLeft !== tooltip.left ||
      clampedTop !== tooltip.top ||
      !tooltip.positioned
    ) {
      setTooltip((currentTooltip) =>
        currentTooltip
          ? {
              ...currentTooltip,
              left: clampedLeft,
              top: clampedTop,
              positioned: true,
            }
          : currentTooltip,
      );
    }
  }, [tooltip]);

  useEffect(() => {
    const hoverMediaQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    function getTooltipContent(element: HTMLElement): TooltipContent | null {
      if (element.dataset.powerTooltip) {
        try {
          return {
            kind: "power",
            data: JSON.parse(element.dataset.powerTooltip) as PowerTooltipData,
          };
        } catch {
          // Fall back to the plain title when a malformed dataset slips through.
        }
      }

      const text =
        element.title.trim() ||
        element.dataset.instantTooltipTitle?.trim() ||
        "";

      return text ? { kind: "text", text } : null;
    }

    function disconnectMutationObserver() {
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
    }

    function showTooltip(element: HTMLElement, x: number, y: number) {
      const content = getTooltipContent(element);

      if (!content) {
        return;
      }

      if (activeElementRef.current !== element) {
        releaseTooltipElement(activeElementRef.current);
      }

      activeElementRef.current = element;
      element.dataset.instantTooltipTitle = element.title;
      element.removeAttribute("title");

      setTooltip({
        content,
        cursorX: x,
        cursorY: y,
        left: x,
        top: y,
        positioned: false,
      });

      disconnectMutationObserver();
      mutationObserverRef.current = new MutationObserver(() => {
        const nextContent = getTooltipContent(element);

        if (!nextContent) {
          return;
        }

        setTooltip((currentTooltip) =>
          currentTooltip
            ? {
                ...currentTooltip,
                content: nextContent,
              }
            : currentTooltip,
        );
      });
      mutationObserverRef.current.observe(element, {
        attributeFilter: ["data-power-tooltip", "title"],
        attributes: true,
      });
    }

    function hideTooltip() {
      disconnectMutationObserver();
      releaseTooltipElement(activeElementRef.current);
      activeElementRef.current = null;
      setTooltip(null);
    }

    function clearLongPressTimeout() {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }

    function handleMouseOver(event: MouseEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-no-instant-tooltip]")
      ) {
        hideTooltip();
        return;
      }

      const element = getTooltipElement(event.target);

      if (!element) {
        return;
      }

      showTooltip(element, event.clientX, event.clientY);
    }

    function handleMouseMove(event: MouseEvent) {
      if (!activeElementRef.current) {
        return;
      }

      setTooltip((currentTooltip) =>
        currentTooltip
          ? {
              ...currentTooltip,
              cursorX: event.clientX,
              cursorY: event.clientY,
            }
          : currentTooltip,
      );
    }

    function handleMouseOut(event: MouseEvent) {
      const activeElement = activeElementRef.current;

      if (!activeElement) {
        return;
      }

      if (
        event.relatedTarget instanceof Node &&
        activeElement.contains(event.relatedTarget)
      ) {
        return;
      }

      hideTooltip();
    }

    function handleFocusIn(event: FocusEvent) {
      const element = getTooltipElement(event.target);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      showTooltip(element, rect.left + rect.width / 2, rect.bottom);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        return;
      }

      clearLongPressTimeout();

      const element = getTooltipElement(event.target);

      if (!element) {
        hideTooltip();
        return;
      }

      longPressTimeoutRef.current = window.setTimeout(() => {
        showTooltip(element, event.clientX, event.clientY);
        longPressTimeoutRef.current = null;
      }, 520);
    }

    function handlePointerCancel() {
      clearLongPressTimeout();
    }

    function handlePointerUp(event: PointerEvent) {
      clearLongPressTimeout();

      if (
        event.pointerType !== "mouse" &&
        activeElementRef.current &&
        !activeElementRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        clearLongPressTimeout();
      }
    }

    if (hoverMediaQuery.matches) {
      document.addEventListener("mouseover", handleMouseOver);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseout", handleMouseOut);
      document.addEventListener("focusin", handleFocusIn);
      document.addEventListener("focusout", hideTooltip);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", hideTooltip);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      clearLongPressTimeout();
      disconnectMutationObserver();
      releaseTooltipElement(activeElementRef.current);
    };
  }, []);

  if (!tooltip) {
    return null;
  }

  return (
    <div
      className="instant-tooltip"
      ref={tooltipRef}
      role="tooltip"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        visibility: tooltip.positioned ? "visible" : "hidden",
      }}
    >
      {tooltip.content.kind === "power" ? (
        <PowerTooltip tooltip={tooltip.content.data} />
      ) : (
        tooltip.content.text
      )}
    </div>
  );
}
