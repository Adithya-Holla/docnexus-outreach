'use client'

import * as React from 'react'
import * as TooltipPrimitives from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitives.Provider

export const Tooltip = TooltipPrimitives.Root

export const TooltipTrigger = TooltipPrimitives.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitives.Portal>
    <TooltipPrimitives.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        className,
      )}
      {...props}
    />
  </TooltipPrimitives.Portal>
))
TooltipContent.displayName = TooltipPrimitives.Content.displayName
