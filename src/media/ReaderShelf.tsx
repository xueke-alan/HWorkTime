import Card from "antd/es/card";
import Empty from "antd/es/empty";
import Button from "antd/es/button";
import Select from "antd/es/select";
import { HeartIcon } from "../tabler-icons";
import type { CSSProperties } from "react";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";
interface ShelfBook {
  id: string;
  title: string;
  author: string;
  format: string;
  favorite: boolean;
  group: string;
  status: string;
  progress: number;
  cover?: string;
  available: boolean;
}
interface Props {
  books: ShelfBook[];
  groups: string[];
  empty: string;
  text: (key: string) => string;
  open: (id: string) => void;
  update: (
    id: string,
    change: Partial<Pick<ShelfBook, "favorite" | "group" | "status">>,
  ) => void;
}
function Shelf({ books, groups, empty, text, open, update }: Props) {
  useLanguage();
  if (!books.length)
    return (
      <Empty
        className="reader-empty"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={text(empty)}
      />
    );
  return books.map((book) => (
    <Card
      size="small"
      className="reader-book"
      key={book.id}
      data-book-id={book.id}
    >
      <Button
        htmlType="button"
        className="reader-book-open"
        disabled={!book.available}
        aria-label={book.title}
        onClick={() => open(book.id)}
      >
        <div
          className="reader-cover"
          style={
            {
              "--book-hue": parseInt(book.id.slice(0, 4), 16) % 360,
            } as CSSProperties
          }
        >
          {book.cover ? (
            <img src={book.cover} alt={book.title} loading="lazy" />
          ) : (
            <>
              <span className="reader-cover-format">
                {book.format.toUpperCase()}
              </span>
              <strong>{book.title}</strong>
              <span className="reader-cover-author">{book.author}</span>
            </>
          )}
        </div>
        <div className="reader-book-info">
          <h4>{book.title}</h4>
          <p>{book.author || book.format.toUpperCase()}</p>
          <progress
            max={1}
            value={book.progress || 0}
            aria-label={text("progress")}
          />
          <small>
            {text(book.status)} · {Math.round((book.progress || 0) * 100)}%
            {!book.available && " · " + text("unavailable")}
          </small>
        </div>
      </Button>
      <div className="reader-book-tools">
        <Button
          className="reader-button reader-heart"
          aria-label={text("favorite")}
          aria-pressed={!!book.favorite}
          onClick={() => update(book.id, { favorite: !book.favorite })}
        >
          <HeartIcon aria-hidden="true" />
        </Button>
        <details className="reader-card-more">
          <summary
            className="reader-more"
            aria-label={text("more")}
            data-hint-text={text("more")}
          >
            {text("more")}
          </summary>
          <div className="reader-menu">
            <label className="reader-field">
              <span>{text("groups")}</span>
              <Select
                aria-label={text("groups")}
                virtual={false}
                value={book.group || ""}
                options={[
                  { value: "", label: text("ungrouped"), title: "" },
                  ...groups.map((value) => ({
                    value,
                    label: value,
                    title: "",
                  })),
                ]}
                getPopupContainer={(node) => node.parentElement!}
                onChange={(group) => update(book.id, { group })}
              />
            </label>
            <label className="reader-field">
              <span>{text("progress")}</span>
              <Select
                aria-label={text("progress")}
                virtual={false}
                value={book.status}
                options={["unread", "reading", "finished"].map((value) => ({
                  value,
                  label: text(value),
                  title: "",
                }))}
                getPopupContainer={(node) => node.parentElement!}
                onChange={(status) => update(book.id, { status })}
              />
            </label>
          </div>
        </details>
      </div>
    </Card>
  ));
}
export function mountReaderShelf(host: HTMLElement) {
  const view = mountView(host);
  return {
    render(props: Props) {
      view.render(<Shelf {...props} />);
    },
    dispose: view.dispose,
  };
}
