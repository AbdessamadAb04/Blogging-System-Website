import { useEffect, useState } from 'react'
import Navbar from '../sections/Navbar'
import Hero from '../sections/Hero'
import Features from '../sections/Features'
import LatestBlogs from '../sections/LatestBlogs'
import CategoryBlogs from '../sections/CategoryBlogs'
import Newsletter from '../sections/Newsletter'
import FAQ from '../components/FAQ'
import Footer from '../sections/Footer'
import type { Post } from '../types/models'
import RecommendationsBlogs from '../sections/RecommendationsBlogs'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE || ''
    const apiUrl = base + '/api/postsapi'  // Request all posts
    console.log('Fetching from:', apiUrl)
    
    fetch(apiUrl)
      .then((r) => {
        console.log('Response status:', r.status)
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`)
        }
        return r.json()
      })
      .then((data) => {
        console.log('API response data:', data)
        setPosts(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Fetch error:', error)
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <Hero />
      <main className="pt-8">
        <Features />
        <LatestBlogs posts={posts} loading={loading} />
        <RecommendationsBlogs posts={posts} loading={loading} />
        <CategoryBlogs />
        <Newsletter />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}


