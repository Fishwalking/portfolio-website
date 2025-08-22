const mount = document.getElementById("aurora");
const indexSec = document.getElementById("index");

if (mount && indexSec) {
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stopForReducedMotion = () => prefersReduced.matches;

  /* ---------- CSS Fallback (랜덤 Web Animations) ---------- */
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }
  function buildCssAurora() {
    mount.classList.add("aurora-css");
    mount.innerHTML = `
            <span class="blob" style="left:-12%; top:-12%; width:58vmax; height:58vmax; background: radial-gradient(35% 35% at 50% 50%, rgba(124,255,103,.9) 0%, rgba(124,255,103,0) 60%);"></span>
            <span class="blob" style="right:-15%; top:-10%; width:62vmax; height:62vmax; background: radial-gradient(35% 35% at 50% 50%, rgba(82,39,255,.9) 0%, rgba(82,39,255,0) 60%);"></span>
            <span class="blob" style="left:5%; bottom:-18%; width:66vmax; height:66vmax; background: radial-gradient(35% 35% at 50% 50%, rgba(255,204,0,.85) 0%, rgba(255,204,0,0) 60%);"></span>
            <span class="blob" style="right:-10%; bottom:-10%; width:56vmax; height:56vmax; background: radial-gradient(35% 35% at 50% 50%, rgba(123,97,255,.8) 0%, rgba(123,97,255,0) 60%);"></span>
          `;
    // WAAPI로 자유분방한 랜덤 모션
    if (!stopForReducedMotion() && "animate" in HTMLElement.prototype) {
      mount.dataset.waapi = "1";
      mount.querySelectorAll(".blob").forEach((el) => wander(el));
    }
    indexSec.classList.add("has-aurora");
  }
  function wander(el) {
    // 랜덤 목표치
    const x = rand(-18, 18);
    const y = rand(-14, 14);
    const s = rand(0.92, 1.12);
    const r = rand(-18, 18);
    const d = rand(6000, 14000);
    // 지속시간 랜덤

    // 현재 상태에서 랜덤 목표까지 갔다가 돌아오도록 2회 반복 후 다음 랜덤 타겟
    const anim = el.animate(
      [
        {
          transform:
            getComputedStyle(el).transform === "none"
              ? "translate(0,0) scale(1) rotate(0deg)"
              : getComputedStyle(el).transform,
        },
        {
          transform: `translate(${x}%, ${y}%) scale(${s}) rotate(${r}deg)`,
        },
      ],
      {
        duration: d,
        direction: "alternate",
        iterations: 2,
        easing: "cubic-bezier(.42,0,.2,1)",
        fill: "forwards",
      }
    );
    anim.onfinish = () => {
      // 다음 랜덤 타겟으로 계속
      requestAnimationFrame(() => wander(el));
    };
  }

  /* ---------- WebGL Aurora (OGL, 랜덤 파라미터 + reseed) ---------- */
  async function initWebGLAurora() {
    // WebGL2 체크
    const gl2ok = !!document.createElement("canvas").getContext("webgl2");
    if (!gl2ok) {
      buildCssAurora();
      return;
    }

    let Renderer, Program, Mesh, Color, Triangle;
    try {
      ({ Renderer, Program, Mesh, Color, Triangle } = await import(
        "https://unpkg.com/ogl@0.0.104/dist/ogl.mjs"
      ));
    } catch {
      buildCssAurora();
      return;
    }

    const VERT = `#version 300 es
            in vec2 position;
            void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

    const FRAG = `#version 300 es
            precision highp float;
            out vec4 fragColor;

            uniform float uTime;
            uniform float uAmplitude;
            uniform vec3  uColorStops[3];
            uniform vec2  uResolution;
            uniform float uBlend;
            // 랜덤 파라미터
            uniform vec3  uSeed;
            uniform vec3  uFreq;
            uniform vec3  uSpeed;
            uniform vec3  uPhase;

            vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x,289.0); }
            float snoise(in vec2 v){
              const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
              vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
              vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
              vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.0);
              vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
              vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
              m*=m; m*=m;
              vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5;
              vec3 ox=floor(x+0.5); vec3 a0=x-ox;
              m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
              vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
              return 130.0*dot(m,g);
            }

            struct ColorStop{ vec3 color; float position; };
            vec3 rampColor(float f){
              ColorStop c0=ColorStop(uColorStops[0],0.0);
              ColorStop c1=ColorStop(uColorStops[1],0.5);
              ColorStop c2=ColorStop(uColorStops[2],1.0);
              vec3 col;
              if (f<=0.5){
                float t=clamp(f/0.5,0.0,1.0);
                col=mix(c0.color,c1.color,t);
              } else {
                float t=clamp((f-0.5)/0.5,0.0,1.0);
                col=mix(c1.color,c2.color,t);
              }
              return col;
            }

            float layerNoise(vec2 uv, float f, float spd, float ph){
              // 시간에 따라 회전 + 쉬프트(자유분방)
              float ang = 0.35*sin(uTime*0.07 + ph + uSeed.x*6.2831);
              mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
              vec2 p = R*(uv - 0.5) + 0.5;
              p += vec2(sin(uTime*0.11 + ph)*0.25, cos(uTime*0.13 + ph)*0.25);
              return snoise(p*f + uTime*spd + vec2(uSeed.y, uSeed.z));
            }

            void main(){
              vec2 uv = gl_FragCoord.xy / uResolution;
              // 여러 레이어를 서로 다른 랜덤 파라미터로 합성
              float n = 0.0;
              n += layerNoise(uv, 1.0 + uFreq.x*2.0, 0.2 + uSpeed.x*0.8, uPhase.x) * 0.6;
              n += layerNoise(uv.yx + uSeed.xy, 2.0 + uFreq.y*3.0, 0.3 + uSpeed.y*1.1, uPhase.y) * 0.3;
              n += layerNoise(uv + uSeed.yz, 4.0 + uFreq.z*4.0, 0.5 + uSpeed.z*1.3, uPhase.z) * 0.2;
              // 리치 효과 + 색 그라데이션
              float ridge = smoothstep(0.0, 1.0, abs(n));
              float intensity = ridge * uAmplitude * 0.55;

              float alpha = smoothstep(0.15 - uBlend*0.5, 0.15 + uBlend*0.5, intensity);
              vec3 col = rampColor(uv.x) * intensity;

              fragColor = vec4(col * alpha, alpha);
            }`;
    // 속도/색/진폭 기본값
    const PARAMS = {
      colorStops: ["#3A29FF", "#FF94B4", "#FF3232"],
      amplitude: 5.0,
      blend: 0.5,
      speed: 10.0, // 전체 시간 스케일
    };
    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";
    mount.appendChild(gl.canvas);

    const geom = new Triangle(gl);
    if (geom.attributes.uv) delete geom.attributes.uv;

    const cStops = PARAMS.colorStops.map((h) => {
      const c = new Color(h);
      return [c.r, c.g, c.b];
    });
    // 초기 랜덤 파라미터
    const randf = (a, b) => a + Math.random() * (b - a);
    const uniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: PARAMS.amplitude },
      uColorStops: { value: cStops },
      uResolution: { value: [mount.offsetWidth, mount.offsetHeight] },
      uBlend: { value: PARAMS.blend },

      uSeed: { value: [Math.random(), Math.random(), Math.random()] },
      uFreq: {
        value: [randf(0.2, 1.2), randf(0.2, 1.2), randf(0.2, 1.2)],
      },
      uSpeed: {
        value: [randf(0.3, 1.1), randf(0.3, 1.1), randf(0.3, 1.1)],
      },
      uPhase: {
        value: [randf(0.0, 6.2831), randf(0.0, 6.2831), randf(0.0, 6.2831)],
      },
    };

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms,
    });
    const mesh = new Mesh(gl, { geometry: geom, program });
    const onResize = () => {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w, h];
    };
    new ResizeObserver(onResize).observe(mount);
    window.addEventListener("resize", onResize, { passive: true });
    onResize();

    let raf = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      program.uniforms.uTime.value = t * 0.001 * PARAMS.speed;
      renderer.render({ scene: mesh });
    };
    const start = () => {
      if (raf || stopForReducedMotion()) return;
      raf = requestAnimationFrame(loop);
      indexSec.classList.add("has-aurora");
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      indexSec.classList.remove("has-aurora");
    };

    // 주기적으로 파라미터 재시드 -> 자유분방한 변화
    function reseed() {
      program.uniforms.uSeed.value = [
        Math.random(),
        Math.random(),
        Math.random(),
      ];
      program.uniforms.uFreq.value = [
        randf(0.2, 1.4),
        randf(0.2, 1.6),
        randf(0.2, 1.8),
      ];
      program.uniforms.uSpeed.value = [
        randf(0.25, 1.2),
        randf(0.25, 1.3),
        randf(0.25, 1.4),
      ];
      program.uniforms.uPhase.value = [
        randf(0, 6.2831),
        randf(0, 6.2831),
        randf(0, 6.2831),
      ];
    }
    const reseedTimer = setInterval(reseed, 12000);
    // 첫 섹션 가시성에 따라 on/off
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          e.isIntersecting && !stopForReducedMotion() ? start() : stop()
        );
      },
      { threshold: 0.5 }
    );
    io.observe(indexSec);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
    prefersReduced.addEventListener?.("change", () => {
      stop();
      start();
    });
    if (!stopForReducedMotion()) start();
    else indexSec.classList.remove("has-aurora");
  }

  /* 실행 */
  (async () => {
    try {
      await initWebGLAurora();
    } catch (e) {
      // 어떤 이유로든 실패하면 CSS 폴백
      buildCssAurora();
    }
  })();
}
