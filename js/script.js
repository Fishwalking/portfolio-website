/* =================================================================
 * js/script.js  (전체)
 * - 가로 스냅 섹션 내비게이션
 * - 뉴스/탭/캐러셀/모달/음악/카드 글로우
 * - INFORMATION 섹션 배경 비디오(아침/밤) 15초 디졸브 + 시작 시점 시크
 * ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------
   * 공통 상태
   * ------------------------------ */
  const container = document.getElementById("container");
  const sections = Array.from(document.querySelectorAll(".full-page-section"));
  const navLinks = document.querySelectorAll(".nav-links a");
  const modalOverlay = document.getElementById("modal-overlay");

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

  /* 섹션 스크롤 */
  const scrollToSection = (index, pushHistory = true) => {
    if (!container) return;
    const max = sections.length - 1;
    currentIndex = Math.min(Math.max(index, 0), max);
    isScrolling = true;
    container.style.transform = `translateX(-${currentIndex * 100}vw)`;
    if (pushHistory)
      history.pushState(null, "", `#${sections[currentIndex].id}`);
    setTimeout(() => {
      animateVisible();
      isScrolling = false;
      updateCurrentNav();
    }, 800);
  };

  /* 최초 진입: 해시 처리 */
  if (location.hash && indexByHash(location.hash) !== -1) {
    const old = container?.style.transition;
    if (container) container.style.transition = "none";
    requestAnimationFrame(() => {
      scrollToSection(indexByHash(location.hash), false);
      if (container)
        container.style.transition = old || "transform .8s ease-in-out";
    });
  } else if (sections[0]) {
    history.replaceState(null, "", `#${sections[0].id}`);
  }

  window.addEventListener("hashchange", () => {
    const idx = indexByHash(location.hash);
    if (idx !== -1 && idx !== currentIndex) scrollToSection(idx, false);
  });

  /* 모달 열림 여부 */
  const modalOpen = () =>
    !!modalOverlay && getComputedStyle(modalOverlay).display === "flex";

  /* 휠로 좌우 섹션 이동 */
  window.addEventListener(
    "wheel",
    (e) => {
      if (modalOpen()) return;
      e.preventDefault();
      if (isScrolling) return;
      if (e.deltaY > 0 && currentIndex < sections.length - 1)
        scrollToSection(currentIndex + 1);
      else if (e.deltaY < 0 && currentIndex > 0)
        scrollToSection(currentIndex - 1);
    },
    { passive: false }
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
      if (modalOpen()) return;
      if (touchStartX === null) return;
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

  /* 등장 애니메이션 */
  const animateVisible = () => {
    const visible = sections[currentIndex];
    if (!visible) return;
    const animated = visible.querySelectorAll(".fade-in-up");
    document
      .querySelectorAll(".fade-in-up")
      .forEach((el) => el.classList.remove("visible"));
    animated.forEach((el, i) =>
      setTimeout(() => el.classList.add("visible"), i * 150)
    );
  };
  animateVisible();

  /* ------------------------------
   * 뉴스 렌더 (데모 데이터)
   * ------------------------------ */
  const NEWS_DATA = {
    latest: [
      {
        date: "2025-08-14",
        tag: "공지",
        title: "08월 14일 16:00 점검 안내",
        url: "https://ak.hypergryph.com/",
      },
      {
        date: "2025-08-03",
        tag: "공지",
        title: "신규 오퍼레이터 「遥」 이슈 공지",
        url: "https://ak.hypergryph.com/",
      },
      {
        date: "2025-08-02",
        tag: "이벤트",
        title: "창작 공모전 「墟」 개최",
        url: "https://ak.hypergryph.com/",
      },
    ],
    notice: [
      {
        date: "2025-08-14",
        tag: "공지",
        title: "08월 14일 16:00 점검 안내",
        url: "https://ak.hypergryph.com/",
      },
    ],
    event: [
      {
        date: "2025-08-02",
        tag: "이벤트",
        title: "창작 공모전 「墟」 개최",
        url: "https://ak.hypergryph.com/",
      },
    ],
    news: [
      {
        date: "2025-08-02",
        tag: "뉴스",
        title: "BREAKING NEWS 업데이트",
        url: "https://ak.hypergryph.com/",
      },
    ],
  };
  const renderNews = (key, targetId) => {
    const wrap = document.getElementById(targetId);
    if (!wrap) return;
    wrap.innerHTML = "";
    NEWS_DATA[key].forEach((item) => {
      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "news-card";
      a.setAttribute(
        "aria-label",
        `${item.tag} | ${item.date} | ${item.title}`
      );
      a.innerHTML = `<div class="news-meta">${item.date} · ${item.tag}</div><div class="news-title">${item.title}</div>`;
      wrap.appendChild(a);
    });
  };
  renderNews("latest", "news-latest");
  renderNews("notice", "news-notice");
  renderNews("event", "news-event");
  renderNews("news", "news-news");

  /* 탭 전환 */
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = {
    "tab-latest": "panel-latest",
    "tab-notice": "panel-notice",
    "tab-event": "panel-event",
    "tab-news": "panel-news",
  };
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      Object.values(panels).forEach(
        (id) => (document.getElementById(id).hidden = true)
      );
      const active = document.getElementById(panels[tab.id]);
      if (active) active.hidden = false;
    })
  );

  /* ------------------------------
   * 캐러셀
   * ------------------------------ */
  const track = document.getElementById("opTrack");
  let opIndex = 0;
  const getGap = () => {
    const first = track?.children?.[0];
    if (!first) return 24;
    const s = getComputedStyle(first);
    return parseFloat(s.marginRight || "0");
  };
  const updateCarousel = () => {
    if (!track || !track.children.length) return;
    const cardW = track.children[0]?.offsetWidth || 320;
    const gap = getGap();
    track.style.transform = `translateX(${-(opIndex * (cardW + gap))}px)`;

    // 캐러셀 버튼 상태 업데이트
    if (opPrev) opPrev.disabled = opIndex === 0;
    if (opNext) opNext.disabled = opIndex >= track.children.length - 1;
  };
  const opPrev = document.getElementById("opPrev");
  const opNext = document.getElementById("opNext");
  opPrev?.addEventListener("click", () => {
    opIndex = Math.max(0, opIndex - 1);
    updateCarousel();
  });
  opNext?.addEventListener("click", () => {
    opIndex = Math.min(track.children.length - 1, opIndex + 1);
    updateCarousel();
  });
  window.addEventListener("resize", updateCarousel);

  /* 캐러셀 스와이프/드래그 */
  (() => {
    const carousel = document.querySelector("#operator .carousel");
    if (!carousel) return;
    let sx = null,
      sy = null,
      dragging = false,
      md = false;
    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      sx = t.clientX;
      sy = t.clientY;
      dragging = true;
    };
    const onMove = (e) => {
      if (!dragging) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dy) > Math.abs(dx)) return;
      e.preventDefault();
    };
    const onEnd = (e) => {
      if (!dragging) return;
      dragging = false;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - sx;
      if (Math.abs(dx) > 40) {
        if (dx < 0) opIndex = Math.min(track.children.length - 1, opIndex + 1);
        else opIndex = Math.max(0, opIndex - 1);
        updateCarousel();
      }
      sx = sy = null;
    };
    carousel.addEventListener("touchstart", onStart, { passive: true });
    carousel.addEventListener("touchmove", onMove, { passive: false });
    carousel.addEventListener("touchend", onEnd, { passive: true });
    carousel.addEventListener("mousedown", (e) => {
      md = true;
      onStart(e);
    });
    carousel.addEventListener("mousemove", (e) => {
      if (md) onMove(e);
    });
    carousel.addEventListener("mouseup", (e) => {
      if (md) {
        md = false;
        onEnd(e);
      }
    });
    carousel.addEventListener("mouseleave", (e) => {
      if (md) {
        md = false;
        onEnd(e);
      }
    });
  })();

  const ro = new ResizeObserver(() => updateCarousel());
  if (track) {
    ro.observe(track);
    [...track.children].forEach((card) => ro.observe(card));
  }
  updateCarousel();

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
    // 모달 내 포커스 가능한 첫 번째 요소로 포커스 이동
    const firstFocusable = getFocusable()[0];
    if (firstFocusable) firstFocusable.focus();
    document.addEventListener("keydown", trap);
  };
  const closeModal = () => {
    modalOverlay.style.display = "none";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", trap);
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
    musicToggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    musicControls.classList.toggle("playing", playing);
  };
  musicToggleBtn?.addEventListener("click", async () => {
    try {
      if (bgm.paused) await bgm.play();
      else bgm.pause();
    } catch (e) {}
    syncMusicUI();
  });
  volumeSlider?.addEventListener("input", (e) => {
    if (bgm) bgm.volume = parseFloat(e.target.value) || 0;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && bgm && !bgm.paused) {
      bgm.pause();
      syncMusicUI();
    }
  });
  document.addEventListener("visibilitychange", syncMusicUI);
  window.addEventListener("pageshow", syncMusicUI);
  syncMusicUI();

  /* ------------------------------
   * 카드 라이트 글로우
   * ------------------------------ */
  document.querySelectorAll(".card.card--border-glow").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--glow-x", x + "%");
      card.style.setProperty("--glow-y", y + "%");
      card.style.setProperty("--glow-intensity", "1");
    });
    card.addEventListener("mouseleave", () =>
      card.style.setProperty("--glow-intensity", "0")
    );
  });

  /* ==============================================================
   * INFORMATION 섹션 배경 비디오 (아침/밤 디졸브)
   * - 15초 간격으로 교차
   * - 등장 순간 원하는 지점으로 시크 (아침=0초, 밤=NIGHT_START_AT)
   * - 영상이 끝나면 0초부터 자동 재생
   * ============================================================== */
  (() => {
    const infoSection = document.getElementById("information");
    if (!infoSection) return;

    // 비디오 엘리먼트
    const day = document.getElementById("infoVideoDay");
    const night = document.getElementById("infoVideoNight");
    if (!day || !night) return; // 두 개 다 있어야 동작

    // 구성
    const INTERVAL_MS = 10000; // 15초마다 디졸브
    const DAY_START_AT = 0.0; // 아침은 0초부터 보여주기
    const NIGHT_START_AT = 0; // 밤은 원하는 시작 구간(원하면 0으로 바꿔도 됨)

    // 매번 등장할 때마다 해당 시점으로 리셋할지
    const RESET_DAY_ON_EVERY_FADE = true;
    const RESET_NIGHT_ON_EVERY_FADE = true;

    // iOS 등 자동재생 정책 대비: 확실한 속성/상태
    [day, night].forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.loop = true; // 끝나면 자동 0초로
      v.preload = v.preload || "auto";
    });

    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
    const shouldPause = () => prefersReduced.matches || document.hidden;

    let timer = null;
    let active = day; // 현재 화면에 보이는 비디오
    let idle = night; // 다음에 보일 비디오

    // 안전 시크
    const seekWhenReady = (video, t) => {
      const doSeek = () => {
        const dur = video.duration;
        const safeT =
          isFinite(dur) && dur > 0
            ? Math.min(Math.max(0, t), dur - 0.1)
            : Math.max(0, t);
        try {
          video.currentTime = safeT;
        } catch (e) {}
      };
      if (video.readyState >= 1) doSeek();
      else video.addEventListener("loadedmetadata", doSeek, { once: true });
    };

    const playBoth = () =>
      [day, night].forEach((v) => v.play().catch(() => {}));
    const pauseBoth = () => [day, night].forEach((v) => v.pause());

    // 끝나면(루프가 꺼져 있어도) 0부터 다시
    [day, night].forEach((v) => {
      v.addEventListener("ended", () => {
        try {
          v.currentTime = 0;
          v.play().catch(() => {});
        } catch (e) {}
      });
    });

    // 최초 활성 비디오 클래스 보정
    const ensureInitialClasses = () => {
      day.classList.add("bg-video");
      night.classList.add("bg-video");
      if (
        !day.classList.contains("is-active") &&
        !night.classList.contains("is-active")
      ) {
        day.classList.add("is-active");
      }
      active = day.classList.contains("is-active") ? day : night;
      idle = active === day ? night : day;
    };
    ensureInitialClasses();

    // 다음에 보일 비디오가 등장하기 직전, 시작 시점으로 점프
    const prepareIdle = () => {
      if (idle === day) {
        if (RESET_DAY_ON_EVERY_FADE) seekWhenReady(day, DAY_START_AT);
      } else if (idle === night) {
        if (RESET_NIGHT_ON_EVERY_FADE) seekWhenReady(night, NIGHT_START_AT);
      }
    };

    // 교차 디졸브
    const crossfade = () => {
      prepareIdle(); // 등장 비디오를 먼저 시크

      // 디졸브
      idle.classList.add("is-active");
      active.classList.remove("is-active");

      // 스왑
      [active, idle] = [idle, active];

      // 재생 보장
      playBoth();
    };

    // 시작/중지
    const start = () => {
      if (timer || shouldPause()) return;
      // 첫 사이클 전, 다음에 나올 비디오(=idle)를 시작 지점으로 맞춰둠
      prepareIdle();
      playBoth();
      timer = setInterval(crossfade, INTERVAL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      pauseBoth();
    };

    // 2페이지가 보일 때만 동작
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          e.isIntersecting && !shouldPause() ? start() : stop()
        );
      },
      { threshold: 0.35 }
    );
    io.observe(infoSection);

    // 탭/OS 상태 변화
    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start()
    );
    prefersReduced.addEventListener?.("change", () =>
      shouldPause() ? stop() : start()
    );

    // 페이지 로드시 한번 시도
    start();
  })();
});
