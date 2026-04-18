import { BracketClient } from "./BracketClient";

export const metadata = {
  title: "Bracket · SmartBracket WC26",
};

export const dynamic = "force-dynamic";

export default function BracketPage() {
  return <BracketClient />;
}
