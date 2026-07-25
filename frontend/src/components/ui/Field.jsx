const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

const errorClass = 'border-error focus:ring-error/20 focus:border-error';

export function Label({ children, small }) {
  return (
    <label
      className={`block font-semibold text-on-surface-variant mb-1.5 ${
        small ? 'text-xs' : 'text-sm'
      }`}
    >
      {children}
    </label>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-error text-xs mt-1 mb-0">{error}</p>;
}

export function Input({ className = '', error, ...rest }) {
  return (
    <>
      <input className={`${inputClass} ${error ? errorClass : ''} ${className}`} {...rest} />
      <FieldError error={error} />
    </>
  );
}

export function Textarea({ className = '', error, ...rest }) {
  return (
    <>
      <textarea className={`${inputClass} resize-y ${error ? errorClass : ''} ${className}`} {...rest} />
      <FieldError error={error} />
    </>
  );
}

export function Select({ className = '', children, error, ...rest }) {
  return (
    <>
      <select className={`${inputClass} cursor-pointer ${error ? errorClass : ''} ${className}`} {...rest}>
        {children}
      </select>
      <FieldError error={error} />
    </>
  );
}

export function FormGroup({ label, small, children }) {
  return (
    <div>
      {label && <Label small={small}>{label}</Label>}
      {children}
    </div>
  );
}
