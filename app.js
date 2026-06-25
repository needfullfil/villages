/* =========================================
   AP DIGITAL UNIVERSE
   APP.JS
========================================= */

/* =========================================
   SPLASH SCREEN
========================================= */



/* =========================================
   ELEMENTS
========================================= */

const installBtn =

  document.getElementById(
    "installBtn"
  );

const appsGrid =

  document.getElementById(
    "appsGrid"
  );

const featuredApp =

  document.getElementById(
    "featuredApp"
  );

const notificationsFeed =

  document.getElementById(
    "notificationsFeed"
  );


const governmentGrid =

  document.getElementById(
    "governmentGrid"
  );

const tollGrid =

  document.getElementById(
    "tollGrid"
  );


/* =========================================
   SAFE LINKS
========================================= */

function safeOpen(url) {

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}

/* =========================================
   APP CARD
========================================= */

function createAppCard(app) {

  return `

    <div
      class="appCard"
    >

      <div class="appCardGlow"></div>

      <img
        src="${app.icon}"
        alt="${app.name}"
        class="appIcon"
        loading="lazy"
        decoding="async"
      />

      <div class="appInfo">

        <div class="appTag">

          ${app.category}

        </div>

        <h3>
          ${app.name}
        </h3>

        <p>
          ${app.description}
        </p>

        <div class="cardButtons">

          <button
            class="openCardBtn"
            onclick="safeOpen('${app.url}')"
          >

            Open App

          </button>


        </div>

      </div>

    </div>

  `;

}



function createGovernmentCard(app) {

  return `

    <div
      class="appCard"
    >

      <div class="appCardGlow"></div>

      <img
        src="${app.icon}"
        alt="${app.name}"
        class="appIcon"
        loading="lazy"
        decoding="async"
      />

      <div class="appInfo">

        <div class="appTag">
          ${app.category}
        </div>

        <h3>
          ${app.name}
        </h3>

        <p>
          ${app.description}
        </p>

        <div class="cardButtons">

          <button
            class="openCardBtn"
            onclick="safeOpen('${app.url}')"
          >
            Open Service
          </button>

        </div>

      </div>

    </div>

  `;

}



function createTollCard(item) {

  return `

    <div
      class="appCard"
      onclick="window.location.href='tel:${item.number}'"
      role="button"
    >

      <div class="appCardGlow"></div>

      <div class="appInfo">

        <div class="appTag">

          ${item.icon}

        </div>

        <h3>

          ${item.title}

        </h3>

        <p>

          ${item.description}

        </p>

        <div class="cardButtons">

          <button
            class="launchButton"
          >

            📞 Call ${item.number}

          </button>

        </div>

      </div>

    </div>

  `;

}


/* =========================================
   FEATURED CARD
========================================= */

function createFeaturedCard(app) {

  return `

    <div
      class="featuredCard"
    >

      <div class="featuredGlow"></div>

      <div class="featuredImageWrap">

        <img
          src="${app.icon}"
          alt="${app.name}"
          loading="lazy"
          decoding="async"
        />

      </div>

      <div class="featuredContent">

        <div class="featuredBadge">

          ${app.badge || "FEATURED"}

        </div>

        <h3>
          ${app.name}
        </h3>

        <p>
          ${app.description}
        </p>

        <div class="cardButtons">

          <button
            class="launchButton"
            onclick="safeOpen('${app.url}')"
          >

            Open Experience

          </button>



        </div>

      </div>

    </div>

  `;

}

/* =========================================
   NOTIFICATION CARD
========================================= */

function createNotificationCard(item) {

  return `

    <div

      class="notificationCard"

      onclick="safeOpen('${item.url}')"

      role="button"

      tabindex="0"

    >

      <div class="notificationGlow"></div>

      <div class="notificationTop">

        <div class="notificationBadge">

          ${item.badge || "UPDATE"}

        </div>

        <div class="notificationTime">

          ${item.time || "NOW"}

        </div>

      </div>

      <h3>
        ${item.title}
      </h3>

      <p>
        ${item.description}
      </p>

    </div>

  `;

}

/* =========================================
   INSTALL POPUP
========================================= */

async function loadData() {

  try {

    const response =
      await fetch("apps.json");

    const data =
      await response.json();

    const apps =
      data.filter(item =>
        item.featured !== undefined
      );

    const government =
      data.filter(item =>
        item.name &&
        item.category &&
        item.icon &&
        item.featured === undefined &&
        item.number === undefined &&
        item.title === undefined
      );

    const tolls =
      data.filter(item =>
        item.number !== undefined
      );

    const notifications =
      data.filter(item =>
        item.time !== undefined
      );

    const featured =
      apps.find(app =>
        app.featured === true
      );

    if (
      featured &&
      featuredApp
    ) {

      featuredApp.innerHTML =
        createFeaturedCard(
          featured
        );

    }

    if (appsGrid) {

      appsGrid.innerHTML =
        apps
          .map(createAppCard)
          .join("");

    }

    if (governmentGrid) {

      governmentGrid.innerHTML =
        government
          .map(createGovernmentCard)
          .join("");

    }

    if (tollGrid) {

      tollGrid.innerHTML =
        tolls
          .map(createTollCard)
          .join("");

    }

    if (notificationsFeed) {

      notificationsFeed.innerHTML =
        notifications
          .map(createNotificationCard)
          .join("");

    }

  }

  catch (error) {

    console.error(
      "Data loading failed",
      error
    );

  }

}


/* =========================================
   CARD EFFECTS
========================================= */

function initCardEffects() {}

/* =========================================
   HERO FLOAT
========================================= */

const heroLogo =

  document.querySelector(
    ".heroLogoWrap"
  );

let floatAngle = 0;

function animateHeroLogo() {

  if (!heroLogo) {
    return;
  }

  floatAngle += 0.002;

  const y =
    Math.sin(floatAngle) * 8;

  const rotate =
    Math.sin(floatAngle * 0.6) * 2;

  heroLogo.style.transform =

    `
      translateY(${y}px)
      rotate(${rotate}deg)
    `;

  requestAnimationFrame(
    animateHeroLogo
  );

}

// animateHeroLogo();

/* =========================================
   PWA INSTALL
========================================= */

let deferredPrompt = null;

function isPWAInstalled() {

  return (

    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||

    window.navigator.standalone === true

  );

}

window.addEventListener(

  "beforeinstallprompt",

  event => {

    event.preventDefault();

    deferredPrompt = event;

    if (
      !isPWAInstalled()
    ) {

      installBtn?.classList.add(
        "showInstall"
      );

    }

  }
);

installBtn?.addEventListener(
  "click",
  async () => {

    if (
      !deferredPrompt
    ) {

      alert(
        "Install option not available on this device/browser."
      );

      return;

    }

    deferredPrompt.prompt();

    const choice =
      await deferredPrompt.userChoice;

    if (
      choice.outcome ===
      "accepted"
    ) {

      installBtn.classList.remove(
        "showInstall"
      );

    }

    deferredPrompt = null;

  }
);

window.addEventListener(
  "appinstalled",
  () => {

    installBtn?.classList.remove(
      "showInstall"
    );

    deferredPrompt = null;

  }
);

/* =========================================
   SERVICE WORKER
========================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .catch(console.error);

    }
  );

}

/* =========================================
   IMAGE FALLBACK
========================================= */

document.addEventListener(
  "error",
  event => {

    if (
      event.target.tagName ===
      "IMG"
    ) {

      event.target.src =
        "/icons/icon-192.png";

    }

  },
  true
);

/* =========================================
   LOAD SYSTEM
========================================= */

loadData();

/* =========================================
   CONSOLE BRANDING
========================================= */

console.log(

  "%cAP DIGITAL UNIVERSE",

  `
    color:#7defff;
    font-size:18px;
    font-weight:bold;
  `
);

console.log(
  "Built by Vidhwaan"
);
