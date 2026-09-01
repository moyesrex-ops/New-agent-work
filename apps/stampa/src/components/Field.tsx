import type { ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

/**
 * These are deliberately hook-free so they render on the server. Reaching for
 * `useId` here would pull every form into the client bundle, and the critical
 * path budget is 180KB (Phase 14.5). The `name` attribute is already unique
 * within a form, so it is the id.
 */
type Shell = {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

function FieldShell({ name, label, hint, error, children }: Shell) {
  const id = `field-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy: describedBy || undefined, invalid: Boolean(error) })}
      {/* A red border with no explanation is a defect, so the message is not optional. */}
      {error ? (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
      {hint ? (
        <span className={styles.fieldHint} id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export type FieldProps = Omit<ComponentProps<"input">, "id" | "className" | "name"> & {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
};

export type TextAreaProps = Omit<ComponentProps<"textarea">, "id" | "className" | "name"> & {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
};

function inputClass(...extra: Array<string | false | undefined>): string {
  return [styles.input, ...extra].filter(Boolean).join(" ");
}

export function Field({ name, label, hint, error, ...input }: FieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          {...input}
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={inputClass(invalid && styles.inputError)}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({ name, label, hint, error, ...input }: TextAreaProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <textarea
          {...input}
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={inputClass(styles.textarea, invalid && styles.inputError)}
        />
      )}
    </FieldShell>
  );
}

/** Money input: mono, tabular, right-aligned, static NGN adornment. */
export function AmountField({ name, label, hint, error, ...input }: FieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <span className={styles.amountWrap}>
          <span className={styles.amountPrefix} aria-hidden="true">
            NGN
          </span>
          <input
            {...input}
            id={id}
            name={name}
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={inputClass(styles.amountInput, invalid && styles.inputError)}
          />
        </span>
      )}
    </FieldShell>
  );
}

export type SelectOption = { value: string; label: string };

/** Console only. Native `<select>`; see the note in ui.module.css. */
export function SelectField({
  name,
  label,
  hint,
  error,
  options,
  ...select
}: Omit<ComponentProps<"select">, "id" | "className" | "name"> & {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  options: SelectOption[];
}) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          {...select}
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={styles.select}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function FileField({ name, label, hint, error, ...input }: FieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          {...input}
          type="file"
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={styles.file}
        />
      )}
    </FieldShell>
  );
}

export function OtpField({ name, label, hint, error, ...input }: FieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          {...input}
          id={id}
          name={name}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]*"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={inputClass(styles.otpInput, invalid && styles.inputError)}
        />
      )}
    </FieldShell>
  );
}
