'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MapPin, X } from 'lucide-react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onValidCity?: (isValid: boolean, cityName: string) => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  required?: boolean
}

interface City {
  id: string
  name: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onValidCity,
  onBlur,
  onKeyDown,
  placeholder = 'Enter city name',
  className,
  disabled,
  autoFocus,
  required
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isValidCity, setIsValidCity] = useState(false)
  const [hasBlurred, setHasBlurred] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Validate pre-filled value on mount silently (don't show errors)
  useEffect(() => {
    if (value && value.length > 0) {
      // Validate silently without showing errors
      const checkInitialValue = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('cities')
          .select('name')
          .ilike('name', value.trim())
          .maybeSingle()
        
        if (data) {
          setIsValidCity(true)
          onValidCity?.(true, data.name)
        }
      }
      checkInitialValue()
    }
  }, [])

  // Fetch cities from database
  const fetchCities = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .ilike('name', `${searchTerm}%`)
      .order('name')
      .limit(10)

    if (!error && data) {
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    }
  }

  // Validate if entered city exists in database
  const validateCity = async (cityName: string) => {
    if (!cityName || !cityName.trim()) {
      setIsValidCity(false)
      onValidCity?.(false, '')
      return
    }

    const supabase = createClient()
    const trimmedCity = cityName.trim()
    
    // Check for exact match (case-insensitive)
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .ilike('name', trimmedCity)
      .maybeSingle()

    const valid = !error && data !== null
    console.log('[v0] LocationAutocomplete: Validating city:', trimmedCity, 'Result:', valid, data)
    setIsValidCity(valid)
    onValidCity?.(valid, data?.name || '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsTyping(true)
    setHasBlurred(false)
    
    // Don't immediately mark as invalid while typing
    if (newValue.length >= 2) {
      fetchCities(newValue)
      setIsValidCity(false)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsValidCity(false)
      onValidCity?.(false, '')
    }
  }

  const handleSelectCity = (city: City) => {
    console.log('[v0] LocationAutocomplete: City selected from dropdown:', city.name)
    onChange(city.name)
    setIsValidCity(true)
    setIsTyping(false)
    setHasBlurred(false) // Clear blur state so no errors show
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
    // Immediately notify parent that this is a valid city
    onValidCity?.(true, city.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelectCity(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
    
    onKeyDown?.(e)
  }

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsTyping(false)
      setHasBlurred(true)
      // Only validate if suggestions are not showing (user didn't click a suggestion)
      if (value && !showSuggestions) {
        validateCity(value)
      }
      onBlur?.()
    }, 250)
  }

  const handleClear = () => {
    onChange('')
    setIsValidCity(false)
    setSuggestions([])
    setShowSuggestions(false)
    onValidCity?.(false, '')
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className={cn(
            'pl-9 pr-8',
            isValidCity && value && 'border-green-500 focus-visible:ring-green-500',
            hasBlurred && value && !isValidCity && !isTyping && !showSuggestions && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((city, index) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelectCity(city)}
              className={cn(
                'w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm',
                selectedIndex === index && 'bg-gray-100'
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {city.name}
            </button>
          ))}
        </div>
      )}

      {hasBlurred && value && !isValidCity && !isTyping && !showSuggestions && suggestions.length === 0 && (
        <p className="text-xs text-red-500 mt-1">
          Please select a valid city from the suggestions
        </p>
      )}
    </div>
  )
}
