declare const __BUILD_ID__: string;

/** A line at the foot of every listening page: what is running, and that nothing is recorded. */
export function footer(): HTMLElement {
  const f = document.createElement("footer");
  f.textContent = `sensory-sound listening pages · build ${__BUILD_ID__} · no usage data is collected on this site`;
  return f;
}
