// Everything here is checked against the RehearsalHub repository itself
// (github.com/PeterMonev/RehearsalHub) rather than written from memory — the
// project counts, package versions and class counts below all come from the
// .sln, the .csproj files and the source tree.
//
// Project names, package names and layer names stay untranslated in both
// languages: they are identifiers in the codebase, not prose.
export const CASE_STUDY = {
  project: "RehearsalHub",
  repo: "https://github.com/PeterMonev/RehearsalHub",
  live: "https://rehearsalshub.onrender.com",
  tagline: {
    en: "Seven projects, one dependency direction.",
    bg: "Седем проекта, една посока на зависимостите.",
  },

  problem: {
    en: "Bands lose rehearsals to logistics: who is coming, which songs are on the setlist, who joined which band, and who never got told the time moved. RehearsalHub puts scheduling, setlists, song libraries and band membership behind one account — with invitations and live notifications so nobody finds out late.",
    bg: "Бандите губят репетиции заради организация: кой ще дойде, кои песни са в сетлиста, кой в коя банда е и кой не е разбрал, че часът се е сменил. RehearsalHub слага графика, сетлистите, библиотеката с песни и състава на бандата зад един профил — с покани и известия в реално време, за да не научава никой последен.",
  },

  // dependency direction is inward: Web -> Services -> Data -> Models
  layers: [
    {
      name: "RehearsalHub",
      role: { en: "Web · ASP.NET Core 8 MVC", bg: "Уеб · ASP.NET Core 8 MVC" },
      detail: {
        en: "9 controllers, 56 Razor views, an Admin area, ASP.NET Identity",
        bg: "9 контролера, 56 Razor изгледа, Admin зона, ASP.NET Identity",
      },
      accent: "#00e5ff",
    },
    {
      name: "RehearsalHub.Services.Data",
      role: { en: "Business logic", bg: "Бизнес логика" },
      detail: {
        en: "8 services, each behind its own interface, injected by DI",
        bg: "8 услуги, всяка зад свой интерфейс, подавани през DI",
      },
      accent: "#5eead4",
    },
    {
      name: "RehearsalHub.Data",
      role: { en: "Persistence", bg: "Достъп до данни" },
      detail: {
        en: "DbContext, EF Core 8 migrations, Npgsql provider",
        bg: "DbContext, миграции с EF Core 8, Npgsql провайдър",
      },
      accent: "#8b5cf6",
    },
    {
      name: "RehearsalHub.Data.Models",
      role: { en: "Domain", bg: "Домейн" },
      detail: {
        en: "9 entities, 4 enums, BaseEntity, IAuditInfo — references nothing",
        bg: "9 ентитета, 4 изброими типа, BaseEntity, IAuditInfo — не реферира нищо",
      },
      accent: "#ff3ec9",
    },
  ],
  sideProjects: [
    {
      name: "RehearsalHub.Web.ViewModels",
      detail: {
        en: "keeps entities out of the views",
        bg: "държи ентитетата далеч от изгледите",
      },
    },
    {
      name: "RehearsalHub.GCommon",
      detail: {
        en: "shared constants and validation rules",
        bg: "споделени константи и правила за валидация",
      },
    },
    {
      name: "RehearsalHub.Tests",
      detail: {
        en: "xUnit suite targeting the service layer",
        bg: "xUnit тестове върху сервизния слой",
      },
    },
  ],

  decisions: [
    {
      title: {
        en: "Entities never reach a view",
        bg: "Ентитетата не стигат до изглед",
      },
      body: {
        en: "A separate ViewModels project sits between the controllers and the domain. It costs an extra mapping step, and it means a change to a database column cannot silently reshape a page — or leak a field that was never meant to be rendered.",
        bg: "Отделен ViewModels проект стои между контролерите и домейна. Струва една допълнителна стъпка по мапване, но заради него промяна в колона от базата не може тихо да преобрази страница — нито да изтече поле, което никога не е било за показване.",
      },
    },
    {
      title: {
        en: "Every service behind an interface",
        bg: "Всяка услуга зад интерфейс",
      },
      body: {
        en: "ISongService, IBandService, IRehearsalService and the rest are registered in DI rather than instantiated. That is what makes the test project possible: services are exercised against an in-memory context with the collaborators mocked.",
        bg: "ISongService, IBandService, IRehearsalService и останалите се регистрират в DI, вместо да се създават директно. Точно това прави тестовия проект възможен: услугите се проверяват срещу in-memory контекст, а зависимостите им са подменени с mock-ове.",
      },
    },
    {
      title: {
        en: "Real-time instead of refresh",
        bg: "В реално време, вместо презареждане",
      },
      body: {
        en: "Invitations and schedule changes push over SignalR through a notification hub with a custom user-id provider, so a member sees the change without reloading. It is the part of the build that took the longest to get right.",
        bg: "Поканите и промените в графика се изпращат през SignalR по notification hub със собствен user-id доставчик, така че членът на бандата вижда промяната без да презарежда. Това е частта, която ми отне най-дълго да заработи както трябва.",
      },
    },
    {
      title: { en: "Postgres in production", bg: "Postgres в продукция" },
      body: {
        en: "Built against SQL Server, deployed on Render, which meant swapping to Npgsql and regenerating migrations. EF Core absorbed nearly all of it — the provider changed, the service and controller layers did not. That is the argument for the layering, made by accident.",
        bg: "Разработен срещу SQL Server, но качен на Render, което наложи смяна с Npgsql и повторно генериране на миграциите. EF Core пое почти всичко — провайдърът се смени, сервизният слой и контролерите останаха същите. Това е аргументът за слоестата архитектура, доказан по случайност.",
      },
    },
  ],

  testing: {
    stack: ["xUnit 2.9", "Moq 4.20", "FluentAssertions 6.12", "EF Core InMemory", "coverlet"],
    detail: {
      en: "8 service test classes with a shared TestDataBuilder and a per-test DbContext factory, so each test starts from a known, isolated database.",
      bg: "8 тестови класа върху услугите, със споделен TestDataBuilder и фабрика за DbContext на всеки тест, така че всеки тръгва от известна и изолирана база.",
    },
  },

  nextTime: {
    en: "The service layer talks to the DbContext directly — no repository sits between them, so a query written for one service cannot be reused by another. I would also split the larger services by use case instead of by entity; BandService grew to cover membership, roles and invitations, and that is three responsibilities wearing one name.",
    bg: "Сервизният слой говори директно с DbContext — няма репозитори между тях, така че заявка, писана за една услуга, не може да се преизползва от друга. Бих разделил и по-големите услуги по случай на употреба, а не по ентитет: BandService порасна и покрива членство, роли и покани — това са три отговорности под едно име.",
  },
};
