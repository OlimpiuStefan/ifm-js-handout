// Raw sensor frames arrive as NUMBERS. This is where they become the
// transport shape: value as a string, timestamp as ISO 8601 UTC.
// The shape is the committed contract in contract/reading.schema.json.

export function normalize(frame) {
  if (frame.value == null) return null; // no value, no reading. 0 is a value.
  return {
    deviceId: frame.deviceId,
    name: frame.name,
    value: String(frame.value),
    unit: frame.unit,
    at: new Date(frame.at).toISOString(),
  };
}

// A whole batch. A frame that cannot be normalised throws, and that is right:
// it is a bug in the frame or in this code, not something to skip quietly.
export function normalizeAll(frames) {
  return frames.map(normalize).filter(Boolean);
}
