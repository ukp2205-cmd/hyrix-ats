'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfQuarter } from 'date-fns'
import { Separator } from '@/components/ui/separator'

export interface DateRange {
  from: Date
  to: Date
}

interface DashboardDateFilterProps {
  onDateChange: (range: DateRange) => void
  className?: string
}

export function DashboardDateFilter({ onDateChange, className }: DashboardDateFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [open, setOpen] = useState(false)
  const [displayOption, setDisplayOption] = useState<string>('today')

  const dateRangeOptions = [
    { value: 'today', label: 'Today', group: 'recent' },
    { value: 'yesterday', label: 'Yesterday', group: 'recent' },
    { value: 'this_week', label: 'This Week (Mon to Sat)', group: 'week' },
    { value: 'last_7_days', label: 'Last 7 Days', group: 'week' },
    { value: 'last_30_days', label: 'Last 30 Days', group: 'month' },
    { value: 'this_month', label: 'This Month', group: 'month' },
    { value: 'last_month', label: 'Last Month', group: 'month' },
    { value: 'last_90_days', label: 'Last 90 Days', group: 'quarter' },
    { value: 'quarter_to_date', label: 'Quarter to Date', group: 'quarter' },
    { value: 'this_year', label: 'This Year (Jan to Today)', group: 'year' },
    { value: 'last_year', label: 'Last Calendar Year', group: 'year' },
    { value: 'custom', label: 'Custom Range', group: 'custom' },
  ]
  
  // Group options for better organization
  const recentlyUsed = dateRangeOptions.filter(opt => ['today', 'yesterday'].includes(opt.value))
  const commonRanges = dateRangeOptions.filter(opt => !['today', 'yesterday', 'custom'].includes(opt.value))
  const customOption = dateRangeOptions.find(opt => opt.value === 'custom')

  const calculateDateRange = (option: string): DateRange => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (option) {
      case 'today':
        return { from: today, to: today }
      
      case 'yesterday':
        const yesterday = subDays(today, 1)
        return { from: yesterday, to: yesterday }
      
      case 'this_week': {
        // Monday to Saturday
        const start = startOfWeek(today, { weekStartsOn: 1 }) // 1 = Monday
        const end = new Date(start)
        end.setDate(end.getDate() + 5) // Saturday (Mon + 5 days)
        return { from: start, to: end > today ? today : end }
      }
      
      case 'last_7_days':
        return { from: subDays(today, 6), to: today }
      
      case 'last_30_days':
        return { from: subDays(today, 29), to: today }
      
      case 'this_month':
        return { from: startOfMonth(today), to: today }
      
      case 'last_month': {
        const lastMonth = subMonths(today, 1)
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
      }
      
      case 'last_90_days':
        return { from: subDays(today, 89), to: today }
      
      case 'quarter_to_date':
        return { from: startOfQuarter(today), to: today }
      
      case 'this_year':
        return { from: startOfYear(today), to: today }
      
      case 'last_year': {
        const lastYear = subYears(today, 1)
        return { from: startOfYear(lastYear), to: endOfYear(lastYear) }
      }
      
      default:
        return { from: today, to: today }
    }
  }

  const handleRangeSelect = (option: string) => {
    if (option === 'custom') {
      setShowCustomCalendar(true)
      setSelectedRange(option)
      setDisplayOption(option)
    } else {
      setSelectedRange(option)
      setDisplayOption(option)
      setShowCustomCalendar(false)
      const range = calculateDateRange(option)
      onDateChange(range)
      setOpen(false)
    }
  }

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    // Only update the visual state, don't trigger data fetch yet
    setCustomRange(range as DateRange)
  }

  const handleApplyCustomRange = () => {
    if (customRange?.from && customRange?.to) {
      setSelectedRange('custom')
      setDisplayOption('custom')
      onDateChange(customRange)
      setShowCustomCalendar(false)
      setOpen(false)
    }
  }

  const getDisplayText = () => {
    if (displayOption === 'custom' && customRange?.from && customRange?.to) {
      return `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`
    }
    const option = dateRangeOptions.find(opt => opt.value === displayOption)
    return option?.label || 'Select date range'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between gap-2 font-normal h-9 text-sm border-gray-300 w-auto min-w-[180px]",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-gray-700 text-sm">{getDisplayText()}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", showCustomCalendar ? "w-auto" : "w-[280px]")} align="end" sideOffset={8}>
        {!showCustomCalendar ? (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="py-2">
              {/* Recently Used Section */}
              <div className="px-2 pb-2">
                <p className="px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recently Used</p>
                <div className="space-y-0.5">
                  {recentlyUsed.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRangeSelect(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                        displayOption === option.value && "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                      )}
                    >
                      <span>{option.label}</span>
                      {displayOption === option.value && <Check className="h-4 w-4 text-blue-700" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* Common Ranges Section */}
              <div className="px-2">
                <div className="space-y-0.5">
                  {commonRanges.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRangeSelect(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                        displayOption === option.value && "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                      )}
                    >
                      <span>{option.label}</span>
                      {displayOption === option.value && <Check className="h-4 w-4 text-blue-700" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* Custom Range Option */}
              {customOption && (
                <div className="px-2 pb-1">
                  <button
                    onClick={() => handleRangeSelect('custom')}
                    className={cn(
                      "w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors font-medium",
                      displayOption === 'custom' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    )}
                  >
                    <span>{customOption.label}</span>
                    {displayOption === 'custom' && <Check className="h-4 w-4 text-blue-700" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomCalendar(false)}
                className="h-7 px-2 text-xs hover:bg-gray-100 -ml-2"
              >
                ← Back
              </Button>
              <p className="text-xs font-semibold text-gray-700">Select Date Range</p>
            </div>
            <div className="calendar-compact">
              <Calendar
                mode="range"
                selected={customRange as any}
                onSelect={handleCustomRangeSelect as any}
                numberOfMonths={2}
                className="rounded-md border-0"
              />
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {customRange?.from && customRange?.to ? (
                  <span className="font-medium text-gray-700">
                    {format(customRange.from, 'MMM d')} - {format(customRange.to, 'MMM d, yyyy')}
                  </span>
                ) : (
                  'Select start and end date'
                )}
              </p>
              <Button
                size="sm"
                onClick={handleApplyCustomRange}
                disabled={!customRange?.from || !customRange?.to}
                className="h-7 px-3 text-xs"
              >
                Apply
              </Button>
            </div>
            <style jsx global>{`
              .calendar-compact .rdp {
                --rdp-cell-size: 30px;
                --rdp-accent-color: #3b82f6;
                font-size: 12px;
              }
              .calendar-compact .rdp-months {
                display: flex;
                flex-direction: row;
                gap: 12px;
              }
              .calendar-compact .rdp-month {
                width: auto;
              }
              .calendar-compact .rdp-caption {
                margin-bottom: 6px;
                font-size: 13px;
                font-weight: 600;
              }
              .calendar-compact .rdp-head_cell {
                font-size: 10px;
                font-weight: 600;
                color: #6b7280;
                padding: 4px;
              }
              .calendar-compact .rdp-day {
                font-size: 12px;
                width: 30px;
                height: 30px;
              }
              .calendar-compact .rdp-day_selected {
                background-color: #3b82f6;
                color: white;
                font-weight: 600;
              }
              .calendar-compact .rdp-day_range_middle {
                background-color: #dbeafe;
                color: #1e40af;
              }
              .calendar-compact .rdp-day_range_start,
              .calendar-compact .rdp-day_range_end {
                background-color: #3b82f6;
                color: white;
                font-weight: 600;
              }
              .calendar-compact .rdp-nav_button {
                width: 24px;
                height: 24px;
              }
            `}</style>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
