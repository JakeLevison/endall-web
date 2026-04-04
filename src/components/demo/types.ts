export interface DemoStep {
  id: string;
  /** CSS selector for the target element to spotlight */
  target: string;
  /** Coach mark content */
  title: string;
  description: string;
  /** Where to position the tooltip relative to target */
  placement: "top" | "bottom" | "left" | "right";
  /** What the user needs to do to advance */
  action: "click" | "type" | "wait" | "observe";
  /** For "type" actions — pre-fill text */
  typedText?: string;
  /** For "wait" actions — milliseconds to auto-advance */
  waitMs?: number;
}

export interface DemoConfig {
  id: string;
  title: string;
  description: string;
  steps: DemoStep[];
}
