(() => {
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  const state = {
    mood: { rgb: [165, 0, 52], imgUrl: null },
    ourlife: { report: { homeCook: 12, healing: 8, cinema: 4 }, points: 1320 },
    missions: [
      { id:"cook2", name:"이번 주 집밥 2회 도전", tag:"추천", desc:"조리 가전 사용 + 3시간 이내 식기세척기 작동 → ‘집밥 1회’ 자동 인정", progress: 0.5, reward:"180P · 배지" },
      { id:"cinema", name:"주말 홈시네마 즐기기", tag:"추천", desc:"저녁 시간대 TV 장시간 사용 + 조명 연동 → ‘홈시네마 타임’ 자동 인정", progress: 0.25, reward:"120P · 배지" },
      { id:"care", name:"공기청정기 케어모드 사용해보기", tag:"추천", desc:"저녁 시간 TV + 공기청정기 반복 사용 → ‘힐링 데이’ 자동 인정", progress: 0.35, reward:"90P · 배지" }
    ]
  };

  // ---------- Router ----------
  const screens = () => $$('[data-screen]');
  const navItems = () => $$('[data-nav].nav-item');
  const go = (name) => {
    screens().forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    // also for any buttons with data-nav in content (not nav-item)
    $$('.bottom-nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    // scroll to top
    const content = $('#content');
    if(content) content.scrollTop = 0;
  };

  // Bind navigation buttons
  const bindNav = () => {
    $$('[data-nav]').forEach(el => {
      // avoid double binding
      if(el.__boundNav) return;
      el.__boundNav = true;
      el.addEventListener('click', (e) => {
        const target = el.dataset.nav;
        if(target) go(target);
      });
    });
  };

  // ---------- Toast ----------
  let toastTimer = null;
  const toast = (msg) => {
    const t = $('#toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1300);
  };

  // ---------- Mood: color extraction ----------
  const averageRGB = (img) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const size = 64;
    c.width = size; c.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0,0,size,size).data;
    let r=0,g=0,b=0, n=0;
    for(let i=0;i<data.length;i+=4){
      const a = data[i+3];
      if(a < 32) continue;
      r += data[i]; g += data[i+1]; b += data[i+2]; n++;
    }
    if(!n) n = 1;
    return [Math.round(r/n), Math.round(g/n), Math.round(b/n)];
  };

  const setMoodUI = (rgb, imgUrl=null) => {
    const [r,g,b] = rgb;
    state.mood.rgb = rgb;
    state.mood.imgUrl = imgUrl;

    const sw = $('#moodSwatch');
    const rgbEl = $('#moodRGB');
    const prev = $('#moodPreview');
    const light = $('#syncLight');
    const panel = $('#syncPanel');

    if(sw) sw.style.background = `rgb(${r},${g},${b})`;
    if(rgbEl) rgbEl.textContent = `RGB ${r}, ${g}, ${b}`;

    if(prev){
      prev.innerHTML = "";
      if(imgUrl){
        const img = new Image();
        img.alt = "선택한 무드 사진";
        img.src = imgUrl;
        prev.appendChild(img);
      } else {
        const p = document.createElement('div');
        p.className = "placeholder";
        p.textContent = "선택한 사진이 여기에 표시됩니다";
        prev.appendChild(p);
      }
    }

    const fillStyle = `linear-gradient(90deg, rgba(${r},${g},${b},1), rgba(255,90,165,1))`;
    if(light){ light.style.background = fillStyle; }
    if(panel){ panel.style.background = fillStyle; }

    // animate "apply"
    requestAnimationFrame(() => {
      if(light) light.classList.add('on');
      if(panel) panel.classList.add('on');
    });
  };

  const bindMood = () => {
    const input = $('#moodInput');
    if(input && !input.__bound){
      input.__bound = true;
      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        if(!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
          const rgb = averageRGB(img);
          setMoodUI(rgb, url);
          toast("공간 무드가 동기화됐어요");
        };
        img.src = url;
      });
    }

    const save = $('#btnSaveMood');
    if(save && !save.__bound){
      save.__bound = true;
      save.addEventListener('click', () => toast("무드가 저장됐어요"));
    }
  };

  // ---------- Pet ----------
  const bindPet = () => {
    const input = $('#petInput');
    const grid = $('#petGrid');
    if(input && grid && !input.__bound){
      input.__bound = true;
      input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        if(!files.length) return;
        files.forEach((f, idx) => {
          const url = URL.createObjectURL(f);
          const fig = document.createElement('figure');
          fig.className = "pet-item";
          fig.innerHTML = `<img alt="펫 찰나 업로드" src="${url}"/><figcaption>업로드 #${String(idx+1).padStart(2,'0')}</figcaption>`;
          grid.prepend(fig);
        });
        toast("펫 찰나에 추가했어요");
      });
    }

    const btn = $('#btnPetHighlight');
    if(btn && !btn.__bound){
      btn.__bound = true;
      btn.addEventListener('click', () => toast("오늘의 찰나로 저장했어요"));
    }
  };

  // ---------- Missions ----------
  const renderMissions = () => {
    const wrap = $('#missionStack');
    if(!wrap) return;
    wrap.innerHTML = "";
    state.missions.forEach((m) => {
      const el = document.createElement('div');
      el.className = "mission press";
      el.innerHTML = `
        <div class="mission-top">
          <div class="mission-name" title="${m.name}">${m.name}</div>
          <div class="mission-tag">${m.tag}</div>
        </div>
        <div class="mission-desc">${m.desc}</div>
        <div class="mission-bar"><div class="mission-fill" style="width:${Math.round(m.progress*100)}%"></div></div>
        <div class="mission-actions">
          <div class="mini">보상: ${m.reward}</div>
          <button class="btn small press" data-mdone="${m.id}">달성 체크</button>
        </div>
      `;
      wrap.appendChild(el);
    });

    // bind buttons
    $$('[data-mdone]').forEach(btn => {
      if(btn.__bound) return;
      btn.__bound = true;
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.mdone;
        const m = state.missions.find(x => x.id === id);
        if(!m) return;
        m.progress = Math.min(1, m.progress + 0.25);
        renderMissions();
        toast("패턴 기반 자동 인식 완료(데모)");
      });
    });
  };

  const bindMissions = () => {
    const refresh = $('#btnRefreshMission');
    if(refresh && !refresh.__bound){
      refresh.__bound = true;
      refresh.addEventListener('click', () => {
        // rotate missions for demo
        state.missions = state.missions.slice(1).concat(state.missions.slice(0,1));
        renderMissions();
        toast("새 추천을 불러왔어요");
      });
    }
  };

  // ---------- Store ----------
  const bindStore = () => {
    $$('.store-item').forEach(it => {
      if(it.__bound) return;
      it.__bound = true;
      it.addEventListener('click', () => {
        const name = $('.si-name', it)?.textContent?.trim() || "상품";
        toast(`${name} 선택(데모)`);
      });
    });

    const info = $('#btnOpenStoreInfo');
    if(info && !info.__bound){
      info.__bound = true;
      info.addEventListener('click', () => {
        openModal();
        drawSharePoster($("#shareCanvas"), "store");
        toast("포인트 안내 카드 생성");
      });
    }
  };

  // ---------- Grow / Moving ----------
  const bindGrow = () => {
    const b = $('#btnUnlockBaby');
    if(b && !b.__bound){
      b.__bound = true;
      b.addEventListener('click', () => {
        toast("Baby Mode 활성화(데모)");
        const u = $('#unlockPreview');
        if(u){
          u.style.boxShadow = "0 24px 70px rgba(225,29,72,.22)";
          setTimeout(() => u.style.boxShadow = "", 800);
        }
      });
    }

    const fp = $('#floorplanInput');
    const canvas = $('#arDemo .ar-canvas');
    if(fp && canvas && !fp.__bound){
      fp.__bound = true;
      fp.addEventListener('change', () => {
        const f = fp.files && fp.files[0];
        if(!f) return;
        // For pdf we can't render without pdf.js; show name instead
        if(f.type === "application/pdf"){
          canvas.innerHTML = `<img alt="AR 도면 시뮬레이션 데모" src="./assets/floorplan_demo.svg"/><div class="placeholder" style="backdrop-filter:blur(10px);background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,0.10);border-radius:16px;margin:12px;padding:10px;font-weight:900;">PDF 업로드됨: ${f.name}<br/>※ 데모는 시뮬레이션 연출로 표시</div>`;
          toast("도면 업로드 완료(데모)");
          return;
        }
        const url = URL.createObjectURL(f);
        canvas.innerHTML = `<img alt="도면 미리보기" src="${url}"/>`;
        toast("도면 분석 중…(데모)");
      });
    }

    const apply = $('#btnApplyMove');
    if(apply && !apply.__bound){
      apply.__bound = true;
      apply.addEventListener('click', () => toast("배치 적용 완료(데모)"));
    }
  };

  // ---------- Wrapped Overlay ----------
  const wrapped = () => $('#wrapped');
  const slides = () => $('#slides');
  const pbarEls = () => $$('.pbar', wrapped() || document);

  let wIdx = 0, startX = 0, dx = 0, dragging = false;

  const clamp = (n,a,b) => Math.max(a, Math.min(b, n));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCount = (el, to, ms=800) => {
    const from = parseInt((el.textContent||"0").replace(/[^0-9]/g,"")) || 0;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now-start)/ms, 0, 1);
      const v = Math.round(from + (to-from)*easeOutCubic(p));
      el.textContent = String(v);
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const runSlideAnim = (s) => {
    if(s===1){
      $$('.wcount', wrapped() || document).forEach(el => animateCount(el, parseInt(el.dataset.to||"0",10)||0, 850));
    }
    if(s===2){
      const conf = (wrapped() || document).querySelector('.slide[data-s="2"] .confetti');
      if(conf){
        conf.style.animation = "none";
        conf.offsetHeight;
        conf.style.animation = "wConf .9s ease-out forwards";
      }
    }
  };

  const setWIdx = (n, animate=true) => {
    const s = slides();
    if(!s) return;
    wIdx = clamp(n, 0, 3);
    s.style.transition = animate ? "transform .35s cubic-bezier(.2,.9,.2,1)" : "none";
    s.style.transform = `translateX(${-wIdx*100}%)`;
    pbarEls().forEach((b,i)=> b.classList.toggle("done", i <= wIdx));
    runSlideAnim(wIdx);
  };

  const openWrapped = () => {
    const w = wrapped();
    if(!w) return;
    w.setAttribute("aria-hidden","false");
    setWIdx(0, false);
    setTimeout(()=> setWIdx(0, true), 30);
  };
  const closeWrapped = () => {
    const w = wrapped();
    if(!w) return;
    w.setAttribute("aria-hidden","true");
  };

  // ---------- Share Modal + Canvas Poster ----------
  const modal = () => $('#modal');
  const openModal = () => modal()?.setAttribute("aria-hidden","false");
  const closeModal = () => modal()?.setAttribute("aria-hidden","true");

  const rr = (ctx,x,y,w,h,r) => {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  };

  const drawSharePoster = (canvas, mode="ourlife") => {
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // background
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(0,0,W,H);

    const glow = (x,y,rad,colorA) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,rad);
      g.addColorStop(0,colorA);
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    };
    glow(W*0.78, H*0.14, W*0.72, "rgba(225,29,72,0.45)");
    glow(W*0.22, H*0.20, W*0.65, "rgba(165,0,52,0.35)");
    glow(W*0.50, H*0.86, W*0.85, "rgba(122,92,255,0.22)");

    // phone frame
    const fx=90, fy=110, fw=W-180, fh=H-220;
    ctx.save();
    ctx.shadowColor="rgba(0,0,0,0.55)";
    ctx.shadowBlur=56;
    ctx.shadowOffsetY=18;
    ctx.fillStyle="rgba(255,255,255,0.08)";
    rr(ctx,fx,fy,fw,fh,72); ctx.fill();
    ctx.restore();

    ctx.fillStyle="rgba(12,12,16,0.92)";
    rr(ctx,fx+18,fy+18,fw-36,fh-36,60); ctx.fill();

    // header pill
    ctx.fillStyle="rgba(255,255,255,0.06)";
    rr(ctx,fx+36,fy+36,fw-72,120,36); ctx.fill();

    // brand dot
    const gx = ctx.createLinearGradient(fx+170, fy+60, fx+170, fy+86);
    gx.addColorStop(0, "#ff5aa5"); gx.addColorStop(1, "#e11d48");
    ctx.fillStyle=gx;
    ctx.beginPath(); ctx.arc(fx+150, fy+86, 10, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle="rgba(255,255,255,0.92)";
    ctx.font="900 30px 'Noto Sans KR', system-ui";
    ctx.fillText("LG ThinQ", fx+176, fy+97);

    // home label
    ctx.fillStyle="rgba(255,255,255,0.06)";
    rr(ctx,fx+36,fy+170,fw-72,86,32); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.92)";
    ctx.font="900 28px 'Noto Sans KR', system-ui";
    ctx.fillText("김지현의 집", fx+66, fy+226);

    const cx=fx+36, cw=fw-72;
    let y=fy+278;

    const card = (title, hgt) => {
      ctx.fillStyle="rgba(255,255,255,0.07)";
      rr(ctx,cx,y,cw,hgt,42); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.92)";
      ctx.font="900 34px 'Noto Sans KR', system-ui";
      ctx.fillText(title, cx+24, y+56);
      return y + hgt;
    };

    if(mode === "store"){
      let y2 = card("Life Point 안내", 560);
      const lines = [
        "포인트는 오직 ‘타이틀 획득’과 ‘챌린지 달성’에서만 적립됩니다.",
        "가전 사용량 자체로는 포인트가 발생하지 않아 과사용 경쟁을 방지합니다.",
        "보상 예시: OTT 구독권 · 반려견 필터 · 세제 · 치약"
      ];
      ctx.fillStyle="rgba(255,255,255,0.78)";
      ctx.font="800 26px 'Noto Sans KR', system-ui";
      let ty = y+130;
      lines.forEach(line => { ctx.fillText(line, cx+24, ty); ty += 52; });
      y = y2 + 18;
    } else {
      // OurLife poster
      const report = state.ourlife.report;

      let y2 = card("Life Discovery", 320);
      const gline = ctx.createLinearGradient(cx+24, y+78, cx+240, y+78);
      gline.addColorStop(0, "#e11d48"); gline.addColorStop(1, "#ff5aa5");
      ctx.fillStyle=gline;
      rr(ctx,cx+24,y+78,220,14,10); ctx.fill();

      ctx.fillStyle="rgba(255,255,255,0.92)";
      ctx.font="950 46px 'Noto Sans KR', system-ui";
      ctx.fillText("홈셰프 라이프", cx+24, y+150);
      ctx.fillStyle="rgba(255,255,255,0.72)";
      ctx.font="800 26px 'Noto Sans KR', system-ui";
      ctx.fillText("전국 상위 20% · 패턴 신뢰도 High", cx+24, y+200);

      const chip = (xx,yy,txt) => {
        ctx.font="900 22px 'Noto Sans KR', system-ui";
        const tw = ctx.measureText(txt).width + 42;
        ctx.fillStyle="rgba(0,0,0,0.22)";
        rr(ctx,xx,yy,tw,54,27); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.10)";
        ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.86)";
        ctx.fillText(txt, xx+20, yy+36);
      };
      chip(cx+24, y+234, `🍳 집밥 ${report.homeCook}회`);
      chip(cx+260, y+234, `🌿 힐링 ${report.healing}회`);
      chip(cx+24, y+298, `🎬 홈시네마 ${report.cinema}회`);

      y = y2 + 18;

      y2 = card("이번 달 결산", 330);
      const bar = (yy, label, val, maxv) => {
        ctx.fillStyle="rgba(255,255,255,0.78)";
        ctx.font="900 24px 'Noto Sans KR', system-ui";
        ctx.fillText(label, cx+24, yy);
        ctx.fillStyle="rgba(255,255,255,0.16)";
        rr(ctx,cx+150,yy-18,520,16,8); ctx.fill();
        const ww = (val/maxv)*520;
        const gg = ctx.createLinearGradient(cx+150, yy-18, cx+150+ww, yy-18);
        gg.addColorStop(0, "#e11d48"); gg.addColorStop(1, "#ff5aa5");
        ctx.fillStyle=gg; rr(ctx,cx+150,yy-18,ww,16,8); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.86)";
        ctx.font="950 24px 'Noto Sans KR', system-ui";
        ctx.fillText(String(val), cx+690, yy);
      };
      const maxv = Math.max(report.homeCook, report.healing, report.cinema, 12);
      bar(y+140, "집밥", report.homeCook, maxv);
      bar(y+200, "힐링", report.healing, maxv);
      bar(y+260, "홈시네마", report.cinema, maxv);

      y = y2 + 18;

      y2 = card("리워드 스토어", 260);
      chip(cx+24, y+108, "🎬 OTT 구독권");
      chip(cx+280, y+108, "🐶 반려견 필터");
      chip(cx+24, y+176, "🧴 세제");
      chip(cx+190, y+176, "🪥 치약");
      y = y2 + 18;
    }

    // footer
    ctx.fillStyle="rgba(255,255,255,0.52)";
    ctx.font="700 18px 'Noto Sans KR', system-ui";
    ctx.fillText("LG ThinQ LifeOS Prototype (Demo)", cx+24, fy+fh-70);
  };

  const downloadCanvas = (canvas, filename="share.png") => {
    if(!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  };

  // ---------- Modal bindings ----------
  const bindModal = () => {
    const m = modal();
    if(!m) return;
    if(!m.__bound){
      m.__bound = true;
      $$('[data-close]', m).forEach(el => el.addEventListener('click', closeModal));
      $('#btnCloseModal')?.addEventListener('click', closeModal);
      $('#btnDownloadShare')?.addEventListener('click', () => {
        downloadCanvas($('#shareCanvas'), "thinq_share.png");
        toast("PNG 저장 완료");
      });
    }
  };

  // Magazine share
  const bindMagazine = () => {
    const btn = $('#btnMagShare');
    if(btn && !btn.__bound){
      btn.__bound = true;
      btn.addEventListener('click', () => {
        openModal();
        drawSharePoster($('#shareCanvas'), "ourlife");
        toast("공유 카드가 생성됐어요");
      });
    }
  };

  // ---------- Wrapped bindings ----------
  const bindWrapped = () => {
    const w = wrapped();
    const s = slides();
    if(!w || !s) return;

    if(!w.__bound){
      w.__bound = true;
      $$('[data-wclose]', w).forEach(el => el.addEventListener('click', closeWrapped));
      $('#prev')?.addEventListener('click', () => setWIdx(wIdx-1));
      $('#next')?.addEventListener('click', () => setWIdx(wIdx+1));
      s.addEventListener('click', (e)=>{
        if(e.target.closest("button")) return;
        setWIdx(wIdx+1);
      });

      s.addEventListener('pointerdown', (e)=>{
        dragging = true; startX = e.clientX; dx = 0;
        s.setPointerCapture(e.pointerId);
        s.style.transition = "none";
      });
      s.addEventListener('pointermove', (e)=>{
        if(!dragging) return;
        dx = e.clientX - startX;
        const pct = (dx / Math.max(320, window.innerWidth)) * 100;
        s.style.transform = `translateX(${(-wIdx*100) + pct}%)`;
      });
      s.addEventListener('pointerup', ()=>{
        if(!dragging) return;
        dragging = false;
        const threshold = 60;
        if(dx > threshold) setWIdx(wIdx-1);
        else if(dx < -threshold) setWIdx(wIdx+1);
        else setWIdx(wIdx);
      });

      s.addEventListener('keydown', (e)=>{
        if(e.key==="ArrowRight") setWIdx(wIdx+1);
        if(e.key==="ArrowLeft") setWIdx(wIdx-1);
        if(e.key==="Escape") closeWrapped();
      });

      const share = () => {
        openModal();
        drawSharePoster($('#shareCanvas'), "ourlife");
        setTimeout(()=>{
          downloadCanvas($('#shareCanvas'), "ourlife_wrapped.png");
          toast("공유 카드 저장 완료");
        }, 60);
      };
      $('#btnWShare')?.addEventListener('click', share);
      $('#btnWShare2')?.addEventListener('click', share);
    }

    const openBtn = $('#btnOpenWrapped');
    if(openBtn && !openBtn.__bound){
      openBtn.__bound = true;
      openBtn.addEventListener('click', openWrapped);
    }
  };

  // ---------- Misc ----------
  const bindQuick = () => {
    $('#btnQuickSearch')?.addEventListener('click', () => toast("검색(데모)"));
    $('#btnBell')?.addEventListener('click', () => toast("알림(데모)"));
  };

  // ---------- Init ----------
  const init = () => {
    bindNav();
    bindModal();
    bindQuick();
    bindMood();
    bindPet();
    bindMagazine();
    bindMissions();
    bindStore();
    bindGrow();
    bindWrapped();

    renderMissions();
    setMoodUI(state.mood.rgb, state.mood.imgUrl);
    go("home");
  };

  document.addEventListener('DOMContentLoaded', init);
  // v18: Magazine - Anniversary replay demo
  const btnAnnivReplay = $('#btnAnnivReplay');
  if(btnAnnivReplay){
    btnAnnivReplay.addEventListener('click', () => toast('기념일 무드가 자동 재현됩니다 (데모)'));
  }
  const btnIssueMagazine = $('#btnIssueMagazine');
  if(btnIssueMagazine){
    btnIssueMagazine.addEventListener('click', () => toast('월간 매거진이 자동 발행됩니다 (데모)'));
  }
  const btnMagShare2 = $('#btnMagShare2');
  if(btnMagShare2){
    btnMagShare2.addEventListener('click', () => $('#btnMagShare')?.click());
  }

  // v18: Magazine - Pet upload highlight
  const petUploadInMag = $('#petUploadInMag');
  const petMini = $('#petMini');
  if(petUploadInMag && petMini){
    petUploadInMag.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []).slice(0, 12);
      files.forEach((f, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'pet-card';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.alt = '업로드된 펫 찰나';
        const cap = document.createElement('div');
        cap.className = 'pet-cap';
        cap.textContent = '찰나 업로드';
        wrap.appendChild(img); wrap.appendChild(cap);
        petMini.prepend(wrap);
      });
      petUploadInMag.value = '';
    });
  }

})();

// v21: Wrapped final = time saved (not points)
(function(){
  const el = document.getElementById('savedHours');
  if(!el) return;

  // If the app already tracks points in state, convert points -> hours.
  // Heuristic: 100P = 1.0h (demo). If points not found, use demo aggregate from report cards.
  let points = 0;

  // Try common globals
  try{
    if(window.appState && typeof window.appState.points === 'number') points = window.appState.points;
    if(window.STATE && typeof window.STATE.points === 'number') points = window.STATE.points;
  }catch(e){}

  if(!points){
    // Try read from any element showing P in wrapped
    const pEl = document.querySelector('[data-screen="ourlife"]') || document.body;
    const txt = (pEl && pEl.innerText) ? pEl.innerText : '';
    const m = txt.match(/(\d{1,4})\s*P\b/);
    if(m) points = parseInt(m[1],10);
  }

  // Demo conversion: points -> hours (100P = 1h)
  let hours = points ? (points/100) : 6.5;

  // Clamp + format (one decimal max)
  hours = Math.max(1.0, Math.min(99.9, hours));
  const out = (Math.round(hours*10)/10).toString().replace(/\.0$/,'');
  el.textContent = out;
})();
