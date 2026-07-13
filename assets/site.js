/* 株式会社エクシス — 共通スクリプト */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ヘッダー: スクロール状態 + 読了プログレス ---------- */
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".progress-bar");
  var valve = document.querySelector(".valve");
  var railFill = document.querySelector(".rail-fill");
  var railNodes = Array.prototype.slice.call(document.querySelectorAll(".rail-node"));
  var railSections = railNodes.map(function (n) {
    return document.getElementById(n.getAttribute("data-target"));
  });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? y / max : 0;

      if (header) header.classList.toggle("scrolled", y > 10);
      if (progress) progress.style.width = (ratio * 100).toFixed(2) + "%";
      if (valve && !reduceMotion) valve.style.transform = "rotate(" + (y * 0.25) + "deg)";

      if (railFill) railFill.style.height = (ratio * 100).toFixed(2) + "%";
      railNodes.forEach(function (node, i) {
        var sec = railSections[i];
        if (!sec) return;
        node.classList.toggle("lit", y + window.innerHeight * 0.55 >= sec.offsetTop);
      });

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 配管レール: ノードをセクション位置に配置 */
  function placeRailNodes() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    railNodes.forEach(function (node, i) {
      var sec = railSections[i];
      if (!sec) return;
      var t = Math.min(1, Math.max(0, sec.offsetTop / total));
      node.style.top = (t * 100).toFixed(2) + "%";
    });
  }
  if (railNodes.length) {
    placeRailNodes();
    window.addEventListener("resize", placeRailNodes);
    window.addEventListener("load", placeRailNodes);
  }

  /* ---------- モバイルメニュー ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ---------- カウントアップ ---------- */
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }
    var startAttr = parseFloat(el.getAttribute("data-start"));
    var start = isNaN(startAttr) ? Math.floor(target * 0.6) : startAttr;
    var dur = 1400;
    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var val = Math.round(start + (target - start) * easeOutQuart(p));
      el.textContent = String(val);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- IntersectionObserver: reveal / draw / counter ---------- */
  var seen = new WeakSet();
  function activate(el) {
    el.classList.add("in-view");
    el.querySelectorAll("[data-count]").forEach(function (c) {
      if (!seen.has(c)) { seen.add(c); runCounter(c); }
    });
  }

  var targets = document.querySelectorAll(".reveal, .anim-scope");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(activate);
  }

  /* ヒーロー系統図は読み込み直後に描画開始 */
  var riser = document.querySelector(".hero-riser.anim-scope");
  if (riser) {
    setTimeout(function () { activate(riser); }, 150);
  }

  /* ---------- ヒーロー・パララックス ---------- */
  var hero = document.querySelector(".hero");
  var riserWrap = document.querySelector(".hero-riser");
  if (hero && riserWrap && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * -12;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -12;
      if (rafId === null) rafId = requestAnimationFrame(lerpFrame);
    });
    function lerpFrame() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      riserWrap.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px)";
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        rafId = requestAnimationFrame(lerpFrame);
      } else {
        rafId = null;
      }
    }
  }

  /* ---------- FAQ アコーディオン ---------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
})();
