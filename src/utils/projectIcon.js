import { Music2, Calculator, ShoppingBag, Boxes } from "lucide-react";

export function projectIcon(name) {
  if (name === "RehearsalHub") return Music2;
  if (name === "CV-Portfolio-Interactive") return Boxes;
  if (name === "Simple Calculator") return Calculator;
  return ShoppingBag;
}

