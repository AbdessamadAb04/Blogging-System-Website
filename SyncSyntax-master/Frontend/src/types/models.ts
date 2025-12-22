export interface Category {
  id: number
  name: string
  description?: string
}

export interface Post {
  id: number
  title: string
  content: string
  subtitle?: string
  featureImageUrl?: string
  createdAt: string
  category?: Category
  author?: string
  status?: string
}

export interface Comment {
  id: number
  content: string
  createdAt: string
  authorName?: string
}
