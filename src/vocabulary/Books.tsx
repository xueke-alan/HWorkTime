import Button from "antd/es/button";
import Input from "antd/es/input";
import Select from "antd/es/select";
import ToolbarSegmented from "../workspace/ToolbarSegmented";
import { useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "../tabler-icons";

const t = (key: string) => WorkTimeApp.i18n.t("vocabulary." + key);
interface Entry {
  id: string;
  word: string;
  books: string[];
  zh: string;
}
type Play = (entry: Entry, loading: (value: boolean) => void) => void;
export interface BooksProps {
  book: string | null;
  current: string;
  entries: Entry[];
  disabled: boolean;
  initialQuery: string;
  initialLimit: number;
  summaries: Record<string, string>;
  distribution: Record<string, number>;
  counts: Record<string, string>;
  estimate: string;
  dailyTotal: number;
  mode: string;
  random: boolean;
  update: (key: string, value: number | string) => void;
  remember: (query: string, limit: number) => void;
  phonetic: (entry: Entry) => string;
  play: Play;
  openWord: (entry: Entry, scroll: number) => void;
  openBook: (book: string) => void;
  back: () => void;
  useBook: (id: string) => void;
}
const titles = ["daily", "cet6", "kaoyan", "toefl", "ielts"];
function Cover({ book }: { book: string }) {
  const index = titles.indexOf(book);
  return (
    <span
      className="vocabulary-book-cover"
      data-color={index}
      aria-hidden="true"
    >
      <small>ENGLISH</small>
      <strong>{book === "daily" ? "Aa" : book.toUpperCase()}</strong>
      <span>{String(index + 1).padStart(2, "0")}</span>
    </span>
  );
}
function Overview({ p }: { p: BooksProps }) {
  const total = Object.values(p.distribution).reduce((a, b) => a + b, 0);
  return (
    <>
      <div className="vocabulary-controls is-compact">
        <label
          data-setting-field="dailyTotal"
          className="vocabulary-field vocabulary-plan-control"
        >
          <span>{t("dailyTotal")}</span>
          <Input
            aria-label={t("dailyTotal")}
            type="number"
            min={1}
            defaultValue={p.dailyTotal}
            disabled={p.disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            onBlur={(event) => {
              const n = Number(event.target.value);
              if (Number.isSafeInteger(n) && n >= 1) {
                if (n !== p.dailyTotal) p.update("dailyTotal", n);
              } else event.target.value = String(p.dailyTotal);
            }}
          />
        </label>
        <div className="vocabulary-field" data-setting-field="mode">
          <Select
            virtual={false}
            aria-label={t("mode")}
            className="vocabulary-plan-control"
            classNames={{
              content: "vocabulary-mode-label",
              suffix: "vocabulary-mode-arrow",
            }}
            value={p.mode}
            options={["recall", "spelling", "dictation"].map((value) => ({
              value,
              label: t(value),
              title: "",
            }))}
            disabled={p.disabled}
            onChange={(v) => p.update("mode", v)}
          />
        </div>
      </div>
      <div className="vocabulary-plan-counts">
        {Object.entries(p.counts).map(([key, value]) => (
          <div
            key={key}
            data-hint-text={
              key === "pendingReviewShort" ? t("pendingReview") : undefined
            }
          >
            <span>{t(key)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section
        className="vocabulary-current-book"
        data-hint-text={t("familiarityHint")}
      >
        <span className="vocabulary-book-tools">
          <ToolbarSegmented
            className="vocabulary-order-switch"
            size="small"
            aria-label={t("wordOrder")}
            data-hint-text={t("wordOrderHint")}
            value={p.random ? "random" : "ordered"}
            options={[
              { value: "ordered", label: t("ordered") },
              { value: "random", label: t("randomOrder") },
            ]}
            disabled={p.disabled}
            onChange={(value) => p.update("wordOrder", value)}
          />
          <Cover book={p.current} />
        </span>
        <span className="vocabulary-current-book-info">
          <small>{t("currentBook")}</small>
          <strong className="vocabulary-current-book-title">
            {t(p.current)}
          </strong>
          <span className="vocabulary-distribution-bar" aria-hidden="true">
            {Object.entries(p.distribution).map(([key, n]) => (
              <span
                key={key}
                data-state={key}
                style={{ width: (total ? (n / total) * 100 : 0) + "%" }}
              />
            ))}
          </span>
          <span className="vocabulary-distribution-legend">
            {Object.entries(p.distribution).map(([key, n]) => (
              <span key={key} data-state={key}>
                {t(key)} {n}
              </span>
            ))}
          </span>
          <small className="vocabulary-book-progress-line">
            <span>
              {total - p.distribution.unlearned}/{total}
            </span>
            <small
              className="vocabulary-learning-estimate"
              data-hint-text={t("estimateHint")}
            >
              {p.estimate}
            </small>
          </small>
        </span>
      </section>
      <h3>{t("allBooks")}</h3>
      <div className="vocabulary-books">
        {titles.map((id) => (
          <Button
            key={id}
            type="text"
            className={
              "vocabulary-book" + (id === p.current ? " is-current" : "")
            }
            data-book={id}
            disabled={p.disabled}
            onClick={() => p.openBook(id)}
          >
            <Cover book={id} />
            <span className="vocabulary-book-info">
              <strong>{t(id)}</strong>
              <small>{p.summaries[id]}</small>
              {id === p.current && <span>{t("currentBook")}</span>}
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}
function WordRow({
  entry,
  p,
  open,
}: {
  entry: Entry;
  p: BooksProps;
  open: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div
      className="vocabulary-row"
      onClick={(e) => {
        if (
          !p.disabled &&
          !(e.target as Element).closest("button") &&
          !window.getSelection()?.toString()
        )
          open();
      }}
    >
      <div>
        <div className="vocabulary-list-heading">
          <Button
            type="text"
            className="vocabulary-word-open"
            data-word={entry.id}
            disabled={p.disabled}
            onClick={open}
          >
            <strong>{entry.word}</strong>
          </Button>
          <div className="vocabulary-list-pronunciation">
            <small className="vocabulary-phonetic">{p.phonetic(entry)}</small>
            <Button
              type="text"
              className="vocabulary-list-play"
              aria-label={t("play") + ": " + entry.word}
              aria-busy={loading || undefined}
              loading={loading}
              disabled={p.disabled}
              onClick={() => p.play(entry, setLoading)}
            >
              <svg className="ui-icon" aria-hidden="true">
                <use href="#icon-text-to-speech" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export function Books(p: BooksProps) {
  const [query, setQuery] = useState(p.initialQuery);
  const [limit, setLimit] = useState(p.initialLimit);
  const results = useRef<HTMLDivElement>(null);
  const global = p.book === null;
  const needle = query.trim().toLowerCase();
  const hidden = global && !needle;
  const matching = useMemo(
    () =>
      hidden
        ? []
        : p.entries.filter(
            (e) =>
              (p.book === null || e.books.includes(p.book)) &&
              (!needle || (e.word + " " + e.zh).toLowerCase().includes(needle)),
          ),
    [hidden, needle, p.entries, p.book],
  );
  return (
    <>
      {p.book && (
        <div className="vocabulary-book-heading">
          <Button
            type="text"
            className="vocabulary-book-back"
            aria-label={t("backToSelection")}
            disabled={p.disabled}
            onClick={p.back}
            icon={<ArrowLeftIcon />}
          />
          <div className="vocabulary-book-title">
            <h3>{t(p.book)}</h3>
            <p className="vocabulary-muted">{p.summaries[p.book]}</p>
          </div>
          <Button
            className="vocabulary-use-book"
            disabled={p.disabled}
            data-action="use-book"
            onClick={() => p.useBook(p.book!)}
          >
            {t(p.book === p.current ? "currentBook" : "useBook")}
          </Button>
        </div>
      )}
      <section
        className={
          "vocabulary-library" + (global ? " vocabulary-global-search" : "")
        }
      >
        <div className="vocabulary-search-field">
          <MagnifyingGlassIcon className="ui-icon" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            aria-label={t("search")}
            placeholder={t("search")}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(40);
              p.remember(e.target.value, 40);
              if (results.current) results.current.scrollTop = 0;
            }}
          />
        </div>
        <div className="vocabulary-list" hidden={!!hidden} ref={results}>
          {matching.slice(0, limit).map((entry) => (
            <WordRow
              key={entry.id}
              {...{ entry, p }}
              open={() =>
                p.openWord(
                  entry,
                  (global
                    ? results.current?.closest(".vocabulary-page")
                    : results.current
                  )?.scrollTop || 0,
                )
              }
            />
          ))}
          {!matching.length && !hidden && <p>{t("empty")}</p>}
          {matching.length > limit && (
            <Button
              disabled={p.disabled}
              onClick={() => {
                setLimit(limit + 40);
                p.remember(query, limit + 40);
              }}
            >
              {t("more")}
            </Button>
          )}
        </div>
      </section>
      {global && (
        <div className="vocabulary-books-overview" hidden={!!needle}>
          <Overview p={p} />
        </div>
      )}
    </>
  );
}
