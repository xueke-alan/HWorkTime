import ConfigProvider from "antd/es/config-provider";
import theme from "antd/es/theme";
import type { ThemeConfig } from "antd/es/config-provider";
import { useMemo, type PropsWithChildren } from "react";
import "./styles/sidebar-controls.css";

export const sidebarTheme: ThemeConfig = {
  // Use the normal typography algorithm; large controls are deliberately 36px.
  algorithm: theme.defaultAlgorithm,
  token: {
    fontFamily: "var(--font-ui-medium)",
    fontSize: 14,
    fontSizeLG: 14,
    lineHeightLG: 22 / 14,
    controlHeight: 32,
    controlHeightLG: 36,
    colorBorder: "var(--control-border)",
    colorBorderSecondary: "var(--control-border)",
    colorBgContainer: "var(--paper)",
    borderRadius: 4,
    borderRadiusXS: 4,
    borderRadiusSM: 4,
    borderRadiusLG: 4,
    borderRadiusOuter: 4,
    controlOutlineWidth: 2,
  },
  components: {
    Button: { borderRadius: 4, borderRadiusSM: 4, borderRadiusLG: 4 },
    Segmented: { borderRadius: 4, borderRadiusSM: 4, borderRadiusLG: 4 },
    Card: { bodyPadding: 12, bodyPaddingSM: 12, headerFontSize: 14 },
    Select: { optionHeight: 32, optionFontSize: 14 },
  },
};

/** Independent roots and portals must opt into the same sidebar theme. */
export function SidebarTheme({ children }: PropsWithChildren) {
  const { token } = theme.useToken();
  const tokens = useMemo(
    () => ({
      ...sidebarTheme,
      algorithm:
        token.colorBgBase === "#000"
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
    }),
    [token.colorBgBase],
  );
  return (
    <ConfigProvider
      theme={tokens}
      componentSize="large"
      select={{ classNames: { popup: { root: "sidebar-popup" } } }}
      dropdown={{ classNames: { root: "sidebar-popup" } }}
    >
      {children}
    </ConfigProvider>
  );
}
