# 이지은 포트폴리오 — Frontend Developer

인터랙션·반응형·웹 접근성 중심의 포트폴리오 사이트입니다. 빌드 도구 없이 HTML·CSS·Vanilla JS(ES Modules)로 만들었고 GitHub Pages에 그대로 배포됩니다.

## 구조

```
index.html            # 페이지 골격 (내용은 JS가 data.js로 채움)
en/index.html         # 예전 영어 주소 → ?lang=en 으로 이동
assets/
  css/style.css       # 디자인 토큰 + 전체 스타일 (반응형, reduced-motion 대응)
  js/data.js          # ✏️ 모든 텍스트(KO/EN), 프로젝트, 컴포넌트 목록 — 내용 수정은 여기만
  js/main.js          # 렌더링 + 인터랙션
  img/work/           # 프로젝트 스크린샷
  img/lab/            # 컴포넌트 썸네일
```

## 섹션

1. **Hero** — 인트로 로더, 문장 등장 애니메이션, 마우스를 따라가는 배경 빛, 숫자 카운트업
2. **Selected Work** — 대표 프로젝트 5개. 카드를 누르면 문제 → 판단 → 구현 → 결과 케이스 스터디 시트가 열림
3. **Component Lab** — [whitexhanin/components](https://github.com/whitexhanin/components)의 컴포넌트 41개를 카테고리 필터로 정리. 카드를 누르면 실제 데모를 iframe으로 실행하고 모바일/태블릿/데스크톱 폭으로 바꿔볼 수 있음
4. **Capabilities / Experience / Contact**

## 인터랙션 & 접근성

- 스크롤 등장, 이미지 패럴랙스, 마그네틱 버튼, 카드 스포트라이트, 커스텀 커서(마우스 환경만)
- 시트: 포커스 트랩, Esc 닫기, 포커스 복귀, 모바일에서는 바텀시트 + 아래로 스와이프해서 닫기
- `prefers-reduced-motion` 사용 시 모든 모션 비활성화, 키보드 포커스 스타일, 본문 바로가기 링크

## 수정 방법

- 텍스트·프로젝트 내용: `assets/js/data.js`의 `content.ko` / `content.en`
- 컴포넌트 추가: components 저장소에 폴더를 만든 뒤 `data.js`의 `components` 배열에 `{ name, cat, path, thumb }` 추가 (썸네일은 `assets/img/lab/<thumb>.jpg`)

## 로컬 실행

ES Modules를 쓰므로 파일을 직접 열지 말고 로컬 서버로 실행하세요.

```bash
python3 -m http.server 8000
```
