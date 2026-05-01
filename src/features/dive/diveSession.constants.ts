import { Dimensions } from "react-native";

const { height: SCREEN_H } = Dimensions.get("window");

export const LANE_HEIGHT  = SCREEN_H * 0.5;
export const DIVER_SIZE   = 32;
export const BUTTON_SIZE  = 120;
export const BG_COLOR     = "#0d2d3a";
export const ACCENT_COLOR = "#3BBFAD";

// Depth interval tick rate in ms.  Position only visibly changes when an
// integer-meter boundary is crossed, so the perceived update cadence is
// (1000 / metersPerSecond) ms — typically several seconds per meter.
export const TICK_MS = 200;

export type SessionState   = "idle" | "holding" | "surfacing" | "done";
export type SessionOutcome = "completed" | "interrupted";
