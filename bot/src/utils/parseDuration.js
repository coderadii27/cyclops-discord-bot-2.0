const UNIT_MS = {
  s: 1000,
  sec: 1000,
  secs: 1000,
  second: 1000,
  seconds: 1000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hrs: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
  w: 604_800_000,
  week: 604_800_000,
  weeks: 604_800_000,
};

export function parseDuration(input) {
  if (!input) return null;
  const str = String(input).trim().toLowerCase().replace(/\s+/g, '');
  let total = 0;
  const re = /(\d+(?:\.\d+)?)([a-z]+)/g;
  let m;
  let matched = false;
  while ((m = re.exec(str)) !== null) {
    const n = parseFloat(m[1]);
    const unit = m[2];
    if (!UNIT_MS[unit]) return null;
    total += n * UNIT_MS[unit];
    matched = true;
  }
  if (!matched) {
    const n = parseFloat(str);
    if (Number.isNaN(n)) return null;
    return n * 1000;
  }
  return total;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m`;
  const d = Math.floor(hr / 24);
  return `${d}d ${hr % 24}h`;
}
