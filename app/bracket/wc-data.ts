// 2026 FIFA World Cup — 48 teams, 12 groups of 4 (A–L).
// Knockout round of 32: top 2 from each group (24) + 8 best third-place (8) = 32.

export type Team = {
  name: string;
  code: string;
  group: string;
  seed: 1 | 2 | 3 | 4;
  stripes: string[];
};

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { name: "Mexico",       code: "MEX", group: "A", seed: 1, stripes: ["#006847", "#FFFFFF", "#CE1126"] },
  POL: { name: "Poland",       code: "POL", group: "A", seed: 2, stripes: ["#FFFFFF", "#DC143C"] },
  SAU: { name: "Saudi Arabia", code: "SAU", group: "A", seed: 3, stripes: ["#006C35", "#FFFFFF"] },
  NZL: { name: "New Zealand",  code: "NZL", group: "A", seed: 4, stripes: ["#012169", "#E4002B", "#FFFFFF"] },

  // Group B
  CAN: { name: "Canada",       code: "CAN", group: "B", seed: 1, stripes: ["#D52B1E", "#FFFFFF", "#D52B1E"] },
  SUI: { name: "Switzerland",  code: "SUI", group: "B", seed: 2, stripes: ["#FF0000", "#FFFFFF", "#FF0000"] },
  SEN: { name: "Senegal",      code: "SEN", group: "B", seed: 3, stripes: ["#00853F", "#FDEF42", "#E31B23"] },
  UZB: { name: "Uzbekistan",   code: "UZB", group: "B", seed: 4, stripes: ["#1EB53A", "#0099B5", "#CE1126"] },

  // Group C
  USA: { name: "USA",          code: "USA", group: "C", seed: 1, stripes: ["#3C3B6E", "#B22234", "#FFFFFF"] },
  CRO: { name: "Croatia",      code: "CRO", group: "C", seed: 2, stripes: ["#FF0000", "#FFFFFF", "#171796"] },
  CRC: { name: "Costa Rica",   code: "CRC", group: "C", seed: 3, stripes: ["#002B7F", "#FFFFFF", "#CE1126"] },
  JOR: { name: "Jordan",       code: "JOR", group: "C", seed: 4, stripes: ["#000000", "#FFFFFF", "#CE1126"] },

  // Group D
  FRA: { name: "France",       code: "FRA", group: "D", seed: 1, stripes: ["#002395", "#FFFFFF", "#ED2939"] },
  KOR: { name: "South Korea",  code: "KOR", group: "D", seed: 2, stripes: ["#FFFFFF", "#CD2E3A", "#0047A0"] },
  GHA: { name: "Ghana",        code: "GHA", group: "D", seed: 3, stripes: ["#CE1126", "#FCD116", "#006B3F"] },
  CUR: { name: "Curaçao",      code: "CUR", group: "D", seed: 4, stripes: ["#002B7F", "#FFD700", "#002B7F"] },

  // Group E
  ESP: { name: "Spain",        code: "ESP", group: "E", seed: 1, stripes: ["#AA151B", "#F1BF00", "#AA151B"] },
  URU: { name: "Uruguay",      code: "URU", group: "E", seed: 2, stripes: ["#FFFFFF", "#0038A8", "#FFFFFF"] },
  IRN: { name: "Iran",         code: "IRN", group: "E", seed: 3, stripes: ["#239F40", "#FFFFFF", "#DA0000"] },
  PAN: { name: "Panama",       code: "PAN", group: "E", seed: 4, stripes: ["#005293", "#FFFFFF", "#D21034"] },

  // Group F
  ENG: { name: "England",      code: "ENG", group: "F", seed: 1, stripes: ["#FFFFFF", "#CE1124", "#FFFFFF"] },
  JPN: { name: "Japan",        code: "JPN", group: "F", seed: 2, stripes: ["#FFFFFF", "#BC002D", "#FFFFFF"] },
  AUS: { name: "Australia",    code: "AUS", group: "F", seed: 3, stripes: ["#012169", "#E4002B"] },
  HAI: { name: "Haiti",        code: "HAI", group: "F", seed: 4, stripes: ["#00209F", "#D21034"] },

  // Group G
  BRA: { name: "Brazil",       code: "BRA", group: "G", seed: 1, stripes: ["#009C3B", "#FFDF00", "#002776"] },
  ECU: { name: "Ecuador",      code: "ECU", group: "G", seed: 2, stripes: ["#FFDD00", "#034EA2", "#ED1C24"] },
  CIV: { name: "Ivory Coast",  code: "CIV", group: "G", seed: 3, stripes: ["#FF8200", "#FFFFFF", "#009A44"] },
  QAT: { name: "Qatar",        code: "QAT", group: "G", seed: 4, stripes: ["#8A1538", "#FFFFFF"] },

  // Group H
  POR: { name: "Portugal",     code: "POR", group: "H", seed: 1, stripes: ["#006600", "#FF0000"] },
  NED: { name: "Netherlands",  code: "NED", group: "H", seed: 2, stripes: ["#AE1C28", "#FFFFFF", "#21468B"] },
  EGY: { name: "Egypt",        code: "EGY", group: "H", seed: 3, stripes: ["#CE1126", "#FFFFFF", "#000000"] },
  CPV: { name: "Cape Verde",   code: "CPV", group: "H", seed: 4, stripes: ["#003893", "#FFFFFF", "#CF2027"] },

  // Group I
  ARG: { name: "Argentina",    code: "ARG", group: "I", seed: 1, stripes: ["#6CACE4", "#FFFFFF", "#6CACE4"] },
  MAR: { name: "Morocco",      code: "MAR", group: "I", seed: 2, stripes: ["#C1272D", "#006233"] },
  NGA: { name: "Nigeria",      code: "NGA", group: "I", seed: 3, stripes: ["#008751", "#FFFFFF", "#008751"] },
  PAR: { name: "Paraguay",     code: "PAR", group: "I", seed: 4, stripes: ["#D52B1E", "#FFFFFF", "#0038A8"] },

  // Group J
  GER: { name: "Germany",      code: "GER", group: "J", seed: 1, stripes: ["#000000", "#DD0000", "#FFCE00"] },
  COL: { name: "Colombia",     code: "COL", group: "J", seed: 2, stripes: ["#FCD116", "#003893", "#CE1126"] },
  TUN: { name: "Tunisia",      code: "TUN", group: "J", seed: 3, stripes: ["#E70013", "#FFFFFF", "#E70013"] },
  JAM: { name: "Jamaica",      code: "JAM", group: "J", seed: 4, stripes: ["#009B3A", "#FED100", "#000000"] },

  // Group K
  BEL: { name: "Belgium",      code: "BEL", group: "K", seed: 1, stripes: ["#000000", "#FAE042", "#ED2939"] },
  DEN: { name: "Denmark",      code: "DEN", group: "K", seed: 2, stripes: ["#C8102E", "#FFFFFF"] },
  ALG: { name: "Algeria",      code: "ALG", group: "K", seed: 3, stripes: ["#006633", "#FFFFFF", "#CE1126"] },
  VEN: { name: "Venezuela",    code: "VEN", group: "K", seed: 4, stripes: ["#FCE300", "#00247D", "#CF142B"] },

  // Group L
  ITA: { name: "Italy",        code: "ITA", group: "L", seed: 1, stripes: ["#008C45", "#F4F9FF", "#CD212A"] },
  NOR: { name: "Norway",       code: "NOR", group: "L", seed: 2, stripes: ["#EF2B2D", "#FFFFFF", "#002868"] },
  TUR: { name: "Turkey",       code: "TUR", group: "L", seed: 3, stripes: ["#E30A17", "#FFFFFF"] },
  BOL: { name: "Bolivia",      code: "BOL", group: "L", seed: 4, stripes: ["#D52B1E", "#F9E300", "#007934"] },
};

// 32-team knockout field, mirror-bracket seeded (16 R32 matches)
export const KNOCKOUT_SEEDING: [string, string][] = [
  // LEFT HALF
  ["ARG", "HAI"],
  ["POR", "POL"],
  ["GER", "SEN"],
  ["ESP", "ECU"],
  ["FRA", "NGA"],
  ["ENG", "DEN"],
  ["ITA", "CRO"],
  ["BRA", "MAR"],
  // RIGHT HALF
  ["USA", "TUR"],
  ["BEL", "JPN"],
  ["NED", "URU"],
  ["MEX", "COL"],
  ["CAN", "KOR"],
  ["ALG", "CIV"],
  ["SUI", "NOR"],
  ["GHA", "EGY"],
];

export const R32_META = [
  { date: "JUN 18", time: "12:00", venue: "MEX CITY" },
  { date: "JUN 18", time: "15:00", venue: "HOUSTON" },
  { date: "JUN 18", time: "18:00", venue: "BOSTON" },
  { date: "JUN 18", time: "21:00", venue: "LOS ANGELES" },
  { date: "JUN 19", time: "12:00", venue: "TORONTO" },
  { date: "JUN 19", time: "15:00", venue: "DALLAS" },
  { date: "JUN 19", time: "18:00", venue: "ATLANTA" },
  { date: "JUN 19", time: "21:00", venue: "SEATTLE" },
  { date: "JUN 20", time: "12:00", venue: "VANCOUVER" },
  { date: "JUN 20", time: "15:00", venue: "KC" },
  { date: "JUN 20", time: "18:00", venue: "PHILADELPHIA" },
  { date: "JUN 20", time: "21:00", venue: "SF BAY" },
  { date: "JUN 21", time: "12:00", venue: "MIAMI" },
  { date: "JUN 21", time: "15:00", venue: "GUADALAJARA" },
  { date: "JUN 21", time: "18:00", venue: "NEW YORK" },
  { date: "JUN 21", time: "21:00", venue: "MONTERREY" },
];

export type FriendEntry = {
  name: string;
  avatar: string;
  pts: number;
  pick: string;
  correct: number;
  total: number;
  badge?: string;
};

export const FRIENDS: FriendEntry[] = [
  { name: "you",          avatar: "YO", pts: 87,  pick: "ARG", correct: 11, total: 14, badge: "🔥" },
  { name: "marcos.b",     avatar: "MB", pts: 92,  pick: "BRA", correct: 12, total: 14, badge: "👑" },
  { name: "sofia_p",      avatar: "SP", pts: 84,  pick: "FRA", correct: 10, total: 14 },
  { name: "jefreysha03",  avatar: "JS", pts: 78,  pick: "ESP", correct: 9,  total: 14 },
  { name: "dk.morales",   avatar: "DK", pts: 71,  pick: "ARG", correct: 9,  total: 14 },
  { name: "lin.wei",      avatar: "LW", pts: 68,  pick: "ENG", correct: 8,  total: 14 },
  { name: "owen.r",       avatar: "OR", pts: 64,  pick: "POR", correct: 8,  total: 14 },
  { name: "tatiana.v",    avatar: "TV", pts: 59,  pick: "USA", correct: 7,  total: 14 },
];
