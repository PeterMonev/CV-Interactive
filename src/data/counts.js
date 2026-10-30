import { CERT_DATA } from "./certificates.js";
import { PROJECTS } from "./projects.js";
import { SKILLS } from "./skills.js";

// The four numbers in About were typed in by hand, so adding a certificate or
// a language left them wrong until someone noticed. Read from the data instead.
const group = (name) => SKILLS.find((g) => g.group === name)?.items.length ?? 0;

export const COUNTS = {
  projects: PROJECTS.length,
  languages: group("Languages"),
  databases: group("Databases"),
  certificates: CERT_DATA.length,
};
