/** Direction thresholds avoid flicker from tiny movements and rubber-band overscroll. */
export function createNavigationScrollTracker() {
  let previous = 0;
  let travel = 0;
  let compact = false;
  return (position: number, maximum: number) => {
    const y = Math.max(0, Math.min(position, Math.max(0, maximum)));
    const delta = y - previous;
    previous = y;
    if (y <= 16) {
      compact = false;
      travel = 0;
    } else if (delta !== 0) {
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      if (y > 80 && travel >= 24) compact = true;
      if (travel <= -12) compact = false;
    }
    return compact;
  };
}
