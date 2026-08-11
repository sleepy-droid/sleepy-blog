'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toggleVote } from '@/app/votes/actions'
import { GuestLoginModal } from '@/components/auth/GuestLoginModal'

type PostLikeButtonProps = {
  postId: string
  initialLikes?: number
  userHasVoted?: boolean
}

export function PostLikeButton({ postId, initialLikes = 0, userHasVoted = false }: PostLikeButtonProps) {
  const pathname = usePathname()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(userHasVoted)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPending) return
    setIsPending(true)

    try {
      const res = await toggleVote('post', postId, 1)
      if (res.requireAuth) {
        setShowGuestModal(true)
      } else if (res.success) {
        setIsLiked(Boolean(res.hasVoted))
        if (typeof res.newLikeCount === 'number') {
          setLikes(res.newLikeCount)
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLikeClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
          isLiked
            ? 'bg-red-950 text-red-400 border border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
            : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
        }`}
        title="Me gusta esta publicación"
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
        <span>{likes}</span>
      </button>

      <GuestLoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        redirectPath={pathname}
        title="¿Te gusta esta publicación?"
        message="Inicia sesión con tu cuenta de usuario para registrar tu me gusta y ayudar a posicionar esta noticia."
      />
    </>
  )
}
