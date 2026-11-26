import Button from "antd/es/button";
import Input from "antd/es/input";
import { ArrowLeftIcon, SpeakerHighIcon } from "../phosphor-icons";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  WordDetails,
  MemoryHistory,
  type DetailsProps,
  type History,
} from "./WordDetails";

const t = (key: string) => WorkTimeApp.i18n.t("vocabulary." + key);
interface HeaderProps {
  word: string;
  mode: string;
  revealed: boolean;
  disabled: boolean;
  accent: string;
  phonetic: string;
  play: (synthesis: (loading: boolean) => void) => void;
}
function WordHeader({ p, mini = false }: { p: HeaderProps; mini?: boolean }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      attempt.current++;
      clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    const id = ++attempt.current;
    clearTimeout(timer.current);
    setFeedback("");
    let result = "wordCopied";
    try {
      await navigator.clipboard.writeText(p.word);
    } catch {
      result = "wordCopyFailed";
    }
    if (attempt.current !== id) return;
    setFeedback(result);
    timer.current = setTimeout(() => setFeedback(""), 1800);
  }
  const copyLabel = WorkTimeApp.i18n.t("vocabulary.copyWord", { word: p.word });
  const voice = t(p.accent === "uk" ? "shortUK" : "shortUS");
  return (
    <div className="vocabulary-word-header">
      {(p.mode === "recall" || p.revealed) && (
        <>
          <h3 className={mini ? "vocabulary-mini-word" : undefined}>
            <Button
              type="text"
              className="vocabulary-word-copy"
              data-hint-text={copyLabel}
              aria-label={copyLabel}
              disabled={p.disabled}
              onClick={copy}
            >
              {p.word}
            </Button>
          </h3>
          <span
            role="status"
            className={
              "vocabulary-word-copy-status" +
              (feedback === "wordCopyFailed" ? " is-error" : "")
            }
          >
            {feedback && t(feedback)}
          </span>
        </>
      )}
      {(p.mode !== "spelling" || p.revealed) && (
        <div className="vocabulary-pronunciation">
          {(p.revealed || p.mode === "recall") && p.phonetic && (
            <span
              className={
                "vocabulary-phonetic" +
                (mini ? " vocabulary-mini-phonetic" : "")
              }
            >
              {p.phonetic}
            </span>
          )}
          <Button
            type="text"
            className="vocabulary-pronunciation-play"
            aria-label={t("play") + " · " + voice}
            aria-busy={loading || undefined}
            loading={loading}
            disabled={p.disabled}
            onClick={() => p.play(setLoading)}
          >
            {!loading && <SpeakerHighIcon aria-hidden="true" />}
            <span className="vocabulary-voice-label">{voice}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
export interface MiniProps {
  header: HeaderProps | null;
  streak: number;
  back: () => void;
  expand: () => void;
}
export function MiniStudy({ header, streak, back, expand }: MiniProps) {
  const backTitle = WorkTimeApp.i18n.t("tools.back");
  return (
    <>
      <Button
        type="text"
        className="ui-button icon-only vocabulary-mini-back"
        aria-label={backTitle}
        data-hint-text={backTitle}
        onClick={back}
        icon={<ArrowLeftIcon />}
      />
      <button
        className="vocabulary-mini-expand"
        aria-label={t("expand")}
        onClick={expand}
        type="button"
      />
      <div className="vocabulary-study-header">
        {header ? (
          <section className="vocabulary-card">
            <WordHeader key={header.word} p={header} mini />
          </section>
        ) : (
          <section className="vocabulary-hero">
            <span className="vocabulary-eyebrow">{t("streak")}</span>
            <strong className="vocabulary-streak">
              {String(streak).padStart(2, "0")}
            </strong>
          </section>
        )}
      </div>
    </>
  );
}
interface Rating {
  value: number;
  label: string;
  shortcut: string;
  delay: string;
  previous?: boolean;
}
export interface StudyProps {
  header: HeaderProps;
  headerHost: HTMLElement;
  actionsHost?: HTMLElement;
  meaning: string;
  draft: { answer: string; correct: boolean | null };
  initialAnswer: string;
  audioReady: boolean;
  ratings: Rating[];
  early: boolean;
  details?: DetailsProps;
  history?: History;
  back?: () => void;
  input: (value: string) => void;
  reveal: () => void;
  grade: (value: number) => void;
}
export function Study(p: StudyProps) {
  const { header: h } = p;
  const answer = !h.revealed && h.mode !== "recall";
  const locked = h.disabled || (h.mode === "dictation" && !p.audioReady);
  return (
    <>
      {createPortal(
        <>
          {p.back && (
            <Button
              className="vocabulary-word-back"
              aria-label={t("back")}
              icon={<ArrowLeftIcon />}
              onClick={p.back}
              disabled={h.disabled}
            />
          )}
          <section className="vocabulary-card">
            <WordHeader p={h} />
            {(h.mode === "spelling" || h.revealed) && (
              <p className="vocabulary-meaning">{p.meaning}</p>
            )}
            {answer && (
              <>
                <p className="vocabulary-muted vocabulary-study-prompt">
                  {t(h.mode + "Prompt")}
                </p>
                <Input
                  className="vocabulary-answer"
                  placeholder={t("answer")}
                  aria-label={t("answer")}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="off"
                  defaultValue={p.initialAnswer}
                  disabled={locked}
                  onChange={(e) => p.input(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.nativeEvent.isComposing &&
                      !locked
                    )
                      p.reveal();
                  }}
                />
              </>
            )}
            {h.revealed && p.draft.correct !== null && (
              <p
                className={
                  p.draft.correct ? "vocabulary-right" : "vocabulary-wrong"
                }
              >
                {t(p.draft.correct ? "right" : "wrong")}
                {p.draft.answer && " · " + p.draft.answer}
              </p>
            )}
            {p.early && (
              <p className="vocabulary-muted">{t("practiceEarly")}</p>
            )}
          </section>
        </>,
        p.headerHost,
      )}
      {p.actionsHost &&
        createPortal(
          answer ? (
            <Button
              type="primary"
              className="ui-button vocabulary-primary"
              data-action="check"
              disabled={locked}
              onClick={p.reveal}
            >
              {t("check")}
            </Button>
          ) : (
            <div className="vocabulary-ratings">
              {p.ratings.map((r) => (
                <Button
                  key={r.value}
                  className={
                    "vocabulary-rating" +
                    (r.previous ? " is-previous-choice" : "")
                  }
                  data-grade={r.value}
                  aria-keyshortcuts={r.shortcut}
                  aria-pressed={r.previous}
                  disabled={
                    h.disabled || (p.draft.correct === false && r.value !== 1)
                  }
                  onClick={() => p.grade(r.value)}
                >
                  <strong>{t(r.label)}</strong>
                  <small>{r.delay}</small>
                </Button>
              ))}
            </div>
          ),
          p.actionsHost,
        )}
      {!h.revealed && h.mode === "recall" && (
        <div className="vocabulary-recall-prompt">
          <h4>{t("recallPrompt")}</h4>
          <p className="vocabulary-muted">{t("tapReveal")}</p>
        </div>
      )}
      {p.details && <WordDetails {...p.details} />}
      {p.history && <MemoryHistory {...p.history} />}
    </>
  );
}
