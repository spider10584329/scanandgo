import toast from 'react-hot-toast'
import React from 'react'
import Image from 'next/image'

// Toast types with custom colors
type ToastType = 'success' | 'error' | 'warning' | 'notification'

// Custom SVG icons from public directory
const ToastIcons = {
  success: (
    <Image 
      src="/success.svg" 
      alt="Success" 
      width={20} 
      height={20} 
      style={{ filter: 'brightness(0) invert(1)' }} // Makes SVG white
    />
  ),
  error: (
    <Image 
      src="/error.svg" 
      alt="Error" 
      width={20} 
      height={20} 
      style={{ filter: 'brightness(0) invert(1)' }} // Makes SVG white
    />
  ),
  warning: (
    <Image 
      src="/warning.svg" 
      alt="Warning" 
      width={20} 
      height={20} 
      style={{ filter: 'brightness(0) invert(1)' }} // Makes SVG white
    />
  ),
  notification: (
    <Image 
      src="/notification.svg" 
      alt="Notification" 
      width={20} 
      height={20} 
      style={{ filter: 'brightness(0) invert(1)' }} // Makes SVG white
    />
  ),
}

// Default color scheme
const defaultColors = {
  success: '#0ba33e',      // Green
  error: '#b81b1b',        // Red
  warning: '#dd9519',      // Amber/Orange
  notification: '#224992', // Blue
}

// Custom toast configuration
interface ToastConfig {
  type: ToastType
  message: string
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  colors?: {
    background?: string
    text?: string
  }
  customIcon?: React.ReactNode
  hideIcon?: boolean
}

// Main toast function
export const showToast = ({
  type,
  message,
  duration = 4000,
  position = 'bottom-right',
  colors,
  customIcon,
  hideIcon = false
}: ToastConfig) => {
  const backgroundColor = colors?.background || defaultColors[type]
  const textColor = colors?.text || 'white'

  const getIcon = (): React.ReactElement | undefined => {
    if (hideIcon) return undefined
    if (customIcon) return customIcon as React.ReactElement
    return ToastIcons[type]
  }

  const baseOptions = {
    duration,
    position,
    style: {
      background: backgroundColor,
      color: textColor,
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  }

  const iconElement = getIcon()
  const toastOptions = iconElement 
    ? { ...baseOptions, icon: iconElement }
    : baseOptions

  // Use the generic toast function to avoid default icons
  return toast(message, toastOptions)
}

// Convenience functions for each toast type
export const toastSuccess = (message: string, options?: Omit<ToastConfig, 'type' | 'message'>) =>
  showToast({ type: 'success', message, ...options })

export const toastError = (message: string, options?: Omit<ToastConfig, 'type' | 'message'>) =>
  showToast({ type: 'error', message, ...options })

export const toastWarning = (message: string, options?: Omit<ToastConfig, 'type' | 'message'>) =>
  showToast({ type: 'warning', message, ...options })

export const toastNotification = (message: string, options?: Omit<ToastConfig, 'type' | 'message'>) =>
  showToast({ type: 'notification', message, ...options })

// Custom color presets
export const toastPresets = {
  // Light theme colors
  light: {
    success: { background: '#029b68', text: 'white' },
    error: { background: '#EF4444', text: 'white' },
    warning: { background: '#F59E0B', text: 'white' },
    notification: { background: '#3B82F6', text: 'white' },
  },
  // Dark theme colors
  dark: {
    success: { background: '#059669', text: 'white' },
    error: { background: '#DC2626', text: 'white' },
    warning: { background: '#D97706', text: 'white' },
    notification: { background: '#2563EB', text: 'white' },
  },
  // Pastel colors
  pastel: {
    success: { background: '#86EFAC', text: '#064E3B' },
    error: { background: '#FCA5A5', text: '#7F1D1D' },
    warning: { background: '#FDE68A', text: '#78350F' },
    notification: { background: '#93C5FD', text: '#1E3A8A' },
  },
}

export default showToast
