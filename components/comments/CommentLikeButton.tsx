'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toggleVote } from '@/app/votes/actions'
import { GuestLoginModal } from '@/components/auth/GuestLoginModal'

type CommentLikeButtonProps = {
  commentId: string
  initialLikes?: number
}

export function CommentLikeButton({ commentId, initialLikes = 0 }: CommentLikeButtonProps) {
  const pathname = usePathname()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const handleToggle = async () => {
    if (isPending) return
    setIsPending(true)
    try {
      const res = await toggleVote('comment', commentId, 1)
      if (res.requireAuth) {
        setShowGuestModal(true)
      } else if (res.success) {
        setIsLiked(Boolean(res.hasVoted))
        if (typeof res.newLikeCount === 'number') {
          setLikes(res.newLikeCount)
        }
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all cursor-pointer ${
          isLiked
            ? 'bg-red-950/90 text-red-400 border border-red-800'
            : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800'
        }`}
        title="Me gusta este comentario"
      >
        <Heart className={`w-3 h-3 ${isLiked ? 'fill-current text-red-500' : ''}`} />
        <span>{likes}</span>
      </button>

      <GuestLoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        redirectPath={pathname}
        title="¿Te gusta este comentario?"
        message="Inicia sesión para apoyar los mejores aportes de la comunidad sleepyred999."
      />
    </>
  )
}
