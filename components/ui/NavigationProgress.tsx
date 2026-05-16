'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const crawlTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startProgress() {
    if (crawlTimer.current) clearInterval(crawlTimer.current)
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    setVisible(true)
    setWidth(0)
    // jump to 20% instantly, then crawl slowly toward 85%
    requestAnimationFrame(() => {
      setWidth(20)
      crawlTimer.current = setInterval(() => {
        setWidth(prev => {
          if (prev >= 85) {
            clearInterval(crawlTimer.current!)
            return prev
          }
          // slow crawl — decelerates as it approaches 85
          return prev + (85 - prev) * 0.04
        })
      }, 100)
    })
  }

  function completeProgress() {
    if (crawlTimer.current) clearInterval(crawlTimer.current)
    setWidth(100)
    fadeTimer.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 300)
  }

  // Complete bar when pathname changes (navigation done)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      completeProgress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Intercept internal link clicks to start progress immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      // skip external links, hash-only links, and same page
      if (href.startsWith('http') || href.startsWith('#') || href === pathname) return
      startProgress()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    return () => {
      if (crawlTimer.current) clearInterval(crawlTimer.current)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)',
          transition: width === 100 ? 'width 150ms ease-out' : 'width 100ms linear',
        }}
      />
    </div>
  )
}
