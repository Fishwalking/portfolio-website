const designViewer = document.getElementById("design-viewer");
const designLinks = [...document.querySelectorAll("#design [data-art-title]")];

if (designViewer && typeof designViewer.showModal === "function") {
  const title = designViewer.querySelector("h2");
  const image = designViewer.querySelector(".design-viewer-image img");
  const original = designViewer.querySelector(".design-original");
  const position = designViewer.querySelector(".design-pages span");
  let current = 0;

  function showArtwork(index) {
    current = (index + designLinks.length) % designLinks.length;
    const link = designLinks[current];
    title.textContent = link.dataset.artTitle;
    image.alt = link.querySelector("img").alt;
    image.src = link.href;
    original.href = link.href;
    position.textContent = `${current + 1} / ${designLinks.length}`;
  }

  designLinks.forEach((link, index) => {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showArtwork(index);
      designViewer.showModal();
    });
  });

  designViewer.querySelectorAll("[data-step]").forEach(button => {
    button.addEventListener("click", () => showArtwork(current + Number(button.dataset.step)));
  });
  designViewer.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showArtwork(current + (event.key === "ArrowLeft" ? -1 : 1));
  });
  designViewer.addEventListener("click", event => {
    if (event.target !== designViewer) return;
    const box = designViewer.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) designViewer.close();
  });
  designViewer.addEventListener("close", () => image.removeAttribute("src"));
}
