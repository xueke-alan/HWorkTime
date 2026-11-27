import {
  useLayoutEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";

/** All sidebar modes share these three permanent regions. Mount views in the
 * content slot and send their heading through SidebarHeader; never replace the shell. */
export function SidebarLayout({
  children,
  functions,
}: PropsWithChildren<{ functions: React.ReactNode }>) {
  return (
    <aside className="panel editor" data-ui="panel">
      <header id="sidebarHeader" className="sidebar-header" />
      <div id="sidebarContent" className="sidebar-content">
        {children}
      </div>
      <footer id="sidebarFunctions" className="sidebar-functions">
        {functions}
      </footer>
    </aside>
  );
}

/** The source stays with its mode so existing visibility controllers keep working. */
export function SidebarHeader({
  children,
  className,
}: PropsWithChildren<{ className: string }>) {
  const source = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const marker = source.current!;
    const editor = marker.closest<HTMLElement>(".editor")!;
    setHost(editor.querySelector<HTMLElement>("#sidebarHeader"));
    const ancestors: HTMLElement[] = [];
    for (let node = marker.parentElement; node; node = node.parentElement) {
      ancestors.push(node);
    }
    const update = () =>
      setVisible(
        ancestors.every(
          (node) => !node.hidden && getComputedStyle(node).display !== "none",
        ),
      );
    const observer = new MutationObserver(update);
    for (const node of ancestors)
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["hidden", "class", "style"],
      });
    update();
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <>
      <span ref={source} hidden data-sidebar-header-source="" />
      {host &&
        createPortal(
          <div className={className} data-sidebar-heading="" hidden={!visible}>
            {children}
          </div>,
          host,
        )}
    </>
  );
}
