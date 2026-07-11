const Input = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`form-input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} {...props} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
