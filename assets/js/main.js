(function () {
  var artworks = window.ayeletArtworks || [];
  var activeFilter = "All";
  var activeItems = artworks.slice();
  var activeIndex = 0;
  var lastFocused = null;

  var body = document.body;
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");
  var gallery = document.querySelector("#gallery-grid");
  var filters = document.querySelector("#gallery-filters");
  var search = document.querySelector("#gallery-search");
  var emptyState = document.querySelector("#empty-state");
  var year = document.querySelector("#year");
  var lightbox = document.querySelector("#lightbox");
  var lightboxImage = document.querySelector("#lightbox-image");
  var lightboxTitle = document.querySelector("#lightbox-title");
  var lightboxMeta = document.querySelector("#lightbox-meta");
  var closeLightbox = document.querySelector("[data-close-lightbox]");
  var prevLightbox = document.querySelector("[data-lightbox-prev]");
  var nextLightbox = document.querySelector("[data-lightbox-next]");

  function init() {
    if (year) year.textContent = new Date().getFullYear();
    renderFilters();
    renderGallery();
    bindEvents();
    setHeaderState();
  }

  function bindEvents() {
    window.addEventListener("scroll", setHeaderState, { passive: true });

    if (navToggle) {
      navToggle.addEventListener("click", function () {
        var isOpen = body.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    if (nav) {
      nav.addEventListener("click", function (event) {
        if (event.target.matches("a")) {
          body.classList.remove("nav-open");
          if (navToggle) navToggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (search) {
      search.addEventListener("input", renderGallery);
    }

    document.querySelectorAll("[data-open-art]").forEach(function (button) {
      button.addEventListener("click", function () {
        var index = Number(button.getAttribute("data-open-art"));
        openLightbox(index, artworks);
      });
    });

    document.querySelectorAll("[data-open-press]").forEach(function (button) {
      button.addEventListener("click", function () {
        var src = button.getAttribute("data-open-press");
        openPress(src);
      });
    });

    if (closeLightbox) closeLightbox.addEventListener("click", hideLightbox);
    if (prevLightbox) prevLightbox.addEventListener("click", showPrevious);
    if (nextLightbox) nextLightbox.addEventListener("click", showNext);

    if (lightbox) {
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) hideLightbox();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!lightbox || lightbox.hidden) return;
      if (event.key === "Escape") hideLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    });
  }

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  function renderFilters() {
    if (!filters) return;
    var categories = ["All"].concat(
      artworks
        .map(function (item) {
          return item.category;
        })
        .filter(function (category, index, list) {
          return list.indexOf(category) === index;
        })
    );

    filters.innerHTML = "";
    categories.forEach(function (category) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = category;
      button.className = category === activeFilter ? "is-active" : "";
      button.setAttribute("aria-pressed", String(category === activeFilter));
      button.addEventListener("click", function () {
        activeFilter = category;
        renderFilters();
        renderGallery();
      });
      filters.appendChild(button);
    });
  }

  function renderGallery() {
    if (!gallery) return;

    var query = search ? search.value.trim().toLowerCase() : "";
    activeItems = artworks.filter(function (item) {
      var matchesFilter = activeFilter === "All" || item.category === activeFilter;
      var searchable = [item.title, item.medium, item.dimensions, item.category].join(" ").toLowerCase();
      return matchesFilter && searchable.indexOf(query) !== -1;
    });

    gallery.innerHTML = "";
    activeItems.forEach(function (item, index) {
      var originalIndex = artworks.indexOf(item);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "art-card";
      card.setAttribute("aria-label", "Open " + item.title + ", " + item.medium);
      card.addEventListener("click", function () {
        openLightbox(index, activeItems);
      });

      var imageWrap = document.createElement("span");
      imageWrap.className = "art-card__image";

      var image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      image.loading = originalIndex < 6 ? "eager" : "lazy";
      image.decoding = "async";
      image.sizes = "(min-width: 1200px) 25vw, (min-width: 720px) 33vw, 92vw";

      var caption = document.createElement("span");
      caption.className = "art-card__caption";
      caption.innerHTML = "<strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.medium) + " / " + escapeHtml(item.dimensions) + "</span>";

      imageWrap.appendChild(image);
      card.appendChild(imageWrap);
      card.appendChild(caption);
      gallery.appendChild(card);
    });

    if (emptyState) emptyState.hidden = activeItems.length > 0;
  }

  function openLightbox(index, sourceItems) {
    if (!lightbox || !sourceItems.length) return;
    activeItems = sourceItems;
    activeIndex = index;
    lastFocused = document.activeElement;
    updateLightbox();
    lightbox.hidden = false;
    body.classList.add("lightbox-open");
    if (closeLightbox) closeLightbox.focus();
  }

  function openPress(src) {
    var pressItem = {
      src: src,
      title: "CAN Magazine",
      medium: "Press feature",
      dimensions: "Archive image",
      alt: "CAN Magazine press image featuring Ayelet Yeruham",
      type: "press"
    };
    openLightbox(0, [pressItem]);
  }

  function updateLightbox() {
    var item = activeItems[activeIndex];
    if (!item) return;

    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightbox.classList.toggle("lightbox--press", item.type === "press");
    lightboxTitle.textContent = item.title;
    lightboxMeta.textContent = item.medium + " / " + item.dimensions;

    var single = activeItems.length < 2;
    if (prevLightbox) prevLightbox.hidden = single;
    if (nextLightbox) nextLightbox.hidden = single;
  }

  function hideLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightbox.classList.remove("lightbox--press");
    body.classList.remove("lightbox-open");
    lightboxImage.removeAttribute("src");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function showPrevious() {
    if (activeItems.length < 2) return;
    activeIndex = (activeIndex - 1 + activeItems.length) % activeItems.length;
    updateLightbox();
  }

  function showNext() {
    if (activeItems.length < 2) return;
    activeIndex = (activeIndex + 1) % activeItems.length;
    updateLightbox();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  init();
})();
