import Button from "antd/es/button";
import { mountReaderShelf } from "./ReaderShelf";
import { CaretLeftIcon, BooksIcon, SidebarSimpleIcon } from "../tabler-icons";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";

type Props = {
  reading: boolean;
  narrow: boolean;
  visible: boolean;
  controls: string;
  book: string;
  activate: (id: string) => void;
};
function ReaderToolbar({
  reading,
  narrow,
  visible,
  controls,
  book,
  activate,
}: Props) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const classes = "hw-button reader-button reader-icon-button";
  return (
    <>
      <Button
        id="readerExit"
        data-hint-text={t("copy.11d0241540")}
        aria-label={t("copy.11d0241540")}
        onClick={() => activate("exit")}
        className={classes}
      >
        <CaretLeftIcon className="ui-icon" aria-hidden="true" />
      </Button>
      <Button
        id="readerSidebarToggle"
        hidden={!reading && !narrow}
        aria-expanded={visible}
        aria-controls={controls}
        data-hint-text={t("media.reader.sidebar")}
        aria-label={t("media.reader.sidebar")}
        onClick={() => activate("sidebar")}
        className={classes}
      >
        <span className="reader-glyph">
          <SidebarSimpleIcon aria-hidden="true" />
        </span>
        <span className="reader-button-label">{t("media.reader.sidebar")}</span>
      </Button>
      <h2 id="readerTitle" className="reader-title">
        {t("media.reader.title")}
      </h2>
      <span className="reader-book-title">{book}</span>
      <Button
        id="readerShelf"
        hidden={!reading}
        data-hint-text={t("media.reader.shelf")}
        aria-label={t("media.reader.shelf")}
        onClick={() => activate("shelf")}
        className={classes}
      >
        <span className="reader-glyph">
          <BooksIcon aria-hidden="true" />
        </span>
        <span className="reader-button-label">{t("media.reader.shelf")}</span>
      </Button>
    </>
  );
}
export function mountReaderToolbar(
  host: HTMLElement,
  activate: Props["activate"],
) {
  const view = mountView(host);
  function update(
    reading: boolean,
    narrow: boolean,
    visible: boolean,
    controls: string,
    book: string,
  ) {
    view.render(
      <ReaderToolbar
        {...{ reading, narrow, visible, controls, book, activate }}
      />,
    );
  }
  update(false, false, false, "", "");
  return { update, mountShelf: mountReaderShelf, dispose: view.dispose };
}
