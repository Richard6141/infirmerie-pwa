import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  isLoading?: boolean
  disabled?: boolean
  onSearchChange?: (search: string) => void
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé",
  isLoading = false,
  disabled = false,
  onSearchChange,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    onSearchChange?.(newSearch)
  }

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-white hover:bg-slate-50", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[500px] p-0 bg-white shadow-lg border-slate-200" align="start">
        <div className="bg-white">
          <div className="border-b border-slate-200 px-3 py-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full outline-none text-sm placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {options.map((option) => {
                  const isSelected = value === option.value
                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      onMouseDown={(e) => e.preventDefault()}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                        isSelected
                          ? "bg-cyan-50 border border-cyan-200"
                          : "hover:bg-slate-100 border border-transparent"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0 text-cyan-600",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn(
                          "text-sm",
                          isSelected ? "font-semibold text-cyan-900" : "font-medium text-slate-700"
                        )}>
                          {option.label}
                        </span>
                        {option.description && (
                          <span className={cn(
                            "text-xs truncate",
                            isSelected ? "text-cyan-700" : "text-slate-500"
                          )}>
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
