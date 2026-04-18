import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flagUrl(code: string): string {
  // flagcdn expects lowercase ISO-2; our codes are IOC 3-letter. Map roughly.
  const map: Record<string, string> = {
    USA: "us", CAN: "ca", MEX: "mx", ARG: "ar", BRA: "br", FRA: "fr",
    ESP: "es", ENG: "gb-eng", GER: "de", POR: "pt", NED: "nl", BEL: "be",
    CRO: "hr", ITA: "it", URU: "uy", COL: "co", JPN: "jp", MAR: "ma",
    DEN: "dk", SUI: "ch", AUT: "at", SRB: "rs", SEN: "sn", KOR: "kr",
    ECU: "ec", IRN: "ir", AUS: "au", KSA: "sa", POL: "pl", TUN: "tn",
    NOR: "no", UKR: "ua", EGY: "eg", NGA: "ng", ALG: "dz", CIV: "ci",
    PAN: "pa", CRC: "cr", JAM: "jm", PAR: "py", UZB: "uz", IRQ: "iq",
    JOR: "jo", CMR: "cm", GHA: "gh", NZL: "nz", COD: "cd", BOL: "bo",
  };
  const iso = map[code] ?? code.toLowerCase().slice(0, 2);
  return `https://flagcdn.com/w80/${iso}.png`;
}

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function confedColor(conf: string): string {
  const map: Record<string, string> = {
    UEFA: "bg-confed-uefa",
    CONMEBOL: "bg-confed-conmebol",
    CONCACAF: "bg-confed-concacaf",
    AFC: "bg-confed-afc",
    CAF: "bg-confed-caf",
    OFC: "bg-confed-ofc",
  };
  return map[conf] ?? "bg-gray-600";
}
