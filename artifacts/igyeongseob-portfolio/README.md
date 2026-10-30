# 이경섭 포트폴리오

정적 HTML/CSS/JavaScript로 만든 1페이지 포트폴리오입니다. 별도 API나 서버 없이 동작하며 Vite는 개발 및 빌드 도구로만 사용합니다.

## 파일 구조

- `index.html` — 페이지 콘텐츠와 시맨틱 구조
- `css/styles.css` — 색상, 레이아웃, 반응형 스타일, 모션
- `js/main.js` — 프로젝트 상세 창과 모바일 메뉴 동작
- `assets/favicon.svg` — 브라우저 탭 아이콘
- `dist/public/` — `pnpm --filter @workspace/igyeongseob-portfolio run build` 결과물

## 정보 수정

- 이름, 소개 문장, 계기, 강점, 기술 목록, 연락처는 `index.html`에서 수정합니다.
- 프로젝트의 제목, 기간, 역할, 목적은 `index.html`의 프로젝트 항목에서 수정합니다.
- 프로젝트의 어려움, 해결 과정, 배운 점은 `js/main.js` 상단의 `experiences` 항목에서 수정합니다.
- 스타일은 `css/styles.css`에서 조정합니다.
- 실제로 제공되지 않은 활동이나 기술 사용 사례는 추가하지 않았습니다.

## GitHub Pages 배포

1. `index.html`, `css/`, `js/`, `assets/`를 GitHub 저장소의 루트에 복사합니다. `docs/` 폴더를 배포하려면 이 네 항목을 그 안에 둡니다.
2. 저장소의 **Settings → Pages**에서 배포할 브랜치와 폴더(`/(root)` 또는 `/docs`)를 선택합니다.
3. 빌드 없이 정적 파일을 바로 배포하거나, 빌드하려면 `pnpm --filter @workspace/igyeongseob-portfolio run build`를 실행해 `dist/public/`의 내용을 배포 대상으로 사용합니다.

상대 경로(`./css/styles.css`, `./js/main.js`)와 Vite의 상대 base 설정을 사용해 저장소 하위 경로에서도 리소스가 동작합니다.
