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
  const sliderContainer = document.querySelector(".packaging-slider-container");
  if (!sliderContainer) return;

  const slider = sliderContainer.querySelector(".packaging-slider");
  const slides = Array.from(slider.children);
  const prevBtn = sliderContainer.querySelector(".prev-btn");
  const nextBtn = sliderContainer.querySelector(".next-btn");

  let currentIndex = 0; // 0: figma, 1: images
  const offsets = [0]; // 각 슬라이드 시작 위치 저장 배열

  function calculateOffsets() {
    // 첫번째 슬라이드(Figma) 너비 저장
    let currentOffset = slides[0].offsetWidth + 16; // 16 = padding * 2
    offsets.push(currentOffset);
  }

  function moveTo(index) {
    if (index < 0) index = 1;
    if (index > 1) index = 0;

    slider.style.transform = `translateX(-${offsets[index]}px)`;
    currentIndex = index;
  }

  // 초기화 함수
  function initializeSlider() {
    calculateOffsets();
    moveTo(0);
  }

  nextBtn.addEventListener("click", () => moveTo(currentIndex + 1));
  prevBtn.addEventListener("click", () => moveTo(currentIndex - 1));

  // Lightbox functionality
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.querySelector(".lightbox-close");

  slides.forEach((slide) => {
    if (slide.hasAttribute("data-filename")) {
      slide.addEventListener("click", () => {
        const img = slide.querySelector("img");
        const filename = slide.dataset.filename;

        lightbox.style.display = "flex";
        lightboxImg.src = img.src;
        lightboxCaption.textContent = filename;
      });
    }
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

  // 창 크기가 변경될 때 슬라이더 재계산
  window.addEventListener("resize", initializeSlider);

  // 초기 실행
  // 이미지가 모두 로드된 후 슬라이더 초기화 (너비 계산 정확도 향상)
  window.addEventListener("load", initializeSlider);
});
