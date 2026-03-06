'use client'

import React from "react"

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { GripVertical, X, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  order: number
}

interface ColumnCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
}

export function ColumnCustomizer({
  open,
  onOpenChange,
  columns,
  onColumnsChange,
}: ColumnCustomizerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [searchQuery, setSearchQuery] = useState('')
  const hiddenColumns = localColumns.filter(col => !col.visible)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const visibleColumns = localColumns.filter(col => col.visible).sort((a, b) => a.order - b.order)
  
  // Filter all columns by search query
  const allColumnsSorted = localColumns.sort((a, b) => a.label.localeCompare(b.label))
  const filteredColumns = searchQuery
    ? allColumnsSorted.filter(col => 
        col.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allColumnsSorted

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newColumns = [...visibleColumns]
    const draggedItem = newColumns[draggedIndex]
    newColumns.splice(draggedIndex, 1)
    newColumns.splice(index, 0, draggedItem)

    // Update orders
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }))

    // Merge with hidden columns
    const allColumns = [
      ...updatedColumns,
      ...hiddenColumns
    ]

    setLocalColumns(allColumns)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onColumnsChange(localColumns)
  }

  const toggleColumnVisibility = (columnId: string) => {
    const updatedColumns = localColumns.map(col => {
      if (col.id === columnId) {
        return { ...col, visible: !col.visible }
      }
      return col
    })
    setLocalColumns(updatedColumns)
    onColumnsChange(updatedColumns)
  }

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === visibleColumns.length - 1)
    ) {
      return
    }

    const newColumns = [...visibleColumns]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newColumns[index]
    newColumns[index] = newColumns[targetIndex]
    newColumns[targetIndex] = temp

    // Update orders
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }))

    // Merge with hidden columns
    const allColumns = [
      ...updatedColumns,
      ...hiddenColumns
    ]

    setLocalColumns(allColumns)
    onColumnsChange(allColumns)
  }

  const removeColumn = (columnId: string) => {
    toggleColumnVisibility(columnId)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[440px] overflow-y-auto bg-white p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customize Columns</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-gray-50 border-gray-200 text-sm focus:bg-white"
            />
          </div>
        </div>

        <div className="px-6 py-5 space-y-8">
          {/* Available Columns - All columns with checkboxes */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Available Columns</h3>
            <div className="space-y-1">
              {filteredColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  onClick={() => toggleColumnVisibility(column.id)}
                >
                  <Checkbox
                    id={`checkbox-${column.id}`}
                    checked={column.visible}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                    className="flex-shrink-0"
                  />
                  <label
                    htmlFor={`checkbox-${column.id}`}
                    className="flex-1 text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Columns - Can be Reordered */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                SELECTED COLUMNS
              </h3>
              <span className="text-xs text-gray-500">
                Drag to reorder
              </span>
            </div>
            <div className="space-y-2">
              {visibleColumns.map((column, index) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 border border-gray-200 rounded-md bg-gray-50/50 transition-all cursor-move group",
                    draggedIndex === index && "opacity-50 shadow-md",
                    "hover:border-gray-300 hover:bg-gray-100/50"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  
                  <span className="flex-1 text-sm font-normal text-gray-800">
                    {column.label}
                  </span>

                  <div className="flex items-center gap-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-200 rounded"
                      onClick={() => moveColumn(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-200 rounded"
                      onClick={() => moveColumn(index, 'down')}
                      disabled={index === visibleColumns.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-200 rounded"
                      onClick={() => removeColumn(column.id)}
                    >
                      <X className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
