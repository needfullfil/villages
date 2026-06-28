/* =========================================================
   VILLAGE FOOD MARKETPLACE
   FINAL PRODUCTION APP.JS
========================================================= */

/* =========================
   CONFIG
========================= */

const API_BASE =
  "https://twilight-frog-c0ce.propertiesgrouphyd.workers.dev";



const API_ITEMS =
`${API_BASE}/items`;

const API_CREATE_PAYMENT =
`${API_BASE}/create-payment`;

const API_ADD =
`${API_BASE}/add-item`;





/* =========================
   STATE
========================= */

const state = {



  allItems: [],

  filteredItems: [],

  activeCategory: "food",

  activeAddCategory: "food",

  deferredPrompt: null,

  sliderIndex: 0,

  sliderStarted: false,

  refreshing: false,



  loadingItems: false,

  liveLocation: null,

  activeOrderItem: null,

  autoRefreshTimer: null,



};





/* =========================
   NORMALIZE ITEM
========================= */

function normalizeItem(x){

  return {

    id:
      x.i || "",

    name:
      x.n || "",

    category:

      x.k === "j"

        ? "juices"

        : x.k === "fr"

          ? "fruits"

          : x.k === "s"

            ? "sweets"

            : x.k === "g"

              ? "grocery"

              : x.k === "gd"

                ? "goods"

                : "food",

    price:
      Number(x.p || 0),

    unit:
      x.u || "",

    total:
      Number(x.q || 0),

    shop:
      x.s || "",

    whatsapp:
      x.w || "",

    video:
      x.y || "",

    delivery:
      Number(x.d || 0),

    created_at:
      Number(x.t || 0)

  };

}

/* =========================
   GET VILLAGE
========================= */

function getVillage(){

  const parts =

    location.pathname

      .split("/")

      .filter(Boolean);

  if(
    !parts.length
  ){

    throw new Error(
      "Village not found"
    );

  }

  return parts[0]
    .trim()
    .toLowerCase();

}


/* =========================
   ELEMENTS
========================= */

const els = {

  addBtn:
    document.getElementById("addBtn"),




  floatingRefresh:
    document.getElementById("floatingRefresh"),

  addModal:
    document.getElementById("addModal"),

  cancelItem:
    document.getElementById("cancelItem"),

  closeModalTop:
    document.getElementById("closeModalTop"),

  submitItem:
    document.getElementById("submitItem"),



  items:
    document.getElementById("items"),

  search:
    document.getElementById("search"),

  categories:
    document.getElementById("categories"),

  addCategories:
    document.getElementById("addCategories"),

  toast:
    document.getElementById("toast"),

  installBtn:
    document.getElementById("installBtn"),

  slides:
    document.getElementById("slides"),

  sliderDots:
    document.getElementById("sliderDots"),

  globalLoader:
    document.getElementById("globalLoader"),

  offlineBar:
    document.getElementById("offlineBar"),

  liveText:
    document.getElementById("liveText"),

  pullIndicator:
    document.getElementById("pullIndicator"),





  name:
    document.getElementById("name"),

  price:
    document.getElementById("price"),

  unit:
    document.getElementById("unit"),

  qty:
    document.getElementById("qty"),

  shop:
    document.getElementById("shop"),

  whatsapp:
    document.getElementById("whatsapp"),

  video:
    document.getElementById("video"),

  /* ===== ORDER MODAL ===== */

  orderModal:
    document.getElementById("orderModal"),

  closeOrderModal:
    document.getElementById("closeOrderModal"),

  cancelOrderBtn:
    document.getElementById("cancelOrderBtn"),

  confirmOrderBtn:
    document.getElementById("confirmOrderBtn"),

  orderImage:
    document.getElementById("orderImage"),

  orderName:
    document.getElementById("orderName"),

  orderUnit:
    document.getElementById("orderUnit"),

  orderPrice:
    document.getElementById("orderPrice"),

  orderDelivery:
    document.getElementById("orderDelivery"),

  orderTotal:
    document.getElementById("orderTotal"),

  customerName:
    document.getElementById("customerName"),

  customerPhone:
    document.getElementById("customerPhone"),

  customerAddress:
    document.getElementById("customerAddress"),

  liveLocationBtn:
    document.getElementById("liveLocationBtn"),

  orderQty:
    document.getElementById("orderQty")
};

/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);

async function init() {


  /* =========================
     CATEGORY FILTER
  ========================= */

  els.categories.addEventListener(
    "click",
    e => {

      const btn =
        e.target.closest(".cat");

      if (!btn) return;

      haptic();

      document
        .querySelectorAll(".cat")
        .forEach(x =>
          x.classList.remove("active")
        );

      btn.classList.add("active");

      state.activeCategory =
        btn.dataset.cat;

      applyFilters();
    }
  );

  bindUI();


  /* =========================
     ADD ITEM CATEGORY
  ========================= */

  els.addCategories.addEventListener(
    "click",
    e => {

      const btn =
        e.target.closest(".add-cat");

      if (!btn) return;

      haptic();

      document
        .querySelectorAll(".add-cat")
        .forEach(x =>
          x.classList.remove("active")
        );

      btn.classList.add("active");

      state.activeAddCategory =
        btn.dataset.addcat;
    }
  );

 

  renderSkeletons();

  setupOfflineDetection();

  setupPWA();

  setupPullRefresh();



  setupGlobalDelegation();

 

  await loadItems();

 


  startSlider();

  startAutoRefresh();


}

/* =========================
   BIND UI
========================= */

function on(
  el,
  event,
  handler
){

  if(!el) return;

  el.addEventListener(
    event,
    handler
  );
}

function bindUI() {

  on(
    els.addBtn,
    "click",
    openAddModal
  );

  on(
    els.submitItem,
    "click",
    handleAddItem
  );

  on(
    els.cancelItem,
    "click",
    closeAddModal
  );

  on(
    els.closeModalTop,
    "click",
    closeAddModal
  );


  on(
    els.floatingRefresh,
    "click",
    refreshItems
  );

  on(
    els.search,
    "input",
    applyFilters
  );

  on(
    els.closeOrderModal,
    "click",
    closeOrderModal
  );

  on(
    els.cancelOrderBtn,
    "click",
    closeOrderModal
  );

  on(
    els.confirmOrderBtn,
    "click",
    processOrder
  );

  on(
    els.orderQty,
    "input",
    updateOrderTotal
  );

  on(
    els.liveLocationBtn,
    "click",
    captureLiveLocation
  );

  window.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Escape" &&
        els.addModal &&
        !els.addModal.classList.contains(
          "hidden"
        )
      ) {

        closeAddModal();
      }
    }
  );

  on(
    els.addModal,
    "click",
    e => {

      if (
        e.target === els.addModal
      ) {

        closeAddModal();
      }
    }
  );
}


/* =========================
   EVENT DELEGATION
========================= */

function setupGlobalDelegation() {

  document.addEventListener(
    "click",
    async e => {

      const orderBtn =
        e.target.closest("[data-order]");

      if (orderBtn) {

        haptic();

        await handleOrder(orderBtn);

        return;
      }

      const video =
        e.target.closest("[data-video]");

      if (video) {

        haptic();

        const modal =
          document.getElementById(
            "videoModal"
          );

        const frame =
          document.getElementById(
            "videoFrame"
          );

        const videoId =
          video.dataset.video;

        if(
          !modal ||
          !frame ||
          !videoId
        ) return;

        frame.src =
      `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;

        
      



        /* AUTO CLOSE SAFETY */

        clearTimeout(
          window.__videoTimer
        );

        window.__videoTimer =
        setTimeout(
          closeVideoModal,
          180000
        );

        modal.classList.remove(
          "hidden"
        );

        document.body.classList.add(
          "modal-open"
        );

        return;
      }

      /* ===== ADD MODAL CATEGORY ===== */

 

      /* ===== TOP CATEGORY FILTER ===== */


    }
  );
}

/* =========================
   MARKET STATUS
========================= */


/* =========================
   REFRESH
========================= */

async function refreshItems() {

  if (state.refreshing) return;

  state.refreshing = true;

  haptic();

  renderSkeletons();

  await loadItems();

  state.refreshing = false;
}

/* =========================
   LOAD CATEGORIES
========================= */


/* =========================
   LOAD ITEMS
========================= */

async function loadItems(){

  if(
    state.loadingItems
  ){
    return;
  }

  state.loadingItems =
    true;

  try{

    const village =
      getVillage();

    if(
      !village
    ){

      throw new Error(
        "Village not found"
      );

    }

    const res =
      await fetch(

        `${API_ITEMS}?village=${encodeURIComponent(village)}`,

        {

          cache:"no-store"

        }

      );

    if(
      !res.ok
    ){

      throw new Error(
        "Failed to load items"
      );

    }

    const data =
      await res.json();

    state.allItems =

      Array.isArray(data)

        ? data.map(normalizeItem)

        : [];

    applyFilters();

  }catch(e){

    console.error(e);

    state.allItems = [];

    applyFilters();

    els.items.innerHTML = `

      <div class="card item-card">

        <h3>

          ❌ Failed to load items

        </h3>

      </div>

    `;

  }

  finally{

    state.loadingItems =
      false;

  }

}


/* =========================
   FILTER ITEMS
========================= */

function applyFilters() {

  const q =
    els.search.value
      .trim()
      .toLowerCase();

  let items =
    [...state.allItems];

 

  /* GLOBAL SEARCH */

  if (q) {

    items =
      items.filter(item =>

        item.name
          .toLowerCase()
          .includes(q)
      );

  } else {

    /* CATEGORY */

    items =
      items.filter(item =>

        item.category ===
        state.activeCategory
      );
  }

 

    items.sort((a, b) => {

      /* MORE QUANTITY FIRST */

      if (
        Number(b.total || 0) !==
        Number(a.total || 0)
      ) {

        return (
          Number(b.total || 0) -
          Number(a.total || 0)
        );
      }

      /* LOWER PRICE FIRST */

      return (
        Number(a.price || 0) -
        Number(b.price || 0)
      );
    });

  state.filteredItems = items;

  updateLiveText();

  renderItems(items);
}

/* =========================
   LIVE TEXT
========================= */

function updateLiveText() {

  const total =
    state.allItems.length;

  els.liveText.innerText =
    `${total} fresh items available now`;
}

/* =========================
   SKELETONS
========================= */

function renderSkeletons() {

  els.items.innerHTML =
    Array(6).fill(`
      <div class="card item-card">

        <div
          class="skeleton"
          style="
            height:180px;
            border-radius:18px;
          "
        ></div>

        <div
          class="skeleton"
          style="
            height:16px;
            margin-top:12px;
          "
        ></div>

        <div
          class="skeleton"
          style="
            height:14px;
            margin-top:10px;
            width:60%;
          "
        ></div>

      </div>
    `).join("");
}

/* =========================
   RENDER ITEMS
========================= */

function renderItems(items){

  try{

    if(!Array.isArray(items)){

      els.items.innerHTML="";

      return;

    }

    if(!items.length){

      els.items.innerHTML=`

        <div class="card item-card show">

          <h3>
            🍲 No fresh items today
          </h3>

          <p style="color:#94a3b8;">
            Be the first to add one.
          </p>

        </div>

      `;

      return;

    }

    els.items.innerHTML=

      items.map(item=>{

        const videoId=
          getYouTubeId(
            item.video
          );

        return `

<div
class="card item-card"
id="${item.id}"
>

<div class="food-image-wrap">

<img

loading="lazy"

decoding="async"

src="${
videoId
?`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
:"https://picsum.photos/500/500?food"
}"

${
videoId
?`data-video="${videoId}"`
:""
}

alt="${escapeHtml(item.name)}"

>

</div>

<div class="food-body">

<h3 class="food-title">

${escapeHtml(item.name)}

</h3>

<div class="food-sub-row">

<div class="food-main-details">

₹${item.price}

<span class="food-unit-inline">

(${escapeHtml(item.unit)})

</span>

</div>

</div>

<div class="food-meta">

<div class="food-time">

🕒 ${formatItemTime(item.created_at)}

</div>

<div class="food-time">

🚚 ${item.delivery} min

</div>

</div>

<div class="food-vendor">

🏪 ${escapeHtml(item.shop)}

</div>

<button

class="premium-order-btn"

data-order="${item.id}"

>

Order Now

</button>

</div>

</div>

`;

      }).join("");

  }catch(e){

    console.error(e);

    els.items.innerHTML=`

<div class="card item-card show">

<h3>

❌ Failed to render items

</h3>

</div>

`;

  }

}


/* =========================
   OPEN VIDEO
========================= */
async function captureLiveLocation() {

  try {

    if (!navigator.geolocation) {

      showToast(
        "Location not supported"
      );

      return;
    }

    lockButton(
      els.liveLocationBtn,
      "Detecting..."
    );

    navigator.geolocation.getCurrentPosition(

      position => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        const mapUrl =
`https://maps.google.com/?q=${lat},${lng}`;

        state.liveLocation = {

          lat,
          lng,
          mapUrl

        };

        els.customerAddress.value =
          "Live location selected";

        unlockButton(
          els.liveLocationBtn,
          "📍 Use Current Location"
        );

        showToast(
          "✅ Live location captured"
        );

      },

      error => {

        console.error(error);

        unlockButton(
          els.liveLocationBtn,
          "📍 Use Current Location"
        );

        showToast(
          "❌ Location permission denied"
        );

      },

      {

        enableHighAccuracy:true,

        timeout:15000,

        maximumAge:0

      }

    );

  } catch(e) {

    console.error(e);

    unlockButton(
      els.liveLocationBtn,
      "📍 Use Current Location"
    );

    showToast(
      "❌ Failed to get location"
    );
  }
}



/* =========================
   MODAL
========================= */

function openAddModal() {

  els.addModal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeAddModal() {

  els.addModal.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "modal-open"
  );
}





/* =========================
   ADD ITEM
========================= */

/* =========================
   ADD ITEM
========================= */

async function handleAddItem(){

  if(
    els.submitItem.disabled
  ){
    return;
  }

  const payload={

    village:
      getVillage(),

    n:
      cleanString(
        els.name.value,
        80
      ),

    k:

      state.activeAddCategory==="food"

      ?"f"

      :state.activeAddCategory==="juices"

      ?"j"

      :state.activeAddCategory==="fruits"

      ?"fr"

      :state.activeAddCategory==="sweets"

      ?"s"

      :state.activeAddCategory==="grocery"

      ?"g"

      :"gd",

    p:
      Number(
        els.price.value
      ),

    u:
      cleanString(
        els.unit.value,
        20
      ),

    q:
      Number(
        els.qty.value
      ),

    d:
      Number(
        els.time.value
      ),

    s:
      cleanString(
        els.shop.value,
        60
      ),

    w:
      cleanString(
        els.whatsapp.value,
        15
      ),

    y:
      cleanString(
        els.video.value,
        200
      )

  };

  if(payload.n.length<2){
    showToast("Invalid Item Name");
    return;
  }

  if(payload.s.length<2){
    showToast("Invalid Shop Name");
    return;
  }

  if(payload.w.length<10){
    showToast("Invalid WhatsApp");
    return;
  }

  if(payload.p<1){
    showToast("Invalid Price");
    return;
  }

  if(payload.q<1){
    showToast("Invalid Quantity");
    return;
  }

  if(
    payload.d<1 ||
    payload.d>1440
  ){
    showToast("Invalid Delivery Time");
    return;
  }

  if(payload.u.length<1){
    showToast("Invalid Unit");
    return;
  }

  if(
    !/^https:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]{5,}(\?.*)?$/
      .test(payload.y)
  ){
    showToast("Only YouTube Shorts allowed");
    return;
  }

  lockButton(
    els.submitItem,
    "Creating Payment..."
  );

  try{

    /* =========================
       CREATE PAYMENT
    ========================= */

    const paymentRes =
      await fetch(

        API_CREATE_PAYMENT,

        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(payload)

        }

      );

    const payment =
      await paymentRes.json();

    if(!paymentRes.ok){

      unlockButton(
        els.submitItem,
        "Add Item"
      );

      showToast(

        payment.error ||

        "Payment Failed"

      );

      return;

    }

    unlockButton(
      els.submitItem,
      "Pay ₹1 & Publish"
    );

    const razorpay =
      new Razorpay({

        key:
          payment.key,

        amount:
          payment.amount,

        currency:
          "INR",

        order_id:
          payment.orderId,

        name:
          "Village Marketplace",

        description:
          "Publish Marketplace Item",

        handler:
          async function(response){

            lockButton(
              els.submitItem,
              "Publishing..."
            );

            try{

              const res =
                await fetch(

                  API_ADD,

                  {

                    method:"POST",

                    headers:{

                      "Content-Type":
                        "application/json"

                    },

                    body:
                      JSON.stringify({

                        ...payload,

                        paymentId:
                          response.razorpay_payment_id,

                        orderId:
                          response.razorpay_order_id,

                        signature:
                          response.razorpay_signature

                      })

                  }

                );

              const data =
                await res.json();

              unlockButton(
                els.submitItem,
                "Add Item"
              );

              if(!res.ok){

                showToast(

                  data.error ||

                  "Failed"

                );

                return;

              }

              showToast(
                "✅ Item Added"
              );

              closeAddModal();

              clearAddForm();

              await loadItems();

            }catch(e){

              console.error(e);

              unlockButton(
                els.submitItem,
                "Add Item"
              );

              showToast(
                "Failed to publish"
              );

            }

          },

        modal:{

          ondismiss(){

            unlockButton(
              els.submitItem,
              "Add Item"
            );

            showToast(
              "Payment Cancelled"
            );

          }

        }

      });

    razorpay.open();

  }catch(e){

    console.error(e);

    unlockButton(
      els.submitItem,
      "Add Item"
    );

    showToast(
      "Payment Failed"
    );

  }

}


/* =========================
   ORDER
========================= */

async function handleOrder(btn){

  const itemId =
    btn.dataset.order;

  const item =
    state.allItems.find(
      x => x.id === itemId
    );

  if(!item){

    showToast(
      "Item not found"
    );

    return;

  }

  state.activeOrderItem =
    item;

  const videoId =
    getYouTubeId(
      item.video
    );

  els.orderImage.src =

    videoId

      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

      : "https://picsum.photos/500/500?food";

  els.orderName.innerText =
    item.name;

  els.orderUnit.innerText =
    item.unit;

  els.orderPrice.innerText =
    `₹${item.price}`;

  els.orderDelivery.innerText =
    `${item.delivery} min`;

  els.orderQty.value = 1;

  els.customerName.value = "";

  els.customerPhone.value = "";

  els.customerAddress.value = "";

  state.liveLocation = null;

  updateOrderTotal();

  openOrderModal();

}









/* =========================
   SLIDER
========================= */

function startSlider() {

  if (
    state.sliderStarted ||
    !els.slides
  ) return;

  state.sliderStarted = true;

  const total =
    els.slides.children.length;

  els.sliderDots.innerHTML =
    Array(total)
    .fill(0)
    .map((_,i)=>`
      <div class="${
        i === 0
          ? "active"
          : ""
      }"></div>
    `).join("");

  setInterval(() => {

    state.sliderIndex =
      (state.sliderIndex + 1)
      % total;

    els.slides.style.transform =
      `translateX(-${
        state.sliderIndex * 100
      }%)`;

    document
      .querySelectorAll(
        "#sliderDots div"
      )
      .forEach((dot,i)=>{

        dot.classList.toggle(
          "active",
          i === state.sliderIndex
        );
      });

  }, 4000);
}




/* =========================
   AUTO REFRESH
========================= */

function startAutoRefresh(){

  clearInterval(
    state.autoRefreshTimer
  );

  state.autoRefreshTimer =
    setInterval(async()=>{

      try{

        if(
          document.body.classList.contains(
            "modal-open"
          )
        ){
          return;
        }

        await loadItems();

      }catch(e){

        console.error(e);

      }

    },300000);

}

/* =========================
   PULL REFRESH
========================= */

function setupPullRefresh() {

  let startY = 0;

  window.addEventListener(
    "touchstart",
    e => {

      startY =
        e.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    async e => {

      const endY =
        e.changedTouches[0]
          .clientY;

      if (
        window.scrollY === 0 &&
        endY - startY > 120
      ) {

        haptic();

        await refreshItems();
      }
    },
    { passive: true }
  );
}

/* =========================
   OFFLINE
========================= */

function setupOfflineDetection() {

  const update = () => {

    if (navigator.onLine) {

      els.offlineBar
        .classList
        .add("hidden");

    } else {

      els.offlineBar
        .classList
        .remove("hidden");
    }
  };

  window.addEventListener(
    "online",
    update
  );

  window.addEventListener(
    "offline",
    update
  );

  update();
}

/* =========================
   VISIBILITY REFRESH
========================= */


/* =========================
   PWA
========================= */

function setupPWA() {

  if (
    "serviceWorker" in navigator
  ) {

    navigator
      .serviceWorker
      .register("/sw.js")
      .catch(console.error);
  }

  window.addEventListener(
    "beforeinstallprompt",
    e => {

      e.preventDefault();

      state.deferredPrompt = e;

      if(els.installBtn){

        els.installBtn.style.display =
          "flex";
      }
    }
  );

  if(els.installBtn){

    els.installBtn.addEventListener(
      "click",
      async () => {

        if (
          !state.deferredPrompt
        ) return;

        state.deferredPrompt.prompt();

        state.deferredPrompt = null;
      }
    );
  }
}

/* =========================
   FORM RESET
========================= */

function clearAddForm() {

  [

    els.name,
    els.price,
    els.unit,
    els.qty,
    els.shop,
    els.whatsapp,
    els.video
  ].forEach(el => {

    el.value = "";
  });


}

/* =========================
   BUTTON LOCK
========================= */

function lockButton(
  btn,
  text
) {

  btn.disabled = true;

  btn.dataset.old =
    btn.innerText;

  btn.innerText = text;
}

function unlockButton(
  btn,
  text
) {

  btn.disabled = false;

  btn.innerText =
    text || btn.dataset.old;
}

/* =========================
   TOAST
========================= */

function showToast(msg) {

  els.toast.innerText = msg;

  els.toast.classList.add(
    "show"
  );

  clearTimeout(
    window.__toastTimer
  );

  window.__toastTimer =
    setTimeout(() => {

      els.toast.classList.remove(
        "show"
      );

    }, 2200);
}

/* =========================
   HAPTIC
========================= */

function haptic() {

  if (navigator.vibrate) {

    navigator.vibrate(15);
  }
}

/* =========================
   UTILS
========================= */

/* =========================
   CLEAN STRING
========================= */

function cleanString(
  value,
  max = 100
){

  if(
    value === null ||
    value === undefined
  ){
    return "";
  }

  return String(value)

    .replace(/<[^>]*>/g, "")

    .replace(
      /[\x00-\x1F\x7F]/g,
      ""
    )

    .replace(/\s+/g, " ")

    .trim()

    .slice(0, max);
}


function getYouTubeId(url) {

  try {

    if (!url) return "";

    /* SHORTS */

    if (
      url.includes("/shorts/")
    ) {

      return url
        .split("/shorts/")[1]
        .split("?")[0]
        .trim();
    }

    /* NORMAL */

    const u =
      new URL(url);

    if (
      u.hostname.includes(
        "youtu.be"
      )
    ) {

      return u.pathname
        .replace("/", "")
        .trim();
    }

    return (
      u.searchParams.get("v")
      || ""
    ).trim();

  } catch {

    return "";
  }
}



function formatItemTime(ts){

  try{

    if(!ts){
      return "";
    }

    return new Date(ts)
      .toLocaleString(
        "en-IN",
        {
          hour:"numeric",
          hour12:true
        }
      )
      .replace(/\s/g,"");

  }catch{

    return "";
  }
}



/* =========================
   DISTANCE
========================= */


/* =========================
   ORDER MODAL
========================= */

function openOrderModal() {

  els.orderModal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeOrderModal() {

  els.orderModal.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "modal-open"
  );
}

/* =========================
   UPDATE TOTAL
========================= */

function updateOrderTotal() {

  const item =
    state.activeOrderItem;

  if (!item) return;

  const qty =
    Math.max(
      1,
      Number(
        els.orderQty.value || 1
      )
    );

  const total =
    Math.max(
      1,
      qty * Number(item.price)
    );

  els.orderTotal.innerText =
    `₹${total}`;
}

/* =========================
   PROCESS ORDER
========================= */
/* =========================
   PROCESS ORDER
========================= */

function processOrder(){

  const item =
    state.activeOrderItem;

  if(!item){

    showToast(
      "Item not found"
    );

    return;

  }

  const name =
    cleanString(
      els.customerName.value,
      60
    );

  const phone =
    cleanString(
      els.customerPhone.value,
      15
    );

  const address =
    cleanString(
      els.customerAddress.value,
      300
    );

  const qty =
    Math.max(
      1,
      Number(
        els.orderQty.value || 1
      )
    );

  if(name.length < 2){

    showToast(
      "Enter your name"
    );

    return;

  }

  if(!/^\d{10}$/.test(phone)){

    showToast(
      "Enter valid phone number"
    );

    return;

  }

  if(
    address.length < 5 &&
    !state.liveLocation
  ){

    showToast(
      "Enter address or use live location"
    );

    return;

  }

  const village =
    getVillage();

  let finalAddress =
    address;

  if(
    state.liveLocation
  ){

    finalAddress +=

`\n\nLocation:
${state.liveLocation.mapUrl}`;

  }

  const message =

`Hello,

I want to order this item.

Village:
${village}

Item:
${item.name}

Price:
₹${item.price}/${item.unit}

Quantity:
${qty}

Shop:
${item.shop}

Customer:
${name}

Phone:
${phone}

Address:
${finalAddress}

Page:
${location.href}`;

  window.open(

`https://wa.me/91${item.whatsapp}?text=${encodeURIComponent(message)}`,

"_blank"

  );

  closeOrderModal();

  showToast(
    "Opening WhatsApp..."
  );

}

/* =========================================================
   GLOBAL FOOTER MODAL SYSTEM
========================================================= */

function openModal(id){

  const modal =
    document.getElementById(id);

  if(!modal) return;

  modal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeModal(id){

  const modal =
    document.getElementById(id);

  if(!modal) return;

  modal.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "modal-open"
  );
}

/* =========================================================
   GLOBAL EVENT DELEGATION
========================================================= */

document.addEventListener(
  "click",
  e => {

    /* =====================================================
       OPEN MODAL
    ===================================================== */

    const modalBtn =
      e.target.closest(
        "[data-modal]"
      );

    if(modalBtn){

      openModal(
        modalBtn.dataset.modal
      );

      return;
    }

    /* =====================================================
       OPEN EXTERNAL LINKS
    ===================================================== */

    const linkBtn =
      e.target.closest(
        "[data-link]"
      );

    if(linkBtn){

      window.open(
        linkBtn.dataset.link,
        "_blank"
      );

      return;
    }

    /* =====================================================
       HOW APP WORKS
    ===================================================== */

    const howBtn =
      e.target.closest(
        "[data-action='how']"
      );

    if(howBtn){

      openModal(
        "howWorksModal"
      );

      /* LOAD VIDEO ONLY WHEN OPEN */

      const frame =
        document.getElementById(
          "howWorksFrame"
        );

      if(
        frame &&
        !frame.src
      ){

        frame.src =
"https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1";
      }

      return;
    }

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeBtn =
      e.target.closest(
        "[data-close]"
      );

    if(closeBtn){

      const modalId =
        closeBtn.dataset.close;

      /* STOP VIDEO */

      if(
        modalId ===
        "howWorksModal"
      ){

        const frame =
          document.getElementById(
            "howWorksFrame"
          );

        if(frame){

          frame.src = "";
        }
      }

      closeModal(modalId);

      return;
    }

    /* =====================================================
       OUTSIDE CLICK CLOSE
    ===================================================== */

    const modal =
      e.target.closest(
        ".modal"
      );

    if(
      modal &&
      e.target === modal
    ){

      /* STOP VIDEO */

      if(
        modal.id ===
        "howWorksModal"
      ){

        const frame =
          document.getElementById(
            "howWorksFrame"
          );

        if(frame){

          frame.src = "";
        }
      }

      modal.classList.add(
        "hidden"
      );

      document.body.classList.remove(
        "modal-open"
      );
    }
  }
);




/* =========================================================
   VIDEO MODAL
========================================================= */

document.addEventListener(
  "click",
  e => {

    const close =
      e.target.closest(
        "[data-close-video]"
      );

    if(close){

      closeVideoModal();

      return;
    }

    const modal =
      document.getElementById(
        "videoModal"
      );

    if(
      modal &&
      e.target === modal
    ){

      closeVideoModal();
    }
  }
);

function closeVideoModal(){

  const modal =
    document.getElementById(
      "videoModal"
    );

  const frame =
    document.getElementById(
      "videoFrame"
    );

  if(modal){

    modal.classList.add(
      "hidden"
    );
  }

  document.body.classList.remove(
    "modal-open"
  );

  /* FULL VIDEO CLEANUP */

  if(frame){

    frame.src = "";
  }

  /* CLEAR AUTO CLOSE TIMER */

  clearTimeout(
    window.__videoTimer
  );
}




/* =========================================================
   FORCE LIVE UPDATE
========================================================= */

if ("serviceWorker" in navigator) {

  navigator.serviceWorker.addEventListener(
    "message",
    async event => {

      if (
        event.data &&
        event.data.type === "FORCE_RELOAD"
      ) {

        try {

          if (
            document.body.classList.contains(
              "modal-open"
            )
          ) {
            return;
          }

          if (
            els.confirmOrderBtn?.disabled
          ) {
            return;
          }

          await loadItems();

        } catch(e){

          console.error(e);
        }
      }
    }
  );
}
