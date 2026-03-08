import type { SeverityLevel, VisualFilterMode } from "@/types";

export function formatCoordinate(value: number, type: "lat" | "lon"): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
  const dir =
    type === "lat"
      ? value >= 0 ? "N" : "S"
      : value >= 0 ? "E" : "W";
  return `${deg}°${min}'${sec}"${dir}`;
}

export function formatAltitude(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatVelocity(kmPerSec: number): string {
  return `${(kmPerSec * 3600).toFixed(0)} km/h`;
}

export function severityColor(severity: SeverityLevel): string {
  switch (severity) {
    case "critical": return "#ff0000";
    case "high": return "#ff6600";
    case "medium": return "#ffcc00";
    case "low": return "#00cc00";
  }
}

export function severityBgClass(severity: SeverityLevel): string {
  switch (severity) {
    case "critical": return "bg-red-600";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
  }
}

export function filterStyleCSS(mode: VisualFilterMode): React.CSSProperties {
  switch (mode) {
    case "night_vision":
      return {
        filter: "brightness(1.2) contrast(1.3) saturate(0) sepia(1) hue-rotate(70deg)",
      };
    case "thermal":
      return {
        filter: "contrast(1.5) saturate(2) hue-rotate(180deg) brightness(0.8)",
      };
    case "crt_scanline":
      return {
        filter: "contrast(1.1) brightness(1.1) saturate(0.8)",
      };
    case "classified":
      return {
        filter: "contrast(1.2) brightness(0.9) saturate(0.5) sepia(0.3)",
      };
    case "satellite_view":
      return {
        filter: "contrast(1.3) brightness(1.1)",
      };
    default:
      return {};
  }
}

export function getTimeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len - 3) + "...";
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
