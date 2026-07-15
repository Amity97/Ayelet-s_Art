(function () {
  var artworks = window.ayeletArtworks || [];
  var activeFilter = "All";
  var activeYear = "All";
  var activeItems = artworks.slice();
  var lightboxItems = [];
  var activeIndex = 0;
  var lastFocused = null;
  var renderedColumns = 0;

  var body = document.body;
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");
  var gallery = document.querySelector("#gallery-grid");
  var filters = document.querySelector("#gallery-filters");
  var yearFilters = document.querySelector("#gallery-years");
  var search = document.querySelector("#gallery-search");
  var emptyState = document.querySelector("#empty-state");
  var year = document.querySelector("#year");
  var lightbox = document.querySelector("#lightbox");
  var lightboxImage = document.querySelector("#lightbox-image");
  var lightboxTitle = document.querySelector("#lightbox-title");
  var lightboxMeta = document.querySelector("#lightbox-meta");
  var lightboxStatus = document.querySelector("#lightbox-status");
  var closeLightbox = document.querySelector("[data-close-lightbox]");
  var prevLightbox = document.querySelector("[data-lightbox-prev]");
  var nextLightbox = document.querySelector("[data-lightbox-next]");

  function init() {
    if (year) year.textContent = new Date().getFullYear();
    renderFilters();
    renderYearFilters();
    renderGallery();
    bindEvents();
    setHeaderState();
  }

  function bindEvents() {
    window.addEventListener("scroll", setHeaderState, { passive: true });

    window.addEventListener("resize", function () {
      if (galleryColumnCount() !== renderedColumns) renderGallery();
    });

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

    document.querySelectorAll("[data-open-art-src]").forEach(function (button) {
      button.addEventListener("click", function () {
        var src = button.getAttribute("data-open-art-src");
        var index = artworks.map(function (item) { return item.src; }).indexOf(src);
        if (index !== -1) openLightbox(index, artworks);
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
        var active = filters.querySelector(".is-active");
        if (active) active.focus();
      });
      filters.appendChild(button);
    });
  }

  function renderYearFilters() {
    if (!yearFilters) return;
    var years = artworks
      .map(function (item) {
        return item.year;
      })
      .filter(function (year, index, list) {
        return year && list.indexOf(year) === index;
      })
      .sort(function (a, b) {
        return b - a;
      });

    if (!years.length) return;

    yearFilters.innerHTML = "";
    ["All"].concat(years).forEach(function (yearOption) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = yearOption === "All" ? "All years" : String(yearOption);
      button.className = yearOption === activeYear ? "is-active" : "";
      button.setAttribute("aria-pressed", String(yearOption === activeYear));
      button.addEventListener("click", function () {
        activeYear = yearOption;
        renderYearFilters();
        renderGallery();
        var active = yearFilters.querySelector(".is-active");
        if (active) active.focus();
      });
      yearFilters.appendChild(button);
    });
  }

  function galleryColumnCount() {
    if (!gallery) return 1;
    var template = getComputedStyle(gallery).gridTemplateColumns;
    return template === "none" ? 1 : template.split(" ").length;
  }

  function cardHeightEstimate(item) {
    // approximate card height in column-width units so items flow row by row
    var ratio = 1.25;
    var match = /^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i.exec(item.dimensions || "");
    if (match) ratio = parseFloat(match[1]) / parseFloat(match[2]);
    return Math.min(Math.max(ratio, 0.4), 2.6) + 0.34;
  }

  function renderGallery() {
    if (!gallery) return;

    var query = search ? search.value.trim().toLowerCase() : "";
    activeItems = artworks.filter(function (item) {
      var matchesFilter = activeFilter === "All" || item.category === activeFilter;
      var matchesYear = activeYear === "All" || item.year === activeYear;
      var searchable = [item.title, item.medium, item.dimensions, item.category, item.year || "", item.alt].join(" ").toLowerCase();
      return matchesFilter && matchesYear && searchable.indexOf(query) !== -1;
    });

    gallery.innerHTML = "";
    renderedColumns = galleryColumnCount();
    var renderedItems = activeItems;
    var columns = [];
    var columnHeights = [];
    for (var i = 0; i < renderedColumns; i++) {
      var column = document.createElement("div");
      column.className = "gallery-grid__col";
      gallery.appendChild(column);
      columns.push(column);
      columnHeights.push(0);
    }

    activeItems.forEach(function (item, index) {
      var originalIndex = artworks.indexOf(item);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "art-card";
      var statusLabel = item.status === "sold" ? ", sold" : item.status === "nfs" ? ", not for sale" : "";
      card.setAttribute("aria-label", "Open " + item.title + ", " + item.medium + statusLabel);
      card.addEventListener("click", function () {
        openLightbox(index, renderedItems);
      });

      var imageWrap = document.createElement("span");
      imageWrap.className = "art-card__image";

      var image = document.createElement("img");
      image.src = item.thumb || item.src;
      image.alt = item.alt;
      image.loading = originalIndex < 6 ? "eager" : "lazy";
      image.decoding = "async";
      image.sizes = "(min-width: 1200px) 25vw, (min-width: 720px) 33vw, 92vw";

      var metaParts = [item.medium, item.dimensions].filter(Boolean).join(" / ");
      var caption = document.createElement("span");
      caption.className = "art-card__caption";
      caption.innerHTML = "<strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(metaParts) + "</span>";

      imageWrap.appendChild(image);
      if (item.status) {
        var badge = document.createElement("span");
        badge.className = "art-badge art-badge--" + item.status;
        badge.textContent = item.status === "sold" ? "Sold" : "Not for sale";
        imageWrap.appendChild(badge);
      }
      card.appendChild(imageWrap);
      card.appendChild(caption);

      // place in the shortest column so works keep their top-to-bottom order
      var target = 0;
      for (var c = 1; c < columns.length; c++) {
        if (columnHeights[c] < columnHeights[target] - 0.001) target = c;
      }
      columns[target].appendChild(card);
      columnHeights[target] += cardHeightEstimate(item);
    });

    if (emptyState) emptyState.hidden = activeItems.length > 0;
  }

  function openLightbox(index, sourceItems) {
    if (!lightbox || !sourceItems.length) return;
    lightboxItems = sourceItems;
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
    var item = lightboxItems[activeIndex];
    if (!item) return;

    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightbox.classList.toggle("lightbox--press", item.type === "press");
    lightboxTitle.textContent = item.title;
    lightboxMeta.textContent = [item.medium, item.dimensions, item.year].filter(Boolean).join(" / ");

    if (lightboxStatus) {
      if (item.status) {
        lightboxStatus.textContent = item.status === "sold" ? "Sold" : "Not for sale";
        lightboxStatus.className = "lightbox__status lightbox__status--" + item.status;
        lightboxStatus.hidden = false;
      } else {
        lightboxStatus.hidden = true;
      }
    }

    var single = lightboxItems.length < 2;
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
    if (lightboxItems.length < 2) return;
    activeIndex = (activeIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  }

  function showNext() {
    if (lightboxItems.length < 2) return;
    activeIndex = (activeIndex + 1) % lightboxItems.length;
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
