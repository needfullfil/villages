/* =========================================
   AP DIGITAL UNIVERSE
   APP.JS
   FINAL PRODUCTION VERSION
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const installBtn =
  document.getElementById("installBtn");

const appsGrid =
  document.getElementById("appsGrid");

const featuredApp =
  document.getElementById("featuredApp");

const notificationsFeed =
  document.getElementById("notificationsFeed");

const governmentGrid =
  document.getElementById("governmentGrid");

const tollGrid =
  document.getElementById("tollGrid");

const videosGrid =
  document.getElementById("videosGrid");


/* =========================================
   CARD RENDERERS
========================================= */

const render = (() => {

  const card = (item, buttonText) => `
    <div class="appCard">

      <div class="appCardGlow"></div>

      <img
        src="${item.icon}"
        alt="${item.name}"
        class="appIcon"
        loading="lazy"
        decoding="async"
      >

      <div class="appInfo">

        <div class="appTag">
          ${item.category}
        </div>

        <h3>${item.name}</h3>

        <p>${item.description}</p>

        <div class="cardButtons">

          <button
            class="openCardBtn"
            type="button"
            data-url="${item.url}"
          >
            ${buttonText}
          </button>

        </div>

      </div>

    </div>
  `;


  return {

    app(item) {
      return card(item, "Open App");
    },


    government(item) {
      return card(item, "Open Service");
    },


    toll(item) {
      return `
        <div
          class="appCard"
          data-phone="${item.number}"
          role="button"
          tabindex="0"
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
                type="button"
              >
                📞 Call ${item.number}
              </button>

            </div>

          </div>

        </div>
      `;
    },


    featured(item) {
      return `
        <div class="featuredCard">

          <div class="featuredGlow"></div>

          <div class="featuredImageWrap">

            <img
              src="${item.icon}"
              alt="${item.name}"
              loading="eager"
              decoding="async"
            >

          </div>

          <div class="featuredContent">

            <div class="featuredBadge">
              ${item.badge || "FEATURED"}
            </div>

            <h3>
              ${item.name}
            </h3>

            <p>
              ${item.description}
            </p>

            <div class="cardButtons">

              <button
                class="launchButton"
                type="button"
                data-url="${item.url}"
              >
                Open Experience
              </button>

            </div>

          </div>

        </div>
      `;
    },


    notification(item) {
      return `
        <div
          class="notificationCard"
          data-url="${item.url || ""}"
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
    },


    video(item) {

      const youtubeUrl =
        String(item.youtube || "").trim();

      if (!youtubeUrl) {
        return "";
      }


      /*
       * Detect YouTube video ID
       */

      let videoId = "";

      let isShort = false;


      try {

        const url =
          new URL(youtubeUrl);


        /*
         * YouTube Shorts
         */

        if (
          url.hostname === "www.youtube.com" ||
          url.hostname === "youtube.com" ||
          url.hostname === "m.youtube.com"
        ) {

          const parts =
            url.pathname
              .split("/")
              .filter(Boolean);


          if (
            parts[0] === "shorts" &&
            parts[1]
          ) {

            videoId =
              parts[1];

            isShort = true;

          }


          /*
           * Normal watch URL
           */

          if (
            !videoId &&
            url.pathname === "/watch"
          ) {

            videoId =
              url.searchParams.get("v") || "";

          }


          /*
           * Embed URL
           */

          if (
            !videoId &&
            parts[0] === "embed" &&
            parts[1]
          ) {

            videoId =
              parts[1];

          }

        }


        /*
         * youtu.be URL
         */

        if (
          !videoId &&
          (
            url.hostname === "youtu.be" ||
            url.hostname === "www.youtu.be"
          )
        ) {

          videoId =
            url.pathname
              .split("/")
              .filter(Boolean)[0] || "";

        }

      }

      catch (error) {

        console.warn(
          "Invalid YouTube URL:",
          youtubeUrl
        );

        return "";

      }


      /*
       * Clean video ID
       */

      videoId =
        videoId
          .split("?")[0]
          .split("&")[0]
          .trim();


      if (!videoId) {
        return "";
      }


      /*
       * Official privacy-enhanced YouTube embed
       */

      const embedUrl =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(videoId) +
        "?autoplay=1" +
        "&playsinline=1" +
        "&rel=0" +
        "&modestbranding=1";


      /*
       * YouTube thumbnail
       *
       * We show only the thumbnail initially.
       * The iframe is created after the user clicks.
       */

      const thumbnail =
        "https://i.ytimg.com/vi/" +
        encodeURIComponent(videoId) +
        "/maxresdefault.jpg";


      return `
        <article
          class="videoCard ${
            isShort
              ? "videoCardShort"
              : "videoCardNormal"
          }"
          data-video-id="${videoId}"
          data-video-src="${embedUrl}"
        >

          <div class="videoPlayerWrap">

            <button
              class="videoPoster"
              type="button"
              aria-label="Play ${item.title || "video"}"
            >

              <img
                src="${thumbnail}"
                alt=""
                class="videoThumbnail"
                loading="lazy"
                decoding="async"
                onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg';"
              >

              <span
                class="videoPlayButton"
                aria-hidden="true"
              >
                ▶
              </span>

            </button>

          </div>


          <div class="videoContent">

            ${
              item.title
                ? `
                  <h3>
                    ${item.title}
                  </h3>
                `
                : ""
            }

            ${
              item.description
                ? `
                  <p>
                    ${item.description}
                  </p>
                `
                : ""
            }

          </div>

        </article>
      `;
    }

  };

})();


/* =========================================
   LOAD DATA
========================================= */

async function loadData() {

  try {

    const response =
      await fetch("apps.json", {
        cache: "default"
      });


    if (!response.ok) {

      throw new Error(
        `apps.json returned ${response.status}`
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "apps.json must contain an array"
      );

    }


    /* -------------------------------------
       HTML BUFFERS
    ------------------------------------- */

    let featuredHtml = "";

    let appsHtml = "";

    let governmentHtml = "";

    let tollHtml = "";

    let notificationHtml = "";

    let videosHtml = "";


    /* -------------------------------------
       SINGLE DATA PASS
    ------------------------------------- */

    for (const item of data) {

      if (
        !item ||
        typeof item !== "object"
      ) {

        continue;

      }


      /* -----------------------------------
         VIDEOS
      ----------------------------------- */

      if (
        item.type === "video"
      ) {

        videosHtml +=
          render.video(item);

        continue;

      }


      /* -----------------------------------
         NOTIFICATIONS
      ----------------------------------- */

      if (
        item.time !== undefined
      ) {

        notificationHtml +=
          render.notification(item);

        continue;

      }


      /* -----------------------------------
         TOLL / IMPORTANT NUMBERS
      ----------------------------------- */

      if (
        item.number !== undefined
      ) {

        tollHtml +=
          render.toll(item);

        continue;

      }


      /* -----------------------------------
         APPLICATIONS
      ----------------------------------- */

      if (
        item.featured !== undefined
      ) {

        appsHtml +=
          render.app(item);


        if (
          item.featured === true
        ) {

          featuredHtml =
            render.featured(item);

        }


        continue;

      }


      /* -----------------------------------
         GOVERNMENT SERVICES
      ----------------------------------- */

      governmentHtml +=
        render.government(item);

    }


    /* -------------------------------------
       RENDER ALL CONTENT
    ------------------------------------- */

    if (
      featuredApp &&
      featuredHtml
    ) {

      featuredApp.innerHTML =
        featuredHtml;

    }


    if (appsGrid) {

      appsGrid.innerHTML =
        appsHtml;

    }


    if (governmentGrid) {

      governmentGrid.innerHTML =
        governmentHtml;

    }


    if (tollGrid) {

      tollGrid.innerHTML =
        tollHtml;

    }


    if (notificationsFeed) {

      notificationsFeed.innerHTML =
        notificationHtml;

    }


    if (videosGrid) {

      videosGrid.innerHTML =
        videosHtml;

    }

  }

  catch (error) {

    console.error(
      "AP Digital Universe data loading failed:",
      error
    );

  }

}


/* =========================================
   PWA INSTALL
========================================= */

let deferredPrompt = null;


/* -----------------------------------------
   CHECK PWA INSTALLATION
----------------------------------------- */

function isPWAInstalled() {

  return (

    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||

    window.navigator.standalone === true

  );

}


/* -----------------------------------------
   INSTALL PROMPT
----------------------------------------- */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredPrompt = event;

    if (
      installBtn &&
      !isPWAInstalled()
    ) {

      installBtn.classList.add(
        "showInstall"
      );

    }

  }
);


/* -----------------------------------------
   INSTALL BUTTON
----------------------------------------- */

if (installBtn) {

  installBtn.addEventListener(
    "click",
    async () => {

      if (!deferredPrompt) {

        return;

      }

      const promptEvent =
        deferredPrompt;

      deferredPrompt = null;

      try {

        await promptEvent.prompt();

        const result =
          await promptEvent.userChoice;

        if (
          result.outcome === "accepted"
        ) {

          installBtn.classList.remove(
            "showInstall"
          );

        }

      }

      catch (error) {

        console.error(
          "PWA installation failed:",
          error
        );

      }

    }
  );

}


/* -----------------------------------------
   APP INSTALLED
----------------------------------------- */

window.addEventListener(
  "appinstalled",
  () => {

    deferredPrompt = null;

    if (installBtn) {

      installBtn.classList.remove(
        "showInstall"
      );

    }

  }
);


/* =========================================
   IMAGE FALLBACK
========================================= */

document.addEventListener(
  "error",
  event => {

    const image =
      event.target;

    if (
      image &&
      image.tagName === "IMG" &&
      !image.classList.contains("videoThumbnail") &&
      !image.dataset.fallback
    ) {

      image.dataset.fallback = "1";

      image.src =
        "/icons/icon-192.png";

    }

  },
  true
);



/* =========================================
   VIDEO PLAYER
========================================= */

document.addEventListener(
  "click",
  event => {

    const poster =
      event.target.closest(
        ".videoPoster"
      );


    if (!poster) {
      return;
    }


    const card =
      poster.closest(
        ".videoCard"
      );


    if (!card) {
      return;
    }


    const playerWrap =
      card.querySelector(
        ".videoPlayerWrap"
      );


    const videoSrc =
      card.dataset.videoSrc;


    if (
      !playerWrap ||
      !videoSrc
    ) {

      return;

    }


    /*
     * Create the official YouTube
     * iframe only after user clicks.
     */

    const iframe =
      document.createElement("iframe");


    iframe.className =
      "videoPlayer";


    iframe.src =
      videoSrc;


    iframe.title =
      "YouTube video";


    iframe.loading =
      "lazy";


    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


    iframe.allowFullscreen =
      true;


    iframe.referrerPolicy =
      "strict-origin-when-cross-origin";


    playerWrap.replaceChildren(
      iframe
    );

  }
);



/* =========================================
   GLOBAL CLICK HANDLER
========================================= */

document.addEventListener(
  "click",
  event => {

    const target =
      event.target;

    if (
      !target ||
      !target.closest
    ) {

      return;

    }

    const element =
      target.closest(
        "[data-url],[data-phone]"
      );

    if (!element) {

      return;

    }


    const {
      url,
      phone
    } = element.dataset;


    /* -------------------------------------
       OPEN URL
    ------------------------------------- */

    if (url) {

      window.location.assign(url);

      return;

    }


    /* -------------------------------------
       CALL PHONE
    ------------------------------------- */

    if (phone) {

      window.location.href =
        "tel:" + phone;

    }

  }
);


/* =========================================
   KEYBOARD ACCESSIBILITY
========================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {

      return;

    }

    const target =
      event.target;

    if (
      !target ||
      !target.closest
    ) {

      return;

    }

    const element =
      target.closest(
        "[data-url],[data-phone]"
      );

    if (!element) {

      return;

    }


    /*
      Native buttons already handle
      Enter / Space themselves.
    */

    if (
      target.tagName === "BUTTON"
    ) {

      return;

    }

    event.preventDefault();


    const {
      url,
      phone
    } = element.dataset;


    if (url) {

      window.location.assign(url);

      return;

    }


    if (phone) {

      window.location.href =
        "tel:" + phone;

    }

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
        .catch(() => {});

    },
    {
      once: true
    }
  );

}


/* =========================================
   START APPLICATION
========================================= */

loadData();
