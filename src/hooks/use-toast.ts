'use client'

import { useState, useEffect } from 'react'

export type ToastVariant = 'default' | 'destructive'

export interface Toast {
  id:           string
  title:        string
  description?: string
  variant?:     ToastVariant
}

type ToastInput = Omit<Toast, 'id'>

const LIMIT    = 3
const DURATION = 4500

// Module-level singleton store — survives across re-renders
const listeners = new Set<(toasts: Toast[]) => void>()
let store: Toast[] = []
let counter = 0

function notify() {
  const snapshot = [...store]
  listeners.forEach((fn) => fn(snapshot))
}

export function toast(input: ToastInput): string {
  const id: string = `toast-${++counter}`
  store = [{ ...input, id }, ...store].slice(0, LIMIT)
  notify()
  setTimeout(() => dismiss(id), DURATION)
  return id
}

export function dismiss(id: string) {
  store = store.filter((t) => t.id !== id)
  notify()
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([...store])

  useEffect(() => {
    listeners.add(setToasts)
    return () => { listeners.delete(setToasts) }
  }, [])

  return { toasts, toast, dismiss }
}
