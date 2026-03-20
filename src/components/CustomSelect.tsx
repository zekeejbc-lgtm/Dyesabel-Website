import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  previewClassName?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: 'light' | 'dark';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

const VARIANT_STYLES = {
  light: {
    trigger:
      'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-ocean-deep dark:text-white hover:border-primary-cyan/50 focus-visible:ring-primary-cyan/40',
    menu:
      'bg-white/95 dark:bg-[#0d2330]/95 border-gray-200/90 dark:border-white/10 text-ocean-deep dark:text-white shadow-[0_24px_60px_rgba(2,16,23,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]',
    option:
      'text-ocean-deep dark:text-white hover:bg-primary-cyan/10 dark:hover:bg-primary-cyan/15 data-[active=true]:bg-primary-cyan/15 dark:data-[active=true]:bg-primary-cyan/20',
    secondary: 'text-ocean-deep/60 dark:text-white/60'
  },
  dark: {
    trigger:
      'bg-black/20 border-white/10 text-white hover:border-primary-cyan/50 focus-visible:ring-primary-cyan/40',
    menu:
      'bg-[#122333]/95 border-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]',
    option:
      'text-white hover:bg-white/5 data-[active=true]:bg-primary-cyan/15',
    secondary: 'text-white/55'
  }
} as const;

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  ariaLabel,
  variant = 'light',
  className,
  triggerClassName,
  menuClassName
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(288);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;

    const GAP = 10;
    const MIN_HEIGHT = 140;
    const IDEAL_HEIGHT = 288;

    const updateMenuPlacement = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const availableBelow = window.innerHeight - rect.bottom - GAP;
      const availableAbove = rect.top - GAP;

      const shouldOpenUpward = availableBelow < MIN_HEIGHT && availableAbove > availableBelow;
      const chosenSpace = shouldOpenUpward ? availableAbove : availableBelow;
      const safeMaxHeight = Math.max(MIN_HEIGHT, Math.min(IDEAL_HEIGHT, Math.floor(chosenSpace)));

      setOpenUpward(shouldOpenUpward);
      setMenuMaxHeight(safeMaxHeight);
    };

    updateMenuPlacement();
    window.addEventListener('resize', updateMenuPlacement);
    window.addEventListener('scroll', updateMenuPlacement, true);

    return () => {
      window.removeEventListener('resize', updateMenuPlacement);
      window.removeEventListener('scroll', updateMenuPlacement, true);
    };
  }, [open]);

  const styles = VARIANT_STYLES[variant];

  const commit = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const moveActive = (direction: 1 | -1) => {
    if (!options.length) return;
    setActiveIndex((current) => {
      const base = current < 0 ? 0 : current;
      return (base + direction + options.length) % options.length;
    });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (disabled) return;

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            moveActive(1);
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            moveActive(-1);
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (open && activeIndex >= 0 && options[activeIndex]) {
              commit(options[activeIndex].value);
              return;
            }
            setOpen((current) => !current);
          }
        }}
        className={cn(
          'group flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          styles.trigger,
          open && 'border-primary-cyan/70 ring-2 ring-primary-cyan/20',
          triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedOption?.previewClassName && (
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 flex-shrink-0 rounded-full ring-4 ring-white/8 dark:ring-white/5',
                selectedOption.previewClassName
              )}
            />
          )}
          <span className="truncate font-medium">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={cn('flex-shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          style={{ maxHeight: `${menuMaxHeight}px` }}
          className={cn(
            'absolute z-50 w-full overflow-auto rounded-2xl border p-2 backdrop-blur-xl',
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2',
            styles.menu,
            menuClassName
          )}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                data-active={active}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150',
                  styles.option
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {option.previewClassName && (
                    <span
                      aria-hidden="true"
                      className={cn('h-3 w-3 flex-shrink-0 rounded-full', option.previewClassName)}
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{option.label}</span>
                    {option.description && (
                      <span className={cn('block truncate text-xs', styles.secondary)}>
                        {option.description}
                      </span>
                    )}
                  </span>
                </span>
                {selected && <Check size={16} className="flex-shrink-0 text-primary-cyan" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
