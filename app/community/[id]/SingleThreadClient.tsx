'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ThumbsUp, ThumbsDown, Tag, Video, Calendar } from 'lucide-react'
import { toggleVote } from '@/app/votes/actions'
import { GuestLoginModal } from '@/components/auth/GuestLoginModal'
import type { ThreadWithAuthor } from '../page'

type SingleThreadClientProps = {
  thread: ThreadWithAuthor
}

export function SingleThreadClient({ thread }: SingleThreadClientProps) {
  const pathname = usePathname()
  const [upvotes, setUpvotes] = useState(thread.upvotes ?? 0)
  const [downvotes, setDownvotes] = useState(thread.downvotes ?? 0)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)
  const [isVoting, setIsVoting] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const authorName =
    thread.profiles?.display_name ||
    thread.profiles?.username ||
    thread.profiles?.email?.split('@')[0] ||
    'Miembro'
  const authorUsername =
    thread.profiles?.username ||
    thread.profiles?.email?.split('@')[0] ||
    thread.author_id
  const authorAvatar = thread.profiles?.avatar_url

  const handleVote = async (val: 1 | -1) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      const res = await toggleVote('forum_thread', thread.id, val)
      if (res.requireAuth) {
        setShowGuestModal(true)
      } else if (res.success) {
        if (typeof res.newLikeCount === 'number') setUpvotes(res.newLikeCount)
        if (typeof res.newDownvoteCount === 'number') setDownvotes(res.newDownvoteCount)
        setUserVote(res.userVote ?? 0)
      }
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header: Author Info & Date */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <Link
          href={`/u/${authorUsername}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                unoptimized={authorAvatar.endsWith('.svg')}
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-400">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors block">
              @{authorName}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" />
              {new Date(thread.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </Link>

        {/* Persistent Upvote / Downvote buttons */}
        <div className="flex items-center gap-2 bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-800">
          <button
            type="button"
            disabled={isVoting}
            onClick={() => handleVote(1)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              userVote === 1
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{upvotes}</span>
          </button>
          <button
            type="button"
            disabled={isVoting}
            onClick={() => handleVote(-1)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              userVote === -1
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{downvotes}</span>
          </button>
        </div>
      </div>

      {/* Tags Badges & Tagged Product Link */}
      <div className="flex flex-wrap items-center gap-2">
        {thread.tags &&
          thread.tags.map((tag) => (
            <Link
              key={tag}
              href={`/community?tag=${encodeURIComponent(tag)}`}
              className="text-[11px] font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full hover:border-red-900/60 transition-colors"
            >
              #{tag}
            </Link>
          ))}

        {thread.products && (
          <Link
            href={`/shop/${encodeURIComponent(thread.products.slug)}`}
            className="text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-900/60 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-900 transition-colors"
          >
            <Tag className="w-3 h-3" />
            <span>Producto: {thread.products.name}</span>
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
        {thread.title}
      </h1>

      {/* Full Body Text */}
      <p className="text-neutral-200 text-sm sm:text-base leading-relaxed whitespace-pre-line border-l-2 border-red-900/60 pl-4 py-1">
        {thread.body}
      </p>

      {/* YouTube Embedded Player */}
      {thread.youtube_url && (
        <div className="space-y-2 pt-2">
          <span className="text-xs uppercase font-mono font-bold text-red-400 flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            Vídeo Embebido de YouTube
          </span>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl">
            <iframe
              src={thread.youtube_url}
              title={thread.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Attached Image (if no youtube) */}
      {!thread.youtube_url && thread.image_url && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-xl">
          <Image src={thread.image_url} alt={thread.title} fill className="object-cover" sizes="800px" />
        </div>
      )}

      <GuestLoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        redirectPath={pathname}
        title="¿Quieres votar en este debate?"
        message="Inicia sesión con tu cuenta de usuario para apoyar los mejores hilos de la comunidad."
      />
    </div>
  )
}
