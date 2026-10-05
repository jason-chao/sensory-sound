/** The layers, scales and soundscapes. Everything is synthesised; no recordings are involved. */

export interface LayerInfo {
  id: string;
  label: string;
  blurb: string;
}

export const LAYERS: LayerInfo[] = [
  { id: "drone", label: "Warm drone", blurb: "A slow, sustained chord" },
  { id: "chimes", label: "Chimes", blurb: "Sparse soft bells" },
  { id: "bowls", label: "Singing bowls", blurb: "Long shimmering tones" },
  { id: "koto", label: "Plucked strings", blurb: "Short phrases on a koto-like string" },
  { id: "ocean", label: "Ocean", blurb: "Waves arriving and leaving" },
  { id: "rain", label: "Rain", blurb: "Steady rain with soft drops" },
  { id: "wind", label: "Wind", blurb: "Air moving through trees" },
  { id: "stream", label: "Stream", blurb: "Water over stones" },
  { id: "noise", label: "Brown noise", blurb: "A deep, even hush" },
  { id: "pulse", label: "Soft pulse", blurb: "A slow heartbeat-like beat" },
  { id: "breath", label: "Breath", blurb: "Follows the breathing pace" },
];

export const SCALES: Record<string, { label: string; steps: number[] }> = {
  pentaMajor: { label: "Bright (major pentatonic)", steps: [0, 2, 4, 7, 9] },
  pentaMinor: { label: "Dusk (minor pentatonic)", steps: [0, 3, 5, 7, 10] },
  lydian: { label: "Floating (lydian)", steps: [0, 2, 4, 6, 7, 9, 11] },
  yo: { label: "Garden (yo scale)", steps: [0, 2, 5, 7, 9] },
  insen: { label: "Twilight (in scale)", steps: [0, 1, 5, 7, 10] },
};

/** A named mix: layer levels plus a scale. Layers not listed are silent. */
export interface Soundscape {
  id: string;
  label: string;
  /** what plays, in plain words */
  blurb: string;
  scale: string;
  layers: Record<string, number>;
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: "shore", label: "Shore at dusk", blurb: "ocean, warm drone, a few chimes", scale: "pentaMinor", layers: { ocean: 0.5, drone: 0.4, chimes: 0.2 } },
  { id: "temple", label: "Temple bells", blurb: "singing bowls, plucked strings, low drone", scale: "insen", layers: { bowls: 0.5, koto: 0.35, drone: 0.25 } },
  { id: "garden", label: "Night garden", blurb: "wind, chimes, quiet drone, a bowl now and then", scale: "yo", layers: { wind: 0.35, chimes: 0.4, drone: 0.3, bowls: 0.15 } },
  { id: "hush", label: "Deep hush", blurb: "brown noise, low drone, slow pulse", scale: "pentaMinor", layers: { noise: 0.45, drone: 0.3, pulse: 0.2 } },
  { id: "stream", label: "Mountain stream", blurb: "stream, light wind, chimes", scale: "lydian", layers: { stream: 0.5, wind: 0.2, chimes: 0.3 } },
  { id: "chimes", label: "Chimes alone", blurb: "sparse chimes, nothing else", scale: "pentaMajor", layers: { chimes: 0.5 } },
  { id: "rain", label: "Rainy window", blurb: "rain, warm drone", scale: "pentaMajor", layers: { rain: 0.5, drone: 0.35 } },
  { id: "breathing", label: "Breathing", blurb: "breath sound at the breathing pace, soft drone, bowls", scale: "pentaMajor", layers: { breath: 0.5, drone: 0.35, bowls: 0.2 } },
];
