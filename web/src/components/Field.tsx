import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  helpText?: string;
  error?: string | null;
  children: ReactNode;
};

export function Field({ label, helpText, error, children }: FieldProps) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      <div className="field-head">
        <span>{label}</span>
        {error ? <strong className="field-error-text">{error}</strong> : null}
      </div>
      {children}
      {helpText ? <small className="field-help-text">{helpText}</small> : null}
    </label>
  );
}
