const grid = document.querySelector(".project-grid");
const player = document.getElementById("project-player");

if (grid && typeof player?.showModal === "function") {
  const title = player.querySelector("h2");
  const screen = player.querySelector(".project-screen");
  const original = player.querySelector(".project-original");

  grid.addEventListener("click", event => {
    const card = event.target.closest("a[data-project-video]");
    if (!card || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = new URL(card.href).searchParams.get("v");
    if (!id) return;

    event.preventDefault();
    title.textContent = card.querySelector(".project-name").textContent;
    original.href = card.href;
    const video = document.createElement("iframe");
    video.title = title.textContent + " 영상";
    video.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    video.allowFullscreen = true;
    video.referrerPolicy = "strict-origin-when-cross-origin";
    video.src = "https://www.youtube.com/embed/" + encodeURIComponent(id) + "?autoplay=1&mute=1&playsinline=1";
    screen.replaceChildren(video);
    player.showModal();
  });

  player.addEventListener("close", () => screen.replaceChildren());
  player.addEventListener("click", event => {
    if (event.target !== player) return;
    const { left, right, top, bottom } = player.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      player.close();
    }
  });
}
