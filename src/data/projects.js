import {
  PROJECT_IMG_MUSIC_SHOP,
  PROJECT_IMG_BOUTIQUE,
  PROJECT_IMG_CALCULATOR,
  PROJECT_IMG_REHEARSALHUB,
  PROJECT_IMG_MUSIC_CATALOG,
  PROJECT_IMG_MUSIC_LOGIN,
  PROJECT_IMG_BOUTIQUE_2,
  PROJECT_IMG_BOUTIQUE_HEADER,
  PROJECT_IMG_REHEARSAL_SONGS,
  PROJECT_IMG_REHEARSAL_BAND,
} from "./projectImages.js";

export const PROJECTS = [
  {
    name: "RehearsalHub",
    tag: "Capstone Build",
    period: "2025",
    description:
      "Full-stack platform for bands and musicians to manage rehearsal scheduling, setlists, band membership, and song libraries. Architected with Clean Architecture and strict SOLID compliance across six separate projects.",
    stack: ["C#", "ASP.NET Core 8", "MSSQL", "Entity Framework"],
    live: "https://rehearsalshub.onrender.com",
    featured: true,
    images: [PROJECT_IMG_REHEARSALHUB, PROJECT_IMG_REHEARSAL_SONGS, PROJECT_IMG_REHEARSAL_BAND],
  },
  {
    name: "Music Instruments Shop",
    tag: "Full-Stack",
    period: "Mar — Apr 2023",
    description:
      "Marketplace for buying and selling second-hand instruments — browse inventory, list gear for sale, purchase online, and manage an account.",
    stack: ["React", "Node.js", "Express", "MongoDB"],
    live: "https://music-intruments-shop-client.onrender.com/",
    images: [PROJECT_IMG_MUSIC_SHOP, PROJECT_IMG_MUSIC_CATALOG, PROJECT_IMG_MUSIC_LOGIN],
  },
  {
    name: "Boutique Shop PLP",
    tag: "Frontend",
    period: "2023",
    description:
      "E-commerce storefront for clothing, shoes, bags, and watches with cart and account management.",
    stack: ["JavaScript", "HTML", "CSS", "JSON"],
    live: "https://boutique-shop-plp-project.netlify.app/",
    images: [PROJECT_IMG_BOUTIQUE, PROJECT_IMG_BOUTIQUE_2, PROJECT_IMG_BOUTIQUE_HEADER],
  },
  {
    name: "Simple Calculator",
    tag: "UI Study",
    period: "2023",
    description:
      "One of the first personal projects — a clean, visually polished calculator, notable for its attention to interface detail and smooth interaction.",
    stack: ["React", "CSS"],
    live: "https://react-calculator-pm.onrender.com/",
    images: [PROJECT_IMG_CALCULATOR],
  },
];


export const FILTERS = [
  { id: "all", label: "All", test: () => true },
  {
    id: "react",
    label: "React",
    test: (p) => p.stack.some((s) => s.toLowerCase().includes("react")),
  },
  {
    id: "dotnet",
    label: "C# / .NET",
    test: (p) =>
      p.stack.some((s) => {
        const v = s.toLowerCase();
        return (
          v.includes("c#") ||
          v.includes("asp.net") ||
          v.includes("mssql") ||
          v.includes("entity")
        );
      }),
  },
  {
    id: "js",
    label: "JavaScript",
    test: (p) =>
      p.stack.some((s) => {
        const v = s.toLowerCase();
        return v === "javascript" || v.includes("node");
      }),
  },
];
