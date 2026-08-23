// url: SoftUni verification links (softuni.bg/certificates/details/<id>/<hash>),
// copied from the SoftUni profile "certificates" tab. Ordered newest first by
// certificate id (higher id = more recent), so the C#/.NET track sits above the
// older JavaScript track. CERT_FALLBACK_URL is the safety net the 3D cloud uses
// if an entry ever ships without a url.
export const CERT_DATA = [
  {
    name: "Back-End Software Engineer with C# — Diploma",
    url: "https://softuni.bg/certificates/details/264915/b96c2ed6",
  },
  { name: "Entity Framework Core", url: "https://softuni.bg/certificates/details/263700/d05ef7b2" },
  { name: "MS SQL", url: "https://softuni.bg/certificates/details/262200/0a61a833" },
  { name: "ASP.NET Advanced", url: "https://softuni.bg/certificates/details/260014/2f9b0b10" },
  { name: "ASP.NET Fundamentals", url: "https://softuni.bg/certificates/details/257928/42d7cd68" },
  { name: "C# OOP", url: "https://softuni.bg/certificates/details/254287/e959baad" },
  { name: "C# Advanced", url: "https://softuni.bg/certificates/details/139238/a15e82d0" },
  { name: "MSSQL", url: "https://softuni.bg/certificates/details/251594/3e634675" },
  {
    name: "Front-End Developer JavaScript — Diploma",
    url: "https://softuni.bg/certificates/details/256059/34aac0f8",
  },
  { name: "React", url: "https://softuni.bg/certificates/details/168489/855a0f0d" },
  { name: "JavaScript Back-End", url: "https://softuni.bg/certificates/details/162711/07729bab" },
  { name: "JavaScript Applications", url: "https://softuni.bg/certificates/details/149863/25a88944" },
  { name: "HTML and CSS", url: "https://softuni.bg/certificates/details/147301/233868d0" },
  { name: "JavaScript Advanced", url: "https://softuni.bg/certificates/details/145469/94dd7900" },
  { name: "Programming Fundamentals with JavaScript", url: "https://softuni.bg/certificates/details/125483/0368bceb" },
  { name: "QA Fundamentals", url: "https://softuni.bg/certificates/details/133013/505f6769" },
];

export const CERT_FALLBACK_URL = "https://softuni.bg/certificates";
export const CERT_PALETTE = ["#00e5ff", "#ff3ec9", "#8b5cf6", "#5eead4", "#fbbf24"];
