export const SKILLS = [
  { group: "Languages", items: ["JavaScript", "PHP", "C#"] },
  {
    group: "Frameworks & Libraries",
    items: ["React", "Express.js", "Laravel", "Bootstrap", "ASP.NET Core"],
  },
  {
    group: "Frontend",
    items: ["HTML5", "CSS3", "SASS", "jQuery", "Handlebars", "GSAP"],
  },
  { group: "Backend", items: ["Node.js", "Mongoose"] },
  {
    group: "Databases",
    items: ["MySQL", "MariaDB", "MongoDB", "MSSQL", "PostgreSQL"],
  },
  { group: "Tools", items: ["Git", "GitHub", "Selenium"] },
];

// Domain-based regrouping for the 3D galaxy view: the "Chips" view mirrors the
// resume's literal categories, but Frontend/Backend here group by what the
// technology actually is (e.g. React + Bootstrap under Frontend, Laravel +
// ASP.NET Core + Express under Backend), which represents full-stack breadth
// more fairly than the resume's original "Frameworks & Libraries" bucket.

export const RADAR_DOMAINS = [
  { category: "Languages", color: "#8b5cf6", items: ["JavaScript", "PHP", "C#"] },
  {
    category: "Frontend",
    color: "#00e5ff",
    items: ["HTML5", "CSS3", "SASS", "jQuery", "Handlebars", "GSAP", "React", "Bootstrap"],
  },
  {
    category: "Backend",
    color: "#ff3ec9",
    items: ["Laravel", "ASP.NET Core", "Node.js", "Express.js", "Mongoose"],
  },
  {
    category: "Databases",
    color: "#5eead4",
    items: ["MySQL", "MariaDB", "MongoDB", "MSSQL", "PostgreSQL"],
  },
  { category: "Tools", color: "#fbbf24", items: ["Git", "GitHub", "Selenium"] },
];

