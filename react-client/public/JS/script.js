
/* ========================= SPOTIFY CLONE ========================= */

/* GLOBAL STATE */

let currentSong = new Audio();
let songs = [];
let currentIndex = 0;
let currentFolder = "";
let isLoadingFolder = false;

let openAlbumSongs = [];
let openAlbumFolder = "";

let savedHomeScrollPosition = 0;
let savedClickedCard = null;
let savedClickedCardTop = 0;
let savedScrollContainer = null;

/* ALBUMS */

const albumFolders = [
  "4 Da Gang EP",
  "Adhi Tape",
  "Archives",
  "Aujla Szn 1",
  "Autobiography",
  "Bermuda Triangle",
  "Cloud 9",
  "DND EP",
  "G.O.A.T",
  "His Story",
  "I M Possible",
  "L.O.V.E EP",
  "Majhaestic",
  "No Lookin Back",
  "P-POP CULTURE",
  "Still Here",
  "Stolen Dreams",
  "The Brownprint",
  "The Simpsons",
  "Young G.O.A.T",
];

/* ARTISTS */

const artistFolders = [
  "Anuv Jain",
  "Ap Dhillon",
  "Garry Sandhu",
  "Gulab Sidhu",
  "Karan Aujla",
  "Nijjar",
  "Singga",
  "Nirvair Pannu",
];

/* URL HELPER
   Do not use import.meta in this plain JS file.
   App.jsx must set window.APP_BASE_PATH before loading this script.
*/

function makeURL(path) {
  const configuredBase = window.APP_BASE_PATH || "/";
  const base = configuredBase.endsWith("/")
    ? configuredBase
    : `${configuredBase}/`;

  const cleanPath = String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  const encodedPath = cleanPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}${encodedPath}`;
}

/* CLEAN SONG NAME */

function cleanSongName(fileName) {
  return String(fileName)
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* CLEAN FOLDER NAME */

function getDisplayFolderName(folder) {
  if (!folder) return "";

  return String(folder)
    .split("/")
    .pop()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ESCAPE HTML */

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* FORMAT TIME */

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";

  seconds = Math.max(0, Math.floor(seconds));

  return (
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}

/* SONG MANIFEST */

let songManifestPromise;

async function getSongs(folder) {
  try {
    if (!songManifestPromise) {
      songManifestPromise = fetch(makeURL("songs/songs.json"))
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `songs.json request failed: ${response.status}`
            );
          }

          return response.json();
        })
        .catch((error) => {
          songManifestPromise = null;
          throw error;
        });
    }

    const manifest = await songManifestPromise;

    const normalize = (value) =>
      String(value)
        .replace(/\\/g, "/")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase()
        .trim();

    const requestedFolder = normalize(folder);

    const matchingKey = Object.keys(manifest).find(
      (key) => normalize(key) === requestedFolder
    );

    if (!matchingKey) {
      console.error("Folder missing from songs.json:", folder);
      console.log("Available manifest keys:", Object.keys(manifest));
      return [];
    }

    const folderSongs = manifest[matchingKey];

    if (!Array.isArray(folderSongs)) {
      console.error(
        "Expected an array of songs for:",
        matchingKey,
        folderSongs
      );
      return [];
    }

    return folderSongs;
  } catch (error) {
    console.error("Error loading songs:", error);
    return [];
  }
}

/* MUSIC ANIMATION */

function createMusicLogo(isPlaying = false) {
  return `<div class="playing-icon ${isPlaying ? "is-playing" : ""}">
    <span></span><span></span><span></span><span></span>
    <span></span><span></span><span></span>
  </div>`;
}

/* UPDATE LIBRARY SONG LIST */

function updateSongList() {
  const songList = document.querySelector(".songList ul");
  if (!songList) return;

  songList.innerHTML = "";

  songs.forEach((song, index) => {
    const li = document.createElement("li");

    if (index === currentIndex) {
      li.classList.add("current-song");
    }

    const iconHTML =
      index === currentIndex && !currentSong.paused
        ? createMusicLogo(true)
        : `<img src="${makeURL("img/music.svg")}" alt="">`;

    li.innerHTML = `
      <div class="song-icon">${iconHTML}</div>
      <div class="info">
        <div>${escapeHTML(cleanSongName(song))}</div>
        <div>${escapeHTML(getDisplayFolderName(currentFolder))}</div>
      </div>
      <div class="playnow">
        <img src="${makeURL("img/play.svg")}" alt="">
      </div>
    `;

    li.addEventListener("click", () => playSong(index));
    songList.appendChild(li);
  });
}

/* UPDATE PLAYING SONG HIGHLIGHT */

function updatePlayingSong() {
  document.querySelectorAll(".songList li").forEach((item, index) => {
    const icon = item.querySelector(".song-icon");

    item.classList.toggle("current-song", index === currentIndex);

    if (icon) {
      icon.innerHTML =
        index === currentIndex && !currentSong.paused
          ? createMusicLogo(true)
          : `<img src="${makeURL("img/music.svg")}" alt="">`;
    }
  });
}

/* UPDATE PLAYBAR SONG INFORMATION */

function updatePlaybarSongInfo() {
  const songInfo = document.querySelector(".songinfo");
  if (!songInfo || !songs[currentIndex]) return;

  const songName = cleanSongName(songs[currentIndex]);
  const folderName = getDisplayFolderName(currentFolder);
  const isAlbum = albumFolders.includes(currentFolder);

  const coverPath = isAlbum
    ? "songs/albums/" + currentFolder + "/cover.jpg"
    : "songs/" + currentFolder + "/cover.jpg";

  songInfo.innerHTML = `
    <img
      class="nowPlayingCover"
      id="nowPlayingCover"
      src="${makeURL(coverPath)}"
      alt="${escapeHTML(folderName)} cover"
    >
    <div class="nowPlayingText">
      <div class="nowPlayingTitle">${escapeHTML(songName)}</div>
      <div class="nowPlayingSubtitle">${escapeHTML(folderName)}</div>
    </div>
  `;

  updatePlaybarState();
}

/* UPDATE PLAYBAR STATE */

function updatePlaybarState() {
  const playbar = document.querySelector(".playbar");

  if (playbar) {
    playbar.classList.toggle("is-playing", !currentSong.paused);
  }
}

/* PLAY SONG */

async function playSong(index, pause = false) {
  if (!songs[index]) return;

  currentIndex = index;
  currentSong.pause();

  currentSong.src = makeURL(
    "songs/" + currentFolder + "/" + songs[index]
  );

  currentSong.load();

  updatePlaybarSongInfo();
  updatePlayingSong();

  if (!pause) {
    try {
      await currentSong.play();
    } catch (error) {
      console.warn("Playback could not start:", error);
    }
  }

  updatePlayButton();
  updatePlayingSong();
  updatePlaybarState();
}

/* LOAD FOLDER */

async function loadFolder(folder) {
  if (isLoadingFolder) return;

  isLoadingFolder = true;

  try {
    currentFolder = folder;
    songs = await getSongs(folder);
    currentIndex = 0;

    updateSongList();

    if (songs.length > 0) {
      await playSong(0);
    } else {
      console.warn("No audio files found in:", folder);
    }
  } finally {
    isLoadingFolder = false;
  }
}

/* FIND SCROLL CONTAINER */

function findScrollContainer(element) {
  let current = element;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const style = window.getComputedStyle(current);

    const canScroll =
      /(auto|scroll|overlay)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight;

    if (canScroll) return current;

    current = current.parentElement;
  }

  return document.scrollingElement || document.documentElement;
}

/* SAVE HOME POSITION */

function saveHomePosition(card) {
  savedClickedCard = card || null;
  savedScrollContainer = card ? findScrollContainer(card) : null;

  if (savedScrollContainer) {
    savedHomeScrollPosition = savedScrollContainer.scrollTop;
    savedClickedCardTop = card.getBoundingClientRect().top;
  } else {
    savedHomeScrollPosition = window.scrollY || 0;
    savedClickedCardTop = card ? card.getBoundingClientRect().top : 0;
  }
}

/* RESTORE HOME POSITION */

function restoreHomePosition() {
  const cardContainer = document.querySelector(".cardContainer");

  if (cardContainer) cardContainer.hidden = false;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (savedClickedCard && savedClickedCard.isConnected) {
        const newTop = savedClickedCard.getBoundingClientRect().top;
        const difference = newTop - savedClickedCardTop;

        if (savedScrollContainer && savedScrollContainer.isConnected) {
          savedScrollContainer.scrollTop += difference;

          if (Math.abs(difference) < 1) {
            savedScrollContainer.scrollTop = savedHomeScrollPosition;
          }
        } else {
          window.scrollTo(0, savedHomeScrollPosition);
        }
      } else if (
        savedScrollContainer &&
        savedScrollContainer.isConnected
      ) {
        savedScrollContainer.scrollTop = savedHomeScrollPosition;
      } else {
        window.scrollTo(0, savedHomeScrollPosition);
      }
    });
  });
}

/* OPEN ALBUM / ARTIST DETAIL PAGE */

async function openAlbumPage(
  folderPath,
  title,
  imagePath,
  type = "album",
  clickedCard = null
) {
  const cardContainer = document.querySelector(".cardContainer");
  const albumPage = document.querySelector("#albumPage");
  const albumContent = document.querySelector("#albumContent");
  const closeButton = document.querySelector("#backToAlbums");

  if (!cardContainer) return;

  if (closeButton) {
    closeButton.hidden = false;
    closeButton.style.display = "flex";
  }

  saveHomePosition(clickedCard);

  if (albumPage && albumContent) {
    cardContainer.hidden = true;

    albumPage.classList.remove("album-closing", "album-visible");
    albumPage.hidden = false;

    void albumPage.offsetWidth;

    requestAnimationFrame(() => {
      albumPage.classList.add("album-visible");
    });

    albumContent.innerHTML = "<p>Loading songs...</p>";

    const albumSongs = await getSongs(folderPath);

    openAlbumFolder = folderPath;
    openAlbumSongs = albumSongs;

    albumContent.innerHTML = `
      <div class="album-hero">
        <img
          class="album-cover"
          src="${makeURL(imagePath)}"
          alt="${escapeHTML(title)}"
        >

        <div class="album-info">
          <p>${escapeHTML(type.toUpperCase())}</p>
          <h2>${escapeHTML(title)}</h2>
          <p>${albumSongs.length} songs</p>
        </div>
      </div>

      <div class="album-actions">
        <button
          class="album-play-button"
          id="albumPlayButton"
          type="button"
          aria-label="Play album"
          title="Play album"
          ${albumSongs.length ? "" : "disabled"}
        >
          <img src="${makeURL("img/play.svg")}" alt="">
        </button>
      </div>

      <div class="album-tracks">
        ${
          albumSongs.length
            ? albumSongs.map((song, index) => `
              <button
                class="album-track"
                type="button"
                data-index="${index}"
              >
                <span class="track-number">${index + 1}</span>
                <span class="track-name">
                  ${escapeHTML(cleanSongName(song))}
                </span>
                <span class="track-play">▶</span>
              </button>
            `).join("")
            : "<p>No songs found in this folder.</p>"
        }
      </div>
    `;

    const albumPlayButton =
      albumContent.querySelector("#albumPlayButton");

    albumPlayButton?.addEventListener("click", async () => {
      if (!albumSongs.length) return;

      currentFolder = folderPath;
      songs = albumSongs;
      currentIndex = 0;

      updateSongList();
      await playSong(0);
    });

    albumContent.querySelectorAll(".album-track").forEach((track) => {
      track.addEventListener("click", async () => {
        currentFolder = folderPath;
        songs = albumSongs;
        currentIndex = Number(track.dataset.index);

        updateSongList();
        await playSong(currentIndex);
      });
    });

    const rightSection = document.querySelector(".spotifyPlaylists");

    if (rightSection) rightSection.scrollTop = 0;

    return;
  }

  /* FALLBACK FOR OLDER ALBUM DETAIL CONTAINER */

  const oldDetail = document.querySelector("#albumDetail");
  if (!oldDetail) return;

  cardContainer.hidden = true;
  oldDetail.hidden = false;
  oldDetail.innerHTML = "<p>Loading songs...</p>";

  const albumSongs = await getSongs(folderPath);

  oldDetail.innerHTML = `
    <div class="album-hero">
      <img
        src="${makeURL(imagePath)}"
        alt="${escapeHTML(title)}"
      >
      <div>
        <p>${escapeHTML(type.toUpperCase())}</p>
        <h2>${escapeHTML(title)}</h2>
        <p>${albumSongs.length} songs</p>
      </div>
    </div>

    <div class="album-actions">
      <button
        class="album-play-button"
        id="albumPlayButton"
        type="button"
        aria-label="Play album"
        ${albumSongs.length ? "" : "disabled"}
      >
        <img src="${makeURL("img/play.svg")}" alt="">
      </button>
    </div>

    <div class="album-tracks">
      ${
        albumSongs.map((song, index) => `
          <button
            class="album-track"
            type="button"
            data-index="${index}"
          >
            <span class="track-number">${index + 1}</span>
            <span class="track-name">
              ${escapeHTML(cleanSongName(song))}
            </span>
            <span class="track-play">▶</span>
          </button>
        `).join("") || "<p>No songs found in this folder.</p>"
      }
    </div>
  `;

  oldDetail
    .querySelector("#albumPlayButton")
    ?.addEventListener("click", async () => {
      if (!albumSongs.length) return;

      currentFolder = folderPath;
      songs = albumSongs;
      currentIndex = 0;

      updateSongList();
      await playSong(0);
    });

  oldDetail.querySelectorAll(".album-track").forEach((track) => {
    track.addEventListener("click", async () => {
      currentFolder = folderPath;
      songs = albumSongs;
      currentIndex = Number(track.dataset.index);

      updateSongList();
      await playSong(currentIndex);
    });
  });
}

/* CLOSE ALBUM */

function closeAlbumPage() {
  const cardContainer = document.querySelector(".cardContainer");
  const albumPage = document.querySelector("#albumPage");
  const oldDetail = document.querySelector("#albumDetail");
  const backButton = document.querySelector("#backToAlbums");

  if (backButton) backButton.hidden = true;

  if (albumPage && !albumPage.hidden) {
    albumPage.classList.remove("album-visible");
    albumPage.classList.add("album-closing");

    let finished = false;

    const finishClose = (event) => {
      if (
        event &&
        (event.target !== albumPage || event.propertyName !== "opacity")
      ) {
        return;
      }

      if (finished) return;
      finished = true;

      albumPage.removeEventListener("transitionend", finishClose);
      albumPage.hidden = true;
      albumPage.classList.remove("album-closing");

      if (cardContainer) cardContainer.hidden = false;
      if (oldDetail) oldDetail.hidden = true;

      restoreHomePosition();
    };

    albumPage.addEventListener("transitionend", finishClose);
    window.setTimeout(() => finishClose(), 400);
  } else {
    if (oldDetail) oldDetail.hidden = true;
    if (cardContainer) cardContainer.hidden = false;

    restoreHomePosition();
  }
}

/* BACK BUTTON */

document
  .querySelector("#backToAlbums")
  ?.addEventListener("click", closeAlbumPage);

document.querySelector("#topHome")?.addEventListener("click", () => {
  const albumPage = document.querySelector("#albumPage");
  const albumDetail = document.querySelector("#albumDetail");
  const cardContainer = document.querySelector(".cardContainer");

  if (albumPage) {
    albumPage.classList.remove("album-visible", "album-closing");
    albumPage.hidden = true;
  }

  if (albumDetail) albumDetail.hidden = true;

  if (cardContainer) cardContainer.hidden = false;

  const backButton = document.querySelector("#backToAlbums");

  if (backButton) {
    backButton.hidden = true;
    backButton.style.removeProperty("display");
  }

  const scrollArea =
    document.querySelector(".right-panel") ||
    document.querySelector(".right") ||
    document.querySelector(".spotifyPlaylists");

  if (scrollArea) {
    scrollArea.scrollTo({ top: 0, behavior: "smooth" });
  }
});

/* DISPLAY ALBUM AND ARTIST CARDS */

function displayCards() {
  const cardContainer = document.querySelector(".cardContainer");

  if (!cardContainer) {
    console.error("Could not find .cardContainer in the page.");
    return;
  }

  cardContainer.innerHTML = "";

  const albumTitle = document.createElement("div");
  albumTitle.className = "section-title";
  albumTitle.textContent = "Albums";
  cardContainer.appendChild(albumTitle);

  albumFolders.forEach((folder) => {
    cardContainer.appendChild(
      createCard(
        folder,
        "songs/albums/" + folder + "/cover.jpg",
        "Album",
        false
      )
    );
  });

  const artistTitle = document.createElement("div");
  artistTitle.className = "section-title";
  artistTitle.textContent = "Artists";
  cardContainer.appendChild(artistTitle);

  artistFolders.forEach((folder) => {
    const artistFolderPath = folder.toLowerCase();

    cardContainer.appendChild(
      createCard(
        folder,
        "songs/" + artistFolderPath + "/cover.jpg",
        "Artist",
        true
      )
    );
  });
}

/* CREATE CARD */

function createCard(folder, imagePath, type, isArtist) {
  const card = document.createElement("div");
  card.className = "card";

  if (isArtist) card.classList.add("artist-card");

  const title = getDisplayFolderName(folder);

  card.innerHTML = `
    <div class="cover">
      <img
        src="${makeURL(imagePath)}"
        alt="${escapeHTML(title)}"
        loading="lazy"
      >
    </div>

    <div class="card-title">${escapeHTML(title)}</div>
    <div class="card-subtitle">${escapeHTML(type)}</div>

    <button
      class="playButton"
      type="button"
      aria-label="Play ${escapeHTML(title)}"
    >
      <img src="${makeURL("img/play.svg")}" alt="">
    </button>
  `;

  const folderPath = isArtist
    ? folder.toLowerCase()
    : "albums/" + folder;

  card.querySelector(".playButton").addEventListener("click", (event) => {
    event.stopPropagation();
    loadFolder(folderPath);
  });

  card.addEventListener("click", () => {
    openAlbumPage(folderPath, title, imagePath, type, card);
  });

  return card;
}

/* UPDATE PLAY / PAUSE BUTTON */

/* UPDATE PLAY / PAUSE BUTTON — FIXED */

function updatePlayButton() {
  const playButton = document.querySelector("#play");
  if (!playButton) return;

  // #play may be a button containing an img, or the img itself.
  const playIcon =
    playButton.tagName === "IMG"
      ? playButton
      : playButton.querySelector("img");

  if (playIcon) {
    playIcon.src = makeURL(
      currentSong.paused ? "img/play.svg" : "img/pause.svg"
    );

    playIcon.alt = currentSong.paused ? "Play" : "Pause";
  }

  // Keep accessibility labels in sync.
  const button =
    playButton.tagName === "BUTTON"
      ? playButton
      : playButton.closest("button");

  if (button) {
    button.setAttribute(
      "aria-label",
      currentSong.paused ? "Play" : "Pause"
    );
    button.setAttribute(
      "title",
      currentSong.paused ? "Play" : "Pause"
    );
  }

  updatePlaybarState();
}

/* PLAY / PAUSE BUTTON */

function setupPlayButton() {
  const playButton = document.querySelector("#play");
  if (!playButton) return;

  playButton.addEventListener("click", async () => {
    if (!currentSong.src) return;

    if (currentSong.paused) {
      try {
        await currentSong.play();
      } catch (error) {
        console.warn("Playback failed:", error);
      }
    } else {
      currentSong.pause();
    }

    updatePlayButton();
    updatePlayingSong();
  });
}

/* NEXT BUTTON */

function setupNextButton() {
  const nextButton = document.querySelector("#next");
  if (!nextButton) return;

  nextButton.addEventListener("click", () => {
    if (!songs.length) return;

    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
  });
}

/* PREVIOUS BUTTON */

function setupPreviousButton() {
  const previousButton = document.querySelector("#previous");
  if (!previousButton) return;

  previousButton.addEventListener("click", () => {
    if (!songs.length) return;

    if (currentSong.currentTime > 3) {
      currentSong.currentTime = 0;
      return;
    }

    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(currentIndex);
  });
}

/* AUTO NEXT SONG */

function setupAutoNext() {
  currentSong.addEventListener("ended", () => {
    if (!songs.length) return;

    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
  });
}

/* UPDATE SONG TIME */

function setupTimeUpdate() {
  currentSong.addEventListener("timeupdate", () => {
    const currentTimeLabel = document.querySelector(".current-time");
    const durationLabel = document.querySelector(".song-duration");
    const circle = document.querySelector(".circle");
    const seekFill = document.querySelector(".seek-fill");

    if (currentTimeLabel) {
      currentTimeLabel.textContent = formatTime(currentSong.currentTime);
    }

    if (Number.isFinite(currentSong.duration) && currentSong.duration > 0) {
      const percentage =
        (currentSong.currentTime / currentSong.duration) * 100;

      if (durationLabel) {
        durationLabel.textContent = formatTime(currentSong.duration);
      }

      if (circle) circle.style.left = percentage + "%";
      if (seekFill) seekFill.style.width = percentage + "%";
    }
  });
}

/* SEEKBAR */

function setupSeekbar() {
  const seekbar = document.querySelector(".seekbar");
  if (!seekbar) return;

  if (!seekbar.querySelector(".seek-fill")) {
    const fill = document.createElement("div");
    fill.className = "seek-fill";
    seekbar.insertBefore(fill, seekbar.firstChild);
  }

  seekbar.addEventListener("click", (event) => {
    if (!Number.isFinite(currentSong.duration) || currentSong.duration <= 0) {
      return;
    }

    const rect = seekbar.getBoundingClientRect();
    if (!rect.width) return;

    const percentage = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width)
    );

    currentSong.currentTime = percentage * currentSong.duration;
  });
}

/* VOLUME */

function setupVolume() {
  const volumeInput = document.querySelector('input[name="volume"]');
  const volumeIcon = document.querySelector(".volume > img");

  if (!volumeInput) return;

  volumeInput.min = 0;
  volumeInput.max = 100;
  volumeInput.value = 100;
  currentSong.volume = 1;

  volumeInput.addEventListener("input", () => {
    const value = Number(volumeInput.value) / 100;
    currentSong.volume = value;

    if (volumeIcon) {
      volumeIcon.src =
        value === 0
          ? makeURL("img/mute.svg")
          : makeURL("img/volume.svg");
    }
  });

  volumeIcon?.addEventListener("click", () => {
    if (currentSong.volume > 0) {
      currentSong.dataset.previousVolume = currentSong.volume;
      currentSong.volume = 0;
      volumeInput.value = 0;
      volumeIcon.src = makeURL("img/mute.svg");
    } else {
      const previous =
        Number(currentSong.dataset.previousVolume) || 1;

      currentSong.volume = previous;
      volumeInput.value = Math.round(previous * 100);
      volumeIcon.src = makeURL("img/volume.svg");
    }
  });
}

/* AUDIO EVENTS */

function setupAudioEvents() {
  currentSong.addEventListener("play", () => {
    updatePlayButton();
    updatePlayingSong();
    updatePlaybarState();
  });

  currentSong.addEventListener("pause", () => {
    updatePlayButton();
    updatePlayingSong();
    updatePlaybarState();
  });

  currentSong.addEventListener("loadedmetadata", () => {
    const currentTimeLabel = document.querySelector(".current-time");
    const durationLabel = document.querySelector(".song-duration");

    if (currentTimeLabel) {
      currentTimeLabel.textContent = "00:00";
    }

    if (durationLabel) {
      durationLabel.textContent = formatTime(currentSong.duration);
    }
  });
}

/* KEYBOARD SPACEBAR */

function setupKeyboard() {
  document.addEventListener("keydown", (event) => {
    const target = event.target;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();

      if (!currentSong.src) return;

      if (currentSong.paused) {
        currentSong
          .play()
          .catch((error) => console.warn("Playback failed:", error));
      } else {
        currentSong.pause();
      }
    }
  });
}

/* MOBILE LIBRARY DRAWER */

function setupMobileLibraryDrawer() {
  const queueButton = document.querySelector("#queueButton");
  const sidebar = document.querySelector(".left-panel");
  const backdrop = document.querySelector("#drawerBackdrop");

  if (!sidebar) return;

  const isMobile = () =>
    window.matchMedia("(max-width: 760px)").matches;

  const closeDrawer = () => {
    sidebar.classList.remove("mobile-open");
    document.body.classList.remove("library-drawer-open");
  };

  const toggleDrawer = () => {
    if (!isMobile()) return;

    const willOpen = !sidebar.classList.contains("mobile-open");

    sidebar.classList.toggle("mobile-open", willOpen);
    document.body.classList.toggle("library-drawer-open", willOpen);
  };

  queueButton?.addEventListener("click", toggleDrawer);
  backdrop?.addEventListener("click", closeDrawer);

  sidebar.addEventListener("click", (event) => {
    if (event.target.closest(".songList li")) {
      closeDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) closeDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
}

/* INITIALIZE */

function main() {
  displayCards();
  setupPlayButton();
  setupNextButton();
  setupPreviousButton();
  setupAutoNext();
  setupTimeUpdate();
  setupSeekbar();
  setupVolume();
  setupAudioEvents();
  setupKeyboard();
  setupMobileLibraryDrawer();
  updatePlayButton();
}

main();
