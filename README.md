# Italiano Replay

유튜브 영상의 짧은 구간을 문장별로 반복 학습하는 정적 웹사이트입니다.

## GitHub Pages 업데이트

이 폴더의 파일 5개를 기존 저장소의 최상위 위치에 업로드하고 기존 파일을 덮어쓴 뒤 `Commit changes`를 누르세요. Pages 설정은 다시 할 필요가 없습니다.

- `index.html`
- `style.css`
- `lessons.js`
- `app.js`
- `README.md`

## 새 영상 추가

`lessons.js`의 `LESSONS` 배열 안에 기존 강의 객체를 복사해 새 객체를 추가합니다.

반드시 바꿀 값:

- `id`: 겹치지 않는 영문 주소용 이름
- `order`: 강의 번호
- `title`, `topic`, `level`
- `creator`, `videoTitle`, `videoId`, `sourceUrl`
- `durationLabel`, `rangeLabel`
- `sentences`: 각 문장의 `start`, `end`, `it`, `ko`

저장 후 GitHub에 업로드하고 커밋하면 영상 카드와 학습 페이지가 자동으로 추가됩니다.
