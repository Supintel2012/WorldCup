# RRToolbox-API Integration Guide

This app currently runs the 1-click auto-fill and the 3-question quiz locally
against the helpers in `app/bracket/wc-logic.ts`. When the RRToolbox-API is
ready, those two generators should round-trip through the backend so picks stay
consistent with server-side scoring — the same pattern used by
[Supintel2012/MarchMadness](https://github.com/Supintel2012/MarchMadness/tree/bracket_list).

The UI is already wired for this swap. Nothing in `BracketClient.tsx` or the
per-component files needs to change — only the two generator functions in
`app/bracket/rrtoolbox-api.ts`.

## The seam

`app/bracket/rrtoolbox-api.ts` exports two function types:

```ts
export type OneClickFn = () => Promise<BracketState> | BracketState;
export type QuizFn = (answers: QuizAnswers) => Promise<BracketState> | BracketState;
```

`BracketClient` accepts both as props (with local fallbacks):

```ts
<BracketClient oneClick={rr.oneClick} quiz={rr.quiz} />
```

A reference implementation, `makeRRToolboxHooks(baseUrl)`, is included as a
stub. Swap it in from `app/bracket/page.tsx` once the endpoint is reachable.

## Expected endpoints

Modeled on the bracket helpers in the `bracket_list` branch of RRToolbox-API.

### `POST /bracket/one-click`

Returns a fully-filled bracket using a seed-based auto-pick (the server's
counterpart to `autoFillBySeed`).

Request:

```json
{ "sport": "wc26" }
```

Response:

```json
{
  "picks": {
    "picks": [
      ["ARG", null, "POR", ...],   // round 0 winners (R32, length 16)
      ["ARG", ...],                // round 1 winners (R16, length 8)
      ["ARG", ...],                // round 2 winners (QF,  length 4)
      ["ARG", ...],                // round 3 winners (SF,  length 2)
      ["ARG"]                      // round 4 winner  (Final, length 1)
    ],
    "thirdPlace": "GER"
  }
}
```

### `POST /bracket/quiz`

Takes the three-question quiz answers and returns picks biased toward the
user's champion, dark horse, and chaos preference (the server's counterpart to
`autoFillFromQuiz`).

Request:

```json
{
  "sport": "wc26",
  "champion": "ARG",
  "darkHorse": "MAR",
  "upsetTolerance": "med"
}
```

`upsetTolerance` is one of `"low" | "med" | "high"` (Chalky / Balanced /
Chaotic). Response shape matches `/bracket/one-click`.

### Optional: `POST /bracket/save`

If you want server-side persistence, call this on every `onPick`. Request body
is a `BracketState`; response can be `{ ok: true, id: "..." }`. The client
already writes to `localStorage` under `wc26-picks-v2`, so this is additive.

## `BracketState` shape

Defined in `app/bracket/wc-logic.ts`:

```ts
type BracketState = {
  picks: [
    (string | null)[],  // R32 winners, length 16
    (string | null)[],  // R16 winners, length 8
    (string | null)[],  // QF  winners, length 4
    (string | null)[],  // SF  winners, length 2
    (string | null)[],  // Final winner, length 1
  ];
  thirdPlace: string | null;
};
```

Keys at each position correspond to indexes in `KNOCKOUT_SEEDING` (R32) and the
derived `getMatchup(state, round, idx)` tree. Team codes are the 3-letter FIFA
codes from `TEAMS` in `app/bracket/wc-data.ts` (e.g. `"ARG"`, `"MAR"`,
`"MEX"`).

`thirdPlace` is the loser of the SF that the user picked for the bronze match;
it must be one of the two SF losers or `null`.

## MarchMadness parallel

The bracket_list branch exposes a matching pair — `one_click_fill` and
`quiz_fill` — both returning a `picks` list keyed by game id. For WC26 the
equivalents are keyed by `(round, matchIndex)` via the nested-array shape
above. Everything else (auth cookie, sport scoping, idempotency on repeat
calls) can mirror that service one-to-one.

## Swapping in the real API

In `app/bracket/page.tsx`:

```ts
import { BracketClient } from "./BracketClient";
import { makeRRToolboxHooks } from "./rrtoolbox-api";

const rr = makeRRToolboxHooks(process.env.NEXT_PUBLIC_RRTOOLBOX_URL!);

export default function BracketPage() {
  return <BracketClient oneClick={rr.oneClick} quiz={rr.quiz} />;
}
```

The defaults in `rrtoolbox-api.ts` will keep working in local dev and in any
deploy where the env var is unset.
