import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode } from "react";

type ActionButtonVariant = "primary" | "ghost" | "danger";
type ActionButtonSize = "xs" | "sm" | "md";

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  iconClassName?: string;
};

type NativeButtonProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className"> & {
    href?: undefined;
    external?: never;
  };

type InternalLinkProps = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "className"> & {
    href: string;
    external?: false;
  };

type ExternalLinkProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"a">, "children" | "className"> & {
    href: string;
    external: true;
  };

type ActionButtonProps = NativeButtonProps | InternalLinkProps | ExternalLinkProps;

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClasses: Record<ActionButtonSize, string> = {
  xs: "px-3 py-2 text-xs font-semibold",
  sm: "px-4 py-2 text-sm font-semibold",
  md: "px-5 py-2.5 text-base font-semibold",
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function omitBaseProps<T extends BaseProps>(value: T) {
  const next = { ...value } as T & {
    className?: string;
    variant?: ActionButtonVariant;
    size?: ActionButtonSize;
    external?: boolean;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
    iconClassName?: string;
  };
  delete next.className;
  delete next.variant;
  delete next.size;
  delete next.external;
  delete next.icon;
  delete next.iconPosition;
  delete next.iconClassName;
  return next;
}

export function ActionButton(props: ActionButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "sm";
  // whitespace-nowrap: 좁은(모바일) 레이아웃에서 라벨이 세로로 쪼개지지 않게 기본 보장.
  const className = cn(
    "whitespace-nowrap",
    variantClasses[variant],
    sizeClasses[size],
    props.className
  );
  const icon = props.icon;
  const iconPosition = props.iconPosition ?? "left";
  const iconClassName = props.iconClassName;
  const content = icon ? (
    <span className="inline-flex items-center gap-1.5">
      {iconPosition === "left" && (
        <span aria-hidden="true" className={iconClassName}>
          {icon}
        </span>
      )}
      <span>{props.children}</span>
      {iconPosition === "right" && (
        <span aria-hidden="true" className={iconClassName}>
          {icon}
        </span>
      )}
    </span>
  ) : (
    props.children
  );

  if ("href" in props && props.href) {
    if (props.external) {
      const anchorProps = props as ExternalLinkProps;
      const cleaned = omitBaseProps(anchorProps);
      const { href, ...rest } = cleaned;
      return (
        <a href={href} className={className} {...rest}>
          {content}
        </a>
      );
    }

    const linkProps = props as InternalLinkProps;
    const cleaned = omitBaseProps(linkProps);
    const { href, ...rest } = cleaned;
    return (
      <Link href={href} className={className} {...rest}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as NativeButtonProps;
  const cleaned = omitBaseProps(buttonProps);
  const {
    type = "button",
    ...rest
  } = cleaned;

  return (
    <button type={type} className={className} {...rest}>
      {content}
    </button>
  );
}
