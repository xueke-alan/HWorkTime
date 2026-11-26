import Button from "antd/es/button";
import {
  BookOpenIcon,
  BookIcon,
  ChartBarIcon,
  GearSixIcon,
} from "../phosphor-icons";
import { useLanguage } from "../ApplicationTheme";
import { mountView } from "../mount-view";

const pages = [
  { id: "learning", label: "navReview", icon: BookOpenIcon },
  { id: "books", label: "navWords", icon: BookIcon },
  { id: "analysis", label: "navStatistics", icon: ChartBarIcon },
  { id: "preferences", label: "navSettings", icon: GearSixIcon },
];
function VocabularyNavigation({
  current,
  remaining,
  navigate,
}: {
  current: string;
  remaining: number;
  navigate: (page: string) => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return pages.map(({ id, label, icon: Icon }) => (
    <Button
      key={id}
      data-page={id}
      aria-current={current === id ? "page" : false}
      onClick={() => navigate(id)}
      className="hw-button vocabulary-nav-item"
    >
      <Icon aria-hidden="true" />
      <span>{t("vocabulary." + label)}</span>
      {id === "learning" && (
        <span
          className="vocabulary-review-badge"
          aria-label={t("vocabulary.remaining") + ": " + remaining}
          data-ui="badge"
        >
          {remaining}
        </span>
      )}
    </Button>
  ));
}
export function mountVocabularyNavigation(
  nav: HTMLElement,
  navigate: (page: string) => void,
) {
  const view = mountView(nav);
  function update(page: string, count: number) {
    view.render(
      <VocabularyNavigation
        current={page}
        remaining={count}
        navigate={navigate}
      />,
    );
  }
  update("learning", 0);
  return { update, dispose: view.dispose };
}
