import styles from "./Input.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: Props) {
  return (
    <label className={[styles.field, className ?? ""].join(" ")}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input
        {...props}
        className={[styles.input, "focusRing"].join(" ")}
        aria-invalid={!!error}
      />
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}