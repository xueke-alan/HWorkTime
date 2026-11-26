import Button from "antd/es/button";
import { HeartIcon } from "../phosphor-icons";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";

interface Track {
  path: string;
  title: string;
  artist?: string;
  album?: string;
  error?: string;
}
interface TrackListProps {
  tracks: Track[];
  current?: string;
  noResults: boolean;
  favorite: (track: Track) => boolean;
  play: (track: Track) => void;
  toggle: (track: Track, icon: Element | null) => void;
  clear: () => void;
  text: (key: string) => string;
}
function TrackList({
  tracks,
  current,
  noResults,
  favorite,
  play,
  toggle,
  clear,
  text,
}: TrackListProps) {
  useLanguage();
  return (
    <>
      {tracks.map((track, index) => {
        const selected = track.path === current;
        const starred = favorite(track);
        const favoriteLabel = text(starred ? "unfavorite" : "favorite");
        return (
          <div
            key={track.path}
            className={"music-track" + (selected ? " is-current" : "")}
            role="listitem"
          >
            <Button
              className="music-track-select"
              data-music-path={track.path}
              aria-current={selected}
              data-hint-text={track.path}
              onClick={() => play(track)}
            >
              <span className="music-track-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="music-track-identity">
                <strong>{track.title}</strong>
                <span className="music-track-subtitle">
                  {[track.artist, track.album].filter(Boolean).join(" · ") ||
                    track.path}
                </span>
                {track.error && (
                  <span className="music-track-error">{text(track.error)}</span>
                )}
              </span>
              <span className="music-track-album">{track.album || "—"}</span>
            </Button>
            <Button
              className="music-button music-favorite music-track-favorite"
              data-music-glyph="heart"
              data-music-favorite={track.path}
              aria-pressed={starred}
              aria-label={favoriteLabel}
              data-hint-text={favoriteLabel}
              onClick={(event) =>
                toggle(track, event.currentTarget.querySelector(".music-glyph"))
              }
            >
              <span className="music-glyph" aria-hidden="true">
                <HeartIcon />
              </span>
            </Button>
          </div>
        );
      })}
      {noResults && (
        <div className="music-empty">
          <p>{text("noResults")}</p>
          <Button className="music-button" onClick={clear}>
            {text("clearSearch")}
          </Button>
        </div>
      )}
    </>
  );
}
interface LyricsProps {
  lines?: { time: number; text: string }[];
  plain?: string;
  active: number;
  seek: (time: number) => void;
  text: (key: string) => string;
}
function Lyrics({ lines, plain, active, seek, text }: LyricsProps) {
  useLanguage();
  if (!lines?.length)
    return (
      <>
        <p className="music-plain-lyrics">{plain || text("noLyrics")}</p>
        {!plain && <p className="music-lyric-hint">{text("lyricHint")}</p>}
      </>
    );
  return lines.map((line, index) => (
    <Button
      key={index}
      className={"music-lyric-line" + (active === index ? " is-current" : "")}
      aria-current={active === index ? true : undefined}
      onClick={() => seek(line.time)}
    >
      {line.text || "♪"}
    </Button>
  ));
}
export function mountMusicLibrary(list: HTMLElement, lyrics: HTMLElement) {
  const songs = mountView(list),
    verses = mountView(lyrics);
  return {
    tracks(props: TrackListProps) {
      songs.render(<TrackList {...props} />);
    },
    lyrics(props: LyricsProps) {
      verses.render(<Lyrics {...props} />);
    },
    dispose() {
      songs.dispose();
      verses.dispose();
    },
  };
}
