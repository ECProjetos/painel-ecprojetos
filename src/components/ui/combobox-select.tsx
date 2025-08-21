"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

export type ComboboxItem = { value: string; label: string }

type Props = {
  name?: string // <- importante para enviar no FormData
  items: ComboboxItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  buttonClassName?: string
  contentClassName?: string
}

export function ComboboxSelect({
  name,
  items,
  value,
  onValueChange,
  placeholder = "Selecione...",
  emptyText = "Nada encontrado.",
  disabled,
  contentClassName = "w-[--radix-popover-trigger-width] p-0 ",
}: Props) {
  const [open, setOpen] = React.useState(false)
  const selected = items.find((i) => i.value === value)

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <Popover open={open} onOpenChange={setOpen} >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full"
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={contentClassName}>
          <Command>
            <CommandInput placeholder="Pesquisar..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    // onSelect retorna o label; vamos mapear de volta para o value
                    onSelect={() => {
                      onValueChange(item.value === value ? "" : item.value)
                      setOpen(false)
                    }}
                  >
                    {item.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        item.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  </>
  )
}
