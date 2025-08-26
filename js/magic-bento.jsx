const { useState, useMemo, useEffect } = React;

const initialGridData = [
  // === 영상 데이터 시작 ===
  {
    id: 1,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/tViL1sLDWIA",
    size: "medium",
  },
  {
    id: 2,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/rBSmqB4-ZF4",
    size: "medium",
  },
  {
    id: 3,
    type: "video",
    videoUrl: "https://www.youtube.com/embed/qqBSvR9t_J4",
    size: "medium",
  },
  // === 영상 데이터 끝 ===
  {
    id: 4,
    category: "Faction",
    title: "로도스 아일랜드",
    description: "광석병 치료를 목표로 하는 제약회사이자 무장 조직.",
    size: "medium",
    url: "https://namu.wiki/w/%EB%A1%9C%EB%8F%84%EC%8A%A4%20%EC%95%84%EC%9D%BC%EB%9E%9C%EB%93%9C(%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC)",
  },
  {
    id: 5,
    category: "Faction",
    title: "리유니온",
    description: "감염자의 권리를 위해 싸우는 극단주의 무장 조직.",
    size: "large",
    url: "https://namu.wiki/w/%EB%A6%AC%EC%9C%A0%EB%8B%88%EC%98%A8(%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC)",
  },
  {
    id: 6,
    category: "Concept",
    title: "오리지늄 아츠 (Originium Arts)",
    description:
      "오리지늄을 매개로 발동하는, 일반적으로 '마법'이라 불리는 능력.",
    size: "medium",
    url: "https://namu.wiki/w/%EC%98%A4%EB%A6%AC%EC%A7%80%EB%84%88%ED%8B%B0%20%EC%95%84%EC%B8%A0",
  },
  {
    id: 7,
    category: "Lore",
    title: "광석병 (Oripathy)",
    description:
      "체내 오리지늄 결정화로 발병하며, 사망 시 주변을 광석으로 오염시키는 불치병.",
    size: "medium",
    url: "https://namu.wiki/w/%EA%B4%91%EC%84%9D%EB%B3%91",
  },
  {
    id: 8,
    category: "Concept",
    title: "이동 도시 (Nomadic City)",
    description:
      "끊임없이 발생하는 '천재(Catastrophe)'를 피해 이동하는 거대 도시.",
    size: "medium",
    url: "https://namu.wiki/w/%ED%85%8C%EB%9D%BC(%EB%AA%85%EC%9D%BC%EB%B0%A9%EC%A3%BC)#s-3.1",
  },
  {
    id: 9,
    category: "Lore",
    title: "감염자 (Infected)",
    description:
      "광석병에 걸린 사람들을 지칭하며, 사회적으로 차별과 박해의 대상이 됨.",
    size: "large",
    url: "https://namu.wiki/w/%EA%B4%91%EC%84%9D%EB%B3%91",
  },
];

function BentoCard({
  item,
  isExpanded,
  isSelected,
  onClick,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) {
  const TagName = item.url && !isExpanded ? "a" : "div";
  const linkProps =
    TagName === "a"
      ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
      : {};

  let content;

  // 영상 타입 카드 처리
  if (item.type === "video") {
    content = (
      <div className="video-container">
        <iframe
          src={item.videoUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  } else if (isExpanded) {
    // 확장된 카드 처리
    content = (
      <div className="card-content-expanded">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            더 알아보기
          </a>
        )}
      </div>
    );
  } else {
    // 기본 카드 처리
    content = (
      <div className="card-content-collapsed">
        <span className="card-category">{item.category}</span>
        <h3>{item.title}</h3>
        <p className="card-description">{item.description}</p>
      </div>
    );
  }

  return (
    <TagName
      {...linkProps}
      className={`bento-card ${item.size} ${isExpanded ? "expanded" : ""} ${
        isSelected ? "selected" : ""
      } ${isHovered ? "hovered" : ""} ${
        item.type === "video" ? "video-card" : ""
      }`}
      onClick={() => onClick(item)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </TagName>
  );
}

function MagicBentoGrid() {
  const [expandedItem, setExpandedItem] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleCardClick = (item) => {
    if (item.type === "video") return; // 영상 카드는 확장되지 않도록 설정
    if (expandedItem && expandedItem.id === item.id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(item);
    }
  };

  const handleMouseEnter = (item) => {
    setHoveredItemId(item.id);
  };

  const handleMouseLeave = () => {
    setHoveredItemId(null);
  };

  const gridTemplate = useMemo(() => {
    if (!expandedItem) {
      return {
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, minmax(150px, auto))",
      };
    }

    const expandedIndex = initialGridData.findIndex(
      (item) => item.id === expandedItem.id
    );
    const numRows = 3;
    const numCols = 3;
    const itemRow = Math.floor(expandedIndex / numCols);
    const itemCol = expandedIndex % numCols;

    const newTemplate = {
      gridTemplateColumns: `repeat(${numCols}, 1fr)`,
      gridTemplateRows: `repeat(${numRows}, minmax(150px, auto))`,
    };

    return newTemplate;
  }, [expandedItem]);

  return (
    <div className="bento-grid-container">
      <div className="bento-grid" style={gridTemplate}>
        {initialGridData.map((item) => (
          <BentoCard
            key={item.id}
            item={item}
            isExpanded={expandedItem && expandedItem.id === item.id}
            isSelected={expandedItem && expandedItem.id === item.id}
            onClick={handleCardClick}
            isHovered={hoveredItemId === item.id}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("magic-bento-root"));
root.render(<MagicBentoGrid />);
