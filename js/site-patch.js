/*!
 * site-patch.js (v2)
 * - Dark Veil in hero
 * - Infinite carousel (operators section)
 * - Smooth transitions between pages (soft navigation + View Transitions API)
 * - Smooth anchor scrolling
 */
(function () {
  // ---------- Utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function injectGlobalCSS() {
    if (document.querySelector('style[data-site-patch="1"]')) return;
    const css = String.raw`
html{scroll-behavior:smooth;} /* smooth in-page anchors */

/* ===== Dark Veil overlay (inside hero) ===== */
.rb-veil{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;
  background:
    radial-gradient(150% 100% at 50% 0%, rgba(147,51,234,.16), transparent 45%),
    radial-gradient(120% 90% at 50% 100%, rgba(99,102,241,.12), transparent 55%),
    linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.88) 60%, rgba(0,0,0,.92));
  filter:saturate(115%);
  contain: paint; /* reduce repaint area */
}
.rb-veil .blob{position:absolute;width:60vmax;height:60vmax;border-radius:50%;filter:blur(70px);
  mix-blend-mode:screen;opacity:.7;will-change:transform;}
.rb-veil .b1{left:-10vmax;top:-12vmax;
  background:radial-gradient(circle at 30% 30%, rgba(168,85,247,.85), rgba(76,29,149,.2) 60%, transparent 65%);
  animation:veilFloat1 18s ease-in-out infinite alternate;}
.rb-veil .b2{right:-8vmax;top:-6vmax;
  background:radial-gradient(circle at 60% 40%, rgba(79,70,229,.75), rgba(30,27,75,.18) 60%, transparent 65%);
  animation:veilFloat2 24s ease-in-out infinite alternate;}
.rb-veil .b3{left:35vw;top:35vh;
  background:radial-gradient(circle at 50% 50%, rgba(236,72,153,.40), transparent 65%);
  animation:veilFloat3 20s ease-in-out infinite alternate;opacity:.5;}
@keyframes veilFloat1{0%{transform:translate3d(0,0,0) scale(1);}100%{transform:translate3d(20%,8%,0) rotate(10deg) scale(1.05);}}
@keyframes veilFloat2{0%{transform:translate3d(0,0,0) scale(1.05);}100%{transform:translate3d(-14%,12%,0) rotate(-8deg) scale(1);}}
@keyframes veilFloat3{0%{transform:translate3d(0,0,0) scale(1);}100%{transform:translate3d(-10%,-10%,0) rotate(6deg) scale(1.08);}}
@media (prefers-reduced-motion: reduce){.rb-veil .blob{animation:none;}}
/* Make sure hero content sits above veil */
.rb-veil-host{position:relative;isolation:isolate;}
.rb-veil-host > *:not(.rb-veil){position:relative;z-index:1;}

/* ===== Infinite carousel base ===== */
._infcar-root{position:relative;overflow:hidden;}
._infcar-track{display:flex;gap:24px;will-change:transform;transition:transform .5s ease;flex-wrap:nowrap;}
._infcar-track > *{flex:0 0 auto;}
._infcar-arrow{position:absolute;top:50%;transform:translateY(-50%);
  width:44px;height:44px;border-radius:50%;display:grid;place-items:center;
  background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.2);
  color:#fff;font-size:18px;line-height:1;cursor:pointer;z-index:5;user-select:none;}
._infcar-arrow.left{left:8px;} ._infcar-arrow.right{right:8px;}
._infcar-arrow:focus{outline:none;box-shadow:0 0 0 3px rgba(147,51,234,.5);}

/* ===== Fade overlay fallback for page transitions ===== */
.site-fade{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99999;transition:opacity .35s ease;}
.site-fade.is-active{opacity:.5;pointer-events:auto;}
`;
    const style = document.createElement("style");
    style.setAttribute("data-site-patch", "1");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function mountDarkVeil(root = document) {
    // find hero container
    const hero =
      root.querySelector("#home, #hero, .hero, .hero-section, .section-hero") ||
      $$("main section, body > section", root).find(
        (sec) =>
          sec.getBoundingClientRect().top < 200 && sec.querySelector("h1,h2")
      ) ||
      root.body ||
      root;
    if (!hero) return;
    const host = hero;
    host.classList.add("rb-veil-host");
    if (!host.querySelector(".rb-veil")) {
      const veil = document.createElement("div");
      veil.className = "rb-veil";
      veil.setAttribute("aria-hidden", "true");
      veil.innerHTML =
        '<span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>';
      host.prepend(veil);
    }
  }

  function mountInfiniteCarousel(root = document) {
    // locate section by heading text
    const headings = $$("h2,h3", root);
    const targetHeading = headings.find((h) =>
      /오퍼레이터|operator/i.test(h.textContent || "")
    );
    const sec = targetHeading
      ? targetHeading.closest("section") || targetHeading.parentElement
      : null;
    if (!sec) return;

    // find track
    let track = null;
    const containers = $$("div, ul, ol, .track", sec).filter(
      (el) => el.children && el.children.length >= 3
    );
    for (const c of containers) {
      const items = Array.from(c.children).filter((n) =>
        n.matches(".card, article, li, .operator-card")
      );
      if (items.length >= 3) {
        track = c;
        break;
      }
    }
    if (!track) return;

    if (!sec.classList.contains("_infcar-root")) {
      sec.classList.add("_infcar-root");
      track.classList.add("_infcar-track");

      let prevBtn = sec.querySelector(
        '[data-prev], .prev, .left, .arrow-left, button[aria-label="이전"], button[aria-label="prev"]'
      );
      let nextBtn = sec.querySelector(
        '[data-next], .next, .right, .arrow-right, button[aria-label="다음"], button[aria-label="next"]'
      );
      function mkArrow(dir) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "_infcar-arrow " + (dir === -1 ? "left" : "right");
        b.setAttribute("aria-label", dir === -1 ? "이전" : "다음");
        b.textContent = dir === -1 ? "‹" : "›";
        sec.appendChild(b);
        return b;
      }
      if (!prevBtn) prevBtn = mkArrow(-1);
      if (!nextBtn) nextBtn = mkArrow(+1);

      // state
      let originals = Array.from(track.children).filter(
        (n) => n.nodeType === 1
      );
      if (originals.length < 3) return;

      const computedGap = () => {
        const cs = getComputedStyle(track);
        const gap = parseFloat(cs.columnGap || cs.gap || "0");
        return isNaN(gap) ? 0 : gap;
      };
      const itemWidth = () => originals[0].getBoundingClientRect().width;
      const trackWidth = () => track.getBoundingClientRect().width;
      const perView = () =>
        Math.max(1, Math.round(trackWidth() / (itemWidth() + computedGap())));

      function mountClones() {
        Array.from(track.children).forEach(
          (el) => el.dataset && el.dataset.clone && el.remove()
        );
        originals = Array.from(track.children).filter(
          (el) => !el.dataset.clone
        );
        const pv = perView();
        const head = originals.slice(0, pv).map((n) => {
          const c = n.cloneNode(true);
          c.dataset.clone = "1";
          return c;
        });
        const tail = originals.slice(-pv).map((n) => {
          const c = n.cloneNode(true);
          c.dataset.clone = "1";
          return c;
        });
        track.prepend(...tail);
        track.append(...head);
      }

      let idx = 0;
      let step = 0;

      function recalc() {
        mountClones();
        const pv = perView();
        const firstReal = track.children[pv];
        const cs = getComputedStyle(track);
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        step = firstReal.getBoundingClientRect().width + gap;
        track.style.transition = "none";
        track.style.transform = `translate3d(${-(idx + pv) * step}px,0,0)`;
        track.offsetHeight;
        track.style.transition = "transform .5s ease";
      }

      function go(dir) {
        idx += dir;
        const pv = perView();
        track.style.transform = `translate3d(${-(idx + pv) * step}px,0,0)`;
      }

      track.addEventListener("transitionend", () => {
        const len = originals.length;
        if (idx >= len) {
          idx -= len;
          recalc();
        } else if (idx < 0) {
          idx += len;
          recalc();
        }
      });

      prevBtn.addEventListener("click", () => go(-1));
      nextBtn.addEventListener("click", () => go(+1));
      window.addEventListener("resize", recalc);
      document.fonts &&
        document.fonts.ready &&
        document.fonts.ready.then(recalc);
      recalc();
    }
  }

  function mountAll(root = document) {
    injectGlobalCSS();
    mountDarkVeil(root);
    mountInfiniteCarousel(root);
  }

  // ---------- Soft navigation (same-origin links) ----------
  function enableSoftNavigation() {
    // fade overlay (fallback when View Transitions unsupported)
    let fade = document.querySelector(".site-fade");
    if (!fade) {
      fade = document.createElement("div");
      fade.className = "site-fade";
      document.body.appendChild(fade);
    }

    async function loadDoc(url) {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Fetch failed: " + res.status);
      const html = await res.text();
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      const doc = tpl.content;
      const newMain =
        doc.querySelector("main") ||
        doc.querySelector("#app") ||
        doc.querySelector("body");
      const curMain =
        document.querySelector("main") ||
        document.querySelector("#app") ||
        document.body;
      if (!newMain || !curMain) return false;

      function swap() {
        // Replace main contents
        curMain.innerHTML = newMain.innerHTML;
        // Update title
        const newTitle =
          (doc.querySelector("title") &&
            doc.querySelector("title").textContent) ||
          document.title;
        document.title = newTitle;
        // Re-run mounts on the current document
        mountAll(document);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      if (document.startViewTransition) {
        await document.startViewTransition(swap).finished;
      } else {
        // Fade fallback
        fade.classList.add("is-active");
        await new Promise((r) => setTimeout(r, 120));
        swap();
        await new Promise((r) => setTimeout(r, 80));
        fade.classList.remove("is-active");
      }
      return true;
    }

    // Intercept anchor clicks
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      // ignore modifiers/new tab/download/external
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        a.hasAttribute("data-no-soft-nav")
      )
        return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // In-page hash: let default smooth scroll handle
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      loadDoc(url.href)
        .then((ok) => {
          if (ok) history.pushState({}, "", url.href);
          else location.href = url.href; // fallback
        })
        .catch(() => (location.href = url.href));
    });

    // Handle back/forward
    window.addEventListener("popstate", () => {
      loadDoc(location.href).catch(() => location.reload());
    });
  }

  // ---------- Boot ----------
  mountAll(document);
  enableSoftNavigation();
})();
