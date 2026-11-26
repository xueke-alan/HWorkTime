import Button from "antd/es/button";
import { useRef, useState } from "react";

const t = (key: string) => WorkTimeApp.i18n.t("vocabulary." + key);
interface Example {
  en: string;
  zh: string;
}
interface Word {
  word: string;
  examples?: Example[];
  forms?: string[];
  mnemonic?: string;
}
type Speak = (sentence: string, synthesis: (busy: boolean) => void) => void;
function ExampleSentence({
  example,
  word,
  disabled,
  speak,
}: {
  example: Example;
  word: string;
  disabled: boolean;
  speak: Speak;
}) {
  const [loading, setLoading] = useState(false);
  const index = example.en.toLowerCase().indexOf(word.toLowerCase());
  return (
    <div className="vocabulary-example">
      <p>
        <Button
          type="text"
          className="vocabulary-example-play"
          aria-label={t("play") + ": " + example.en}
          disabled={disabled}
          aria-busy={loading || undefined}
          onClick={() => speak(example.en, setLoading)}
        >
          {loading ? (
            <svg className="site-audio-spinner" aria-hidden="true">
              <use href="#icon-progress-activity" />
            </svg>
          ) : (
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-text-to-speech" />
            </svg>
          )}
        </Button>
        {index < 0 ? (
          example.en
        ) : (
          <>
            {example.en.slice(0, index)}
            <mark>{example.en.slice(index, index + word.length)}</mark>
            {example.en.slice(index + word.length)}
          </>
        )}
      </p>
      <p className="vocabulary-example-translation">{example.zh}</p>
    </div>
  );
}
export interface DetailsProps {
  entry: Word;
  disabled: boolean;
  speak: Speak;
}
export function WordDetails({ entry, disabled, speak }: DetailsProps) {
  return (
    <>
      <section className="vocabulary-detail-section">
        <h4>{t("examples")}</h4>
        {entry.examples?.length ? (
          entry.examples.map((example, index) => (
            <ExampleSentence
              key={index}
              word={entry.word}
              {...{ example, disabled, speak }}
            />
          ))
        ) : (
          <p className="vocabulary-muted">{t("noExamples")}</p>
        )}
      </section>
      {entry.mnemonic && (
        <section className="vocabulary-detail-section">
          <h4>{t("mnemonic")}</h4>
          <p>{entry.mnemonic}</p>
        </section>
      )}
      <section className="vocabulary-detail-section">
        <h4>{t("forms")}</h4>
        {entry.forms?.length ? (
          entry.forms.map((form, index) => <p key={index}>{form}</p>)
        ) : (
          <p className="vocabulary-muted">{t("noForms")}</p>
        )}
      </section>
    </>
  );
}
interface Review {
  at: string;
  grade: number;
  mode: string;
}
export interface History {
  logs: Review[];
  summary: string;
  due: { mode: string; status: string; overdue: boolean }[];
  dateTitle: (at: string) => string;
  dayNumber: (at: string) => number;
}
export function MemoryHistory({
  logs,
  summary,
  due,
  dateTitle,
  dayNumber,
}: History) {
  const [count, setCount] = useState(24);
  const list = useRef<HTMLOListElement>(null);
  const ratings = ["forgotten", "uncertain", "recognized", "easy"];
  const showMode = logs.some((log) => log.mode !== logs[0].mode);
  return (
    <section className="vocabulary-detail-section">
      <h4>{t("memoryHistory")}</h4>
      <div className="vocabulary-memory-history">
        {logs.length ? (
          <>
            <p>{summary}</p>
            <Button
              hidden={count >= logs.length}
              className="vocabulary-memory-earlier"
              onClick={() => {
                setCount(count + 24);
                if (count + 24 >= logs.length) list.current?.focus();
              }}
            >
              {t("memoryHistoryEarlier")}
            </Button>
            <ol
              className="vocabulary-memory-events"
              role="list"
              ref={list}
              tabIndex={-1}
            >
              {logs.slice(-count).map(({ at, grade, mode }, index) => (
                <li
                  key={logs.length - Math.min(count, logs.length) + index}
                  data-rating={ratings[grade - 1]}
                >
                  <time dateTime={at} data-hint-text={dateTitle(at)}>
                    D{dayNumber(at)}
                  </time>{" "}
                  · {t(ratings[grade - 1])}
                  {showMode && " · " + t(mode)}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="vocabulary-muted">{t("memoryHistoryEmpty")}</p>
        )}
        {due.map((item) => (
          <p
            key={item.mode}
            className="vocabulary-muted vocabulary-memory-due"
            data-overdue={item.overdue || undefined}
          >
            {t(item.mode)} · {item.status}
          </p>
        ))}
      </div>
    </section>
  );
}
