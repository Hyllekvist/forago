import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "soft";
type Size = "sm" | "md";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        "hoverable",
        "pressable",
        className ?? "",
      ].join(" ")}
    />
  );
}