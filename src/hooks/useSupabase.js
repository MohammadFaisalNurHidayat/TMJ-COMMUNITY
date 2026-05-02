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

export function useSiteSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        // convert array of {key,value} ke object
        const obj = {};
        data.forEach(row => { obj[row.key] = row.value; });
        setSettings(obj);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { settings, loading };
}

// ── Member Counter via Discord Widget ──
export function useDiscordMembers(guildId) {
  const [data, setData] = useState({ online: 0, total: 0, loaded: false });

  useEffect(() => {
    if (!guildId || guildId === "GUILD_ID_KAMU_DISINI") return;
    async function fetch() {
      try {
        const res = await window.fetch(
          `https://discord.com/api/guilds/${guildId}/widget.json`
        );
        if (!res.ok) return;
        const json = await res.json();
        setData({
          online: json.presence_count || 0,
          total:  0,
          loaded: true,
        });
      } catch {}
    }
    fetch();
    const interval = setInterval(fetch, 60000); // refresh tiap 1 menit
    return () => clearInterval(interval);
  }, [guildId]);

  return data;
}

// ── Shoutbox dengan Realtime ──
export function useShoutbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Ambil 30 pesan terbaru
    supabase
      .from('shoutbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setMessages(data?.reverse() || []);
        setLoading(false);
      });

    // Subscribe realtime
    const channel = supabase
      .channel('shoutbox-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shoutbox' },
        payload => {
          setMessages(prev => {
            const updated = [...prev, payload.new];
            return updated.slice(-30); // max 30 pesan
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { messages, loading };
}

export async function sendShoutbox(name, message, avatarColor) {
  const { error } = await supabase
    .from('shoutbox')
    .insert([{ name, message, avatar_color: avatarColor }]);
  if (error) throw new Error(error.message);
  return true;
}

// ── Poll ──
export function useActivePoll() {
  const [poll, setPoll]       = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voterKey, setVoterKey] = useState(() => {
    let k = localStorage.getItem("tmj-voter-key");
    if (!k) { k = crypto.randomUUID(); localStorage.setItem("tmj-voter-key", k); }
    return k;
  });

  const fetchOptions = async (pollId) => {
    const { data } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('order_index');
    if (data) setOptions(data);
  };

  useEffect(() => {
    async function init() {
      const { data: polls } = await supabase
        .from('polls')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!polls?.length) { setLoading(false); return; }
      const p = polls[0];
      setPoll(p);
      await fetchOptions(p.id);

      // Cek apakah sudah vote
      const { data: existing } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', p.id)
        .eq('voter_key', voterKey)
        .maybeSingle();
      if (existing) setHasVoted(true);

      setLoading(false);

      // Realtime update votes
      const channel = supabase
        .channel('poll-options')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'poll_options', filter: `poll_id=eq.${p.id}` },
          payload => {
            setOptions(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
    init();
  }, [voterKey]);

  const vote = async (optionId) => {
    if (!poll || hasVoted) return;
    try {
      await supabase.from('poll_votes').insert([{ poll_id: poll.id, option_id: optionId, voter_key: voterKey }]);
      await supabase.rpc('increment_vote', { option_id: optionId });
      setHasVoted(true);
      await fetchOptions(poll.id);
    } catch (e) {
      // Fallback kalau rpc belum ada
      await supabase.from('poll_options').update({ votes: (options.find(o=>o.id===optionId)?.votes||0)+1 }).eq('id', optionId);
      setHasVoted(true);
      await fetchOptions(poll.id);
    }
  };

  const totalVotes = options.reduce((a, o) => a + (o.votes || 0), 0);

  return { poll, options, loading, hasVoted, vote, totalVotes };
}

// ── Blog ──
export function usePosts() {
  return useTable('posts', { order: 'created_at', asc: false });
}

export function usePost(slug) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('posts').select('*').eq('slug', slug).eq('published', true).maybeSingle()
      .then(({ data: post }) => { setData(post); setLoading(false); });
  }, [slug]);

  return { data, loading };
}

// ── Achievements ──
export function useAchievements() {
  return useTable('achievements', { order: 'order_index', asc: true });
}

// ── Global Search ──
export function useGlobalSearch(query) {
  const [results, setResults] = useState({ members:[], posts:[], gallery:[], achievements:[] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ members:[], posts:[], gallery:[], achievements:[] });
      return;
    }
    const q = query.trim().toLowerCase();
    setLoading(true);

    const timeout = setTimeout(async () => {
      const [
        { data: members },
        { data: posts },
        { data: gallery },
        { data: achievements },
      ] = await Promise.all([
        supabase.from('members').select('*').or(`name.ilike.%${q}%,role.ilike.%${q}%`).limit(4),
        supabase.from('posts').select('*').eq('published',true).or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,category.ilike.%${q}%`).limit(4),
        supabase.from('gallery').select('*').or(`caption.ilike.%${q}%,category.ilike.%${q}%`).limit(4),
        supabase.from('achievements').select('*').or(`member_name.ilike.%${q}%,badge_name.ilike.%${q}%`).limit(4),
      ]);
      setResults({
        members:      members      || [],
        posts:        posts        || [],
        gallery:      gallery      || [],
        achievements: achievements || [],
      });
      setLoading(false);
    }, 350); // debounce

    return () => clearTimeout(timeout);
  }, [query]);

  const total = Object.values(results).reduce((a,b) => a + b.length, 0);
  return { results, loading, total };
}