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
  x: number;
  y: number;
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
    const preferredLeft = tooltip.x + gap;
    const preferredTop = tooltip.y + gap;
    const nextLeft =
      preferredLeft > maxLeft ? tooltip.x - rect.width - gap : preferredLeft;
    const nextTop =
      preferredTop > maxTop ? tooltip.y - rect.height - gap : preferredTop;
    const clampedLeft = Math.min(Math.max(nextLeft, margin), maxLeft);
    const clampedTop = Math.min(Math.max(nextTop, margin), maxTop);

    if (clampedLeft !== tooltip.x || clampedTop !== tooltip.y) {
      tooltipElement.style.left = `${clampedLeft}px`;
      tooltipElement.style.top = `${clampedTop}px`;
    }
  }, [tooltip]);

  useEffect(() => {
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
        x,
        y,
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
              x: event.clientX,
              y: event.clientY,
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

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", hideTooltip);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", hideTooltip);
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
        left: tooltip.x,
        top: tooltip.y,
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
