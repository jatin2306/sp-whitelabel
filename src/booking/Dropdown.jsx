import { useEffect, useMemo, useRef, useState } from 'react';
import Select, { components } from 'react-select';
import { sortAz } from '../utility';

const SEARCH_MIN = 5;

function Menu(props) {
  const { innerRef, ...rest } = props;
  return (
    <components.Menu
      {...rest}
      innerRef={(node) => {
        if (typeof innerRef === 'function') innerRef(node);
        else if (innerRef) innerRef.current = node;
        props.selectProps.setMenuNode(node);
      }}
    />
  );
}

function MenuList(props) {
  if (!props.selectProps.searchable) {
    return <components.MenuList {...props} />;
  }

  return (
    <components.MenuList {...props}>
      <div className="search-select__menu-search">
        <input
          autoFocus
          value={props.selectProps.menuQuery}
          placeholder="Search"
          aria-label="Search"
          onChange={(event) => props.selectProps.onMenuQuery(event.target.value)}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') props.selectProps.onRequestClose();
          }}
        />
      </div>
      {props.children}
    </components.MenuList>
  );
}

function Control(props) {
  return (
    <components.Control
      {...props}
      innerProps={{
        ...props.innerProps,
        onMouseDown: (event) => {
          if (props.selectProps.menuIsOpen) {
            event.preventDefault();
            event.stopPropagation();
            props.selectProps.onRequestClose();
            return;
          }
          props.innerProps.onMouseDown?.(event);
        },
      }}
    />
  );
}

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
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuNode = useRef(null);
  const ordered = useMemo(
    () => sortAz(options, (option) => option[labelKey]),
    [options, labelKey],
  );
  const searchable = ordered.length > SEARCH_MIN;
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!searchable || !term) return ordered;
    return ordered.filter((option) =>
      String(option[labelKey] ?? '')
        .toLowerCase()
        .includes(term),
    );
  }, [ordered, query, searchable, labelKey]);
  const selected =
    ordered.find((option) => String(option[valueKey]) === String(value)) ||
    null;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuNode.current?.contains(target)) {
        return;
      }
      close();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef}>
      <Select
        inputId={id}
        name={name}
        unstyled
        className="search-select"
        classNamePrefix="search-select"
        components={{ Menu, MenuList, Control }}
        options={visible}
        value={selected}
        placeholder={loading ? 'Loading…' : placeholder}
        isDisabled={disabled || loading}
        isLoading={loading}
        isSearchable={false}
        isClearable={false}
        menuIsOpen={open}
        onMenuOpen={() => setOpen(true)}
        menuPlacement="auto"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        searchable={searchable}
        menuQuery={query}
        onMenuQuery={setQuery}
        onRequestClose={close}
        setMenuNode={(node) => {
          menuNode.current = node;
        }}
        getOptionValue={(option) => String(option[valueKey])}
        getOptionLabel={(option) => String(option[labelKey] ?? '')}
        onChange={(option) => {
          onChange?.(option ? option[valueKey] : '', option || undefined);
          close();
        }}
        noOptionsMessage={() => (query.trim() ? 'No matches' : 'No options')}
      />
    </div>
  );
}
