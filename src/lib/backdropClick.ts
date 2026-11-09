import type { MouseEvent } from "react";

// Close-on-backdrop handler for modals and drawers: use as onClick={backdropClick(onClose)} on the dark overlay.
// It closes only when the press AND the release were both on the overlay itself. Without this, dragging to select
// text inside the box and letting go outside it counts as a click on the overlay and closes the window mid-edit.
let pressedOn: EventTarget | null = null;
let listening = false;

function listen() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("mousedown", (e) => { pressedOn = e.target; }, true);
}

export function backdropClick(close: () => void) {
  listen();
  return (e: MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && (pressedOn === null || pressedOn === e.currentTarget)) close();
  };
}
