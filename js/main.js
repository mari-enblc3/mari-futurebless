(() => {
  const S = window.SITE;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const page = document.body.dataset.page;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduce;
  if (!motion) root.classList.remove("js");

  const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // 이미지는 로컬(assets/img): 큰 화면용 2000px, 목록·갤러리용 900px 썸네일(sm)
  const src = (m, w = 1600) => (w <= 900 ? `assets/img/sm/${m[0]}.jpg` : `assets/img/${m[0]}.jpg`);
  const ar = (m) => (m[2] / m[3]).toFixed(4);
  const pad2 = (n) => String(n).padStart(2, "0");
  const all = [
    ...S.official.map((p) => ({ ...p, group: "Official" })),
    ...S.speculative.map((p) => ({ ...p, group: "Industrial" })),
    ...(S.artwork || []).map((p) => ({ ...p, group: "Artwork" })),
  ];
  const galleryHidden = new Set(S.galleryHidden || []);
  const home = page === "home" ? "" : "index.html";

  /* ---------------- render ---------------- */

  function chrome() {
    document.body.insertAdjacentHTML("afterbegin", `
      <div class="loader" aria-hidden="true">
        <div class="loader__top"><span>${esc(S.studio)}</span><span>Seoul</span></div>
        <div class="loader__num">000</div>
      </div>
      <header class="hdr">
        <a class="brand" href="${home || "#top"}" data-nav>${esc(S.name)}<small>${esc(S.studio)}</small></a>
        <div class="hdr__r">
          <span class="clock">Seoul <b class="clock__t">--:--</b> <span>(UTC+9)</span></span>
          <button class="theme" type="button" aria-label="Toggle theme" data-magnetic>
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor"/><path d="M8 1a7 7 0 0 1 0 14z" fill="currentColor"/></svg>
          </button>
        </div>
      </header>
      <nav class="dock" aria-label="Primary">
        <span class="dock__ind"></span>
        <a href="${home}#official" data-sec="official" data-nav>Official</a>
        <a href="${home}#speculative" data-sec="speculative" data-nav>Speculative</a>
        <a href="${home}#index" data-sec="index" data-nav>Index</a>
        <a href="${home}#about" data-sec="about" data-nav>About</a>
        <a href="${home}#gallery" data-sec="gallery" data-nav>Gallery</a>
        <a href="${home}#contact" data-sec="contact" data-nav>Contact</a>
      </nav>`);
    document.body.insertAdjacentHTML("beforeend", `
      <footer class="ftr" id="contact">
        <span class="label">Have a brand that needs a world?</span><br>
        <a class="cta" href="mailto:${esc(S.email)}" data-copy="${esc(S.email)}" data-cursor="view" data-cursor-label="Copy">Let’s make it<br><em>blessed.</em><span class="cta__arrow" aria-hidden="true">↗</span></a>
        <div class="ftr__grid">
          <div><span class="label">Contact</span><p><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></p></div>
          <div><span class="label">Follow</span>${S.instagram.map(([n, u]) => `<p><a href="${u}" target="_blank" rel="noopener">${esc(n)} ↗</a></p>`).join("")}</div>
          <div><span class="label">Based in</span><p>Seoul, Korea</p><p class="clock__t">--:--</p></div>
          <div><span class="label">Last updated</span><p>${esc(S.updated)}</p></div>
        </div>
        <div class="ftr__bottom"><span>© ${new Date().getFullYear()} J. A. Mari Lee</span><button type="button" class="totop" data-magnetic>Back to top ↑</button></div>
      </footer>
      <div class="cursor is-out" aria-hidden="true"></div>`);
  }

  function card(p, i, n) {
    return `
      <a class="card" href="project.html?p=${p.slug}" style="--ar:${ar(p.cover)}" data-slug="${p.slug}" data-cursor="view">
        <div class="card__media"><img src="${src(p.cover, 2000)}" alt="${esc(p.title)}" decoding="async"></div>
        <span class="card__no">${pad2(i + 1)} / ${pad2(n)}</span>
        <div class="card__info">
          <h3 class="card__title">${esc(p.title)}${p.wip ? ` <em class="wip">(WIP)</em>` : ""}</h3>
          <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        </div>
      </a>`;
  }

  function tile(p, i, prefix) {
    return `
      <a class="tile" href="project.html?p=${p.slug}" data-slug="${p.slug}" data-cursor="view">
        <div class="tile__media" style="--ar:${ar(p.cover)}"><img src="${src(p.cover, 900)}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div>
        <div class="tile__cap"><span>${esc(p.title)}</span><span class="label">${prefix}—${pad2(i + 1)}</span></div>
      </a>`;
  }

  // 3단 패럴랙스 컬럼으로 나눠 담기
  function specGrid(list, prefix, key, on) {
    const cols = [[], [], []];
    list.forEach((p, i) => cols[i % 3].push(tile(p, i, prefix)));
    return `<div class="spec__grid" data-grid="${key}"${on ? "" : " hidden"}>${cols.map((c) => `<div class="spec__col">${c.join("")}</div>`).join("")}</div>`;
  }

  const media = (m) => m[4]
    ? `<video src="assets/video/${m[0]}.mp4" muted loop playsinline autoplay preload="metadata"></video>`
    : `<img src="${src(m)}" alt="" loading="lazy" decoding="async">`;
  // 2단 그리드에서 짝 없이 혼자 남는 세로 이미지(묶음 끝이거나 바로 다음이 가로)는 가운데 정렬.
  // "three" 묶음은 태블릿부터 3단 — 줄 끝에 1~2장 남으면 그것도 가운데로 (o3a: 한 장, o3b: 두 장 중 첫 장)
  // "two" 묶음은 가로 이미지도 한 줄을 다 쓰지 않고 2장씩
  function galleryGroup(v, kind) {
    const wide = v.map((m) => kind !== "two" && m[2] > m[3]);
    const cls = wide.map((w) => (w ? ["wide"] : []));
    const runs = [[]];
    v.forEach((m, k) => (wide[k] ? runs.push([]) : runs.at(-1).push(k)));
    runs.forEach((r) => {
      if (r.length % 2) cls[r.at(-1)].push("solo");
      if (kind !== "three") return;
      const left = r.length % 3;
      if (left === 1) cls[r.at(-1)].push("o3a");
      if (left === 2) cls[r.at(-2)].push("o3b");
    });
    return `<section class="gallery${kind === "three" ? " gallery--3" : ""}">${v.map((m, k) => `<div class="tile__media ${cls[k].join(" ")}" style="--ar:${ar(m)}">${media(m)}</div>`).join("")}</section>`;
  }
  // 무드보드: 작은 원본 이미지를 비율 그대로 벤토 보드에 (열 배치는 board()가 화면 단계별로)
  const boardGroup = (v) => `<section class="board">${v.map((m) => `<div class="tile__media" style="--ar:${ar(m)}">${media(m)}</div>`).join("")}</section>`;
  const paras = (t) => t.split("\n").filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");

  function yearBlock([year, lines]) {
    const count = lines.filter((l) => !l.startsWith("→")).length;
    const rows = lines.map((l) => {
      if (l.startsWith("→")) return `<li class="row row--note">${esc(l)}</li>`;
      const [, m, rest] = l.match(/^(\S+)\s+(.*)$/);
      const cut = rest.lastIndexOf(", ");
      return `<li class="row"><span class="m">${esc(m)}</span><span class="t">${esc(rest.slice(0, cut))}</span><span class="c">${esc(rest.slice(cut + 2))}</span></li>`;
    });
    return `<div class="yr"><div class="yr__label">${year}<sup>${pad2(count)}</sup></div><ol class="yr__list">${rows.join("")}</ol></div>`;
  }

  function renderHome() {
    const art = S.artwork || [];
    const recent = S.timeline.slice(0, 3), archive = S.timeline.slice(3);
    const total = S.timeline.reduce((n, [, l]) => n + l.filter((x) => !x.startsWith("→")).length, 0);

    $("#app").innerHTML = `
      <section class="hero" id="top">
        <div class="hero__inner">
          <h1 class="hero__lead" data-split="intro"><span class="dim">${[].concat(S.hero.lead).map(esc).join("<br>")}</span><br>${esc(S.hero.sub)}</h1>
          <div class="hero__meta" data-intro>
            <div><span class="label">Worked with</span><p>Beauty of Joseon<br><span class="nb">LIONAT (for Yeonkoung Kim 김연경)</span></p></div>
            <div><span class="label">Services</span><p><span class="nb">Brand eXperience, Creative &amp; Art Direction,</span><br>Strategy</p></div>
            <div><span class="label">Now</span><p>Based in Seoul.<br>Open for new projects.</p></div>
            <div><span class="label">Scroll</span><p>↓</p></div>
          </div>
        </div>
        <h2 class="mark" role="img" aria-label="Future Bless Studio®"></h2>
      </section>

      <div class="sec-intro" id="official">
        <h2 class="display" data-drift>Official<span class="display__n">(${pad2(S.official.length)})</span></h2>
      </div>
      <section class="work">
        <div class="work__pin">
          <div class="work__viewport"><div class="work__track">${S.official.map((p, i) => card(p, i, S.official.length)).join("")}</div></div>
          <div class="work__foot"><span class="work__counter">01 / ${pad2(S.official.length)}</span><div class="work__bar"><i></i></div><a href="#index" data-nav>Full index ↓</a></div>
        </div>
      </section>

      <section class="spec">
        <div class="sec-intro" id="speculative" style="padding-top:14vh">
          <h2 class="display" data-drift="rev">Speculative<span class="display__n">(${pad2(S.speculative.length + art.length)})</span></h2>
        </div>
        <div class="spec__tabs" role="tablist">
          <button class="spec__tab is-on" type="button" role="tab" aria-selected="true" data-tab="industrial">Industrial <span class="label">${pad2(S.speculative.length)}</span></button>
          <button class="spec__tab" type="button" role="tab" aria-selected="false" data-tab="artwork">Artwork <span class="label">${pad2(art.length)}</span></button>
        </div>
        ${specGrid(S.speculative, "I", "industrial", true)}
        ${specGrid(art, "A", "artwork", false)}
      </section>

      <section class="idx" id="index">
        <div class="sec-head"><span>Index — every project since 2018</span><span class="label">${total}</span></div>
        ${recent.map(yearBlock).join("")}
        <div class="idx__more">${archive.map(yearBlock).join("")}</div>
        <button class="idx__toggle" type="button" data-magnetic><i>+</i><span>Show archive ${archive.at(-1)[0]}–${archive[0][0]}</span></button>
      </section>

      <section class="about" id="about">
        <div class="sec-head"><span>About</span><span class="label">${esc(S.studio)}</span></div>
        <p class="about__lead" data-scrub>${esc(S.about)}</p>
        ${S.aboutBody ? `<p class="about__body" data-reveal>${esc(S.aboutBody)}</p>` : ""}
        ${S.method ? `
        <div class="method" data-reveal>
          <div class="method__head"><span class="label">Method</span><h3 class="method__title">${esc(S.method.title)}</h3><p>${esc(S.method.intro)}</p></div>
          <ol class="method__steps">${S.method.steps.map(([t, d], i) => `<li><span class="label">${pad2(i + 1)}</span><h4>${esc(t)}</h4><p>${esc(d)}</p></li>`).join("")}</ol>
          <p class="method__outro">${esc(S.method.outro)}</p>
        </div>` : ""}
        <div class="about__cols" data-reveal>
          <div><h3>Services</h3>${S.services.map(([g, l]) => `<ul><li>${g}</li>${l.map((x) => `<li class="label" style="font-size:14px">${esc(x)}</li>`).join("")}</ul>`).join("")}</div>
          <div><h3>Selected clients</h3><ul>${S.clients.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
          <div><h3>Featured</h3><ul>${S.features.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)} ↗</a></li>`).join("")}</ul></div>
          <div><h3>Experience</h3><ul>
            <li>Treeside Inc.<br><span class="label" style="font-size:14px">Designer, 2025</span></li>
            <li class="sub">Just Music · Indigo Music<br>A&amp;R, 2022</li>
            <li class="sub">Mine Field Entertainment<br>A&amp;R, 2022</li>
            <li class="sub">Vision Agency by Visla<br>Team member, 2022</li>
          </ul></div>
        </div>
      </section>

      <section class="gal" id="gallery">
        <div class="sec-head"><span>Gallery — drag to spin</span><span class="label">${galleryPool().length} images</span></div>
        <div class="gal__stage" data-cursor="view" data-cursor-label="Drag"></div>
      </section>`;
  }

  function renderProject() {
    const slug = new URLSearchParams(location.search).get("p");
    const p = all.find((x) => x.slug === slug) || all[0];
    const list = all.filter((x) => x.group === p.group);
    const i = list.indexOf(p);
    const next = list[(i + 1) % list.length];
    document.title = `${p.title} — J. A. Mari Lee`;
    // 원본 상세 페이지(js/pages.js): 첫 텍스트는 소개, 이후 이미지 묶음과 그 아래 캡션
    const pg = (window.PAGES || {})[p.page || p.slug];
    const body = pg ? pg.body.map((b) => [...b]) : [];
    const intro = body[0]?.[0] === "t" ? body.shift()[1] : p.desc || "";
    const type = p.group === "Official" ? "Commission" : `Speculative — ${p.group}`;
    const back = p.group === "Official" ? "official" : "speculative";

    $("#app").innerHTML = `
      <section class="proj__head">
        <div class="proj__top label"><a class="proj__close" href="index.html#${back}" data-magnetic>← Close</a><span>${p.group} — ${pad2(i + 1)} / ${pad2(list.length)}</span></div>
        <h1 class="proj__title" data-split="intro">${esc(p.title)}</h1>
        <div class="proj__info" data-intro>
          <div><span class="label">Client</span><p>${esc(p.client || "Self-initiated")}</p></div>
          <div><span class="label">Date</span><p>${esc(pg?.date || p.year || "—")}</p></div>
          <div><span class="label">Services</span><p>${esc(p.tags ? p.tags.join(", ") : "—")}</p></div>
          <div><span class="label">Type</span><p>${type}${p.wip ? " · WIP" : ""}</p></div>
        </div>
        ${intro ? `<div class="proj__intro" data-intro>${paras(intro)}</div>` : ""}
      </section>
      <figure class="proj__hero"><div class="proj__hero-in" style="--ar:${ar(p.cover)}"><img src="${src(p.cover, 2400)}" alt="${esc(p.title)}" style="view-transition-name:hero"></div></figure>
      ${body.map(([t, v, kind]) => t === "g"
        ? (kind === "board" ? boardGroup(v) : galleryGroup(v, kind))
        : `<div class="proj__cap">${paras(v)}</div>`).join("")}
      ${p.wip ? `<p class="soon">Work in progress.</p>` : ""}
      <a class="next" href="project.html?p=${next.slug}" data-cursor="view" data-cursor-label="Next">
        <span class="label">Next project</span>
        <span class="next__title">${esc(next.title)}</span>
        <span class="next__img" style="--ar:${ar(next.cover)}"><img src="${src(next.cover, 800)}" alt=""></span>
      </a>`;
  }

  /* ---------------- text splitting ---------------- */

  function splitWords(el) {
    const out = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment(), ws = [];
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(" ");
          const w = document.createElement("span"), wi = document.createElement("span");
          w.className = "w"; wi.className = "wi"; wi.textContent = part;
          w.append(wi); frag.append(w); out.push(wi); ws.push(w);
        });
        // 마지막 두 단어는 묶어서 한 단어만 다음 줄로 떨어지지 않게
        if (ws.length >= 2) {
          const nb = document.createElement("span");
          nb.className = "nb";
          ws.at(-2).before(nb);
          nb.append(ws.at(-2), " ", ws.at(-1));
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(el);
    return out;
  }

  /* ---------------- gallery ---------------- */

  // 같은 파일이 다른 해시로 두 번 올라간 경우가 있어 파일명+크기로 중복 제거
  const galleryPool = () => {
    const all = [...S.official.flatMap((p) => [p.cover, ...(p.images || [])]), ...S.speculative.map((p) => p.cover), ...(S.specArchive || [])];
    const seen = new Set();
    return all.filter((m) => { const k = `${m[1]}|${m[2]}x${m[3]}`; return !galleryHidden.has(m[1]) && !seen.has(k) && seen.add(k); });
  };

  // 사이트 이미지를 3D 구 위에 랜덤 배치. 항상 정면을 보고, 가까울수록 크게. 마우스·터치 드래그로 회전(관성 포함)
  function gallery() {
    const stage = $(".gal__stage");
    if (!stage) return;
    const pool = galleryPool();
    for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const N = pool.length, GOLD = Math.PI * (3 - Math.sqrt(5));
    const items = pool.map((m, i) => {
      // 피보나치 구: 점들이 구 표면에 고르게 퍼지도록
      const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = i * GOLD;
      const el = document.createElement("div");
      el.className = "gal__item";
      el.style.setProperty("--ar", ar(m));
      el.innerHTML = `<img src="${src(m, 500)}" alt="" loading="lazy" decoding="async" draggable="false">`;
      stage.append(el);
      return { el, m, img: $("img", el), p: [Math.cos(th) * r, y, Math.sin(th) * r], s: 0.9 + Math.random() * 0.2, d: i / N, b: 0, ratio: m[2] / m[3] };
    });

    // 회전은 행렬로 누적: 화면 기준 x·y축 회전을 앞에 곱해서 어느 방향이든 손으로 굴리는 느낌
    let M = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const rot = (ax, ay) => {
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      const Rm = [cy, 0, sy, sx * sy, cx, -sx * cy, -cx * sy, sx, cx * cy];
      const o = [];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) o[a * 3 + b] = Rm[a * 3] * M[b] + Rm[a * 3 + 1] * M[3 + b] + Rm[a * 3 + 2] * M[6 + b];
      M = o;
    };

    let W = 0, H = 0, RX = 0, RY = 0, base = 0, frontW = 0, vx = 0, vy = reduce ? 0 : 0.06, drag = null, intro = 0, raf = 0, visible = false, idle = 0, focus = 0;
    const layout = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      // 이미지 수가 늘면 구 표면이 붐비지 않게 카드 크기를 줄임 (30장 기준)
      base = Math.max(40, Math.min(130, Math.min(W, H) * 0.12 * Math.sqrt(30 / N)));
      // 원근으로 가장 멀리 튀어나오는 점이 반지름의 약 1.24배 → 그만큼 줄여 무대 안에 꽉 차게.
      // 가로·세로는 따로 맞추되 너무 납작해지지 않게 1.6배까지만 차이
      const fx = (W / 2 - base * 0.85) / 1.24, fy = (H / 2 - base * 1.15) / 1.24;
      RX = Math.min(fx, fy * 1.6); RY = Math.min(fy, fx * 1.6);
      // 카드는 '메인일 때 크기'로 그려두고 축소만 함 → 작은 걸 확대해서 생기는 흐림 없음
      frontW = Math.min(W * 0.62, H * 0.5);
      items.forEach((it) => {
        it.big = Math.min(frontW, H * 0.7 * it.ratio);
        it.el.style.width = it.big + "px";
      });
    };
    const back = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

    const tick = () => {
      let sx = 0, sy = 0;
      // 1) 회전 결과 계산 + 가장 앞(Z 최대) 이미지 찾기
      const P = items.map((it) => {
        const [x, y, z] = it.p;
        return [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z];
      });
      let fi = 0;
      P.forEach((q, i) => { if (q[2] > P[fi][2]) fi = i; });
      const fp = P[fi];

      // 2) 드래그·관성·스냅
      if (drag) {
        vx = vx * 0.4 + drag.ax * 0.6; vy = vy * 0.4 + drag.ay * 0.6;
        drag.ax = drag.ay = 0;
        idle = 0;
      } else {
        vx *= 0.92; vy *= 0.92;
        // 거의 멈추면 가장 앞 이미지를 정중앙으로 끌어옴
        if (Math.hypot(vx, vy) < 0.012) {
          sx = Math.atan2(fp[1], fp[2]) * 0.14;
          sy = -Math.atan2(fp[0], fp[2]) * 0.14;
          // 한동안 그대로 두면 다음 이미지로 살짝 넘김
          if (!reduce && ++idle > 260) { idle = 0; vy = 0.05; }
        }
      }
      rot(vx + sx, vy + sy);
      // 멈춰서 메인으로 놓였을 때만 크게: 움직이는 동안엔 0으로 돌아감
      focus += ((!drag && Math.hypot(vx, vy) < 0.015 ? 1 : 0) - focus) * 0.12;
      intro = Math.min(1, intro + 0.014);

      // 3) 그리기: 나머지는 원래 크기 그대로, 메인 한 장만 무대 절반 크기까지 키움
      items.forEach((it, i) => {
        const [X, Y, Z] = P[i];
        const s = 1.7 / (1.7 - Z);
        it.b += ((i === fi ? focus : 0) - it.b) * 0.15;
        // 화면에 보일 폭: 평소엔 원근 크기, 메인이 되면 it.big까지 (축소 배율 = 보일 폭 / 실제 폭)
        const small = base * it.s * s;
        const shown = small + (it.big - small) * Math.max(0, it.b);
        const k = reduce ? 1 : back(Math.max(0, Math.min(1, (intro - it.d * 0.5) / 0.5)));
        it.el.style.transform = `translate3d(${W / 2 + X * RX * s * (1 - it.b)}px, ${H / 2 + Y * RY * s * (1 - it.b)}px, 0) scale(${(shown / it.big) * k}) translate(-50%, -50%)`;
        it.el.style.zIndex = 1000 + Math.round(Z * 500) + (it.b > 0.02 ? 2000 : 0);
        it.el.style.opacity = it.b > 0.02 ? 1 : 0.55 + 0.45 * ((Z + 1) / 2);
        // 메인이 되면 고해상도로 교체(미리 받아두고 바꿔서 깜빡임 없음)
        if (!it.hi && it.b > 0.2) {
          it.hi = true;
          const im = new Image();
          im.src = src(it.m, 1400);
          im.decode().then(() => (it.img.src = im.src)).catch(() => {});
        }
      });
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    // 화면에 보일 때만 그리기
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { layout(); raf = requestAnimationFrame(tick); }
    }).observe(stage);
    addEventListener("resize", layout);

    const K = 0.0038;
    stage.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, ax: 0, ay: 0 };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-drag");
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.ay += (e.clientX - drag.x) * K;
      drag.ax -= (e.clientY - drag.y) * K;
      drag.x = e.clientX; drag.y = e.clientY;
    });
    const end = () => { drag = null; stage.classList.remove("is-drag"); };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  /* ---------------- shared behaviour ---------------- */

  // Speculative: 원본 사이트처럼 Industrial / Artwork 탭으로 구분
  function specTabs() {
    const tabs = $$(".spec__tab");
    tabs.forEach((b) => b.addEventListener("click", () => {
      tabs.forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-selected", x === b); });
      $$(".spec__grid").forEach((g) => (g.hidden = g.dataset.grid !== b.dataset.tab));
      window.ScrollTrigger?.refresh();
    }));
  }

  // 커서·탭 라벨: 사이트 폰트 그대로의 작은 VIEW 알약. 따라올 때 속도만큼 살짝 기울었다가 복귀
  function viewLabel() {
    const el = document.createElement("div");
    el.className = "vlabel";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<span class="vlabel__p"><span class="vlabel__t">View</span><i class="vlabel__bar"></i></span>`;
    document.body.append(el);
    const t = $(".vlabel__t", el), bar = $(".vlabel__bar", el);
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    const rTo = gsap.quickTo(el, "rotation", { duration: 0.7, ease: "elastic.out(1, 0.5)" });
    let lx = 0, settle = 0;
    return {
      move(x, y, jump) {
        if (jump) gsap.set(el, { x, y, rotation: 0 });
        else {
          xTo(x); yTo(y);
          rTo(Math.max(-14, Math.min(14, (x - lx) * 0.8)));
          clearTimeout(settle);
          settle = setTimeout(() => rTo(0), 90);
        }
        lx = x;
      },
      show(text = "View") { t.textContent = text; el.classList.add("is-on"); },
      hide() { el.classList.remove("is-on", "is-press"); },
      press(down) { el.classList.toggle("is-press", down); },
      // 모바일 로딩: 라벨 아래 얇은 선이 채워짐
      load(ms) {
        bar.style.transition = "none";
        bar.style.transform = "scaleX(0)";
        bar.offsetWidth;
        bar.style.transition = `transform ${ms}ms cubic-bezier(.6,0,.2,1)`;
        bar.style.transform = "scaleX(1)";
      },
    };
  }

  // 터치 기기: 탭하면 이미지가 블러되고 VIEW 라벨의 로딩선이 채워진 뒤 이동
  function tapLoad(vfx) {
    if (fine) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-slug], .next");
      if (!a || a.classList.contains("is-loading")) return;
      e.preventDefault();
      a.classList.add("is-loading");
      vfx.move(e.clientX, e.clientY, true);
      vfx.show("View");
      vfx.load(560);
      setTimeout(() => (location.href = a.href), 720);
    });
    addEventListener("pageshow", () => {
      $$(".is-loading").forEach((a) => a.classList.remove("is-loading"));
      vfx.hide();
    });
  }

  // 호버 시 위아래로 블러 교체되는 라벨 (CSS .sw)
  function swapLabels() {
    $$(".dock a, .totop, .proj__close, .work__foot a, .ftr__grid a, .about__cols a").forEach((el) => {
      const t = esc(el.textContent);
      el.innerHTML = `<span class="sw"><span>${t}</span><span aria-hidden="true">${t}</span></span>`;
    });
  }

  function clock() {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
    const tick = () => $$(".clock__t").forEach((el) => (el.textContent = f.format(new Date())));
    tick();
    setInterval(tick, 10000);
  }

  function theme() {
    $(".theme").addEventListener("click", (e) => {
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      const apply = () => {
        root.dataset.theme = dark ? "light" : "dark";
        try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
      };
      if (!document.startViewTransition || reduce) return apply();
      const { clientX: x, clientY: y } = e;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("theme-vt");
      const vt = document.startViewTransition(apply);
      vt.ready.then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 800, easing: "cubic-bezier(.7,0,.1,1)", pseudoElement: "::view-transition-new(root)" },
      )).catch(() => {});
      vt.finished.finally(() => root.classList.remove("theme-vt"));
    });
  }

  function cursor(vfx) {
    const c = $(".cursor");
    if (!fine) return c.remove();
    const xTo = gsap.quickTo(c, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(c, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); vfx.move(e.clientX, e.clientY); c.classList.remove("is-out"); });
    root.addEventListener("mouseleave", () => { c.classList.add("is-out"); vfx.hide(); });
    document.addEventListener("pointerover", (e) => {
      const v = e.target.closest("[data-cursor]");
      const l = e.target.closest("a, button");
      c.classList.toggle("is-view", !!v);
      c.classList.toggle("is-link", !v && !!l);
      v ? vfx.show(v.dataset.cursorLabel || "View") : vfx.hide();
    });
    addEventListener("pointerdown", () => vfx.press(true));
    addEventListener("pointerup", () => vfx.press(false));
  }

  // 푸터 CTA: 메일 창 대신 주소를 복사하고 커서 라벨을 Copied로 (복사가 막히면 원래 mailto로)
  function copyMail(vfx) {
    $$("[data-copy]").forEach((a) => {
      let t = 0;
      a.addEventListener("click", (e) => {
        if (!navigator.clipboard) return;
        e.preventDefault();
        navigator.clipboard.writeText(a.dataset.copy).then(() => {
          a.dataset.cursorLabel = "Copied";
          if (!fine) vfx.move(e.clientX, e.clientY, true);
          vfx.show("Copied");
          clearTimeout(t);
          t = setTimeout(() => { a.dataset.cursorLabel = "Copy"; fine && a.matches(":hover") ? vfx.show("Copy") : vfx.hide(); }, 1600);
        }, () => (location.href = a.href));
      });
      a.addEventListener("pointerleave", () => { clearTimeout(t); a.dataset.cursorLabel = "Copy"; });
    });
  }

  function magnetic() {
    if (!fine || !motion) return;
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  function dock() {
    const ind = $(".dock__ind");
    const set = (a) => {
      $$(".dock a").forEach((x) => x.classList.toggle("is-active", x === a));
      if (!a) return (ind.style.width = "0px");
      ind.style.width = a.offsetWidth + "px";
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    if (page !== "home") return set(null);
    // 섹션 순서대로 마지막으로 화면 중앙을 지난 섹션을 활성화
    const secs = $$(".dock a").map((a) => [a, document.getElementById(a.dataset.sec)]);
    const update = () => {
      let cur = null;
      secs.forEach(([a, el]) => { if (el.getBoundingClientRect().top < innerHeight * 0.5) cur = a; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs.at(-1)[0];
      if (cur !== update.cur) { update.cur = cur; set(cur); }
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", () => { update.cur = undefined; update(); });
    update();
  }

  let lenis = null;
  function smooth() {
    if (!motion || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function headerAutoHide() {
    const hdr = $(".hdr");
    let last = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      hdr.classList.toggle("is-hidden", y > last && y > 240);
      last = y;
    }, { passive: true });
  }

  function anchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href*='#']");
      if (!a || page !== "home") return;
      const id = a.getAttribute("href").split("#")[1];
      const el = id ? document.getElementById(id) : null;
      if (!el && id !== "top") return;
      e.preventDefault();
      const target = id === "top" ? 0 : el;
      lenis ? lenis.scrollTo(target, { duration: 1.6 }) : (id === "top" ? scrollTo(0, 0) : el.scrollIntoView());
      history.replaceState(null, "", "#" + id);
    });
    $(".totop").addEventListener("click", () => (lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo(0, 0)));
    $(".brand").addEventListener("click", (e) => {
      if (page !== "home") return;
      e.preventDefault();
      lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo(0, 0);
    });
  }

  // 카드 이미지를 다음 페이지 히어로로 이어지게(공유 요소 전환)
  function morphLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-slug]");
      if (!a || e.metaKey || e.ctrlKey) return;
      const img = $("img", a);
      if (img) img.style.viewTransitionName = "hero";
      try { sessionStorage.setItem("morph", a.dataset.slug); } catch (_) {}
    });
    addEventListener("pageshow", () => $$("[data-slug] img").forEach((i) => (i.style.viewTransitionName = "")));
    // 탭이 백그라운드일 때 브라우저가 전환을 건너뛰면 나는 콘솔 에러 방지
    const quiet = (e) => ["ready", "finished", "updateCallbackDone"].forEach((k) => e.viewTransition?.[k]?.catch(() => {}));
    addEventListener("pagereveal", quiet);
    addEventListener("pageswap", quiet);
  }

  /* ---------------- motion ---------------- */

  const blurIn = { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "expo.out" };
  const blurOut = { yPercent: 45, opacity: 0, filter: "blur(12px)" };

  function reveals() {
    $$("[data-split]:not([data-split=intro])").forEach((el) => {
      const words = splitWords(el);
      gsap.set(el, { opacity: 1 });
      gsap.set(words, blurOut);
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => gsap.to(words, { ...blurIn, stagger: 0.02 }) });
    });
    gsap.set("[data-reveal]", { opacity: 0, y: 30, filter: "blur(10px)" });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%", once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "expo.out", stagger: 0.08 }),
    });
  }

  function introHome() {
    const lead = $(".hero__lead");
    const words = splitWords(lead);
    gsap.set(lead, { opacity: 1 });
    gsap.set(words, blurOut);
    gsap.set(".mark", { opacity: 0, y: 40, filter: "blur(18px)" });
    gsap.set("[data-intro], .dock", { opacity: 0, y: 20 });
    gsap.set(".hdr", { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    const loader = $(".loader");
    let seen = false;
    try { seen = !!sessionStorage.getItem("seen"); sessionStorage.setItem("seen", "1"); } catch (_) {}
    if (!seen) {
      const num = $(".loader__num"), o = { v: 0 };
      tl.to(o, { v: 100, duration: 1.8, ease: "power3.inOut", onUpdate: () => (num.textContent = String(Math.round(o.v)).padStart(3, "0")) })
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" })
        .set(loader, { display: "none" });
    } else loader.remove();

    tl.to(".mark", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6 }, seen ? 0 : "-=0.55")
      .to(words, { ...blurIn, stagger: 0.025 }, "<0.2")
      .to("[data-intro]", { opacity: 1, y: 0, duration: 1.2 }, "<0.4")
      .to(".hdr", { opacity: 1, duration: 1.2, clearProps: "opacity" }, "<")
      .to(".dock", { opacity: 1, y: 0, duration: 1.2, clearProps: "transform" }, "<0.1");

    gsap.to(".hero__inner", { opacity: 0, y: -80, filter: "blur(8px)", ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "70% top", scrub: true } });
  }

  function drift() {
    $$("[data-drift]").forEach((el) => {
      const dir = el.dataset.drift === "rev" ? -1 : 1;
      // 왼쪽으로는 넘어가지 않게 0~6% 범위에서만 이동
      gsap.fromTo(el, { xPercent: dir > 0 ? 6 : 0 }, { xPercent: dir > 0 ? 0 : 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  function official() {
    const n = S.official.length;
    const counter = $(".work__counter"), bar = $(".work__bar i");
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const track = $(".work__track"), vp = $(".work__viewport");
      const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".work", start: "top top", end: () => "+=" + dist() * 1.1, pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (s) => {
            bar.style.transform = `scaleX(${s.progress})`;
            counter.textContent = `${pad2(Math.round(s.progress * (n - 1)) + 1)} / ${pad2(n)}`;
          },
        },
      });
      $$(".card").forEach((card, i) => {
        gsap.fromTo($("img", card), { xPercent: -4 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        if (i === 0) return;
        gsap.fromTo(card, { scale: 0.82, rotate: 2.5, borderRadius: 40 }, { scale: 1, rotate: 0, borderRadius: 18, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "left 35%", scrub: true } });
      });
    });
    mm.add("(max-width: 767px)", () => {
      const vp = $(".work__viewport");
      const onScroll = () => {
        const p = vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth);
        bar.style.transform = `scaleX(${p})`;
        counter.textContent = `${pad2(Math.round(p * (n - 1)) + 1)} / ${pad2(n)}`;
      };
      vp.addEventListener("scroll", onScroll, { passive: true });
      return () => vp.removeEventListener("scroll", onScroll);
    });
    // 섹션에 들어올 때 카드들이 아래에서 올라옴
    gsap.from(".card", { yPercent: 18, opacity: 0, duration: 1.4, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".work", start: "top 75%", once: true } });
  }

  function speculative() {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      $$(".spec__grid").forEach((grid) => {
        [-8, 6, -16].forEach((v, i) => {
          gsap.fromTo($$(".spec__col", grid)[i], { y: () => (-v * innerHeight) / 100 }, { y: () => (v * innerHeight) / 100, ease: "none", scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
        });
      });
    });
    clipReveal(".spec .tile__media");
  }

  // 패럴랙스 컬럼 안에서도 실제 화면 위치 기준으로 열리도록 IntersectionObserver 사용
  function clipReveal(sel) {
    const io = new IntersectionObserver((entries) => entries.forEach(({ isIntersecting, target: m }) => {
      if (!isIntersecting) return;
      io.unobserve(m);
      gsap.to(m, { clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.4, ease: "expo.inOut" });
      gsap.to($("img, video", m), { scale: 1, duration: 1.8, ease: "expo.out", delay: 0.1, clearProps: "transform" });
    }), { rootMargin: "0px 0px -8% 0px" });
    $$(sel).forEach((m) => {
      gsap.set(m, { clipPath: "inset(100% 0% 0% 0% round 14px)" });
      gsap.set($("img, video", m), { scale: 1.35 });
      io.observe(m);
    });
  }

  function index() {
    const rows = () => $$(".idx .row");
    gsap.set(rows(), { opacity: 0, y: 18, filter: "blur(6px)" });
    ScrollTrigger.batch(".idx .yr__list > .row", {
      start: "top 94%", once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", stagger: 0.035, clearProps: "opacity,filter,transform" }),
    });
    $$(".yr__label").forEach((l) => gsap.from(l, { opacity: 0, x: -30, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: l, start: "top 90%", once: true } }));

    const more = $(".idx__more"), btn = $(".idx__toggle");
    btn.addEventListener("click", () => {
      const open = !btn.classList.contains("is-open");
      btn.classList.toggle("is-open", open);
      $("span", btn).textContent = open ? "Hide archive" : btn.dataset.label;
      gsap.to(more, { height: open ? "auto" : 0, duration: 1.1, ease: "expo.inOut", onComplete: () => ScrollTrigger.refresh() });
      if (open) gsap.to($$(".row", more), { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", stagger: 0.012, delay: 0.25, clearProps: "opacity,filter,transform" });
    });
    btn.dataset.label = $("span", btn).textContent;
  }

  function aboutScrub() {
    const el = $("[data-scrub]");
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  }

  // 무드보드 열 배치: 원래 순서대로 가장 짧은 열에 쌓음 (모바일 2 / 768~ 3 / 1200~ 4 / 1800~ 5열, 카드 폭 ~320px로 원본 화질 유지).
  // 모션이 켜져 있으면 짝수 번째 열이 스크롤에 살짝 어긋나게 흐름
  function board() {
    const boards = $$(".board");
    if (!boards.length) return;
    const qs = ["(min-width: 1800px)", "(min-width: 1200px)", "(min-width: 768px)"].map((q) => matchMedia(q));
    let tweens = [];
    const layout = () => {
      const n = [5, 4, 3].find((_, k) => qs[k].matches) || 2;
      tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
      tweens = [];
      boards.forEach((b) => {
        b._tiles ||= [...b.children];
        const cols = Array.from({ length: n }, () => Object.assign(document.createElement("div"), { className: "board__col" }));
        const h = cols.map(() => 0);
        b._tiles.forEach((t) => {
          const c = h.indexOf(Math.min(...h));
          cols[c].append(t);
          h[c] += 1 / parseFloat(t.style.getPropertyValue("--ar")) + 0.05;
        });
        b.replaceChildren(...cols);
        if (motion) cols.forEach((c, k) => k % 2 && tweens.push(gsap.fromTo(c, { y: 70 }, {
          y: -70, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true },
        })));
      });
      if (motion) ScrollTrigger.refresh();
    };
    layout();
    qs.forEach((q) => q.addEventListener("change", layout));
  }

  function footer() {
    gsap.from(".cta", { y: 40, opacity: 0, filter: "blur(14px)", duration: 1.4, ease: "expo.out", clearProps: "transform,opacity,filter", scrollTrigger: { trigger: ".ftr", start: "top 70%", once: true } });
  }

  function introProject() {
    const title = $(".proj__title");
    const words = splitWords(title);
    gsap.set(title, { opacity: 1 });
    gsap.set(words, blurOut);
    const morphed = (() => { try { const s = sessionStorage.getItem("morph"); sessionStorage.removeItem("morph"); return !!s; } catch (_) { return false; } })();
    gsap.set("[data-intro]", { opacity: 0, y: 20 });
    const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 });
    tl.to(words, { ...blurIn, stagger: 0.04 })
      .to("[data-intro]", { opacity: 1, y: 0, duration: 1.2 }, "<0.3");
    if (!morphed) tl.from(".proj__hero-in", { clipPath: "inset(100% 0% 0% 0% round 18px)", duration: 1.4, ease: "expo.inOut" }, 0.2)
      .from(".proj__hero img", { scale: 1.3, duration: 2 }, "<0.2");

    // 스크롤하면 히어로가 화면 가득 펼쳐짐
    const padPx = parseFloat(getComputedStyle($(".proj__hero")).paddingLeft);
    gsap.fromTo(".proj__hero", { paddingLeft: padPx, paddingRight: padPx },
      { paddingLeft: 0, paddingRight: 0, ease: "none", scrollTrigger: { trigger: ".proj__hero", start: "top 60%", end: "top top", scrub: true } });
    gsap.to(".proj__hero-in", { borderRadius: 0, ease: "none", scrollTrigger: { trigger: ".proj__hero", start: "top 60%", end: "top top", scrub: true } });
    gsap.to(".proj__hero img", { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".proj__hero", start: "top top", end: "bottom top", scrub: true } });
    clipReveal(".gallery .tile__media, .board .tile__media");
  }

  /* ---------------- boot ---------------- */

  chrome();
  page === "home" ? renderHome() : renderProject();
  swapLabels();
  clock();
  theme();
  anchors();
  morphLinks();
  headerAutoHide();
  dock();
  gallery();
  specTabs();

  if (!motion) {
    board();
    $(".loader")?.remove();
    $(".cursor")?.remove();
    $(".idx__toggle")?.addEventListener("click", (e) => {
      const more = $(".idx__more");
      more.style.height = more.style.height === "auto" ? "0" : "auto";
      e.currentTarget.classList.toggle("is-open");
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  smooth();
  const vfx = viewLabel();
  cursor(vfx);
  tapLoad(vfx);
  copyMail(vfx);
  magnetic();
  reveals();
  footer();
  if (page === "home") {
    introHome();
    drift();
    official();
    speculative();
    index();
    aboutScrub();
  } else {
    $(".loader").remove();
    board();
    introProject();
  }
  addEventListener("load", () => ScrollTrigger.refresh());
  // 다른 페이지에서 #앵커로 들어온 경우 위치 맞추기
  if (location.hash && page === "home") {
    const el = document.getElementById(location.hash.slice(1));
    if (el) addEventListener("load", () => lenis ? lenis.scrollTo(el, { immediate: true }) : el.scrollIntoView());
  }
})();
