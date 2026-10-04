import { useState, useEffect } from 'react'

export default function App() {
  const [entries, setEntries] = useState([])
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('keyword')
  const [isSearching, setIsSearching] = useState(false)
  const limit = 10

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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">CJIS — Journal Entries</h1>

      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            if (e.target.value === '') handleClear()
          }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search entries..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-gray-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setSearchMode('keyword')}
            className={`px-3 py-1 rounded-lg text-xs ${searchMode === 'keyword' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Keyword
          </button>
          <button
            onClick={() => setSearchMode('semantic')}
            className={`px-3 py-1 rounded-lg text-xs ${searchMode === 'semantic' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Semantic
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="text-sm text-gray-400 mb-2">
              {new Date(entry.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
              {entry.raw_text}
            </p>
          </div>
        ))}
      </div>

      {!isSearching && (
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-30 hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}