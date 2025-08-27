/* =================================================================
 * js/script.js  (전체)
 * - 가로 스냅 섹션 내비게이션
 * - 뉴스/탭/캐러셀/모달/음악/카드 글로우
 * ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------
   * 공통 상태 및 요소 캐싱
   * ------------------------------ */
  const container = document.getElementById("container");
  const sections = Array.from(document.querySelectorAll(".full-page-section"));
  const navLinks = document.querySelectorAll(".nav-links a");
  const modalOverlay = document.getElementById("modal-overlay");
  const detailPageModal = document.getElementById("detail-page-modal");

  const fadeInElements = sections.map((section) =>
    section.querySelectorAll(".fade-in-up")
  );

  let currentIndex = 0;
  let isScrolling = false;
  let touchStartX = null;
  let touchStartY = null;

  if (container && sections.length) {
    container.style.width = `${sections.length * 100}vw`;
  }

  const indexByHash = (hash) => sections.findIndex((s) => `#${s.id}` === hash);

  const updateCurrentNav = () => {
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    const active = document.querySelector(
      `.nav-links a[href="#${sections[currentIndex]?.id}"]`
    );
    if (active) active.setAttribute("aria-current", "page");
  };

  const animateVisible = () => {
    document
      .querySelectorAll(".fade-in-up.visible")
      .forEach((el) => el.classList.remove("visible"));

    const visibleElements = fadeInElements[currentIndex];
    if (!visibleElements) return;

    visibleElements.forEach((el, i) =>
      setTimeout(() => el.classList.add("visible"), i * 150)
    );
  };

  const scrollToSection = (index, pushHistory = true) => {
    if (!container || isScrolling) return;
    const max = sections.length - 1;
    const newIndex = Math.min(Math.max(index, 0), max);

    if (newIndex === currentIndex) return;
    currentIndex = newIndex;

    isScrolling = true;
    container.style.transform = `translateX(-${currentIndex * 100}vw)`;
    if (pushHistory)
      history.pushState(null, "", `#${sections[currentIndex].id}`);

    setTimeout(() => {
      animateVisible();
      updateCurrentNav();
      isScrolling = false;
    }, 800);
  };

  const initialHash = location.hash;
  const initialIndex = indexByHash(initialHash);
  if (initialHash && initialIndex !== -1) {
    const oldTransition = container?.style.transition;
    if (container) container.style.transition = "none";

    requestAnimationFrame(() => {
      scrollToSection(initialIndex, false);
      if (container)
        container.style.transition =
          oldTransition || "transform .8s ease-in-out";
    });
  } else if (sections[0]) {
    history.replaceState(null, "", `#${sections[0].id}`);
    animateVisible();
    updateCurrentNav();
  }

  window.addEventListener("hashchange", () => {
    const idx = indexByHash(location.hash);
    if (idx !== -1 && idx !== currentIndex) scrollToSection(idx, false);
  });

  const isAnyModalOpen = () => {
    const isTrailerModalOpen =
      !!modalOverlay && getComputedStyle(modalOverlay).display !== "none";
    const isDetailModalOpen =
      !!detailPageModal && getComputedStyle(detailPageModal).display !== "none";
    const isImageLightboxOpen =
      !!document.getElementById("image-lightbox") &&
      getComputedStyle(document.getElementById("image-lightbox")).display !==
        "none";
    return isTrailerModalOpen || isDetailModalOpen || isImageLightboxOpen;
  };

  window.addEventListener(
    "wheel",
    (e) => {
      if (isAnyModalOpen() || isScrolling) return;

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY > 5) {
          scrollToSection(currentIndex + 1);
        } else if (e.deltaY < -5) {
          scrollToSection(currentIndex - 1);
        }
      }
    },
    { passive: true }
  );

  window.addEventListener("keydown", (e) => {
    if (isAnyModalOpen()) return;
    if (["ArrowRight", "PageDown"].includes(e.key)) {
      e.preventDefault();
      scrollToSection(currentIndex + 1);
    }
    if (["ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      scrollToSection(currentIndex - 1);
    }
    if (e.key === "Home") {
      e.preventDefault();
      scrollToSection(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      scrollToSection(sections.length - 1);
    }
  });

  window.addEventListener(
    "touchstart",
    (e) => {
      if (isAnyModalOpen()) return;
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    (e) => {
      if (isAnyModalOpen() || touchStartX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) scrollToSection(currentIndex + 1);
        else scrollToSection(currentIndex - 1);
      }
      touchStartX = touchStartY = null;
    },
    { passive: true }
  );

  navLinks.forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href");
      const target = sections.findIndex((s) => `#${s.id}` === id);
      if (target !== -1) scrollToSection(target);
    })
  );

  /* ------------------------------
   * 캐러셀 (무한 루프 적용)
   * ------------------------------ */
  const track = document.getElementById("opTrack");
  const opPrev = document.getElementById("opPrev");
  const opNext = document.getElementById("opNext");

  if (track && opPrev && opNext) {
    let opIndex = 0;
    const cards = Array.from(track.children);
    const cardCount = cards.length;
    let isMoving = false;
    const cloneFirst = cards[0].cloneNode(true);
    const cloneLast = cards[cardCount - 1].cloneNode(true);
    track.appendChild(cloneFirst);
    track.insertBefore(cloneLast, cards[0]);
    const getCardWidth = () => {
      const card = cards[0];
      const style = getComputedStyle(card);
      return (
        card.offsetWidth +
        parseFloat(style.marginLeft) +
        parseFloat(style.marginRight)
      );
    };
    const updatePosition = (withTransition = true) => {
      if (!withTransition) {
        track.style.transition = "none";
      } else {
        track.style.transition = "transform 0.6s ease";
      }
      const cardWidth = getCardWidth();
      track.style.transform = `translateX(-${(opIndex + 1) * cardWidth}px)`;
    };
    updatePosition(false);
    opNext.addEventListener("click", () => {
      if (isMoving) return;
      isMoving = true;
      opIndex++;
      updatePosition();
      if (opIndex === cardCount) {
        setTimeout(() => {
          opIndex = 0;
          updatePosition(false);
          isMoving = false;
        }, 600);
      } else {
        setTimeout(() => (isMoving = false), 600);
      }
    });
    opPrev.addEventListener("click", () => {
      if (isMoving) return;
      isMoving = true;
      opIndex--;
      updatePosition();
      if (opIndex < 0) {
        setTimeout(() => {
          opIndex = cardCount - 1;
          updatePosition(false);
          isMoving = false;
        }, 600);
      } else {
        setTimeout(() => (isMoving = false), 600);
      }
    });
    window.addEventListener("resize", () => updatePosition(false));
  }

  /* ------------------------------
   * 모달
   * ------------------------------ */
  const openModalBtn = document.getElementById("open-modal");
  if (openModalBtn) {
    const closeBtn = modalOverlay?.querySelector(".close-btn");
    let lastFocused = null;
    const getFocusable = () =>
      modalOverlay.querySelectorAll(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
    const trap = (e) => {
      if (e.key === "Escape") return closeModal();
      if (e.key === "Tab") {
        const f = Array.from(getFocusable());
        if (!f.length) return;
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const openModal = () => {
      lastFocused = document.activeElement;
      modalOverlay.style.display = "flex";
      document.body.style.overflow = "hidden";
      const firstFocusable = getFocusable()[0];
      if (firstFocusable) firstFocusable.focus();
      modalOverlay.addEventListener("keydown", trap);
    };
    const closeModal = () => {
      modalOverlay.style.display = "none";
      document.body.style.overflow = "";
      modalOverlay.removeEventListener("keydown", trap);
      if (lastFocused) lastFocused.focus();
    };
    openModalBtn.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    modalOverlay?.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  /* ------------------------------
   * 오디오 제어
   * ------------------------------ */
  const bgm = document.getElementById("bgm");
  const musicToggleBtn = document.getElementById("music-toggle-btn");
  if (bgm && musicToggleBtn) {
    const volumeSlider = document.getElementById("volume-slider");
    const musicControls = musicToggleBtn.closest(".music-controls");
    if (volumeSlider) bgm.volume = parseFloat(volumeSlider.value);
    const syncMusicUI = () => {
      if (!musicControls) return;
      const playing = !bgm.paused;
      musicToggleBtn.textContent = playing ? "⏸️" : "▶️";
      musicToggleBtn.setAttribute("aria-pressed", String(playing));
      musicControls.classList.toggle("playing", playing);
    };
    musicToggleBtn.addEventListener("click", async () => {
      try {
        if (bgm.paused) await bgm.play();
        else bgm.pause();
      } catch (e) {
        console.error("Audio play failed:", e);
      }
      syncMusicUI();
    });
    volumeSlider?.addEventListener("input", (e) => {
      bgm.volume = parseFloat(e.target.value);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !bgm.paused) bgm.pause();
      syncMusicUI();
    });
    syncMusicUI();
  }

  /**
   * 온세미로 섹션 기능 초기화 (탭, 슬라이더, 라이트박스)
   */
  function initializeOnsemiroSection() {
    const onsemiroSection = document.getElementById("onsemiro");
    if (!onsemiroSection) return;

    // --- 탭 전환 로직 ---
    const tabButtons = onsemiroSection.querySelectorAll(".tab-btn");
    const tabContents = onsemiroSection.querySelectorAll(".tab-content");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        tabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === targetId) {
            content.classList.add("active");
          }
        });
      });
    });

    // --- 각 탭의 슬라이더 초기화 ---
    const sliders = onsemiroSection.querySelectorAll(".photo-slider-container");
    sliders.forEach((sliderContainer) => {
      const track = sliderContainer.querySelector(".photo-slider-track");
      const prevBtn = sliderContainer.querySelector(".photo-prev-btn");
      const nextBtn = sliderContainer.querySelector(".photo-next-btn");
      if (!track || !prevBtn || !nextBtn) return;

      const items = Array.from(track.children);
      if (items.length <= 4) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      }

      let currentIndex = 0;
      const itemsVisible = 4;

      function updateSliderPosition() {
        // 한 번에 한 아이템 너비만큼 이동
        const itemWidthPercent = 100 / items.length;
        track.style.transform = `translateX(-${
          currentIndex * itemWidthPercent * itemsVisible
        }%)`;
      }

      nextBtn.addEventListener("click", () => {
        if (currentIndex < items.length - itemsVisible) {
          currentIndex++;
          updateSliderPosition();
        }
      });
      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateSliderPosition();
        }
      });
    });

    // --- '상세페이지' 탭 라이트박스 로직 ---
    const detailSlider = onsemiroSection.querySelector(".detail-slider");
    const closeDetailModalBtn =
      detailPageModal?.querySelector(".lightbox-close");

    if (detailSlider && detailPageModal) {
      detailSlider.addEventListener("click", () => {
        detailPageModal.style.display = "flex";
      });

      const closeModal = () => (detailPageModal.style.display = "none");
      closeDetailModalBtn?.addEventListener("click", closeModal);
      detailPageModal.addEventListener("click", (e) => {
        if (e.target === detailPageModal) closeModal();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && detailPageModal.style.display === "flex") {
          closeModal();
        }
      });
    }

    // --- '패키징' & '컨셉' 탭 이미지 확대 라이트박스 로직 ---
    const imageLightbox = document.getElementById("image-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const closeImageLightboxBtn =
      imageLightbox?.querySelector(".lightbox-close");

    if (imageLightbox && lightboxImg && lightboxCaption) {
      const imagesToZoom = onsemiroSection.querySelectorAll(
        "#packaging .photo-item, #concept .photo-item"
      );

      const openLightbox = (imgElement) => {
        lightboxImg.src = imgElement.src;
        lightboxCaption.textContent = imgElement.alt;
        imageLightbox.style.display = "flex";
      };

      imagesToZoom.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const img = item.querySelector("img");
          if (img) openLightbox(img);
        });
      });

      const closeLightbox = () => (imageLightbox.style.display = "none");
      closeImageLightboxBtn?.addEventListener("click", closeLightbox);
      imageLightbox.addEventListener("click", (e) => {
        if (e.target === imageLightbox) closeLightbox();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && imageLightbox.style.display === "flex") {
          closeLightbox();
        }
      });
    }
  }

  initializeOnsemiroSection();

  /* ==============================================================
   * INFORMATION 섹션 배경 비디오 (아침/밤 디졸브)
   * ============================================================== */
  (() => {
    const infoSection = document.getElementById("information");
    if (!infoSection) return;

    const day = document.getElementById("infoVideoDay");
    const night = document.getElementById("infoVideoNight");
    if (!day || !night) return;

    const INTERVAL_MS = 10000;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer = null;
    let active = day;
    let idle = night;

    const crossfade = () => {
      idle.classList.add("is-active");
      active.classList.remove("is-active");
      [active, idle] = [idle, active];
    };

    const start = () => {
      if (timer || prefersReduced.matches || document.hidden) return;
      timer = setInterval(crossfade, INTERVAL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.35 }
    );
    io.observe(infoSection);

    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start()
    );
    prefersReduced.addEventListener?.("change", () =>
      prefersReduced.matches ? stop() : start()
    );
  })();
});
