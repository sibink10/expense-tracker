import type { CSSProperties, ReactNode } from "react";
import { C } from "../shared/theme";

export const pageShellRootStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export const pageShellBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
};

export type PageShellProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Surface background (dashboard); default transparent */
  surface?: boolean;
};

export default function PageShell({ header, children, className, style, surface }: PageShellProps) {
  return (
    <div
      className={className}
      style={{
        ...pageShellRootStyle,
        ...(surface ? { background: C.surface } : null),
        ...style,
      }}
    >
      {header ? <div style={{ flexShrink: 0 }}>{header}</div> : null}
      <div style={pageShellBodyStyle}>{children}</div>
    </div>
  );
}
