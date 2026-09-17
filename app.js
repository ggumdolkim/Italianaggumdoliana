(() => {
  const lessons = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const libraryView = document.getElementById("library-view");
  const lessonView = document.getElementById("lesson-view");
  const homeButton = document.getElementById("home-button");
  const lessonGrid = document.getElementById("lesson-grid");
  const cardTemplate = document.getElementById("lesson-card-template");
  const list = document.getElementById("sentences");
  const nowIt = document.getElementById("now-it");
  const nowKo = document.getElementById("now-ko");
  const repeatBtn = document.getElementById("repeat-btn");
  const speedBtn = document.getElementById("speed-btn");
  const translationBtn = document.getElementById("translation-btn");
  const italianBtn = document.getElementById("italian-btn");

  let currentLesson = null;
  let player = null;
  let playerReady = false;
  let youtubeReady = false;
  let pendingIndex = -1;
  let activeIndex = -1;
  let repeatOn = false;
  let speed = 1;
  let monitorId = null;

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function renderLibrary() {
    document.getElementById("library-count").textContent = `현재 ${lessons.length}개 영상 · ${lessons.reduce((sum, lesson) => sum + lesson.sentences.length, 0)}개 문장`;
    lessonGrid.textContent = "";

    lessons.forEach((lesson) => {
      const card = cardTemplate.content.firstElementChild.cloneNode(true);
      const button = card.querySelector(".card-link");
      const image = card.querySelector(".thumbnail");
      image.src = `https://i.ytimg.com/vi/${lesson.videoId}/hqdefault.jpg`;
      image.alt = `${lesson.title} 영상 썸네일`;
      card.querySelector(".card-duration").textContent = lesson.durationLabel;
      card.querySelector(".card-level").textContent = lesson.level;
      card.querySelector(".card-sentence-count").textContent = `${lesson.sentences.length}문장`;
      card.querySelector(".card-title").textContent = lesson.title;
      card.querySelector(".card-topic").textContent = lesson.topic;
      button.setAttribute("aria-label", `${lesson.title} 학습 시작`);
      button.addEventListener("click", () => openLesson(lesson.id, true));
      lessonGrid.appendChild(card);
    });
  }

  function resetLessonState() {
    pendingIndex = -1;
    activeIndex = -1;
    repeatOn = false;
    speed = 1;
    repeatBtn.setAttribute("aria-pressed", "false");
    repeatBtn.textContent = "↻ 반복 꺼짐";
    speedBtn.setAttribute("aria-pressed", "false");
    speedBtn.textContent = "속도 1×";
    document.body.classList.remove("translation-off", "italian-hidden");
    translationBtn.setAttribute("aria-pressed", "false");
    translationBtn.textContent = "번역 가리기";
    italianBtn.setAttribute("aria-pressed", "false");
    italianBtn.textContent = "이탈리아어 가리기";
    nowIt.textContent = "문장을 눌러 시작하세요.";
    nowIt.className = "now-it idle";
    nowKo.textContent = "";
  }

  function renderSentences() {
    list.textContent = "";
    const fragment = document.createDocumentFragment();
    currentLesson.sentences.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sentence";
      button.setAttribute("aria-label", `${index + 1}번 문장 재생: ${item.it}`);

      const number = document.createElement("span");
      number.className = "number";
      number.textContent = String(index + 1).padStart(2, "0");

      const textWrap = document.createElement("span");
      textWrap.className = "text-wrap";
      const italian = document.createElement("span");
      italian.className = "it";
      italian.textContent = item.it;
      const korean = document.createElement("span");
      korean.className = "ko";
      korean.textContent = item.ko;
      textWrap.append(italian, korean);

      const time = document.createElement("span");
      time.className = "time";
      time.textContent = formatTime(item.start);
      button.append(number, textWrap, time);
      button.addEventListener("click", () => playSentence(index));
      fragment.appendChild(button);
    });
    list.appendChild(fragment);
  }

  function setLessonContent() {
    document.getElementById("lesson-level").textContent = currentLesson.level;
    document.getElementById("lesson-number").textContent = `LESSON ${String(currentLesson.order).padStart(2, "0")}`;
    document.getElementById("lesson-title").textContent = currentLesson.title;
    document.getElementById("lesson-source-line").textContent = `${currentLesson.creator} · ${currentLesson.rangeLabel}`;
    document.getElementById("sentence-heading").textContent = `${currentLesson.sentences.length}개 문장`;
    document.getElementById("lesson-duration").textContent = currentLesson.durationLabel;

    const source = document.getElementById("source-note");
    source.textContent = "학습 영상: ";
    const link = document.createElement("a");
    link.href = currentLesson.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = currentLesson.videoTitle;
    source.append(link, document.createElement("br"), "영상과 음성의 저작권은 원저작자에게 있습니다. 이 페이지는 YouTube 임베드 플레이어를 사용합니다.");
    document.title = `${currentLesson.title} · Italiano Replay`;
  }

  function openLesson(id, updateHistory) {
    const lesson = lessons.find((item) => item.id === id);
    if (!lesson) return showLibrary(updateHistory);
    currentLesson = lesson;
    resetLessonState();
    setLessonContent();
    renderSentences();
    libraryView.hidden = true;
    lessonView.hidden = false;
    homeButton.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
    loadVideo();
    if (updateHistory) history.pushState({ lesson: id }, "", `?lesson=${encodeURIComponent(id)}`);
  }

  function showLibrary(updateHistory = true) {
    if (player && typeof player.pauseVideo === "function") player.pauseVideo();
    currentLesson = null;
    libraryView.hidden = false;
    lessonView.hidden = true;
    homeButton.hidden = true;
    document.title = "Italiano Replay";
    window.scrollTo({ top: 0, behavior: "auto" });
    if (updateHistory) history.pushState({}, "", location.pathname);
  }

  function loadVideo() {
    playerReady = false;
    document.getElementById("player-message").hidden = true;
    if (!youtubeReady || !window.YT || !window.YT.Player) return;

    if (player && typeof player.cueVideoById === "function") {
      player.cueVideoById({ videoId: currentLesson.videoId });
      player.setPlaybackRate(speed);
      playerReady = true;
      return;
    }

    player = new YT.Player("player", {
      videoId: currentLesson.videoId,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          playerReady = true;
          player.setPlaybackRate(speed);
          if (!monitorId) monitorId = window.setInterval(monitorPlayback, 100);
          if (pendingIndex >= 0) playSentence(pendingIndex);
        },
        onError: () => { document.getElementById("player-message").hidden = false; }
      }
    });
  }

  function setActive(index) {
    activeIndex = index;
    document.querySelectorAll(".sentence").forEach((row, rowIndex) => {
      row.classList.toggle("active", rowIndex === index);
      row.setAttribute("aria-current", rowIndex === index ? "true" : "false");
    });
    const item = currentLesson.sentences[index];
    nowIt.textContent = item.it;
    nowIt.classList.remove("idle");
    nowKo.textContent = item.ko;
  }

  function playSentence(index) {
    if (!currentLesson) return;
    setActive(index);
    if (!playerReady || !player || typeof player.seekTo !== "function") {
      pendingIndex = index;
      return;
    }
    pendingIndex = -1;
    player.setPlaybackRate(speed);
    player.seekTo(currentLesson.sentences[index].start, true);
    player.playVideo();
  }

  function monitorPlayback() {
    if (!currentLesson || activeIndex < 0 || !player || typeof player.getCurrentTime !== "function") return;
    const item = currentLesson.sentences[activeIndex];
    const current = player.getCurrentTime();
    if (current >= item.end - .08) {
      if (repeatOn) {
        player.seekTo(item.start, true);
        player.playVideo();
      } else {
        player.pauseVideo();
        player.seekTo(item.end, true);
      }
    }
  }

  window.onYouTubeIframeAPIReady = () => {
    youtubeReady = true;
    if (currentLesson) loadVideo();
  };

  repeatBtn.addEventListener("click", () => {
    repeatOn = !repeatOn;
    repeatBtn.setAttribute("aria-pressed", String(repeatOn));
    repeatBtn.textContent = repeatOn ? "↻ 반복 켜짐" : "↻ 반복 꺼짐";
  });
  speedBtn.addEventListener("click", () => {
    speed = speed === 1 ? 1.25 : 1;
    speedBtn.setAttribute("aria-pressed", String(speed === 1.25));
    speedBtn.textContent = speed === 1.25 ? "속도 1.25×" : "속도 1×";
    if (player && typeof player.setPlaybackRate === "function") player.setPlaybackRate(speed);
  });
  translationBtn.addEventListener("click", () => {
    const hidden = document.body.classList.toggle("translation-off");
    translationBtn.setAttribute("aria-pressed", String(hidden));
    translationBtn.textContent = hidden ? "번역 보기" : "번역 가리기";
  });
  italianBtn.addEventListener("click", () => {
    const hidden = document.body.classList.toggle("italian-hidden");
    italianBtn.setAttribute("aria-pressed", String(hidden));
    italianBtn.textContent = hidden ? "이탈리아어 보기" : "이탈리아어 가리기";
  });
  homeButton.addEventListener("click", () => showLibrary(true));
  window.addEventListener("popstate", routeFromUrl);
  window.addEventListener("beforeunload", () => { if (monitorId) window.clearInterval(monitorId); });

  function routeFromUrl() {
    const id = new URLSearchParams(location.search).get("lesson");
    if (id) openLesson(id, false);
    else showLibrary(false);
  }

  renderLibrary();
  routeFromUrl();
  const youtubeApi = document.createElement("script");
  youtubeApi.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(youtubeApi);
})();
