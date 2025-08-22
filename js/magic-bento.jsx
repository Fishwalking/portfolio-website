/* global React, ReactDOM */
const { useRef, useEffect, useCallback, useMemo, useState } = React;

/* ===== Config ===== */
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "132, 0, 255";
const MOBILE_BREAKPOINT = 768;

/* 기본 카드 데이터 (필요시 items로 교체) */
const defaultItems = [
  {
    color: "#060010",
    title: "원석 (Originium)",
    description: "테라 곳곳의 미지의 결정체.",
    label: "Lore",
  },
  {
    color: "#060010",
    title: "원석기예 (Originium Arts)",
    description: "원석을 매개로 발현되는 현상.",
    label: "Lore",
  },
  {
    color: "#060010",
    title: "감염자 (Infected)",
    description: "사회적 배제와 생존의 모순.",
    label: "Lore",
  },
  {
    color: "#060010",
    title: "이동 도시국가",
    description: "재난을 피해 이동하는 도시.",
    label: "Lore",
  },
  {
    color: "#060010",
    title: "로도스 아일랜드",
    description: "의료/용병 활동 집단.",
    label: "Faction",
  },
  {
    color: "#060010",
    title: "리유니온",
    description: "감염자 중심 무장 조직.",
    label: "Faction",
  },
];

/* ===== Utils ===== */
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const calcSpotlight = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const setCardGlow = (card, x, y, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const rx = ((x - rect.left) / rect.width) * 100;
  const ry = ((y - rect.top) / rect.height) * 100;
  card.style.setProperty("--glow-x", `${rx}%`);
  card.style.setProperty("--glow-y", `${ry}%`);
  card.style.setProperty("--glow-intensity", `${glow}`);
  card.style.setProperty("--glow-radius", `${radius}px`);
};

const createParticleEl = (x, y, rgb = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position:absolute; width:4px; height:4px; border-radius:50%;
    background:rgba(${rgb},1); box-shadow:0 0 6px rgba(${rgb},0.6);
    pointer-events:none; z-index:100; left:${x}px; top:${y}px;
  `;
  return el;
};

/* ===== FXCard (stars + tilt + magnet + ripple) ===== */
const FXCard = ({
  children,
  className,
  style,
  glowColor,
  particleCount,
  enableStars,
  enableTilt,
  enableMagnetism,
  clickEffect,
  disableAnimations,
}) => {
  const ref = useRef(null);
  const particlesRef = useRef([]);
  const patternRef = useRef([]);
  const timersRef = useRef([]);
  const hoverRef = useRef(false);
  const initedRef = useRef(false);
  const magnetTweenRef = useRef(null);

  const initPattern = useCallback(() => {
    if (initedRef.current || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    patternRef.current = Array.from({ length: particleCount }, () =>
      createParticleEl(Math.random() * width, Math.random() * height, glowColor)
    );
    initedRef.current = true;
  }, [particleCount, glowColor]);

  const clearParticles = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    magnetTweenRef.current &&
      magnetTweenRef.current.kill &&
      magnetTweenRef.current.kill();

    particlesRef.current.forEach((p) => {
      // 간단 fade out
      p.style.transition = "opacity .25s ease, transform .25s ease";
      p.style.opacity = "0";
      p.style.transform = "scale(0.8)";
      setTimeout(() => p.parentNode && p.parentNode.removeChild(p), 250);
    });
    particlesRef.current = [];
  }, []);

  const animateStars = useCallback(() => {
    if (!enableStars || !ref.current || !hoverRef.current) return;
    if (!initedRef.current) initPattern();

    patternRef.current.forEach((proto, i) => {
      const id = setTimeout(() => {
        if (!hoverRef.current || !ref.current) return;
        const clone = proto.cloneNode(true);
        ref.current.appendChild(clone);
        particlesRef.current.push(clone);

        clone.style.transition =
          "opacity .25s cubic-bezier(.34,1.56,.64,1), transform .25s cubic-bezier(.34,1.56,.64,1)";
        clone.style.opacity = "1";
        clone.style.transform = "scale(1)";

        // 떠다니는 무빙
        const drift = () => {
          if (!clone.isConnected) return;
          const dx = (Math.random() - 0.5) * 100;
          const dy = (Math.random() - 0.5) * 100;
          const r = Math.random() * 360;
          const d = 2000 + Math.random() * 2000;
          clone.animate(
            [
              {
                transform:
                  clone.style.transform ||
                  "translate(0,0) scale(1) rotate(0deg)",
                opacity: clone.style.opacity || "0.8",
              },
              {
                transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${r}deg)`,
                opacity: "0.3",
              },
            ],
            {
              duration: d,
              direction: "alternate",
              iterations: Infinity,
              easing: "linear",
              fill: "forwards",
            }
          );
        };
        drift();
      }, i * 90);
      timersRef.current.push(id);
    });
  }, [enableStars, initPattern]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const noMotion = disableAnimations || prefersReduced();

    const onEnter = () => {
      hoverRef.current = true;
      animateStars();
      if (enableTilt && !noMotion) {
        el.style.transition = "transform .25s ease";
        el.style.transform +=
          " perspective(1000px) rotateX(5deg) rotateY(5deg)";
      }
    };
    const onLeave = () => {
      hoverRef.current = false;
      clearParticles();
      if (enableTilt && !noMotion) {
        el.style.transition = "transform .25s ease";
        el.style.transform = "translateZ(0)";
      }
      if (enableMagnetism && !noMotion) {
        el.style.transition = "transform .25s ease";
        el.style.transform = "translate(0,0)";
      }
      el.style.setProperty("--glow-intensity", "0");
    };
    const onMove = (e) => {
      if (noMotion) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const cx = r.width / 2;
      const cy = r.height / 2;

      if (enableTilt) {
        const rx = ((y - cy) / cy) * -10;
        const ry = ((x - cx) / cx) * 10;
        el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      if (enableMagnetism) {
        const mx = (x - cx) * 0.05;
        const my = (y - cy) * 0.05;
        el.style.transform += ` translate(${mx}px, ${my}px)`;
      }
      const px = (x / r.width) * 100;
      const py = (y / r.height) * 100;
      el.style.setProperty("--glow-x", `${px}%`);
      el.style.setProperty("--glow-y", `${py}%`);
    };
    const onClick = (e) => {
      if (!clickEffect || noMotion) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const maxD = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - r.width, y),
        Math.hypot(x, y - r.height),
        Math.hypot(x - r.width, y - r.height)
      );
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      ripple.style.left = `${x - maxD}px`;
      ripple.style.top = `${y - maxD}px`;
      ripple.style.width = `${maxD * 2}px`;
      ripple.style.height = `${maxD * 2}px`;
      ripple.style.setProperty(
        "--glow-color-rgb",
        style?.["--glow-color-rgb"] || DEFAULT_GLOW_COLOR
      );
      el.appendChild(ripple);

      ripple.animate(
        [
          { transform: "scale(0)", opacity: 0.9 },
          { transform: "scale(1)", opacity: 0 },
        ],
        {
          duration: 800,
          easing: "cubic-bezier(.22,.61,.36,1)",
          fill: "forwards",
        }
      ).onfinish = () => ripple.remove();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("click", onClick);

    return () => {
      hoverRef.current = false;
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("click", onClick);
      clearParticles();
    };
  }, [
    animateStars,
    clearParticles,
    clickEffect,
    disableAnimations,
    enableMagnetism,
    enableTilt,
    style,
  ]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
      <div className="lines" aria-hidden="true" />
    </div>
  );
};

/* ===== Global Spotlight ===== */
const GlobalSpotlight = ({
  gridRef,
  enabled,
  disableAnimations,
  spotlightRadius,
  glowColor,
}) => {
  const spotRef = useRef(null);

  useEffect(() => {
    if (!enabled || !gridRef?.current) return;
    const noMotion = disableAnimations || prefersReduced();

    const spot = document.createElement("div");
    spot.className = "global-spotlight";
    spot.style.setProperty("--glow-color-rgb", glowColor);
    document.body.appendChild(spot);
    spotRef.current = spot;

    const onMove = (e) => {
      if (!spotRef.current || !gridRef.current) return;
      const section = gridRef.current.closest(".bento-section");
      const rect = section?.getBoundingClientRect();
      const inside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll(".card");
      const { proximity, fadeDistance } = calcSpotlight(spotlightRadius);

      if (!inside) {
        spotRef.current.style.opacity = "0";
        cards.forEach((c) => c.style.setProperty("--glow-intensity", "0"));
        return;
      }

      let minD = Infinity;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist =
          Math.hypot(e.clientX - cx, e.clientY - cy) -
          Math.max(r.width, r.height) / 2;
        const d = Math.max(0, dist);
        minD = Math.min(minD, d);

        let glow = 0;
        if (d <= proximity) glow = 1;
        else if (d <= fadeDistance)
          glow = (fadeDistance - d) / (fadeDistance - proximity);

        setCardGlow(card, e.clientX, e.clientY, glow, spotlightRadius);
      });

      const targetOpacity =
        minD <= proximity
          ? 0.85
          : minD <= fadeDistance
          ? ((fadeDistance - minD) / (fadeDistance - proximity)) * 0.85
          : 0;

      if (!noMotion) {
        spotRef.current.style.left = `${e.clientX}px`;
        spotRef.current.style.top = `${e.clientY}px`;
        spotRef.current.style.opacity = `${targetOpacity}`;
      } else {
        spotRef.current.style.opacity = "0";
      }
    };

    const onLeave = () => {
      if (spotRef.current) spotRef.current.style.opacity = "0";
      gridRef.current
        ?.querySelectorAll(".card")
        .forEach((c) => c.style.setProperty("--glow-intensity", "0"));
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      spotRef.current?.parentNode?.removeChild(spotRef.current);
    };
  }, [gridRef, enabled, disableAnimations, spotlightRadius, glowColor]);

  return null;
};

/* ===== Grid ===== */
const BentoGrid = ({ gridRef, children }) => (
  <div
    className="card-grid bento-section"
    ref={gridRef}
    role="list"
    aria-label="Magic Bento"
  >
    {children}
  </div>
);

/* ===== MagicBento ===== */
const MagicBento = ({
  items,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  disableAnimations = false,
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobile();
  const noMotion = disableAnimations || isMobile || prefersReduced();
  const data = useMemo(
    () => (items && items.length ? items : defaultItems),
    [items]
  );

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          enabled={enableSpotlight}
          disableAnimations={noMotion}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoGrid gridRef={gridRef}>
        {data.map((card, i) => {
          const className = [
            "card",
            textAutoHide ? "card--text-autohide" : "",
            enableBorderGlow ? "card--border-glow" : "",
          ]
            .join(" ")
            .trim();

          const style = {
            backgroundColor: card.color,
            "--glow-color-rgb": glowColor,
          };

          return (
            <FXCard
              key={i}
              className={className}
              style={style}
              glowColor={glowColor}
              particleCount={particleCount}
              enableStars={enableStars}
              enableTilt={enableTilt}
              enableMagnetism={enableMagnetism}
              clickEffect={clickEffect}
              disableAnimations={noMotion}
            >
              <div className="card__header">
                <div className="card__label">{card.label}</div>
              </div>
              <div className="card__content">
                <h2 className="card__title">{card.title}</h2>
                <p className="card__description">{card.description}</p>
              </div>
            </FXCard>
          );
        })}
      </BentoGrid>
    </>
  );
};

/* ===== Mount to #magic-bento-root ===== */
(() => {
  const rootEl = document.getElementById("magic-bento-root");
  if (!rootEl) return;

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <MagicBento
      textAutoHide
      enableStars
      enableSpotlight
      enableBorderGlow
      enableTilt
      enableMagnetism
      clickEffect
      spotlightRadius={300}
      particleCount={12}
      glowColor="255, 204, 0" // ★ 노랑 포인트
    />
  );
})();
