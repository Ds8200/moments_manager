// In a `direction: ltr` scroll box (the scrollbar-right trick that keeps the vertical
// scrollbar on the right in this RTL app), the RTL "start" of the content is the right
// edge, i.e. the maximum positive scrollLeft. Returns 0 when the content is not wider
// than the box, so callers can assign the result unconditionally.
export const getRtlStartScrollLeft = (scrollWidth: number, clientWidth: number): number =>
  Math.max(0, scrollWidth - clientWidth)
