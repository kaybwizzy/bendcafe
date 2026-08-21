/* The Bend 25 Cafe — hero fan carousel.
   Vanilla-JS port of a React/GSAP fan-of-cards component: same entry
   animation and hover-spread interaction, no framework/build step. */
(function () {
  "use strict";

  if (typeof gsap === "undefined") return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var wrap = document.querySelector(".fan-hero-visual");
  if (!wrap) return;

  var cards = Array.from(wrap.querySelectorAll(".fan-card"));
  var total = cards.length;
  if (!total) return;

  var IDEAL_HEIGHT_PX = { 480: 22 * 16, 640: 26 * 16, 768: 28 * 16, 1024: 34 * 16, base: 38 * 16 };

  function getResponsiveMultiplier(width) {
    if (width < 480) return 0.32;
    if (width < 640) return 0.42;
    if (width < 768) return 0.55;
    if (width < 1024) return 0.78;
    return 1.0;
  }

  function idealHeight(width) {
    if (width < 480) return IDEAL_HEIGHT_PX[480];
    if (width < 640) return IDEAL_HEIGHT_PX[640];
    if (width < 768) return IDEAL_HEIGHT_PX[768];
    if (width < 1024) return IDEAL_HEIGHT_PX[1024];
    return IDEAL_HEIGHT_PX.base;
  }

  function getHeightMultiplier(width) {
    var ideal = idealHeight(width);
    var available = wrap.getBoundingClientRect().height;
    if (!available || available >= ideal) return 1;
    return Math.max(0.6, available / ideal);
  }

  function slotConfig(slot) {
    var center = total >> 1;
    var distance = total > 1 ? (slot - center) / center : 0;
    var absDistance = Math.abs(distance);
    return {
      rot: distance * 21,
      scale: 1.0 - 0.2244 * absDistance * absDistance,
      x: distance * 9.5,
      y: absDistance * absDistance * 2.6,
      zIndex: 10 - Math.abs(slot - center),
    };
  }

  gsap.set(cards, { xPercent: -50, yPercent: -50 });

  function layout(hoveredSlot) {
    var mult = getResponsiveMultiplier(window.innerWidth);
    var hMult = getHeightMultiplier(window.innerWidth);
    var centerSlot = total >> 1;

    cards.forEach(function (card, slot) {
      var base = slotConfig(slot);
      var targetX = base.x * mult;
      var targetY = base.y * hMult;
      var targetRot = base.rot;
      var targetScale = base.scale;
      var delay = Math.abs(slot - centerSlot) * 0.02;

      var zIndex = base.zIndex;

      if (hoveredSlot !== null && hoveredSlot !== undefined) {
        var distance = Math.abs(slot - hoveredSlot);
        delay = distance * 0.015;

        if (slot === hoveredSlot) {
          targetY -= 5.5 * hMult;
          targetScale *= 1.28;
          targetRot = 0;
          zIndex = 60;
        } else {
          var normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
          var pushStrength = 7.5 * (1 - Math.abs(normalized) * 0.5) * (1 + 0.25 * Math.max(0, 3 - distance));
          targetY += (0.9 + distance * 0.15) * hMult;
          if (slot < hoveredSlot) {
            targetX -= pushStrength * mult;
            targetRot -= 6 / (distance + 1);
          } else {
            targetX += pushStrength * mult;
            targetRot += 6 / (distance + 1);
          }
        }
      }

      gsap.to(card, {
        x: targetX + "rem",
        y: targetY + "rem",
        rotation: targetRot,
        scale: targetScale,
        duration: prefersReducedMotion ? 0.01 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "elastic.out(1,.75)",
        overwrite: "auto",
      });
      gsap.set(card, { zIndex: zIndex });
    });
  }

  function enter() {
    var mult = getResponsiveMultiplier(window.innerWidth);
    var hMult = getHeightMultiplier(window.innerWidth);

    cards.forEach(function (card, slot) {
      var base = slotConfig(slot);
      var target = {
        x: base.x * mult + "rem",
        y: base.y * hMult + "rem",
        rotation: base.rot,
        scale: base.scale,
        opacity: 1,
        zIndex: base.zIndex,
      };

      if (prefersReducedMotion) {
        gsap.set(card, target);
        return;
      }

      gsap.set(card, { x: 0, y: 6 * hMult + "rem", rotation: 0, scale: 0.5, opacity: 0 });
      gsap.to(card, Object.assign({}, target, {
        duration: 1.1,
        ease: "elastic.out(1.05,.78)",
        delay: 0.3 + slot * 0.07,
      }));
    });
  }

  var activeSlot = null;
  var leaveTimer = null;

  if (!prefersReducedMotion) {
    cards.forEach(function (card, slot) {
      card.addEventListener("mouseenter", function () {
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== slot) { activeSlot = slot; layout(slot); }
      });
    });

    wrap.addEventListener("mouseleave", function () {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () { activeSlot = null; layout(null); }, 60);
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { layout(activeSlot); }, 120);
    });
  }

  enter();
})();
