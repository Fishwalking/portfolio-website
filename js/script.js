/* =================================================================
 * js/script.js  (전체)
 * - 가로 스냅 섹션 내비게이션
 * - 뉴스/탭/캐러셀/모달/음악/카드 글로우
 * - INFORMATION 섹션 배경 비디오(아침/밤) 15초 디졸브 + 시작 시점 시크
 * ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------
   * 공통 상태 및 요소 캐싱
   * ------------------------------ */
  const container = document.getElementById("container");
  const sections = Array.from(document.querySelectorAll(".full-page-section"));
  const navLinks = document.querySelectorAll(".nav-links a");
  const modalOverlay = document.getElementById("modal-overlay");

  // 성능 향상을 위해 fade-in 요소를 미리 캐싱
  const fadeInElements = sections.map((section) =>
    section.querySelectorAll(".fade-in-up")
  );

  let currentIndex = 0;
  let isScrolling = false;
  let touchStartX = null;
  let touchStartY = null;

  /* 컨테이너 폭 = 섹션 수 × 100vw */
  if (container && sections.length) {
    container.style.width = `${sections.length * 100}vw`;
  }

  /* 해시 기반 인덱스 */
  const indexByHash = (hash) => sections.findIndex((s) => `#${s.id}` === hash);

  /* 현재 내비활성 표시 */
  const updateCurrentNav = () => {
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    const active = document.querySelector(
      `.nav-links a[href="#${sections[currentIndex]?.id}"]`
    );
    if (active) active.setAttribute("aria-current", "page");
  };

  /* 등장 애니메이션 (캐싱된 요소 사용) */
  const animateVisible = () => {
    // 현재 보이는 모든 애니메이션 요소 숨기기
    document
      .querySelectorAll(".fade-in-up.visible")
      .forEach((el) => el.classList.remove("visible"));

    // 현재 섹션의 애니메이션 요소들을 순차적으로 보이게 함
    const visibleElements = fadeInElements[currentIndex];
    if (!visibleElements) return;

    visibleElements.forEach((el, i) =>
      setTimeout(() => el.classList.add("visible"), i * 150)
    );
  };

  /* 섹션 스크롤 */
  const scrollToSection = (index, pushHistory = true) => {
    if (!container || isScrolling) return;
    const max = sections.length - 1;
    const newIndex = Math.min(Math.max(index, 0), max);

    if (newIndex === currentIndex) return; // 같은 섹션으로 이동 시 중단
    currentIndex = newIndex;

    isScrolling = true;
    container.style.transform = `translateX(-${currentIndex * 100}vw)`;
    if (pushHistory)
      history.pushState(null, "", `#${sections[currentIndex].id}`);

    setTimeout(() => {
      animateVisible();
      updateCurrentNav();
      isScrolling = false;
    }, 800); // transition 시간과 일치
  };

  /* 최초 진입: 해시 처리 */
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

  /* 모달 열림 여부 */
  const modalOpen = () =>
    !!modalOverlay && getComputedStyle(modalOverlay).display === "flex";

  /* 휠로 좌우 섹션 이동 (UX 개선) */
  window.addEventListener(
    "wheel",
    (e) => {
      if (modalOpen() || isScrolling) return;

      // 스크롤 이동이 수평 이동보다 클 때만 섹션 전환
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // e.preventDefault(); // 무조건적인 방지 제거
        if (e.deltaY > 5) {
          // 임계값 설정으로 미세한 움직임 무시
          scrollToSection(currentIndex + 1);
        } else if (e.deltaY < -5) {
          scrollToSection(currentIndex - 1);
        }
      }
    },
    { passive: true } // preventDefault를 사용하지 않으므로 passive: true로 변경 가능
  );

  /* 키보드 이동 */
  window.addEventListener("keydown", (e) => {
    if (modalOpen()) return;
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

  /* 터치 스와이프 */
  window.addEventListener(
    "touchstart",
    (e) => {
      if (modalOpen()) return;
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    (e) => {
      if (modalOpen() || touchStartX === null) return;
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

  /* 네비 링크 클릭 이동 */
  navLinks.forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href");
      const target = sections.findIndex((s) => `#${s.id}` === id);
      if (target !== -1) scrollToSection(target);
    })
  );

  /* ------------------------------
   * 뉴스 렌더 (데모 데이터)
   * ------------------------------ */
  const NEWS_DATA = {
    latest: [
      {
        date: "2025-08-14",
        tag: "공지",
        title: "08월 14일 16:00 점검 안내",
        url: "#",
      },
      {
        date: "2025-08-03",
        tag: "공지",
        title: "신규 오퍼레이터 「遥」 이슈 공지",
        url: "#",
      },
      {
        date: "2025-08-02",
        tag: "이벤트",
        title: "창작 공모전 「墟」 개최",
        url: "#",
      },
    ],
    notice: [
      {
        date: "2025-08-14",
        tag: "공지",
        title: "08월 14일 16:00 점검 안내",
        url: "#",
      },
    ],
    event: [
      {
        date: "2025-08-02",
        tag: "이벤트",
        title: "창작 공모전 「墟」 개최",
        url: "#",
      },
    ],
    news: [
      {
        date: "2025-08-02",
        tag: "뉴스",
        title: "BREAKING NEWS 업데이트",
        url: "#",
      },
    ],
  };
  const renderNews = (key, targetId) => {
    const wrap = document.getElementById(targetId);
    if (!wrap) return;
    wrap.innerHTML = NEWS_DATA[key]
      .map(
        (item) => `
        <a href="${item.url}" target="_blank" rel="noopener" class="news-card" aria-label="${item.tag} | ${item.date} | ${item.title}">
            <div class="news-meta">${item.date} · ${item.tag}</div>
            <div class="news-title">${item.title}</div>
        </a>
    `
      )
      .join("");
  };
  renderNews("latest", "news-latest");
  renderNews("notice", "news-notice");
  renderNews("event", "news-event");
  renderNews("news", "news-news");

  /* 탭 전환 */
  const tablist = document.querySelector('[role="tablist"]');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  tablist.addEventListener("click", (e) => {
    const clickedTab = e.target.closest('[role="tab"]');
    if (!clickedTab) return;

    tabs.forEach((tab) => tab.setAttribute("aria-selected", "false"));
    clickedTab.setAttribute("aria-selected", "true");

    panels.forEach((panel) => {
      panel.hidden = panel.id !== clickedTab.getAttribute("aria-controls");
    });
  });

  /* ------------------------------
   * 캐러셀
   * ------------------------------ */
  const track = document.getElementById("opTrack");
  const opPrev = document.getElementById("opPrev");
  const opNext = document.getElementById("opNext");
  let opIndex = 0;

  if (track && opPrev && opNext) {
    const getGap = () => {
      const first = track?.children?.[0];
      if (!first) return 24;
      return parseFloat(getComputedStyle(first).marginRight || "0");
    };

    const updateCarousel = () => {
      if (!track.children.length) return;
      const cardW = track.children[0]?.offsetWidth || 320;
      const gap = getGap();
      track.style.transform = `translateX(${-(opIndex * (cardW + gap))}px)`;
      opPrev.disabled = opIndex === 0;
      opNext.disabled = opIndex >= track.children.length - 1;
    };

    opPrev.addEventListener("click", () => {
      opIndex = Math.max(0, opIndex - 1);
      updateCarousel();
    });
    opNext.addEventListener("click", () => {
      opIndex = Math.min(track.children.length - 1, opIndex + 1);
      updateCarousel();
    });

    // ResizeObserver를 사용하여 더 안정적인 리사이즈 감지
    const ro = new ResizeObserver(updateCarousel);
    ro.observe(track);

    updateCarousel(); // 초기화
  }

  /* ------------------------------
   * 모달
   * ------------------------------ */
  const openModalBtn = document.getElementById("open-modal");
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
  openModalBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ------------------------------
   * 오디오 제어
   * ------------------------------ */
  const bgm = document.getElementById("bgm");
  const musicToggleBtn = document.getElementById("music-toggle-btn");
  const volumeSlider = document.getElementById("volume-slider");
  const musicControls = musicToggleBtn?.closest(".music-controls");

  if (bgm && volumeSlider) {
    bgm.volume = parseFloat(volumeSlider.value);
  }

  const syncMusicUI = () => {
    if (!bgm || !musicToggleBtn || !musicControls) return;
    const playing = !bgm.paused;
    musicToggleBtn.textContent = playing ? "⏸️" : "🎵";
    musicToggleBtn.setAttribute("aria-pressed", String(playing));
    musicControls.classList.toggle("playing", playing);
  };

  musicToggleBtn?.addEventListener("click", async () => {
    try {
      if (bgm.paused) {
        await bgm.play();
      } else {
        bgm.pause();
      }
    } catch (e) {
      console.error("Audio play failed:", e);
    }
    syncMusicUI();
  });

  volumeSlider?.addEventListener("input", (e) => {
    if (bgm) bgm.volume = parseFloat(e.target.value);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && bgm && !bgm.paused) {
      bgm.pause();
    }
    syncMusicUI();
  });

  syncMusicUI();

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
