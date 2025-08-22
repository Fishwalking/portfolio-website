// js/dark-veil.js
(() => {
  const veil = document.getElementById("dark-veil");
  if (!veil) return;

  let raf = 0;
  let x = 0.5,
    y = 0.5;

  const apply = () => {
    veil.style.setProperty("--vx", (x * 100).toFixed(2) + "%");
    veil.style.setProperty("--vy", (y * 100).toFixed(2) + "%");
    raf = 0;
  };

  const setFrom = (clientX, clientY) => {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    x = Math.min(1, Math.max(0, clientX / vw));
    y = Math.min(1, Math.max(0, clientY / vh));
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const onMove = (e) => {
    if (e.touches && e.touches[0]) {
      setFrom(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      setFrom(e.clientX, e.clientY);
    }
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  // 처음엔 부드럽게 등장
  veil.classList.add("is-hidden");
  requestAnimationFrame(() => veil.classList.remove("is-hidden"));

  // 포인터가 창을 벗어나면 숨기기
  window.addEventListener("pointerleave", () =>
    veil.classList.add("is-hidden")
  );
  window.addEventListener("pointerenter", () =>
    veil.classList.remove("is-hidden")
  );

  // 접근성/디버그: V 키로 토글
  window.addEventListener("keydown", (e) => {
    if (e.key && e.key.toLowerCase() === "v") {
      veil.classList.toggle("is-hidden");
    }
  });
})();
