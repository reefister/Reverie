import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function App() {
  const [tab, setTab] = useState('entries')

  const [entries, setEntries] = useState([])
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('keyword')
  const [isSearching, setIsSearching] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const limit = 10

  const [insightQuery, setInsightQuery] = useState('')
  const [insightResult, setInsightResult] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [expandedSource, setExpandedSource] = useState(null)

  useEffect(() => {
    if (isSearching) return
    fetch(`http://localhost:8000/entries?limit=${limit}&offset=${offset}`)
      .then(res => res.json())
      .then(data => setEntries(data))
  }, [offset, isSearching])

  useEffect(() => {
    if (query.trim()) handleSearch()
  }, [searchMode])

  const handleSearch = () => {
    if (!query.trim()) {
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const endpoint = searchMode === 'keyword'
      ? `http://localhost:8000/search?word=${encodeURIComponent(query)}`
      : `http://localhost:8000/semantic_search?word=${encodeURIComponent(query)}`
    fetch(endpoint)
      .then(res => res.json())
      .then(data => setEntries(data))
  }

  const handleClear = () => {
    setQuery('')
    setIsSearching(false)
    setOffset(0)
  }

  const handleInsight = () => {
    if (!insightQuery.trim()) return
    setInsightLoading(true)
    setInsightResult(null)
    fetch(`http://localhost:8000/insights?q=${encodeURIComponent(insightQuery)}`)
      .then(res => res.json())
      .then(data => {
        setInsightResult(data)
        setInsightLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-8 max-w-none mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Reverie</h1>
        <p className="text-sm text-stone-400 mt-1">Your journal, illuminated</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-stone-200 pb-0">
        <button
          onClick={() => setTab('entries')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'entries'
              ? 'border-amber-500 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Journal
        </button>
        <button
          onClick={() => setTab('insights')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'insights'
              ? 'border-amber-500 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Insights
        </button>
      </div>

      {/* Entries Tab */}
      {tab === 'entries' && (
        <div>
          <div className="mb-6 space-y-3">
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                if (e.target.value === '') handleClear()
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search your journal..."
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 shadow-sm placeholder-stone-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSearchMode('keyword')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  searchMode === 'keyword'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                }`}
              >
                Keyword
              </button>
              <button
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  searchMode === 'semantic'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                }`}
              >
                Semantic
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
              >
                <div className="text-xs text-stone-400 mb-3 font-medium">
                  {new Date(entry.date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                <p className={`text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-serif ${
                  expandedEntry === entry.id ? '' : 'line-clamp-4'
                }`}>
                  {entry.raw_text}
                </p>
                <div className="text-xs text-amber-400 mt-3">
                  {expandedEntry === entry.id ? '↑ collapse' : '↓ read more'}
                </div>
              </div>
            ))}
          </div>

          {!isSearching && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-500 disabled:opacity-30 hover:bg-stone-50 shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {tab === 'insights' && (
        <div>
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={insightQuery}
              onChange={e => setInsightQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInsight()}
              placeholder="Ask anything about your journal..."
              className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 shadow-sm placeholder-stone-300"
            />
            <button
              onClick={handleInsight}
              disabled={insightLoading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-medium disabled:opacity-50 shadow-sm transition-colors"
            >
              {insightLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {insightResult && (
            <div className="space-y-8">

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h2 className="text-xs font-semibold text-amber-500 mb-4 uppercase tracking-widest">Answer</h2>
                <div className="prose prose-stone prose-sm max-w-none text-stone-700">
                  <ReactMarkdown>{insightResult.answer}</ReactMarkdown>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-semibold text-amber-500 mb-4 uppercase tracking-widest">Source Entries</h2>
                <div className="space-y-3">
                  {insightResult.sources.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setExpandedSource(expandedSource === entry.id ? null : entry.id)}
                    >
                      <div className="text-xs text-stone-400 mb-2 font-medium">
                        {new Date(entry.date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        <span className={`ml-3 ${entry.sentiment < 0 ? 'text-red-300' : 'text-green-400'}`}>
                          {entry.sentiment?.toFixed(2)}
                        </span>
                      </div>
                      <p className={`text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-serif ${
                        expandedSource === entry.id ? '' : 'line-clamp-3'
                      }`}>
                        {entry.raw_text}
                      </p>
                      {entry.concepts && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.concepts.slice(0, 5).map(c => (
                            <span key={c} className="text-xs bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-amber-400 mt-2">
                        {expandedSource === entry.id ? '↑ collapse' : '↓ read more'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}