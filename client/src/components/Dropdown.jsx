import React, { useState } from 'react';

function Dropdown({ onSelect, activeItem, items }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const selectItem = (e, item) => {
    e.preventDefault();
    setDropdownVisible(!dropdownVisible);
    onSelect(item);
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        onClick={() => setDropdownVisible(!dropdownVisible)}
      >
        {activeItem.label}
      </button>
      <div className={`dropdown-menu ${dropdownVisible ? 'visible' : ''}`}>
        {items.map((item, i) => (
          <a
            className={`dropdown-item ${
              item.value === activeItem.value ? 'active' : ''
            }`}
            href="#"
            key={i}
            onClick={(e) => selectItem(e, item.value)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default Dropdown;
