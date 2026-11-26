import ConfigProvider from "antd/es/config-provider";
import theme from "antd/es/theme";
import zhCN from "antd/es/locale/zh_CN";
import zhHK from "antd/es/locale/zh_HK";
import zhTW from "antd/es/locale/zh_TW";
import en from "antd/es/locale/en_US";
import ja from "antd/es/locale/ja_JP";
import ko from "antd/es/locale/ko_KR";
import {
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { CaretDownIcon, CheckIcon, SpinnerIcon } from "./phosphor-icons";
import { showInsetWave } from "./inset-wave";
import "./styles/tokens.css";

// Pixel radii for Ant Design and custom UI.
const borderRadius = 8;
const buttonRadius = 5;

const locales: Record<string, typeof zhCN> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "zh-HK": zhHK,
  en,
  ja,
  ko,
};

let catalogRevision = 0;
const languageListeners = new Set<() => void>();
function catalogChanged() {
  catalogRevision++;
  for (const listener of languageListeners) listener();
}
function observeLanguage(listener: () => void) {
  if (!languageListeners.size) {
    document.addEventListener("worktime:languagechange", catalogChanged);
    document.addEventListener("worktime:localemodule", catalogChanged);
  }
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
    if (!languageListeners.size) {
      document.removeEventListener("worktime:languagechange", catalogChanged);
      document.removeEventListener("worktime:localemodule", catalogChanged);
    }
  };
}
export function useLanguage() {
  useSyncExternalStore(
    observeLanguage,
    () => catalogRevision + ":" + WorkTimeApp.i18n.language,
  );
  return WorkTimeApp.i18n.language;
}
interface Palette {
  dark: boolean;
  accent: string;
  motion: boolean;
}
let palette: Palette | undefined;
let observer: MutationObserver | undefined;
const paletteListeners = new Set<() => void>();
function measurePalette() {
  const root = document.documentElement;
  const dark =
    root.classList.contains("dark-mode") ||
    document.body.classList.contains("dark-mode");
  const accent = getComputedStyle(document.body)
    .getPropertyValue("--ui-accent")
    .trim();
  const motion = root.dataset.reducedMotion !== "true";
  if (
    palette &&
    dark === palette.dark &&
    accent === palette.accent &&
    motion === palette.motion
  )
    return;
  palette = { dark, accent, motion };
  for (const listener of paletteListeners) listener();
}
function readPalette(): Palette {
  if (!palette) measurePalette();
  return palette!;
}
function observePalette(listener: () => void) {
  if (!observer) {
    observer = new MutationObserver(measurePalette);
    for (const element of [document.documentElement, document.body])
      observer.observe(element, {
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "data-theme",
          "data-reduced-motion",
        ],
      });
    measurePalette();
  }
  paletteListeners.add(listener);
  return () => {
    paletteListeners.delete(listener);
    if (!paletteListeners.size) {
      observer?.disconnect();
      observer = undefined;
      palette = undefined;
    }
  };
}
function DocumentThemeTokens() {
  const { token } = theme.useToken();
  const radius = `${token.borderRadius}px`;
  useLayoutEffect(() => {
    // Native controls and portals live across several React roots.
    const style = document.documentElement.style;
    if (style.getPropertyValue("--ui-radius") !== radius)
      style.setProperty("--ui-radius", radius);
    const buttonRadiusValue = `${buttonRadius}px`;
    if (style.getPropertyValue("--ui-button-radius") !== buttonRadiusValue)
      style.setProperty("--ui-button-radius", buttonRadiusValue);
  }, [radius]);
  return null;
}

export function ApplicationTheme({ children }: PropsWithChildren) {
  const language = useLanguage();
  const {
    dark,
    accent,
    motion: motionEnabled,
  } = useSyncExternalStore(observePalette, readPalette);
  // Ant inserts its motion provider the first time motion is disabled. Establish
  // that provider before mounting controls so preference changes keep their DOM.
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => setReady(true), []);
  const motion = ready && motionEnabled;
  const tokens = useMemo(
    () => ({
      algorithm: [
        dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        theme.compactAlgorithm,
      ],
      token: {
        ...(accent && { colorPrimary: accent }),
        borderRadius,
        borderRadiusXS: borderRadius,
        borderRadiusSM: borderRadius,
        borderRadiusLG: borderRadius,
        borderRadiusOuter: borderRadius,
        focusOutline: false,
        controlOutlineWidth: 0,
        motion,
      },
      components: {
        Button: {
          borderRadius: buttonRadius,
          borderRadiusSM: buttonRadius,
          borderRadiusLG: buttonRadius,
        },
        Segmented: {
          borderRadius: buttonRadius,
          borderRadiusXS: buttonRadius,
          borderRadiusSM: buttonRadius,
          borderRadiusLG: buttonRadius,
        },
      },
    }),
    [dark, accent, motion],
  );
  return (
    <ConfigProvider
      locale={locales[language] ?? zhCN}
      theme={tokens}
      wave={{ disabled: !motion, showEffect: showInsetWave }}
      select={{
        suffixIcon: <CaretDownIcon size="1em" />,
        menuItemSelectedIcon: <CheckIcon size="1em" />,
      }}
      button={{
        loadingIcon: <SpinnerIcon size="1em" className="site-audio-spinner" />,
      }}
      getPopupContainer={popupContainer}
    >
      <DocumentThemeTokens />
      {ready && children}
    </ConfigProvider>
  );
}

function popupContainer(trigger?: HTMLElement) {
  return (
    trigger?.closest<HTMLElement>("dialog[open], [popover]") ?? document.body
  );
}
