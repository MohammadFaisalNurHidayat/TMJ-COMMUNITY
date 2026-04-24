import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Generic fetcher — reusable untuk semua tabel
function useTable(table, options = {}) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        let query = supabase.from(table).select('*')

        if (options.filter)  query = query.eq(...options.filter)
        if (options.order)   query = query.order(options.order, { ascending: options.asc ?? true })
        if (options.limit)   query = query.limit(options.limit)

        const { data: rows, error: err } = await query
        if (err) throw err
        if (!cancelled) setData(rows)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [table])

  return { data, loading, error }
}

// Hook spesifik per kebutuhan
export function useMembers() {
  return useTable('members', { order: 'order_index', asc: true })
}

export function useGallery() {
  return useTable('gallery', { order: 'order_index', asc: true })
}

export function useTestimonials() {
  return useTable('testimonials', { order: 'order_index', asc: true })
}

export function useAnnouncement() {
  return useTable('announcements', { filter: ['active', true], limit: 1 })
}

export function useNextEvent() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: rows } = await supabase
        .from('events')
        .select('*')
        .eq('active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(1)

      setData(rows?.[0] ?? null)
      setLoading(false)
    }
    fetch()
  }, [])

  return { data, loading }
}

// Submit form pendaftaran
export async function submitRegistration(formData) {
  const { error } = await supabase
    .from('registrations')
    .insert([formData])

  if (error) throw new Error(error.message)
  return true
}

export function useLeaderboard() {
  return useTable('leaderboard', { order: 'order_index', asc: true })
}

export function useTimeline() {
  return useTable('timeline', { order: 'order_index', asc: true })
}

export function useRules() {
  return useTable('rules', { order: 'order_index', asc: true })
}