import type { Post } from '../types/models'
import { Link } from 'react-router-dom'

export default function PostCard({ post }: { post: Post }) {
  const img = post.featureImageUrl || '/images/placeholder.png'
  const subtitle = post.subtitle || (post.content ? post.content.slice(0, 140) + '...' : '')

  return (
    <article className="bg-white rounded overflow-hidden shadow">
      <div className="h-40 bg-gray-200">
        <img src={img} alt={post.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="text-small text-gray-500">{post.category?.name}</div>
        <h2 className="mt-1 text-h3 text-text">
          <Link to={`/post/${post.id}`} className="hover:text-primary">{post.title}</Link>
        </h2>
        <p className="text-subheading text-gray-700 mt-2">{subtitle}</p>
        <div className="mt-3 text-sm text-primary">
          <Link to={`/post/${post.id}`} className="hover:underline">Read more →</Link>
        </div>
      </div>
    </article>
  )
}
