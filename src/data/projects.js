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
    tag: { en: "Capstone Build", bg: "Дипломен проект" },
    period: "2026",
    // Counts and technologies here are read off the repository itself, not the
    // original course brief: the solution holds seven projects, and the live
    // deployment on Render runs EF Core against Npgsql rather than SQL Server.
    description: {
      en: "Full-stack platform for bands and musicians to manage rehearsal scheduling, setlists, band membership, and song libraries. Clean Architecture across seven projects, real-time notifications over SignalR, and a service-layer test suite.",
      bg: "Full-stack платформа за банди и музиканти — управление на репетиции, сетлисти, състав на бандата и библиотека с песни. Clean Architecture в седем проекта, известия в реално време през SignalR и тестове на сервизния слой.",
    },
    stack: ["C#", "ASP.NET Core 8", "EF Core 8", "PostgreSQL", "SignalR", "xUnit"],
    live: "https://rehearsalshub.onrender.com",
    featured: true,
    images: [PROJECT_IMG_REHEARSALHUB, PROJECT_IMG_REHEARSAL_SONGS, PROJECT_IMG_REHEARSAL_BAND],
  },
  {
    name: "Music Instruments Shop",
    tag: "Full-Stack",
    period: { en: "Mar — Apr 2023", bg: "март — апр 2023" },
    description: {
      en: "Marketplace for buying and selling second-hand instruments — browse inventory, list gear for sale, purchase online, and manage an account.",
      bg: "Платформа за купуване и продаване на инструменти втора употреба — разглеждане на обяви, качване на своя техника, онлайн покупка и управление на профил.",
    },
    stack: ["React", "Node.js", "Express", "MongoDB"],
    live: "https://music-intruments-shop-client.onrender.com/",
    images: [PROJECT_IMG_MUSIC_SHOP, PROJECT_IMG_MUSIC_CATALOG, PROJECT_IMG_MUSIC_LOGIN],
  },
  {
    name: "Boutique Shop PLP",
    tag: { en: "Frontend", bg: "Фронтенд" },
    period: "2023",
    description: {
      en: "E-commerce storefront for clothing, shoes, bags, and watches with cart and account management.",
      bg: "Онлайн магазин за дрехи, обувки, чанти и часовници с количка и управление на профил.",
    },
    stack: ["JavaScript", "HTML", "CSS", "JSON"],
    live: "https://boutique-shop-plp-project.netlify.app/",
    images: [PROJECT_IMG_BOUTIQUE, PROJECT_IMG_BOUTIQUE_2, PROJECT_IMG_BOUTIQUE_HEADER],
  },
  {
    name: "Simple Calculator",
    tag: { en: "UI Study", bg: "Упражнение по интерфейс" },
    period: "2023",
    description: {
      en: "One of the first personal projects — a clean, visually polished calculator, notable for its attention to interface detail and smooth interaction.",
      bg: "Един от първите ми лични проекти — изчистен и добре изглеждащ калкулатор, с внимание към детайла в интерфейса и плавното взаимодействие.",
    },
    stack: ["React", "CSS"],
    live: "https://react-calculator-pm.onrender.com/",
    images: [PROJECT_IMG_CALCULATOR],
  },
];


export const FILTERS = [
  { id: "all", labelKey: "all", test: () => true },
  {
    id: "react",
    labelKey: "react",
    test: (p) => p.stack.some((s) => s.toLowerCase().includes("react")),
  },
  {
    id: "dotnet",
    labelKey: "dotnet",
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
    labelKey: "frontend",
    test: (p) =>
      p.stack.some((s) => {
        const v = s.toLowerCase();
        return v === "javascript" || v.includes("node");
      }),
  },
];
