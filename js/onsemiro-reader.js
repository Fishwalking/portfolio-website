const rail = document.querySelector(".rail");
const links = [...document.querySelectorAll(".chapters a")];
const chapters = links.map(link => document.getElementById(link.hash.slice(1)));

function markChapter() {
  const inset = getComputedStyle(rail.parentElement).display === "block" ? rail.offsetHeight : 0;
  let active = 0;
  for (let index = 1; index < chapters.length; index++) {
    if (chapters[index].getBoundingClientRect().top > inset + 12) break;
    active = index;
  }
  links.forEach((link, index) => {
    if (index === active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("scroll", markChapter, { passive: true });
window.addEventListener("resize", markChapter);
markChapter();

const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const control = document.querySelector(".motion");
const stills = document.querySelectorAll("source[data-still]");
let paused = preference.matches;
function updateMotion() {
  stills.forEach(source => { source.media = paused ? "all" : "not all"; });
  control.textContent = paused ? "움직임 재생" : "움직임 멈추기";
}
control.addEventListener("click", () => {
  paused = !paused;
  updateMotion();
});
preference.addEventListener("change", event => {
  paused = event.matches;
  updateMotion();
});
updateMotion();
control.hidden = false;
