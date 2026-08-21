/* The Bend 25 Cafe — shared site behavior. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------------------------------------------------------------
     Sticky nav: shrink + solidify on scroll
     ------------------------------------------------------------------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScrollNav = function () {
      if (window.scrollY > 24) {
        nav.classList.add("is-scrolled");
      } else {
        nav.classList.remove("is-scrolled");
      }
    };
    onScrollNav();
    window.addEventListener("scroll", onScrollNav, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Mobile menu toggle
     ------------------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    var closeMenu = function () {
      toggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    var openMenu = function () {
      toggle.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal via IntersectionObserver
     ------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    "[data-reveal], [data-reveal-group]"
  );
  if (revealTargets.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealTargets.forEach(function (el) {
        revealObserver.observe(el);
      });
    }
  }

  /* ---------------------------------------------------------------------
     Menu page: category tabs + scroll spy
     ------------------------------------------------------------------- */
  var tabs = document.querySelectorAll(".menu-tab");
  var categories = document.querySelectorAll(".menu-category");
  if (tabs.length && categories.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        var targetId = tab.getAttribute("href").slice(1);
        var target = document.getElementById(targetId);
        if (target) {
          var offset =
            (document.querySelector(".menu-tabs") || {}).offsetHeight || 0;
          var navH = getComputedStyle(document.documentElement)
            .getPropertyValue("--nav-height-shrunk")
            .trim();
          var navPx = parseInt(navH, 10) || 64;
          var top =
            target.getBoundingClientRect().top +
            window.scrollY -
            navPx -
            offset +
            4;
          window.scrollTo({
            top: top,
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        }
      });
    });

    if ("IntersectionObserver" in window) {
      var spyObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = entry.target.id;
              tabs.forEach(function (tab) {
                tab.classList.toggle(
                  "is-active",
                  tab.getAttribute("href") === "#" + id
                );
              });
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      categories.forEach(function (cat) {
        spyObserver.observe(cat);
      });
    }
  }

  /* ---------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------- */
  var galleryItems = document.querySelectorAll(".gallery-item");
  var lightbox = document.querySelector(".lightbox");
  if (galleryItems.length && lightbox) {
    var lightboxFrame = lightbox.querySelector(".lightbox-frame");
    var lightboxClose = lightbox.querySelector(".lightbox-close");
    var lastFocused = null;

    var openLightbox = function (item) {
      var sourceBlock = item.querySelector(".photo-block");
      var sourceImg = sourceBlock.querySelector("img");
      var label = sourceBlock.getAttribute("data-label");
      var ratio = getComputedStyle(sourceBlock).getPropertyValue("--ratio");
      lightboxFrame.innerHTML = "";
      var block = document.createElement("div");
      block.className = "photo-block";
      block.style.setProperty("--ratio", ratio || "4/3");
      if (sourceImg) {
        var img = document.createElement("img");
        img.src = sourceImg.src;
        img.alt = sourceImg.alt || "";
        block.appendChild(img);
      } else {
        block.setAttribute("data-label", label || "");
      }
      lightboxFrame.appendChild(block);
      lastFocused = document.activeElement;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightboxClose.focus();
      document.body.style.overflow = "hidden";
    };

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

    galleryItems.forEach(function (item) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.addEventListener("click", function () {
        openLightbox(item);
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(item);
        }
      });
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
