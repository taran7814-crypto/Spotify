import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Vite base is "/" locally and "/Spotify/" on GitHub Pages.
    window.APP_BASE_PATH = import.meta.env.BASE_URL;

    // Prevent duplicate script insertion.
    const existingScript = document.querySelector(
      'script[data-spotify-player="true"]',
    );

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}JS/script.js`;
    script.dataset.spotifyPlayer = "true";

    script.onload = () => {
      console.log(
        "Spotify script loaded. Card container:",
        document.querySelector(".cardContainer"),
      );
    };

    script.onerror = () => {
      console.error("Failed to load Spotify script:", script.src);
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="spotify-logo"
          href={import.meta.env.BASE_URL}
          aria-label="Spotify home"
        >
          <img src={asset("img/logo.svg")} alt="Spotify" />
        </a>

        <button
          className="home-button"
          id="topHome"
          type="button"
          aria-label="Home"
        >
          <img src={asset("img/home.svg")} alt="" />
        </button>

        <label className="search-box">
          <img src={asset("img/search.svg")} alt="" />
          <input
            type="search"
            id="topSearchInput"
            placeholder="What do you want to play?"
            aria-label="Search songs and playlists"
          />
        </label>

        <div className="account-buttons">
          <button className="signupbtn" type="button">
            Sign up
          </button>
          <button className="loginbtn" type="button">
            Log in
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel" id="libraryPanel">
          <section className="library">
            <div className="library-heading">
              <img src={asset("img/playlist.svg")} alt="" />
              <h2>Your Playlist</h2>
            </div>

            <div className="songList">
              <ul />
            </div>
          </section>
        </aside>

        <section className="right-panel">
          <div className="spotifyPlaylists">
            <h1>Spotify Playlists</h1>

            <section id="albumPage" hidden>
              <button
                id="backToAlbums"
                type="button"
                aria-label="Back to albums"
              >
                ×
              </button>
              <div id="albumHeader" />
              <div id="albumContent" />
            </section>

            <div className="cardContainer" />
          </div>
        </section>
      </main>

      <footer className="playbar">
        <div className="player-left">
          <div className="songinfo">No song selected</div>
        </div>

        <div className="player-center">
          <div className="songbuttons">
            <button
              className="transport-button"
              type="button"
              aria-label="Previous"
            >
              <img src={asset("img/prevsong.svg")} alt="" id="previous" />
            </button>

            <button
              className="main-play-button"
              id="play"
              type="button"
              aria-label="Play"
            >
              <img src={asset("img/play.svg")} alt="" />
            </button>

            <button
              className="transport-button"
              type="button"
              aria-label="Next"
            >
              <img src={asset("img/nextsong.svg")} alt="" id="next" />
            </button>

            <button
              className="queue-button"
              id="queueButton"
              type="button"
              aria-label="Open library and queue"
              title="Queue / Library"
            >
              <span className="queue-glyph" aria-hidden="true">
                ☷
              </span>
            </button>
          </div>

          <div className="progress-row">
            <span className="current-time">00:00</span>
            <div
              className="seekbar"
              role="slider"
              aria-label="Seek through song"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="0"
            >
              <div className="circle" />
            </div>
            <span className="song-duration">00:00</span>
          </div>
        </div>

        <div className="player-right">
          <button
            className="queue-button"
            id="queueButton"
            type="button"
            aria-label="Open library and queue"
            title="Queue / Library"
          >
            <span className="queue-glyph" aria-hidden="true">
              Γÿ╖
            </span>
          </button>

          <div className="volume">
            <img src={asset("img/volume.svg")} alt="Volume" />
            <div className="range">
              <input
                type="range"
                name="volume"
                min="0"
                max="100"
                defaultValue="100"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </footer>

      <button
        className="mobile-drawer-backdrop"
        id="drawerBackdrop"
        type="button"
        aria-label="Close library"
        hidden
      />
    </div>
  );
}

export default App;
