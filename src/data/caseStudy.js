// Everything here is checked against the RehearsalHub repository itself
// (github.com/PeterMonev/RehearsalHub) rather than written from memory — the
// project counts, package versions and class counts below all come from the
// .sln, the .csproj files and the source tree.
export const CASE_STUDY = {
  project: "RehearsalHub",
  repo: "https://github.com/PeterMonev/RehearsalHub",
  live: "https://rehearsalshub.onrender.com",
  tagline: "Seven projects, one dependency direction.",

  problem:
    "Bands lose rehearsals to logistics: who is coming, which songs are on the setlist, who joined which band, and who never got told the time moved. RehearsalHub puts scheduling, setlists, song libraries and band membership behind one account — with invitations and live notifications so nobody finds out late.",

  // dependency direction is inward: Web -> Services -> Data -> Models
  layers: [
    {
      name: "RehearsalHub",
      role: "Web · ASP.NET Core 8 MVC",
      detail: "9 controllers, 56 Razor views, an Admin area, ASP.NET Identity",
      accent: "#00e5ff",
    },
    {
      name: "RehearsalHub.Services.Data",
      role: "Business logic",
      detail: "8 services, each behind its own interface, injected by DI",
      accent: "#5eead4",
    },
    {
      name: "RehearsalHub.Data",
      role: "Persistence",
      detail: "DbContext, EF Core 8 migrations, Npgsql provider",
      accent: "#8b5cf6",
    },
    {
      name: "RehearsalHub.Data.Models",
      role: "Domain",
      detail: "9 entities, 4 enums, BaseEntity, IAuditInfo — references nothing",
      accent: "#ff3ec9",
    },
  ],
  sideProjects: [
    { name: "RehearsalHub.Web.ViewModels", detail: "keeps entities out of the views" },
    { name: "RehearsalHub.GCommon", detail: "shared constants and validation rules" },
    { name: "RehearsalHub.Tests", detail: "xUnit suite targeting the service layer" },
  ],

  decisions: [
    {
      title: "Entities never reach a view",
      body:
        "A separate ViewModels project sits between the controllers and the domain. It costs an extra mapping step, and it means a change to a database column cannot silently reshape a page — or leak a field that was never meant to be rendered.",
    },
    {
      title: "Every service behind an interface",
      body:
        "ISongService, IBandService, IRehearsalService and the rest are registered in DI rather than instantiated. That is what makes the test project possible: services are exercised against an in-memory context with the collaborators mocked.",
    },
    {
      title: "Real-time instead of refresh",
      body:
        "Invitations and schedule changes push over SignalR through a notification hub with a custom user-id provider, so a member sees the change without reloading. It is the part of the build that took the longest to get right.",
    },
    {
      title: "Postgres in production",
      body:
        "Built against SQL Server, deployed on Render, which meant swapping to Npgsql and regenerating migrations. EF Core absorbed nearly all of it — the provider changed, the service and controller layers did not. That is the argument for the layering, made by accident.",
    },
  ],

  testing: {
    stack: ["xUnit 2.9", "Moq 4.20", "FluentAssertions 6.12", "EF Core InMemory", "coverlet"],
    detail:
      "8 service test classes with a shared TestDataBuilder and a per-test DbContext factory, so each test starts from a known, isolated database.",
  },

  nextTime:
    "The service layer talks to the DbContext directly — no repository sits between them, so a query written for one service cannot be reused by another. I would also split the larger services by use case instead of by entity; BandService grew to cover membership, roles and invitations, and that is three responsibilities wearing one name.",
};
