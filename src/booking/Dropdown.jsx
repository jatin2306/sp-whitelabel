export default function Dropdown({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  loading = false,
  valueKey = 'value',
  labelKey = 'label',
  name,
  id,
}) {
  const handleChange = (event) => {
    const nextValue = event.target.value;
    const selected = options.find(
      (option) => String(option[valueKey]) === nextValue,
    );
    onChange?.(nextValue, selected);
  };

  return (
    <div className={`dropdown-wrap${loading ? ' is-loading' : ''}`}>
      <select
        id={id}
        name={name}
        className="common-dropdown"
        value={value}
        disabled={disabled || loading}
        onChange={handleChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={String(option[valueKey])} value={option[valueKey]}>
            {option[labelKey]}
          </option>
        ))}
      </select>
      {loading ? <span className="dropdown-spinner" aria-hidden="true" /> : null}
    </div>
  );
}
