/*!
 * Day↔Night YouTube Crossfade (0s start on counterpart after fade-out)
 * HTML:
 * <section class="dn-hero" data-day-night data-day-yt="Ieft0mUOElo" data-night-yt="ZpRuNjeJ7Rs"></section>
 * Optional triggers: <button data-go-night>, <button data-go-day>
 */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // --- CSS inject (no external file) ---
  (function injectCSS() {
    if (document.querySelector("style[data-dnfx]")) return;
    const css = `
.dn-hero[data-day-night]{position:relative;isolation:isolate;overflow:hidden;background:#000;}
.dn-hero[data-day-night] .dn-layer{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;will-change:opacity;}
.dn-hero[data-day-night] .dn-layer.is-show{opacity:1;}
.dn-hero[data-day-night] .dn-layer iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none; /* 배경 용도 */ }
.dn-hero[data-day-night].is-busy::after{content:'';position:absolute;inset:0;pointer-events:auto;} /* 전환 중 클릭 차단(선택) */
@media (prefers-reduced-motion: reduce){ .dn-hero[data-day-night] .dn-layer{transition:none;} }
`;
    const el = document.createElement("style");
    el.setAttribute("data-dnfx", "1");
    el.textContent = css;
    document.head.appendChild(el);
  })();

  // --- YouTube IFrame API loader ---
  let ytReady = !!(window.YT && YT.Player);
  const readyQ = [];
  function ensureYT(cb) {
    if (ytReady) {
      cb();
      return;
    }
    readyQ.push(cb);
    if (!window._dnfxYtLoading) {
      window._dnfxYtLoading = true;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        ytReady = true;
        prev && prev();
        readyQ.splice(0).forEach((fn) => fn());
      };
    }
  }

  // --- YouTube helpers ---
  function makePlayer(el, videoId) {
    return new YT.Player(el, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
        iv_load_policy: 3,
        // loop하려면 playlist=videoId 필요(선택):
        // loop:1, playlist: videoId,
        fs: 0,
      },
      events: {
        onReady: (e) => {
          try {
            e.target.mute();
            e.target.seekTo(0, true);
            e.target.pauseVideo();
          } catch (_) {}
        },
      },
      host: "https://www.youtube.com",
    });
  }
  const resetToZero = (p) => {
    try {
      p.pauseVideo();
      p.seekTo(0, true);
    } catch (_) {}
  };
  const startFromZero = (p) => {
    try {
      p.mute();
      p.seekTo(0, true);
      p.playVideo();
    } catch (_) {}
  };

  // --- Core mount ---
  function mount(container) {
    if (!container || container._dnMounted) return;
    container._dnMounted = true;

    const dayId = container.dataset.dayYt || "Ieft0mUOElo";
    const nightId = container.dataset.nightYt || "ZpRuNjeJ7Rs";

    // Layers
    const dayLayer = document.createElement("div");
    dayLayer.className = "dn-layer dn-day is-show"; // 초기: 아침 보임
    const nightLayer = document.createElement("div");
    nightLayer.className = "dn-layer dn-night";
    const dayHost = document.createElement("div");
    dayHost.id = "yt-day-" + Math.random().toString(36).slice(2);
    const nightHost = document.createElement("div");
    nightHost.id = "yt-night-" + Math.random().toString(36).slice(2);
    dayLayer.appendChild(dayHost);
    nightLayer.appendChild(nightHost);
    container.append(dayLayer, nightLayer);

    // Build players
    let dayP,
      nightP,
      readyCount = 0;
    function onBothReady() {
      if (++readyCount < 2) return;
      resetToZero(dayP);
      resetToZero(nightP);
    }

    ensureYT(() => {
      dayP = makePlayer(dayHost, dayId);
      dayP.addEventListener("onReady", onBothReady);
      nightP = makePlayer(nightHost, nightId);
      nightP.addEventListener("onReady", onBothReady);
    });

    let current = "day";
    let busy = false;
    const FADE_MS = 600;

    function crossfade(next) {
      if (busy || next === current) return;
      busy = true;
      container.classList.add("is-busy");
      const fromLayer = current === "day" ? dayLayer : nightLayer;
      const toLayer = next === "day" ? dayLayer : nightLayer;
      const fromP = current === "day" ? dayP : nightP;
      const toP = next === "day" ? dayP : nightP;

      // 미리 상대편 0초로 준비(재생은 ‘페이드아웃 완료’ 시점에 시작)
      resetToZero(toP);

      // 페이드아웃 시작
      fromLayer.classList.remove("is-show");

      const onOutEnd = (e) => {
        if (e && e.propertyName && e.propertyName !== "opacity") return;
        fromLayer.removeEventListener("transitionend", onOutEnd);
        // 요구사항: 페이드아웃 끝난 ‘그 순간’ 반대편 0초부터 재생
        startFromZero(toP);
        toLayer.classList.add("is-show");

        const onInEnd = (ev) => {
          if (ev && ev.propertyName && ev.propertyName !== "opacity") return;
          toLayer.removeEventListener("transitionend", onInEnd);
          // 숨겨진쪽 리소스 절약 및 다음 전환 대비 0초로 고정
          resetToZero(fromP);
          busy = false;
          container.classList.remove("is-busy");
        };
        toLayer.addEventListener("transitionend", onInEnd, { once: true });
        current = next;
      };
      fromLayer.addEventListener("transitionend", onOutEnd, { once: true });
      // 안전 폴백
      setTimeout(() => {
        try {
          onOutEnd({ propertyName: "opacity" });
        } catch (_) {}
      }, FADE_MS + 60);
    }

    // Public API + 트리거
    const api = {
      toNight() {
        crossfade("night");
      },
      toDay() {
        crossfade("day");
      },
      get current() {
        return current;
      },
      isBusy() {
        return busy;
      },
    };
    container._dnAPI = api;
    window.DayNightFX = window.DayNightFX || api;

    $$("[data-go-night]").forEach((b) =>
      b.addEventListener("click", () => api.toNight())
    );
    $$("[data-go-day]").forEach((b) =>
      b.addEventListener("click", () => api.toDay())
    );

    // 클래스 토글로도 제어 가능(옵션)
    const mo = new MutationObserver(() => {
      if (container.classList.contains("is-night")) api.toNight();
      else if (container.classList.contains("is-day")) api.toDay();
    });
    mo.observe(container, { attributes: true, attributeFilter: ["class"] });
  }

  // auto-mount all
  $$("[data-day-night]").forEach(mount);
})();

document.addEventListener("DOMContentLoaded", function () {
  // --- Onsemiro Tab 기능 ---
  const tabContainer = document.querySelector(".onsemiro-tab-container");
  if (tabContainer) {
    const tabNav = tabContainer.querySelector(".tab-nav");
    const tabBtns = tabContainer.querySelectorAll(".tab-btn");
    const tabContents = tabContainer.querySelectorAll(".tab-content");

    tabNav.addEventListener("click", (e) => {
      const clickedBtn = e.target.closest(".tab-btn");
      if (!clickedBtn) return;

      tabBtns.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      clickedBtn.classList.add("active");
      const targetContent = document.getElementById(clickedBtn.dataset.target);
      if (targetContent) {
        targetContent.classList.add("active");
      }

      // 탭 변경 시 각 슬라이더 초기화 (currentIndex를 0으로 설정)
      const sliders = targetContent.querySelectorAll(".photo-slider-container");
      sliders.forEach((slider) => {
        const track = slider.querySelector(".photo-slider-track");
        track.style.transform = `translateX(0px)`;
        slider.dataset.currentIndex = "0";
      });
    });
  }

  // --- Photo Slider 기능 ---
  function initializePhotoSlider(sliderContainer) {
    const track = sliderContainer.querySelector(".photo-slider-track");
    const items = track.querySelectorAll(".photo-item");
    const prevBtn = sliderContainer.querySelector(".photo-prev-btn");
    const nextBtn = sliderContainer.querySelector(".photo-next-btn");

    if (!track || !items || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const totalItems = items.length;
    let itemsVisible = window.innerWidth <= 768 ? 2 : 4;

    function moveTo(index) {
      const maxIndex = totalItems - itemsVisible;
      if (index < 0) {
        index = 0;
      } else if (index > maxIndex) {
        index = maxIndex;
      }

      const itemWidth = sliderContainer.offsetWidth / itemsVisible;
      track.style.transform = `translateX(-${index * itemWidth}px)`;
      currentIndex = index;
      sliderContainer.dataset.currentIndex = index;
    }

    function updateSlider() {
      itemsVisible = window.innerWidth <= 768 ? 2 : 4;
      moveTo(parseInt(sliderContainer.dataset.currentIndex) || 0);
    }

    nextBtn.addEventListener("click", () => moveTo(currentIndex + 1));
    prevBtn.addEventListener("click", () => moveTo(currentIndex - 1));

    window.addEventListener("resize", updateSlider);
    updateSlider(); // 초기 실행
    sliderContainer.dataset.currentIndex = "0"; // 초기 current index 설정
  }

  const packagingSlider = document.querySelector(".packaging-slider");
  if (packagingSlider) {
    initializePhotoSlider(packagingSlider);
  }

  const conceptSlider = document.querySelector(".concept-slider");
  if (conceptSlider) {
    initializePhotoSlider(conceptSlider);
  }

  // --- Lightbox 기능 ---
  const lightbox = document.getElementById("image-lightbox");
  if (lightbox) {
    const lightboxImg = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const closeBtn = document.querySelector(".lightbox-close");
    const photoItems = document.querySelectorAll(".photo-item");

    photoItems.forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const filename = item.dataset.filename;

        lightbox.style.display = "flex";
        lightboxImg.src = img.src;
        lightboxCaption.textContent = filename;
      });
    });

    function closeLightbox() {
      lightbox.style.display = "none";
    }

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }
});
