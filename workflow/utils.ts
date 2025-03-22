import * as cheerio from 'cheerio'

export async function getHackerNewsTopStories(today: string, JINA_KEY?: string) {
  const url = `https://news.ycombinator.com/front?day=${today}`
  const headers: HeadersInit = {
    'X-Retain-Images': 'none',
    'X-Return-Format': 'html',
  }

  if (JINA_KEY) {
    headers.Authorization = `Bearer ${JINA_KEY}`
  }
  console.info(`get top stories ${today} from ${url}`)
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers,
  })
  console.info(`get top stories result: ${response.statusText}`)
  const text = await response.text()

  const $ = cheerio.load(text)
  const stories: Story[] = $('.athing.submission').map((i, el) => ({
    id: $(el).attr('id'),
    title: $(el).find('.titleline > a').text(),
    url: $(el).find('.titleline > a').attr('href'),
    hackerNewsUrl: `https://news.ycombinator.com/item?id=${$(el).attr('id')}`,
  })).get()

  return stories.filter(story => story.id && story.url)
}

export async function getHackerNewsStory(story: Story, maxTokens: number, JINA_KEY?: string) {
  const headers: HeadersInit = {
    'X-Retain-Images': 'none',
  }

  if (JINA_KEY) {
    headers.Authorization = `Bearer ${JINA_KEY}`
  }

  const [article, comments] = await Promise.all([
    fetch(`https://r.jina.ai/${story.url}`, {
      headers,
    }).then((res) => {
      if (res.ok) {
        return res.text()
      }
      else {
        console.error(`get story failed: ${res.statusText}  ${story.url}`)
        return ''
      }
    }),
    fetch(`https://r.jina.ai/https://news.ycombinator.com/item?id=${story.id}`, {
      headers: {
        ...headers,
        'X-Remove-Selector': '.navs',
        'X-Target-Selector': '#pagespace + tr',
      },
    }).then((res) => {
      if (res.ok) {
        const text = res.text()
        console.error(`get story comments success: ${res.statusText} https://news.ycombinator.com/item?id=${story.id} [${text.length}] ${text.substring(0, 500)} `)

        return text
      }
      else {
        console.error(`get story comments failed: ${res.statusText} https://news.ycombinator.com/item?id=${story.id}`)
        return ''
      }
    }),
  ])
  return [
    story.title
      ? `
<title>
${story.title}
</title>
`
      : '',
    article
      ? `
<article>
${article.substring(0, maxTokens * 4)}
</article>
`
      : '',
    comments
      ? `
<comments>
${comments.substring(0, maxTokens * 4)}
</comments>
`
      : '',
  ].filter(Boolean).join('\n\n---\n\n')
}
