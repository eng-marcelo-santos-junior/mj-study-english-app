'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  autoPlay?: boolean
  label?: string
  onEnded?: () => void
  className?: string
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function AudioPlayer({
  src,
  autoPlay = false,
  label,
  onEnded,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(2) // default 1x
  const [error, setError] = useState(false)

  const speed = SPEED_OPTIONS[speedIndex]

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => setError(true))
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const restart = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    play()
  }, [play])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted((m) => !m)
  }, [isMuted])

  const cycleSpeed = useCallback(() => {
    const next = (speedIndex + 1) % SPEED_OPTIONS.length
    setSpeedIndex(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEED_OPTIONS[next]
  }, [speedIndex])

  // Keyboard shortcuts (Space, R, ArrowUp, ArrowDown, M)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'KeyR') restart()
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setSpeedIndex((i) => Math.min(i + 1, SPEED_OPTIONS.length - 1))
        if (audioRef.current)
          audioRef.current.playbackRate =
            SPEED_OPTIONS[Math.min(speedIndex + 1, SPEED_OPTIONS.length - 1)]
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setSpeedIndex((i) => Math.max(i - 1, 0))
        if (audioRef.current)
          audioRef.current.playbackRate = SPEED_OPTIONS[Math.max(speedIndex - 1, 0)]
      }
      if (e.code === 'KeyM') toggleMute()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay, restart, toggleMute, speedIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => {
      setIsPlaying(false)
      setProgress(0)
      onEnded?.()
    }
    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onErr = () => setError(true)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('error', onErr)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('error', onErr)
    }
  }, [onEnded])

  useEffect(() => {
    if (autoPlay) play()
  }, [autoPlay, play])

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-500 ${className}`}>
        <Volume2 className="h-4 w-4" />
        <span>Erro ao carregar áudio</span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {label && <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>}

      {/* Progress bar */}
      <div
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-gray-200 dark:bg-gray-700"
        onClick={(e) => {
          if (!audioRef.current || !duration) return
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          audioRef.current.currentTime = ratio * duration
        }}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={restart}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Reiniciar (R)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full bg-blue-500 p-1.5 text-white hover:bg-blue-600"
            title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Mudo (M)"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 tabular-nums">
            {fmt(progress)} / {duration ? fmt(duration) : '--:--'}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            title="Velocidade (↑↓)"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  )
}
