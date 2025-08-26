const { useRef, useEffect, useCallback, useState } = React;
const { gsap } = window; // window 객체에서 GSAP를 가져옵니다.

// --- 기존 데이터 구조 (영상 및 텍스트) ---
const initialGridData = [
  {
    id: 1,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/tViL1sLDWIA",
    colSpan: 1,
    rowSpan: 1,
  },
  {
    id: 2,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/rBSmqB4-ZF4",
    colSpan: 1,
    rowSpan: 1,
  },
  {
    id: 3,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/qqBSvR9t_J4",
    colSpan: 1,
    rowSpan: 1,
  },
  {
    id: 4,
    category: "세력",
    title: "로도스 아일랜드",
    description: "광석병 치료를 목표로 하는 제약회사이자 무장 조직.",
    url: "https://namu.wiki/w/%EB%A1%9C%EB%8F%84%EC%8A%A4%20%EC%95%84%EC%9D%BC%EB%9E%9C%EB%93%9C(%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC)",
    colSpan: 1,
    rowSpan: 1,
  },
  {
    id: 5,
    category: "세력",
    title: "리유니온",
    description: "감염자의 권리를 위해 싸우는 극단주의 무장 조직.",
    url: "https://namu.wiki/w/%EB%A6%AC%EC%9C%A0%EB%8B%88%EC%98%A8(%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC)",
    colSpan: 2,
    rowSpan: 1, // 넓은 카드
  },
  {
    id: 6,
    category: "개념",
    title: "오리지늄 아츠",
    description:
      "오리지늄을 매개로 발동하는, 일반적으로 '마법'이라 불리는 능력.",
    url: "https://namu.wiki/w/%EC%98%A4%EB%A6%AC%EC%A7%80%EB%84%88%ED%8B%B0%20%EC%95%84%EC%B8%A0",
    colSpan: 1,
    rowSpan: 1,
  },
];

// --- 애니메이션 카드 컴포넌트 ---
const AnimatedCard = ({
  children,
  className = "",
  item,
  enableTilt,
  enableMagnetism,
  disableAnimations,
  onClick,
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseLeave = () => {
      if (enableTilt)
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      if (enableMagnetism)
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
    };

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        gsap.to(element, {
          x: (x - centerX) * 0.05,
          y: (y - centerY) * 0.05,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);

    return () => {
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
    };
  }, [disableAnimations, enableTilt, enableMagnetism]);

  // item.url이 있으면 a 태그, 없으면 div 태그를 사용합니다.
  const TagName = item.url ? "a" : "div";
  const linkProps = item.url
    ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  // item.url (외부 링크)가 없을 때만 onClick 핸들러를 실행합니다.
  const clickHandler = item.url
    ? undefined
    : (e) => {
        e.preventDefault();
        onClick(item);
      };

  return (
    <TagName
      ref={cardRef}
      className={className}
      style={{
        gridColumn: `span ${item.colSpan || 1}`,
        gridRow: `span ${item.rowSpan || 1}`,
      }}
      onClick={clickHandler}
      {...linkProps}
    >
      {children}
    </TagName>
  );
};

// --- 확대된 영상 플레이어 (모달) 컴포넌트 ---
const VideoPlayerModal = ({ video, onClose }) => {
  // URL에 autoplay=1 파라미터를 추가하여 자동 재생합니다.
  const videoUrl = `${video.videoUrl}?autoplay=1&mute=1`; // mute=1 추가로 자동재생 정책 대응

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-video-wrapper">
          <iframe
            src={videoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

// --- 메인 그리드 컴포넌트 ---
const MagicBentoGrid = ({
  glowColor = "255, 204, 0",
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
}) => {
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null); // 현재 활성화된(확대된) 비디오 상태

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldDisableAnimations = isMobile;

  // 카드 클릭 시 호출될 함수입니다.
  const handleCardClick = (item) => {
    if (item.type === "video") {
      setActiveVideo(item); // 비디오 타입의 카드를 클릭하면 activeVideo 상태로 설정합니다.
    }
  };

  return (
    <>
      <div className="card-grid" ref={gridRef}>
        {initialGridData.map((item) => {
          const baseClassName = `card ${
            enableBorderGlow ? "card--border-glow" : ""
          } ${item.type === "video" ? "video-card" : ""}`;

          return (
            <AnimatedCard
              key={item.id}
              item={item}
              className={baseClassName}
              disableAnimations={shouldDisableAnimations}
              enableTilt={enableTilt}
              enableMagnetism={enableMagnetism}
              onClick={handleCardClick} // 클릭 핸들러를 전달합니다.
            >
              {item.type === "video" ? (
                <div className="video-container">
                  <iframe
                    src={item.videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <>
                  <div className="card__header">
                    <div className="card__label">{item.category}</div>
                  </div>
                  <div className="card__content">
                    <h2 className="card__title">{item.title}</h2>
                    <p className="card__description">{item.description}</p>
                  </div>
                </>
              )}
            </AnimatedCard>
          );
        })}
      </div>
      {/* activeVideo 상태가 존재할 때만 모달을 렌더링합니다. */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("magic-bento-root"));
root.render(<MagicBentoGrid />);
