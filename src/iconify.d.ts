import type { CSSProperties, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": HTMLAttributes<HTMLElement> & {
        icon?: string;
        class?: string;
        className?: string;
        style?: CSSProperties;
      };
    }
  }
}

export {};
