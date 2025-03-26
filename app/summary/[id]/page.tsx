import type { Metadata } from 'next'
import { podcastTitle } from '@/config'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'
import './styles.css'

export const dynamicParams = true
export const revalidate = 300

// 生成页面的元数据
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { env } = getCloudflareContext()
  const id = (await params).id

  const post = (await env.HACKER_NEWS_KV.get(`story-summary:${id}`, 'json'))

  if (!post) {
    return notFound()
  }

  const title = podcastTitle
  const description = post.text?.slice(0, 200) || title
  const url = `${env.NEXT_STATIC_HOST}/summary/${post.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: null,
      authors: [podcastTitle],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext()

  const id = (await params).id

  const post = (await env.HACKER_NEWS_KV.get(`story-summary:${id}`, 'json'))

  if (!post) {
    return notFound()
  }

  return (
    <div class="content">
      <Markdown>{post.text}</Markdown>
    </div>
  )
}
