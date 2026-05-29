'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <RefreshCw className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Something went wrong
            </p>
            <p className="text-xs text-slate-500">
              An unexpected error occurred. Reload the page to continue.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
