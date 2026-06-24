// script.js

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initHeroSlider();
  initNav();
  initDeferredSections();
  initFAQ();
  initContactForm();
  initTermsToggle();
  initRegisterForm();
  initRegisterTermsToggle();
  initRegisterFormHero();
  initRegisterTermsToggleHero();
  initMedia();
  initScrollEffects();
  initNavActiveSection();
  initPopup();
});

/* ──────────────────────────────────────────
   Config → DOM 연결
────────────────────────────────────────── */
function applyConfig() {
  const C = CONFIG;
  const phone = C.phone;
  const telHref = 'tel:' + phone.replace(/-/g, '');

  document.title = C.propertyName + ' 분양안내';

  el('navLogo').textContent = C.propertyName;

  el('navPhoneNum').textContent    = phone;
  el('mobilePhoneNum').textContent = phone;
  setHref('navPhoneBtn', telHref);
  setHref('mobilePhoneBtn', telHref);
  setHref('bottomCallBtn', telHref);
  setHref('floatCallBtn', telHref);
  setHref('ibCallBtn', telHref);
  setHref('ibCallBtn2', telHref);

  buildNavMenu();

  el('heroBadge').textContent = '선착순 분양중 · 상담 가능';
  el('heroTitle').innerHTML = '힐스테이트 <span class="hero-title-gold">수원파크포레</span>,만의 <span class="hero-title-dark">특별한 계약조건!</span>';
  el('heroSub').textContent = '수원의 중심에서,';

  buildHeroBenefitBtns();

  el('bottomCallPhone').textContent = phone;

  // 모바일 전용 배너 CTA + 이미지
  setHref('mobCallBtn', telHref);
  el('mobCallPhone').textContent = phone;
  const mobImg = el('mobBannerImg');
  if (mobImg && C.mobBanner?.image) mobImg.src = C.mobBanner.image;

  // 퀵배너 브랜드명 분할 출력
  const qsBrandName = el('qsBrandName');
  if (qsBrandName) {
    const parts = C.propertyName.split(' ');
    qsBrandName.innerHTML = parts[0] + '<br>' + parts.slice(1).join(' ');
  }

  // 푸터는 정적 HTML로 직접 작성됨
}

function buildNavMenu() {
  const navList    = el('navList');
  const mobileList = el('mobileNavList');

  CONFIG.navMenu.forEach(item => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = item.href;
    a.textContent = item.label;
    li.appendChild(a);
    navList.appendChild(li);

    const mLi = li.cloneNode(true);
    mLi.querySelector('a').addEventListener('click', closeMobileMenu);
    mobileList.appendChild(mLi);
  });
}

function buildHeroBenefitBtns() {
  const cta = el('heroCta');
  if (!cta) return;
  cta.innerHTML = '';
  [
    '발코니 무상지원',
    '잔금유예 1~2억',
    '+ α 계약자혜택 제공',
  ].forEach(value => {
    const a = document.createElement('a');
    a.href = '#visit';
    a.className = 'hero-benefit-btn';
    a.innerHTML = `<span class="benefit-value">${value.replace(/\n/g, '<br>')}</span>`;
    cta.appendChild(a);
  });
}

/* ──────────────────────────────────────────
   네비게이션
────────────────────────────────────────── */
function initNav() {
  const hamburger  = el('hamburger');
  const mobileMenu = el('mobileMenu');

  const topBtn = el('navTopBtn');
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo(0, 0));

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  });

  document.addEventListener('click', e => {
    if (!el('navHeader').contains(e.target)) closeMobileMenu();
  });
}

function openMobileMenu() {
  el('mobileMenu').classList.add('open');
  el('mobileMenu').setAttribute('aria-hidden', 'false');
  const ham = el('hamburger');
  ham.classList.add('active');
  ham.setAttribute('aria-label', '메뉴 닫기');
  ham.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  el('mobileMenu').classList.remove('open');
  el('mobileMenu').setAttribute('aria-hidden', 'true');
  const ham = el('hamburger');
  ham.classList.remove('active');
  ham.setAttribute('aria-label', '메뉴 열기');
  ham.setAttribute('aria-expanded', 'false');
}

/* ──────────────────────────────────────────
   프리미엄 포인트
────────────────────────────────────────── */
function buildPremiumCards() {
  const grid = el('premiumGrid');
  if (!grid || grid.dataset.ready === 'true') return;

  const premiumPoints = [
    {
      title: '입지환경 | 양호',
      desc: '동측 공원 및 북측 구운지구, 서호지구 개발로 입지 우상향',
      image: 'images/premium/point01-optimized.jpg',
      video: '',
    },
    {
      title: '교통환경 | 양호',
      desc: '철도 및 고속도로 등 우수한 도로교통망',
      image: 'images/premium/point02-optimized.jpg',
      video: '',
    },
    {
      title: '교육환경 | 양호',
      desc: '도보통학 가능한 학세권 입지로 교육여건 양호',
      image: 'images/premium/point03-optimized.jpg',
      video: '',
    },
    {
      title: '생활편의 | 양호',
      desc: '대형마트, 백화점 및 복합쇼핑몰 인근 위치로 생활인프라 풍부',
      image: 'images/premium/point04-optimized.jpg',
      video: '',
    },
  ];

  premiumPoints.forEach((pt, idx) => {
    const card = document.createElement('div');
    card.className = 'premium-card';

    const hasVideo = pt.video && pt.video.trim() !== '';
    const hasImage = pt.image && pt.image.trim() !== '';
    const ext      = hasVideo ? pt.video.split('.').pop().toLowerCase() : '';
    const mime     = ext === 'webm' ? 'video/webm' : 'video/mp4';

    let mediaInner = '';
    if (hasVideo) {
      mediaInner = `<video class="card-media-video" autoplay muted loop playsinline>
          <source src="${pt.video}" type="${mime}">
          ${hasImage ? `<img class="card-media-img" src="${pt.image}" alt="${pt.title}">` : ''}
        </video>`;
    } else if (hasImage) {
      mediaInner = `<img class="card-media-img" src="${pt.image}" alt="${pt.title}" loading="lazy" decoding="async">`;
    }

    card.innerHTML = `
      <div class="card-media">${mediaInner}</div>
      <div class="card-body">
        <span class="card-num" aria-hidden="true">0${idx + 1}</span>
        <h3 class="card-title">${pt.title}</h3>
        <p class="card-desc">${pt.desc || ''}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.dataset.ready = 'true';
}

/* ──────────────────────────────────────────
   단지 개요
────────────────────────────────────────── */
function buildOverviewCard() {
  const img = el('overviewImg');
  if (img) {
    img.src          = 'images/overview/overview-optimized.jpg';
    img.loading      = 'lazy';
    img.decoding     = 'async';
    img.fetchPriority = 'low';
  }
  el('overviewCaption').textContent = '';

  const tbody = el('overviewTbody');
  [
    { label: '위치',          value: '경기도 수원시 권선구 서둔동 213-10번지 일원' },
    { label: '규모',          value: '지하 2층 / 지상 14층, 10개동 총 482세대, 최고높이 40.54M' },
    { label: '대지면적',      value: '30,621.0000㎡ (9,262.8525평)' },
    { label: '건폐율/용적률', value: '24.28% / 199.87%' },
    { label: '주차대수',      value: '지하 696대 (세대당 1.44대, 근생 2대 포함)' },
  ].forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="ov-label">${row.label}</td><td class="ov-value">${row.value}</td>`;
    tbody.appendChild(tr);
  });
}

/* ──────────────────────────────────────────
   위치 안내
────────────────────────────────────────── */
function buildLocationPoints() {
  const wrap = el('locationPoints');
  if (!wrap || wrap.dataset.ready === 'true') return;

  [
    {
      label: '입지환경 | 우수',
      items: [
        '동측 공원 및 북측 구운지구, 서호지구 개발로 입지 우상향',
        '사업지 동측 서호공원, 여기산, 서호 꽃뫼공원 등 녹지 풍부',
        '단지 북측 구운지구 및 남측 서호지구 개발',
      ],
    },
    {
      label: '교통환경 | 우수',
      items: [
        '철도 및 고속도로 등 우수한 도로교통망',
        '화서역(1호선, 신분당선(예정)), 수원역(1호선, KTX, GTX-C(28년 예정) 등)',
        '서측 과천봉담고속화도로, 평택파주고속도로 위치로 이용 수월',
      ],
    },
    {
      label: '교육환경 | 양호',
      items: [
        '도보통학 가능한 학세권 입지로 교육여건 양호',
        '탑동초(500M, 도보 8분) 배정 예정',
        '북부중학교 3구역(구운중, 서호중, 율현중) 배정 예정',
      ],
    },
    {
      label: '생활편의 | 양호',
      items: [
        '대형마트, 백화점 및 복합쇼핑몰 인근 위치로 생활인프라 풍부',
        '수원역 일대 AK플라자, 롯데백화점 및 로데오거리 위치로 상권 풍부',
        "스타필드('24.1월 오픈), 홈플러스, 이마트, 롯데마트 등 이용 편리",
      ],
    },
  ].forEach(pt => {
    const card = document.createElement('div');
    card.className = 'location-point-card';
    const itemsHtml = pt.items.map(item => `<li class="pt-item">${item}</li>`).join('');
    card.innerHTML = `
      <p class="pt-label">${pt.label}</p>
      <ul class="pt-list">${itemsHtml}</ul>
    `;
    wrap.appendChild(card);
  });

  wrap.dataset.ready = 'true';
}

function initLocationSection() {
  const mapImg = qs('.location-map-img');
  if (mapImg && !mapImg.getAttribute('src')) {
    mapImg.src      = mapImg.dataset.src || '';
    mapImg.loading  = 'lazy';
    mapImg.decoding = 'async';
  }
  buildLocationPoints();
}

/* ──────────────────────────────────────────
   갤러리
────────────────────────────────────────── */
function initGallery() {
  const C      = CONFIG;
  const tabBar = el('galleryTabBar');

  C.galleryTabs.forEach((tab, idx) => {
    const btn = document.createElement('button');
    btn.className   = 'tab-btn' + (idx === 0 ? ' active' : '');
    btn.textContent = tab.label;
    btn.type        = 'button';
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(tab.id, tab.label);
    });
    tabBar.appendChild(btn);
  });

  renderGallery(C.galleryTabs[0].id, C.galleryTabs[0].label);
}

function renderGallery(tabId, label) {
  const grid   = el('galleryGrid');
  const images = (CONFIG.galleryImages?.[tabId] || []).filter(Boolean);
  grid.dataset.tab = tabId;
  grid.innerHTML = '';

  if (images.length > 0) {
    images.forEach((src, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('role', 'img');
      item.setAttribute('aria-label', `${label} ${i + 1}`);
      const img = document.createElement('img');
      img.src     = src;
      img.alt     = `${label} ${i + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      item.appendChild(img);
      grid.appendChild(item);
    });
  } else {
    for (let i = 1; i <= 6; i++) {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('role', 'img');
      item.setAttribute('aria-label', `${label} ${i}`);
      item.innerHTML = `<div class="img-placeholder">${label} ${i}</div>`;
      grid.appendChild(item);
    }
  }
}

/* ──────────────────────────────────────────
   타입 소개 (평면도)
────────────────────────────────────────── */
function initFloorplan() {
  const tabBar  = el('floorplanTabBar');
  const content = el('floorplanContent');
  const floorplanTabs = [
    {
      id: 'type84',
      label: '84㎡',
      info: {
        subtitle: '84 타입 평면도',
        details: [
          '선호도 높은 4Bay 판상형 구조로 통풍 및 채광 우수',
          '신발장 외 현관 대형 팬트리 위치로 공간활용 및 수납 우수',
          '주방~거실까지 트인 구조로 우수한 개방감과 넓은 공간 활용 가능',
          '우물천정 구조로 기존 천정고 높이 대비 더 높고 넓어 보이는 효과',
          "동선이 편리한 'D'자형 주방 구조",
          '주방 대형 창호 설치로 채광 및 환기 우수',
          '침니형 후드로 고급스러운 인테리어 효과',
          '파우더장 무상 제공으로 수납공간 양호',
          '넓은 드레스룸 및 창문 설치로 통풍이 가능하여 곰팡이 예방 가능',
          '알파룸 공간 침실 및 서재 등 다양한 활용 가능',
        ],
      },
    },
    {
      id: 'type113',
      label: '113㎡',
      info: {
        subtitle: '113 타입 평면도',
        details: [
          '선호도 높은 4Bay 판상형 구조로 통풍 및 채광 우수',
          '넓은 현관 및 신발장 외 팬트리 배치로 공간활용 및 수납 우수',
          '복도 팬트리 제공으로 인한 수납공간 활용도 우수',
          '주방 대형 창호 설치로 채광 및 환기 우수',
          '침니형 후드로 고급스러운 인테리어 효과',
          '파우더장 무상 제공으로 수납공간 양호',
          '넓은 드레스룸 제공 및 창문 설치로 통풍이 가능하여 곰팡이 예방 가능',
          '알파룸 배치로 추가 침실 및 서재 등 다양한 활용 가능',
          '고급스러운 타일과 마감재 등 설치로 깔끔한 인테리어',
          '욕실2 샤워부스 풀파티션 설치 및 수전이 고급스러움',
        ],
      },
    },
  ];
  const floorplanImages = {
    type84: {
      main: 'images/floorplan/4.png',
      gallery: [],
    },
    type113: {
      main: 'images/floorplan/5.png',
      gallery: [],
    },
  };

  floorplanTabs.forEach((tab, idx) => {
    const btn = document.createElement('button');
    btn.className   = 'tab-btn' + (idx === 0 ? ' active' : '');
    btn.textContent = tab.label;
    btn.type        = 'button';
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qsa('.floorplan-panel').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('fp-' + tab.id);
      if (target) target.classList.add('active');
    });
    tabBar.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'floorplan-panel' + (idx === 0 ? ' active' : '');
    panel.id        = 'fp-' + tab.id;
    panel.setAttribute('role', 'tabpanel');

    const data    = floorplanImages[tab.id] || {};
    const mainSrc = data.main || '';
    const gallery = (data.gallery || []).filter(Boolean);
    const info    = tab.info || {};

    const mainImgHtml = mainSrc
      ? `<img class="fp-main-img" src="${mainSrc}" alt="${tab.label} 평면도" loading="lazy" decoding="async">`
      : `평면도 이미지<br>${tab.label}`;

    const detailsHtml = (info.details || [])
      .map(d => `<p class="fp-detail">${d}</p>`).join('');

    const galleryHtml = gallery.length > 0
      ? `<div class="fp-gallery">
           <h3 class="fp-gallery-title">${tab.label} 내부 갤러리</h3>
           <div class="fp-gallery-grid">
             ${gallery.map((src, i) =>
               `<div class="fp-gallery-item">
                  <img src="${src}" alt="${tab.label} 내부 ${i + 1}" loading="lazy" decoding="async">
                </div>`
             ).join('')}
           </div>
         </div>`
      : '';

    panel.innerHTML = `
      <div class="fp-main-wrap">
        <div class="floorplan-viewer">
          <div class="floorplan-img">${mainImgHtml}</div>
          ${info.subtitle ? `<p class="fp-subtitle">${info.subtitle}</p>` : ''}
        </div>
        <div class="floorplan-info">
          ${info.highlight ? `<p class="fp-highlight">${info.highlight}</p>` : ''}
          ${detailsHtml}
          ${info.priceBig  ? `<p class="fp-price-big">${info.priceBig}</p>`  : ''}
          ${info.footnote  ? `<p class="fp-footnote">${info.footnote}</p>`   : ''}
        </div>
      </div>
      ${galleryHtml}
    `;
    content.appendChild(panel);
  });

  initFpLightbox();
}

/* ──────────────────────────────────────────
   평면도 라이트박스
────────────────────────────────────────── */
function initFpLightbox() {
  const lb = document.createElement('div');
  lb.id        = 'fpLightbox';
  lb.className = 'fp-lightbox';
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML = `
    <div class="fp-lb-backdrop"></div>
    <button class="fp-lb-close" aria-label="닫기">✕</button>
    <div class="fp-lb-img-wrap">
      <img class="fp-lb-img" src="" alt="확대 이미지">
    </div>
  `;
  document.body.appendChild(lb);

  const lbImg = lb.querySelector('.fp-lb-img');

  function openLb(src) {
    lbImg.src = src;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  lb.querySelector('.fp-lb-backdrop').addEventListener('click', closeLb);
  lb.querySelector('.fp-lb-close').addEventListener('click', closeLb);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  document.querySelectorAll('.fp-gallery-item img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLb(img.src));
  });
}

/* ──────────────────────────────────────────
   FAQ
────────────────────────────────────────── */
function initFAQ() {
  const accordion = el('faqAccordion');

  CONFIG.faqs.forEach((faq, idx) => {
    const item = document.createElement('div');
    item.className = 'accordion-item';

    const qBtn = document.createElement('button');
    qBtn.className = 'accordion-q';
    qBtn.type      = 'button';
    qBtn.setAttribute('aria-expanded', 'false');
    qBtn.setAttribute('aria-controls', `faq-a-${idx}`);
    qBtn.innerHTML = `
      <span class="q-prefix" aria-hidden="true">Q</span>
      <span class="q-text">${faq.q}</span>
      <span class="q-arrow" aria-hidden="true">&#9662;</span>
    `;

    const aDiv = document.createElement('div');
    aDiv.className = 'accordion-a';
    aDiv.id        = `faq-a-${idx}`;
    aDiv.setAttribute('role', 'region');
    aDiv.innerHTML = `<p>${faq.a}</p>`;

    item.appendChild(qBtn);
    item.appendChild(aDiv);
    accordion.appendChild(item);

    qBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      qsa('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        qBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ──────────────────────────────────────────
   지연 렌더링
────────────────────────────────────────── */
function initDeferredSections() {
  const tasks = [
    { id: 'premium',  run: buildPremiumCards,  done: false },
    { id: 'overview', run: buildOverviewCard,  done: false },
    { id: 'location', run: initLocationSection, done: false },
    { id: 'gallery',  run: initGallery,        done: false },
    { id: 'types',    run: initFloorplan,      done: false },
  ];

  if (!('IntersectionObserver' in window)) {
    tasks.forEach(task => task.run());
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const task = tasks.find(item => item.id === entry.target.id);
      if (!task || task.done) return;
      task.done = true;
      task.run();
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: window.matchMedia('(max-width: 768px)').matches ? '0px 0px' : '120px 0px',
  });

  tasks.forEach(task => {
    const section = el(task.id);
    if (section) observer.observe(section);
  });
}

/* ──────────────────────────────────────────
   방문예약 폼 (#visit)
────────────────────────────────────────── */
function initContactForm() {
  const form          = el('contactForm');
  const phone1        = el('phone1');
  const phone2        = el('phone2');
  const phone3        = el('phone3');
  const phoneCombined = el('phoneCombined');
  const privacyConsent = el('privacyConsent');
  const submitBtn     = el('contactSubmitBtn');
  const status        = el('formStatus');

  if (!form || !phone1 || !phone2 || !phone3) return;

  function setStatus(msg, type = '') {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status' + (type ? ` is-${type}` : '');
  }

  phone1.addEventListener('input', () => {
    phone1.value = phone1.value.replace(/\D/g, '');
    if (phone1.value.length >= 3) phone2.focus();
  });
  phone2.addEventListener('input', () => {
    phone2.value = phone2.value.replace(/\D/g, '');
    if (phone2.value.length >= 4) phone3.focus();
  });
  phone3.addEventListener('input', () => {
    phone3.value = phone3.value.replace(/\D/g, '');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = el('inputName').value.trim();
    const p1    = phone1.value.trim();
    const p2    = phone2.value.trim();
    const p3    = phone3.value.trim();
    const agree = el('agreeAll').checked;
    const endpoint = (form.getAttribute('action') || '').trim();

    setStatus('');

    if (!name) { alert('성함을 입력해주세요.'); el('inputName').focus(); return; }
    if (!p1 || !p2 || !p3 || (p1 + p2 + p3).length < 9) {
      alert('연락처를 정확히 입력해주세요.'); phone1.focus(); return;
    }
    if (!agree) { alert('개인정보 수집 및 이용에 동의해주세요.'); el('agreeAll').focus(); return; }
    if (!endpoint || endpoint.includes('YOUR_FORMSPREE_FORM_ID')) {
      setStatus('Formspree 폼 ID를 먼저 입력해주세요.', 'error');
      alert('Formspree 폼 ID를 먼저 입력해주세요.');
      return;
    }

    if (phoneCombined) phoneCombined.value = `${p1}-${p2}-${p3}`;
    if (privacyConsent) privacyConsent.value = agree ? 'agreed' : 'not-agreed';

    const formData = new FormData(form);
    if (submitBtn) submitBtn.disabled = true;
    setStatus('방문예약 신청을 전송하고 있습니다...');

    fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) {
          let msg = '전송 중 오류가 발생했습니다.';
          try {
            const d = await response.json();
            if (d?.errors?.[0]?.message) msg = d.errors[0].message;
          } catch (_) {}
          throw new Error(msg);
        }
        setStatus('방문예약 신청이 접수되었습니다. 빠르게 연락드리겠습니다.', 'success');
        alert(`방문예약 신청이 접수되었습니다.\n${p1}-${p2}-${p3} 번호로 빠르게 연락드리겠습니다.`);
        form.reset();
      })
      .catch(error => {
        setStatus(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        alert(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => { if (submitBtn) submitBtn.disabled = false; });
  });
}

function initTermsToggle() {
  const btn = el('termsToggle');
  const box = el('termsBox');
  if (!btn || !box) return;

  btn.addEventListener('click', () => {
    const isHidden = box.hasAttribute('hidden');
    if (isHidden) {
      box.removeAttribute('hidden');
      btn.textContent = '내용 닫기 ▴';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      box.setAttribute('hidden', '');
      btn.textContent = '내용 보기 ▾';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ──────────────────────────────────────────
   관심고객등록 폼 (#register)
────────────────────────────────────────── */
function initRegisterForm() {
  const form     = el('registerForm');
  const rp1      = el('regPhone1');
  const rp2      = el('regPhone2');
  const rp3      = el('regPhone3');
  const combined = el('regPhoneCombined');
  const submitBtn = el('registerSubmitBtn');
  const status   = el('registerStatus');

  if (!form || !rp1 || !rp2 || !rp3) return;

  function setStatus(msg, type = '') {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status register-form-status' + (type ? ` is-${type}` : '');
  }

  rp1.addEventListener('input', () => {
    rp1.value = rp1.value.replace(/\D/g, '');
    if (rp1.value.length >= 3) rp2.focus();
  });
  rp2.addEventListener('input', () => {
    rp2.value = rp2.value.replace(/\D/g, '');
    if (rp2.value.length >= 4) rp3.focus();
  });
  rp3.addEventListener('input', () => {
    rp3.value = rp3.value.replace(/\D/g, '');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = el('regName').value.trim();
    const p1    = rp1.value.trim();
    const p2    = rp2.value.trim();
    const p3    = rp3.value.trim();
    const agree = el('regAgree').checked;
    const endpoint = (form.getAttribute('action') || '').trim();

    setStatus('');

    if (!name) { alert('이름을 입력해주세요.'); el('regName').focus(); return; }
    if (!p1 || !p2 || !p3 || (p1 + p2 + p3).length < 9) {
      alert('연락처를 정확히 입력해주세요.'); rp1.focus(); return;
    }
    if (!agree) { alert('개인정보 수집 및 이용에 동의해주세요.'); el('regAgree').focus(); return; }
    if (!endpoint || endpoint.includes('YOUR_FORMSPREE_FORM_ID')) {
      setStatus('Formspree 폼 ID를 먼저 입력해주세요.', 'error');
      alert('Formspree 폼 ID를 먼저 입력해주세요.');
      return;
    }

    if (combined) combined.value = `${p1}-${p2}-${p3}`;

    const formData = new FormData(form);
    if (submitBtn) submitBtn.disabled = true;
    setStatus('등록 중입니다...');

    fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) {
          let msg = '전송 중 오류가 발생했습니다.';
          try {
            const d = await response.json();
            if (d?.errors?.[0]?.message) msg = d.errors[0].message;
          } catch (_) {}
          throw new Error(msg);
        }
        setStatus('관심고객 등록이 완료되었습니다. 우선 상담 혜택을 드리겠습니다!', 'success');
        alert(`관심고객 등록이 완료되었습니다.\n${p1}-${p2}-${p3} 번호로 빠르게 연락드리겠습니다.`);
        form.reset();
      })
      .catch(error => {
        setStatus(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        alert(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => { if (submitBtn) submitBtn.disabled = false; });
  });
}

function initRegisterTermsToggle() {
  const btn = el('regTermsToggle');
  const box = el('regTermsBox');
  if (!btn || !box) return;

  btn.addEventListener('click', () => {
    const isHidden = box.hasAttribute('hidden');
    if (isHidden) {
      box.removeAttribute('hidden');
      btn.textContent = '내용 닫기 ▴';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      box.setAttribute('hidden', '');
      btn.textContent = '내용 보기 ▾';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ──────────────────────────────────────────
   히어로 하단 관심고객 등록 폼 (복제)
────────────────────────────────────────── */
function initRegisterFormHero() {
  const form      = el('registerFormHero');
  const rp1       = el('regPhone1Hero');
  const rp2       = el('regPhone2Hero');
  const rp3       = el('regPhone3Hero');
  const combined  = el('regPhoneCombinedHero');
  const submitBtn = el('registerSubmitBtnHero');
  const status    = el('registerStatusHero');

  if (!form || !rp1 || !rp2 || !rp3) return;

  function setStatus(msg, type = '') {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status register-form-status' + (type ? ` is-${type}` : '');
  }

  rp1.addEventListener('input', () => {
    rp1.value = rp1.value.replace(/\D/g, '');
    if (rp1.value.length >= 3) rp2.focus();
  });
  rp2.addEventListener('input', () => {
    rp2.value = rp2.value.replace(/\D/g, '');
    if (rp2.value.length >= 4) rp3.focus();
  });
  rp3.addEventListener('input', () => {
    rp3.value = rp3.value.replace(/\D/g, '');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name     = el('regNameHero').value.trim();
    const p1       = rp1.value.trim();
    const p2       = rp2.value.trim();
    const p3       = rp3.value.trim();
    const agree    = el('regAgreeHero').checked;
    const endpoint = (form.getAttribute('action') || '').trim();

    setStatus('');

    if (!name) { alert('이름을 입력해주세요.'); el('regNameHero').focus(); return; }
    if (!p1 || !p2 || !p3 || (p1 + p2 + p3).length < 9) {
      alert('연락처를 정확히 입력해주세요.'); rp1.focus(); return;
    }
    if (!agree) { alert('개인정보 수집 및 이용에 동의해주세요.'); el('regAgreeHero').focus(); return; }
    if (!endpoint || endpoint.includes('YOUR_FORMSPREE_FORM_ID')) {
      setStatus('Formspree 폼 ID를 먼저 입력해주세요.', 'error'); return;
    }

    if (combined) combined.value = `${p1}-${p2}-${p3}`;

    const formData = new FormData(form);
    if (submitBtn) submitBtn.disabled = true;
    setStatus('등록 중입니다...');

    fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) {
          let msg = '전송 중 오류가 발생했습니다.';
          try {
            const d = await response.json();
            if (d?.errors?.[0]?.message) msg = d.errors[0].message;
          } catch (_) {}
          throw new Error(msg);
        }
        setStatus('등록이 완료되었습니다. 빠르게 연락드리겠습니다!', 'success');
        alert(`관심고객 등록이 완료되었습니다.\n${p1}-${p2}-${p3} 번호로 빠르게 연락드리겠습니다.`);
        form.reset();
      })
      .catch(error => {
        setStatus(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        alert(error.message || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => { if (submitBtn) submitBtn.disabled = false; });
  });
}

function initRegisterTermsToggleHero() {
  const btn = el('regTermsToggleHero');
  const box = el('regTermsBoxHero');
  if (!btn || !box) return;

  btn.addEventListener('click', () => {
    const isHidden = box.hasAttribute('hidden');
    if (isHidden) {
      box.removeAttribute('hidden');
      btn.textContent = '닫기';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      box.setAttribute('hidden', '');
      btn.textContent = '보기';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ──────────────────────────────────────────
   미디어 더보기 / 접기
────────────────────────────────────────── */
function initMedia() {
  document.querySelectorAll('.media-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const body   = btn.closest('.media-card').querySelector('.media-card-body');
      const isOpen = body.classList.contains('is-open');

      body.classList.toggle('is-open', !isOpen);
      btn.textContent = isOpen ? '더 보기' : '접기';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ──────────────────────────────────────────
   스크롤 기반 현재 섹션 활성 메뉴
────────────────────────────────────────── */
function initNavActiveSection() {
  const links = Array.from(document.querySelectorAll('#navList a[href^="#"]'));
  if (!links.length) return;

  // href → { a, el } 매핑 (el은 스크롤 시 지연 초기화 — 지연 렌더 섹션 대응)
  const items = links.map(a => ({ a, id: a.getAttribute('href').slice(1), el: null }));

  // 고정 헤더 높이 + 여유값으로 오프셋 계산
  const navH   = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
  const OFFSET = navH + 32;

  const setActive = activeA => {
    links.forEach(a => a.classList.remove('active'));
    if (activeA) activeA.classList.add('active');
  };

  const onScroll = () => {
    // 모바일(≤768px)에서는 상단 nav가 숨겨지므로 처리 불필요
    if (window.innerWidth <= 768) return;

    const scrollTop = window.scrollY + OFFSET;
    let current = null;

    for (const item of items) {
      if (!item.el) item.el = document.getElementById(item.id);
      if (!item.el) continue;
      if (item.el.offsetTop <= scrollTop) current = item.a;
    }

    setActive(current);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

/* ──────────────────────────────────────────
   스크롤 효과
────────────────────────────────────────── */
function initScrollEffects() {
  const nav        = el('navHeader');
  const floating   = el('floatingSide');
  const bottomBar  = el('bottomBar');
  const promoStrip = el('mobPromoStrip');

  const isMobile = () => window.innerWidth <= 768;

  const onScroll = () => {
    const y        = window.scrollY;
    const scrolled = y > 100;
    const mobile   = isMobile();

    // PC: 상단 네비 항상 표시 / 모바일: 스크롤 100px 이후 표시
    nav.classList.toggle('visible',  mobile ? scrolled : true);
    nav.classList.toggle('scrolled', y > 60);

    // 하단 바 + 프로모션 스트립: 모바일에서만 스크롤 100px 이후 표시
    bottomBar.classList.toggle('visible', mobile && scrolled);
    promoStrip?.classList.toggle('visible', mobile && scrolled);

    floating.classList.toggle('visible', y > 400);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // 리사이즈(태블릿 회전 등)에도 즉시 반영
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

/* ──────────────────────────────────────────
   히어로 슬라이더
────────────────────────────────────────── */
function initHeroSlider() {
  const track  = el('heroTrack');
  const images = ['images/hero/main-hero-optimized.jpg'];
  const count  = images.length;

  for (let i = 0; i < count; i++) {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';

    if (images[i]) {
      const img = document.createElement('img');
      img.src          = images[i];
      img.alt          = `히어로 슬라이드 ${i + 1}`;
      img.loading      = i === 0 ? 'eager' : 'lazy';
      img.decoding     = 'async';
      if (i === 0) img.fetchPriority = 'high';
      slide.appendChild(img);
    } else {
      const bg = document.createElement('div');
      bg.className   = 'hero-slide-bg';
      bg.textContent = `SLIDE ${i + 1}`;
      slide.appendChild(bg);
    }

    const overlay = document.createElement('div');
    overlay.className = 'hero-slide-overlay';
    slide.appendChild(overlay);
    track.appendChild(slide);
  }

  const slides = Array.from(track.querySelectorAll('.hero-slide'));
  let current = 0;

  function showSlide(index) {
    current = ((index % count) + count) % count;
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
  }

  showSlide(0);
  if (count > 1) setInterval(() => showSlide(current + 1), 3000);
}

/* ──────────────────────────────────────────
   팝업
────────────────────────────────────────── */
function initPopup() {
  const overlay = document.getElementById('popupOverlay');
  if (!overlay) return;

  const closeBtn     = document.getElementById('popupClose');
  const hideTodayBtn = document.getElementById('popupHideToday');
  const track        = document.getElementById('popupTrack');
  const dots         = document.querySelectorAll('.popup-dot');
  const prevBtn      = document.getElementById('popupPrev');
  const nextBtn      = document.getElementById('popupNext');
  const total        = dots.length;
  const hideKey      = 'popupHiddenUntil';
  let current        = 0;
  let opened         = false;

  function getHideUntil() {
    const stored = Number(window.localStorage.getItem(hideKey) || 0);
    return Number.isFinite(stored) ? stored : 0;
  }
  function isHiddenToday() { return getHideUntil() > Date.now(); }
  function hideUntilTomorrow() {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    window.localStorage.setItem(hideKey, String(tomorrow.getTime()));
  }

  function loadPopupImages() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const targets  = overlay.querySelectorAll((isMobile ? '.popup-mobile' : '.popup-pc') + ' img[data-src]');
    targets.forEach(img => { if (!img.getAttribute('src')) img.src = img.dataset.src; });
  }

  function goTo(n) {
    current = (n + total) % total;
    const slides    = track.querySelectorAll('.popup-slide img[data-src]');
    const currentImg = slides[current];
    if (currentImg && !currentImg.getAttribute('src')) currentImg.src = currentImg.dataset.src;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function openPopup() {
    if (opened || isHiddenToday()) return;
    opened = true;
    current = 0;
    loadPopupImages();
    goTo(0);
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    opened = false;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  closeBtn.addEventListener('click', closePopup);
  if (hideTodayBtn) hideTodayBtn.addEventListener('click', () => { hideUntilTomorrow(); closePopup(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

  const delay = window.matchMedia('(max-width: 768px)').matches ? 4500 : 3000;
  if (!isHiddenToday()) window.setTimeout(openPopup, delay);
}

/* ──────────────────────────────────────────
   유틸
────────────────────────────────────────── */
const el  = id  => document.getElementById(id);
const qs  = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

function setHref(id, href) {
  const node = el(id);
  if (node) node.href = href;
}
