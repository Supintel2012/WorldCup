/**
 * Seam for the RRToolbox-API integration.
 *
 * Today the 1-click auto-fill and the 3-question quiz run locally against the
 * helpers in wc-logic.ts. Once the RRToolbox-API (bracket_list branch of
 * Supintel2012/MarchMadness) is wired up, these two generators should round-trip
 * through the backend so picks stay consistent with server-side scoring.
 *
 * Callers pass the generators through to BracketClient. The defaults run
 * locally; production should replace them with a fetch to the endpoints
 * described in BUILD_API.md.
 */

import {
  autoFillBySeed,
  autoFillFromQuiz,
  type BracketState,
  type QuizAnswers,
} from "./wc-logic";

export type OneClickFn = () => Promise<BracketState> | BracketState;
export type QuizFn = (answers: QuizAnswers) => Promise<BracketState> | BracketState;

/** Local defaults — used until the API is live. */
export const defaultOneClick: OneClickFn = () => autoFillBySeed();
export const defaultQuiz: QuizFn = (answers) => autoFillFromQuiz(answers);

/**
 * Reference shape of the RRToolbox-backed implementation. STUB — swap this
 * in once the endpoint is reachable and the auth story is settled. See
 * BUILD_API.md for the full contract.
 */
export function makeRRToolboxHooks(baseUrl: string): {
  oneClick: OneClickFn;
  quiz: QuizFn;
} {
  const post = async (path: string, body: unknown): Promise<BracketState> => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`RRToolbox ${path} → ${res.status}`);
    const data = (await res.json()) as { picks: BracketState };
    return data.picks;
  };

  return {
    oneClick: () => post("/bracket/one-click", { sport: "wc26" }),
    quiz: (answers) => post("/bracket/quiz", { sport: "wc26", ...answers }),
  };
}
