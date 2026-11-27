import Alert from "antd/es/alert";
import { useLayoutEffect, useRef } from "react";
import { mountView } from "../mount-view";

function Notice({
  body,
  tone,
  graphic,
}: {
  body: HTMLElement;
  tone: "info" | "warning" | "error";
  graphic?: string;
}) {
  const slot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    slot.current!.append(body);
    return () => {
      body.remove();
    };
  }, [body]);
  return (
    <Alert
      type={tone}
      showIcon
      icon={
        graphic ? (
          <span dangerouslySetInnerHTML={{ __html: graphic }} />
        ) : undefined
      }
      title={<div ref={slot} className="sidebar-notice-body" />}
    />
  );
}
export function mountNotice(
  host: HTMLElement,
  body: HTMLElement,
  tone: "info" | "warning" | "error",
  graphic?: string,
) {
  const view = mountView(host, "sidebar");
  view.render(<Notice body={body} tone={tone} graphic={graphic} />);
  return { dispose: view.dispose };
}
