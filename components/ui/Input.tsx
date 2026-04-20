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
      <label
        htmlFor={inputId}
        className="text-sm font-semibold text-fg"
      >
        {label}
      </label>

      <input
        {...rest}
        id={inputId}
        aria-describedby={error ? errorId : helper ? helperId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "w-full rounded-lg border px-4 py-2.5 text-base text-fg",
          "placeholder:text-muted bg-white",
          "transition-colors duration-150",
          "min-h-[44px]",
          error
            ? "border-error focus:outline-none focus:ring-2 focus:ring-error/40"
            : "border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
          className
        )}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {!error && helper && (
        <p id={helperId} className="text-sm text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}
