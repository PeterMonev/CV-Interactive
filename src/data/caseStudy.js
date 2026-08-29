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
  // The heading and the diagram caption belong to the study rather than to the
  // interface strings: there are two of these now, and each describes a
  // different arrangement.
  toggle: {
    en: "How RehearsalHub is put together",
    bg: "Как е устроен RehearsalHub",
  },
  archCaption: {
    en: "depends on ↓ — the domain at the bottom references nothing",
    bg: "зависи от ↓ — домейнът най-долу не реферира нищо",
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

// Same rule as above: every count, package version and file name here was read
// out of github.com/PeterMonev/Music-Instruments-App-React, not remembered.
//
// The interesting part of this project is not the marketplace. It is that the
// one rule worth enforcing — only the person who posted a listing may change
// it — is enforced on the server by three middlewares that each do one thing,
// rather than by a check copied into every handler.
export const CASE_STUDY_SHOP = {
  project: "Music Instruments Shop",
  repo: "https://github.com/PeterMonev/Music-Instruments-App-React",
  live: "https://music-intruments-shop-client.onrender.com/",
  toggle: {
    en: "How the instruments marketplace is put together",
    bg: "Как е устроен магазинът за инструменти",
  },
  tagline: {
    en: "Ownership enforced by three middlewares, not by the interface.",
    bg: "Собствеността се пази от три middleware-а, не от интерфейса.",
  },
  archCaption: {
    en: "a request travels ↓ — nothing below it reaches back up",
    bg: "заявката пътува ↓ — нищо отдолу не се връща нагоре",
  },

  problem: {
    en: "A marketplace for second-hand instruments: anyone can browse the catalogue, a registered user can list gear, and every listing carries comments. Which means one rule has to hold no matter what the page shows — only the person who posted a listing may edit or delete it. Hiding the button is not enforcing it.",
    bg: "Пазар за инструменти втора употреба: всеки може да разглежда каталога, регистриран потребител може да качи своя техника, а всяка обява носи коментари. Тоест едно правило трябва да важи, каквото и да показва страницата — само този, който е качил обявата, може да я редактира или изтрие. Скриването на копчето не е защита.",
  },

  // a request travels down: components -> client services -> controllers ->
  // server services -> mongoose models
  layers: [
    {
      name: "client/src/components",
      role: { en: "React 18 · router 6", bg: "React 18 · router 6" },
      detail: {
        en: "27 components by feature; PublicGuard and PrivateGuard decide what a visitor may open",
        bg: "27 компонента по функционалност; PublicGuard и PrivateGuard решават какво може да отвори посетителят",
      },
      accent: "#00e5ff",
    },
    {
      name: "client/src/services",
      role: { en: "One request()", bg: "Едно request()" },
      detail: {
        en: "4 modules over a single fetch wrapper — the only place the token is attached",
        bg: "4 модула върху една обвивка на fetch — единственото място, където се прикача токенът",
      },
      accent: "#5eead4",
    },
    {
      name: "server/src/controllers",
      role: { en: "Express routers", bg: "Express маршрути" },
      detail: {
        en: "2 controllers; they compose middleware and answer, they do not query",
        bg: "2 контролера; сглобяват middleware и отговарят, но не правят заявки",
      },
      accent: "#8b5cf6",
    },
    {
      name: "server/src/services",
      role: { en: "Business logic", bg: "Бизнес логика" },
      detail: {
        en: "3 modules — the only code in the project that talks to Mongoose",
        bg: "3 модула — единственият код в проекта, който говори с Mongoose",
      },
      accent: "#ff3ec9",
    },
    {
      name: "server/src/models",
      role: { en: "Schemas", bg: "Схеми" },
      detail: {
        en: "User, Instrument, Comment — passwords hashed with bcrypt, never stored raw",
        bg: "User, Instrument, Comment — паролите минават през bcrypt, никога не се пазят в чист вид",
      },
      accent: "#00e5ff",
    },
  ],
  sideProjects: [
    {
      name: "auth.js",
      detail: {
        en: "names the user, never blocks",
        bg: "именува потребителя, но не спира никого",
      },
    },
    {
      name: "preload.js",
      detail: {
        en: "loads the record or answers 404",
        bg: "зарежда записа или връща 404",
      },
    },
    {
      name: "guards.js",
      detail: {
        en: "isAuth and isOwner",
        bg: "isAuth и isOwner",
      },
    },
    {
      name: "errorHandler.js",
      detail: {
        en: "one map from error kind to status",
        bg: "една карта от вид грешка към статус",
      },
    },
  ],

  decisions: [
    {
      title: {
        en: "Ownership is three middlewares, not one check",
        bg: "Собствеността е три middleware-а, не една проверка",
      },
      body: {
        en: "auth reads the x-authorization header and attaches req.user — and then calls next() even when there is no token, so it identifies rather than gates. preload fetches the record by id into res.locals.item, or answers 404 before the handler ever runs. isOwner compares req.user._id against res.locals.item.owner._id. Each does one thing and a route composes the ones it needs. The alternative is those same four lines copied into every handler that can delete something, which only has to be wrong once.",
        bg: "auth чете хедъра x-authorization и закача req.user — и после вика next() дори когато токен няма, тоест разпознава, но не спира. preload зарежда записа по id в res.locals.item или отговаря 404, преди изобщо да се стигне до манипулатора. isOwner сравнява req.user._id с res.locals.item.owner._id. Всеки прави по едно нещо, а маршрутът сглобява тези, които са му нужни. Другият вариант са същите четири реда, преписани във всеки манипулатор, който може да изтрие нещо — а те трябва да сгрешат само веднъж.",
      },
    },
    {
      title: {
        en: "One function owns the token",
        bg: "Една функция държи токена",
      },
      body: {
        en: "services/api.js exports a single request(method, url, data). It reads the session out of sessionStorage and attaches X-Authorization on every call that has one. The four service modules above it only describe endpoints, and not one of the 27 components ever sees a fetch or a token. When the header name changes it changes in one file.",
        bg: "services/api.js изнася едно-единствено request(method, url, data). То чете сесията от sessionStorage и закача X-Authorization на всяка заявка, за която има такъв. Четирите модула над него само описват адреси, а нито един от 27-те компонента не вижда нито fetch, нито токен. Смени ли се името на хедъра, се сменя на едно място.",
      },
    },
    {
      title: {
        en: "Errors are translated once",
        bg: "Грешките се превеждат веднъж",
      },
      body: {
        en: "Mongoose fails in several different shapes: a validation error, a CastError, an ObjectId kind for a malformed id. errorHandler maps each of them to a status code and a readable message in one function, and every controller hands its error to it. Without that the same mistake gets three different answers depending on which route you hit.",
        bg: "Mongoose се проваля по няколко различни начина: грешка при валидация, CastError, вид ObjectId при сбъркано id. errorHandler превежда всеки от тях в статус код и четимо съобщение на едно място, и всеки контролер му подава грешката си. Без това една и съща грешка получава три различни отговора според това кой маршрут си ударил.",
      },
    },
    {
      title: {
        en: "The session dies with the tab",
        bg: "Сесията умира с раздела",
      },
      body: {
        en: "The token sits in sessionStorage rather than localStorage, behind a useSessionStorage hook that keeps React state and storage in step so neither can go stale. Close the tab and you are signed out. On a machine somebody else also uses, that is the safer default and it costs nothing.",
        bg: "Токенът стои в sessionStorage, а не в localStorage, зад hook useSessionStorage, който държи React състоянието и хранилището в синхрон, за да не остарее едното. Затваряш раздела и си излязъл. На машина, която ползва и някой друг, това е по-безопасното поведение и не струва нищо.",
      },
    },
  ],

  testing: {
    stack: ["@testing-library/react", "Jest via react-scripts"],
    detail: {
      en: "One test, on the login form. That is the honest number: the layering makes the services straightforward to test, and the coverage is simply not written yet.",
      bg: "Един тест, върху формата за вход. Това е честното число: разделянето прави услугите лесни за тестване, но покритието просто още не е написано.",
    },
  },

  nextTime: {
    en: "The token lives in sessionStorage, which means any script running on the page can read it; an httpOnly cookie would put it out of reach of the page entirely, and that is where I would move it. The single test is the other gap — the structure is testable, the tests are just not there. And two files are misspelled in the tree, PrivateGuad.js and intrumentServices.js, which costs nothing until somebody searches for the correct name and finds nothing.",
    bg: "Токенът живее в sessionStorage, тоест всеки скрипт, който върви на страницата, може да го прочете; httpOnly бисквитка би го извадила изцяло извън обсега на страницата и точно натам бих го преместил. Единственият тест е другата дупка — структурата е тестваема, просто тестовете ги няма. И два файла са изписани сгрешено, PrivateGuad.js и intrumentServices.js, което не пречи, докато някой не потърси правилното име и не намери нищо.",
  },
};

export const CASE_STUDIES = [CASE_STUDY, CASE_STUDY_SHOP];
