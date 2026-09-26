const inputClass =
  'w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all';

const errorClass = 'border-error focus:ring-error/20 focus:border-error';

export function Label({ children, small }) {
  return (
    <label
      className={`block font-semibold text-slate-800 mb-1.5 ${
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

export function Input({ className = '', error, autoComplete = 'off', ...rest }) {
  return (
    <>
      <input
        autoComplete={autoComplete}
        className={`${inputClass} ${error ? errorClass : ''} ${className}`}
        {...rest}
      />
      <FieldError error={error} />
    </>
  );
}

export function Textarea({ className = '', error, autoComplete = 'off', ...rest }) {
  return (
    <>
      <textarea
        autoComplete={autoComplete}
        className={`${inputClass} resize-y ${error ? errorClass : ''} ${className}`}
        {...rest}
      />
      <FieldError error={error} />
    </>
  );
}

export function Select({ className = '', children, error, autoComplete = 'off', ...rest }) {
  return (
    <>
      <select
        autoComplete={autoComplete}
        className={`${inputClass} cursor-pointer ${error ? errorClass : ''} ${className}`}
        {...rest}
      >
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
