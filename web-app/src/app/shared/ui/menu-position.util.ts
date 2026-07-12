/** Computed viewport-relative placement for a fixed-position dropdown menu. */
export interface MenuPosition {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly maxHeight: number;
}

/**
 * Positions a dropdown menu below its trigger, flipping above when there
 * isn't enough room below — so menus opened near the bottom of the
 * viewport (e.g. a filter bar's second row) stay fully reachable instead of
 * running off-screen. Menu is `position: fixed`, so this is viewport-relative.
 */
export function computeMenuPosition(
  triggerRect: DOMRect,
  gap = 6,
  desiredMaxHeight = 260,
  minHeight = 120,
): MenuPosition {
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
  const spaceAbove = triggerRect.top - gap;

  if (spaceBelow >= Math.min(desiredMaxHeight, minHeight) || spaceBelow >= spaceAbove) {
    return {
      top: triggerRect.bottom + gap,
      left: triggerRect.left,
      width: triggerRect.width,
      maxHeight: Math.max(minHeight, Math.min(desiredMaxHeight, spaceBelow)),
    };
  }

  const maxHeight = Math.max(minHeight, Math.min(desiredMaxHeight, spaceAbove));
  return {
    top: triggerRect.top - gap - maxHeight,
    left: triggerRect.left,
    width: triggerRect.width,
    maxHeight,
  };
}
