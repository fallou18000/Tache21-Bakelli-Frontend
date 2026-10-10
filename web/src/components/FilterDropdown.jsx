import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

function FilterDropdown({ options, value, onChange, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className={`filter-dropdown ${className}`.trim()} ref={dropdownRef}>
      <button
        className="filter-dropdown-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="filter-dropdown-menu">
          {options.map(({ value: optionValue, label }) => (
            <button
              className={value === optionValue ? 'selected' : ''}
              key={optionValue}
              type="button"
              aria-pressed={value === optionValue}
              onClick={() => {
                onChange(optionValue)
                setOpen(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
