'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

type PostLikeButtonProps = {
  postId: string
  initialLikes?: number
}

export function PostLikeButton({ postId, initialLikes = 0 }: PostLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false)
      setLikes((l) => Math.max(0, l - 1))
    } else {
      setIsLiked(true)
      setLikes((l) => l + 1)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
        isLiked
          ? 'bg-red-950 text-red-400 border border-red-800 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
          : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
      <span>{likes}</span>
    </button>
  )
}
