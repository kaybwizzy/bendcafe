/* The Bend 25 Cafe — order basket.
   Vanilla JS, localStorage-backed, shared across every page. Builds one
   consolidated WhatsApp message from all added items + a notes field. */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "256700123456";
  var STORAGE_ITEMS = "bend25_basket_items";
  var STORAGE_NOTES = "bend25_basket_notes";

  function formatUGX(n) {
    return "UGX " + Math.round(n).toLocaleString("en-US");
  }

  function loadItems() {
    try {
      var raw = localStorage.getItem(STORAGE_ITEMS);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items));
    } catch (e) {}
  }

  function loadNotes() {
    try {
      return localStorage.getItem(STORAGE_NOTES) || "";
    } catch (e) {
      return "";
    }
  }

  function saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_NOTES, notes);
    } catch (e) {}
  }

  var items = loadItems();

  function findItem(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function addItem(id, name, price) {
    var existing = findItem(id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id: id, name: name, price: price, qty: 1 });
    }
    saveItems(items);
    render();
  }

  function changeQty(id, delta) {
    var item = findItem(id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      items = items.filter(function (it) { return it.id !== id; });
    }
    saveItems(items);
    render();
  }

  function removeItem(id) {
    items = items.filter(function (it) { return it.id !== id; });
    saveItems(items);
    render();
  }

  function clearBasket() {
    items = [];
    saveItems(items);
    render();
  }

  function getTotal() {
    return items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function getCount() {
    return items.reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function buildWhatsAppUrl(notes) {
    var lines = ["Hi The Bend 25 Cafe, I'd like to place the following order:", ""];
    items.forEach(function (it, i) {
      lines.push(
        (i + 1) + ". " + it.name + " x" + it.qty + " — " + formatUGX(it.price * it.qty)
      );
    });
    lines.push("");
    lines.push("Total: " + formatUGX(getTotal()));
    if (notes && notes.trim()) {
      lines.push("");
      lines.push("Special requests: " + notes.trim());
    }
    lines.push("");
    lines.push("Thank you!");
    return (
      "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"))
    );
  }

  /* ---------------------------------------------------------------------
     DOM wiring
     ------------------------------------------------------------------- */

  var toggle = document.getElementById("basketToggle");
  var overlay = document.getElementById("basketOverlay");
  var drawer = document.getElementById("basketDrawer");
  var closeBtn = document.getElementById("basketClose");
  var countEl = document.getElementById("basketCount");
  var itemsEl = document.getElementById("basketItems");
  var emptyEl = document.getElementById("basketEmpty");
  var totalEl = document.getElementById("basketTotal");
  var notesEl = document.getElementById("basketNotes");
  var checkoutBtn = document.getElementById("basketCheckout");
  var clearBtn = document.getElementById("basketClear");

  if (!toggle || !drawer) return;

  if (notesEl) notesEl.value = loadNotes();

  function openDrawer() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    toggle.focus();
  }

  toggle.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  if (notesEl) {
    notesEl.addEventListener("input", function () {
      saveNotes(notesEl.value);
      if (checkoutBtn) checkoutBtn.href = buildWhatsAppUrl(notesEl.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clearBasket();
    });
  }

  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add-item]");
    if (addBtn) {
      addItem(addBtn.getAttribute("data-id"), addBtn.getAttribute("data-name"), parseFloat(addBtn.getAttribute("data-price")));
      addBtn.classList.remove("is-added-pulse");
      // Force reflow so the animation can restart on repeated clicks.
      void addBtn.offsetWidth;
      addBtn.classList.add("is-added-pulse");
      return;
    }

    var qtyBtn = e.target.closest("[data-qty-action]");
    if (qtyBtn) {
      var row = qtyBtn.closest("[data-item-id]");
      var id = row.getAttribute("data-item-id");
      changeQty(id, qtyBtn.getAttribute("data-qty-action") === "inc" ? 1 : -1);
      return;
    }

    var removeBtn = e.target.closest("[data-remove-item]");
    if (removeBtn) {
      var removeRow = removeBtn.closest("[data-item-id]");
      removeItem(removeRow.getAttribute("data-item-id"));
    }
  });

  function renderAddButtons() {
    document.querySelectorAll("[data-add-item]").forEach(function (btn) {
      var id = btn.getAttribute("data-id");
      var item = findItem(id);
      var pill = btn.querySelector(".add-item-pill");
      if (item && item.qty > 0) {
        if (!pill) {
          pill = document.createElement("span");
          pill.className = "add-item-pill";
          btn.appendChild(pill);
        }
        pill.textContent = item.qty + " in order";
      } else if (pill) {
        pill.remove();
      }
    });
  }

  function render() {
    var count = getCount();
    if (countEl) {
      countEl.textContent = String(count);
      countEl.hidden = count === 0;
    }
    toggle.classList.toggle("has-items", count > 0);

    if (itemsEl) {
      itemsEl.querySelectorAll(".basket-item").forEach(function (el) { el.remove(); });
      if (items.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
      } else {
        if (emptyEl) emptyEl.hidden = true;
        items.forEach(function (it) {
          var row = document.createElement("div");
          row.className = "basket-item";
          row.setAttribute("data-item-id", it.id);
          row.innerHTML =
            '<div class="basket-item-info">' +
              '<span class="basket-item-name">' + it.name + "</span>" +
              '<span class="basket-item-price">' + formatUGX(it.price * it.qty) + "</span>" +
            "</div>" +
            '<div class="basket-item-controls">' +
              '<div class="qty-stepper">' +
                '<button type="button" class="qty-btn" data-qty-action="dec" aria-label="Decrease quantity of ' + it.name + '">−</button>' +
                '<span class="qty-value">' + it.qty + "</span>" +
                '<button type="button" class="qty-btn" data-qty-action="inc" aria-label="Increase quantity of ' + it.name + '">+</button>' +
              "</div>" +
              '<button type="button" class="basket-item-remove" data-remove-item aria-label="Remove ' + it.name + ' from order">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
              "</button>" +
            "</div>";
          itemsEl.appendChild(row);
        });
      }
    }

    if (totalEl) totalEl.textContent = formatUGX(getTotal());

    var notes = notesEl ? notesEl.value : loadNotes();
    if (checkoutBtn) {
      checkoutBtn.href = buildWhatsAppUrl(notes);
      checkoutBtn.classList.toggle("is-disabled", count === 0);
      checkoutBtn.setAttribute("aria-disabled", count === 0 ? "true" : "false");
    }

    renderAddButtons();
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function (e) {
      if (getCount() === 0) e.preventDefault();
    });
  }

  render();
})();
