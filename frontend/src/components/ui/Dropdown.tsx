import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export type DropdownOption = {
  value: string
  label: string
  sublabel?: string
  icon?: ReactNode
}

type DropdownProps = {
  trigger: ReactNode
  options: DropdownOption[]
  selected: string
  onSelect: (val: string) => void
  align?: 'start' | 'center' | 'end'
  title?: string
}

export function Dropdown({
  trigger,
  options,
  selected,
  onSelect,
  align = 'end',
  title,
}: DropdownProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={8}
          className="z-50 min-w-48 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {title && (
            <DropdownMenuPrimitive.Label className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              {title}
            </DropdownMenuPrimitive.Label>
          )}

          {options.map((opt) => {
            const isSelected = selected === opt.value
            return (
              <DropdownMenuPrimitive.Item
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer outline-none transition-colors ${
                  isSelected
                    ? 'bg-chick-yellow/20 text-chick-orange dark:text-chick-yellow font-bold'
                    : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <div>
                    <p>{opt.label}</p>
                    {opt.sublabel && (
                      <p className="text-[10px] text-[var(--text-muted)] font-normal">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="size-3.5 text-chick-orange dark:text-chick-yellow shrink-0 ml-2" />}
              </DropdownMenuPrimitive.Item>
            )
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
