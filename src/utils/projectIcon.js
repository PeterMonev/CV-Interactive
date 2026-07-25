import { Music2, Calculator, ShoppingBag } from "lucide-react";

export function projectIcon(name) {
  if (name === "RehearsalHub") return Music2;
  if (name === "Simple Calculator") return Calculator;
  return ShoppingBag;
}

