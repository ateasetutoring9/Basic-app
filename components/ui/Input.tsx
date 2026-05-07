import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, id, className, ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const helperId = `${inputId}-helper`;
  const errorId  = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small font-medium text-fg">
        {label}
      </label>

      <input
        {...rest}
        id={inputId}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "w-full rounded-md border px-3.5 py-2.5 text-base text-fg",
          "placeholder:text-muted bg-card",
          "transition-colors duration-150",
          "min-h-[44px]",
          error
            ? "border-error focus:outline-none focus:ring-2 focus:ring-error/40"
            : "border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
          className
        )}
      />

      {error && (
        <p id={errorId} role="alert" className="text-small text-error">
          {error}
        </p>
      )}

      {!error && helper && (
        <p id={helperId} className="text-small text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}
