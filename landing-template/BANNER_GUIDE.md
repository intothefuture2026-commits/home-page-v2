# 배너 이미지 삽입 가이드

보내주신 배너 3장을 홈페이지에 넣을 코드 작업은 이미 완료했습니다.
이제 남은 일은 **이미지 파일 3개를 정해진 폴더에, 정해진 이름으로 저장하고 → git에 올리는 것**뿐입니다.

---

## 1. 먼저 "잘 들어가는지" 확인한 결과

| 배너 | 원본 크기(대략) | 가로세로 비율 | 결론 |
| --- | --- | --- | --- |
| ① 24시간 문자상담 배너 | 약 2000×750px | 약 2.7:1 | 사이트 본문 폭(최대 1160px)보다 넓어서 **축소만 되고 확대되지 않음** → 화질 깨짐·잘림 없음 |
| ② 상품권 증정 EVENT 배너 | 2046×768px | 약 2.66:1 | 동일 |
| ③ 위치/방문/상담 CTA 배너 | 2206×713px | 약 3.1:1 | 동일 |

- 세 이미지 모두 사이트 컨테이너 폭(1160px)보다 원본이 크기 때문에 **PC에서는 축소 표시**, **모바일에서는 화면 폭에 맞춰 비율 그대로 더 작게** 표시됩니다. 이미지가 잘리거나(overflow), 억지로 늘어나는(찌그러짐) 현상은 없습니다.
- 다만 세 배너 모두 글자가 이미지 안에 그려져 있는 형태라, **모바일(작은 화면)에서는 글자가 함께 작아져 다소 읽기 어려울 수 있습니다.** 레이아웃이 깨지는 것은 아니고 "가독성"의 문제이니, 실제 배포 후 모바일에서 확인해보시고 필요하면 모바일 전용 확대 버전을 추가로 요청해주세요.
- 클릭 시 연결 동작: ① 문자상담 배너(top-banner-1) → 문자 앱 연결(`sms:1844-1588`) / ③ 24시간 배너(top-banner-2) → 전화 연결(`tel:1844-1588`) / ②(이벤트 배너, 3곳 공통) → 방문예약 섹션(`#visit`). 링크 대상을 바꾸고 싶으시면 말씀해주세요.

**결론: 4곳 모두 레이아웃 깨짐 없이 정상적으로 들어갑니다.** 코드는 이미 반영되어 있고, 이미지 파일만 올리면 됩니다.

---

## 2. 어디에, 어떤 이름으로 넣을지 (폴더는 이미 만들어 두었습니다)

```
landing-template/
└── images/
    ├── banner-event/
    │   └── event-banner.webp      ← ② 상품권 증정 EVENT 배너 (3곳에 재사용)
    └── banner-top/
        ├── top-banner-1.webp      ← ① 24시간 문자상담 배너
        └── top-banner-2.webp      ← ③ 위치/방문/상담 CTA 배너
```

| 저장할 파일 경로 | 넣을 이미지 |
| --- | --- |
| `landing-template/images/banner-event/event-banner.webp` | "상품권 증정 EVENT" 배너 (남색+적색, 만원권 리본) |
| `landing-template/images/banner-top/top-banner-1.webp` | "24시간 문자상담" 배너 (HILLSTATE 로고) |
| `landing-template/images/banner-top/top-banner-2.webp` | "위치안내·방문안내·상담문의 / 1844-1588" 배너 |

> 파일명은 위 표와 **정확히 동일해야** 홈페이지에서 바로 보입니다(대소문자·확장자 포함). 갖고 계신 `.webp` 파일을 그대로 이 이름으로 저장하시면 됩니다.

---

## 3. 실제로 어디에 삽입되었는지 (index.html 기준)

| 위치 | 섹션 ID | 사용 이미지 |
| --- | --- | --- |
| 히어로 ↔ 관심고객 등록 사이 | `#event-banner-1` | event-banner.webp |
| 프리미엄 포인트 바로 위 (2개 연속) | `#promo-top-banners` | top-banner-1.webp, top-banner-2.webp |
| 단지개요 ↔ 위치안내 사이 | `#event-banner-2` | event-banner.webp |
| 미디어(인프라) ↔ FAQ 사이 | `#event-banner-3` | event-banner.webp |

---

## 4. 파일을 넣고 나서 (배포 방법)

이 프로젝트는 `main` 브랜치의 `landing-template` 폴더가 바뀌면 GitHub Actions가 자동으로 Cafe24 서버에 업로드하도록 이미 설정되어 있습니다 (자세한 내용은 `CAFE24_DEPLOY.md` 참고).

1. 위 표의 3개 파일을 해당 폴더에 저장
2. `git add landing-template/images/banner-event landing-template/images/banner-top`
3. `git commit -m "add: 이벤트/탑배너 이미지 추가"`
4. `main` 브랜치로 push (또는 현재 작업 브랜치에서 PR 후 병합)
5. GitHub Actions가 자동 배포 → `https://www.bunyanghouse.com/hillstate-suwon/` 에서 확인

---

## 5. 이미지 저장 시 권장 사항

- 형식: WEBP 그대로 사용 (JPG/PNG보다 용량이 작고 화질도 우수해 변환 불필요)
- 용량: 배너 1장당 500KB 이하 권장 (모바일 로딩 속도)
- 원본 비율을 그대로 유지해서 저장 (가로/세로를 따로 늘리거나 줄이지 마세요 — 사이트에서 자동으로 반응형 처리됩니다)
