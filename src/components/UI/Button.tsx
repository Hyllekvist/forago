import Link from "next/link";
import styles from "./Button.module.css";

type Common = {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  children,
  className,
  variant = "ghost",
  size = "md",
  ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "ghost",
  size = "md",
}: Common & { href: string }) {
  return (
    <Link
      href={href}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        className ?? "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}