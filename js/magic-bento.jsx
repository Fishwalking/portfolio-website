const { useState, useMemo, useEffect } = React;

// 각 아이템의 레이아웃 속성(row/col span)과 데이터를 정의합니다.
const initialGridData = [
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
  const isLink = item.url && !isExpanded && item.type !== "video";
  const TagName = isLink ? "a" : "div";
  const linkProps = isLink
    ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  const getCardContent = () => {
    if (item.type === "video") {
      return (
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
    }
    if (isExpanded) {
      return (
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
    }
    return (
      <div className="card-content-collapsed">
        <span className="card-category">{item.category}</span>
        <h3>{item.title}</h3>
        <p className="card-description">{item.description}</p>
      </div>
    );
  };

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
      {getCardContent()}
    </TagName>
  );
}

function MagicBentoGrid() {
  const [expandedItem, setExpandedItem] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleCardClick = (item) => {
    if (item.type === "video") return;
    setExpandedItem((prev) => (prev && prev.id === item.id ? null : item));
  };

  const handleMouseEnter = (item) => {
    if (!expandedItem) {
      setHoveredItemId(item.id);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItemId(null);
  };

  return (
    <div className="bento-grid-container">
      <div className={`bento-grid ${expandedItem ? "expanded-mode" : ""}`}>
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
