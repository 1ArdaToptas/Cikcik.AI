import * as SliderPrimitive from '@radix-ui/react-slider'

type RadixSliderProps = {
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function RadixSlider({
  value,
  onChange,
  min = 0.5,
  max = 2.0,
  step = 0.05,
  disabled = false,
  className = '',
  ariaLabel = 'Hız ayarı',
}: RadixSliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={(vals) => {
        if (vals[0] !== undefined) {
          onChange(vals[0])
        }
      }}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative flex w-full touch-none select-none items-center py-2 ${className}`}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--sidebar-bg)] border border-[var(--border-subtle)]">
        <SliderPrimitive.Range className="absolute h-full bg-chick-yellow" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block size-5 rounded-full border-2 border-chick-yellow bg-black shadow-md transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-chick-yellow focus-visible:ring-offset-2 disabled:pointer-events-none cursor-grab active:cursor-grabbing"
        aria-label={ariaLabel}
      />
    </SliderPrimitive.Root>
  )
}
