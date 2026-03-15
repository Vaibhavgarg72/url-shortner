import { useState, useEffect } from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import { Copy, Check, BarChart2, ChevronDown, ChevronUp, Globe, Monitor, MapPin } from 'lucide-react'
import axios from 'axios'
import './App.css'

// Define API base URL. Make sure Backend runs on this!
const API_BASE = import.meta.env.VITE_PUBLIC_BACKEND_URL;

function Home() {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await axios.get(`${API_BASE}/urls`);
      // Since our new GET /urls does not include analytics, let's just set the URLs for now
      // Or we can fetch individually when expanded!
      setUrls(response.data);
    } catch (err) {
      console.error("Error fetching URLs:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE}/urls`, { link: url });
      setUrl('');
      fetchUrls(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to shorten URL';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/urls/${id}`);
      fetchUrls();
    } catch (err) {
      console.error("Error deleting URL", err);
    }
  }

  const handleCopy = (id) => {
    const shortUrl = `${window.location.origin}/${id}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-5xl font-bold text-center text-blue-600 mb-8 flex items-center justify-center gap-3">
          <Globe className="w-12 h-12" />
          URL Shortener
        </h1>

        {/* Create URL Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row gap-4">
          <input
            type="url"
            placeholder="Enter your long URL here (https://...)"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {loading ? 'Shortening...' : 'Shorten'}
          </button>
        </form>

        {error && <p className="text-red-500 text-center font-medium bg-red-50 py-2 rounded">{error}</p>}

        {/* URLs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-100 border-b border-gray-200 font-semibold text-gray-700">
            Recent Shortened URLs
          </div>

          <ul className="divide-y divide-gray-200">
            {urls.length === 0 ? (
              <li className="p-8 text-center text-gray-500">No URLs shortened yet!</li>
            ) : (
              urls.map((item) => {
                const isExpanded = expandedId === item.id;
                const analytics = item.analytics || [];

                return (
                  <li key={item.id} className="transition group">
                    <div className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="truncate max-w-md w-full">
                        <p className="text-lg font-medium text-gray-800 truncate" title={item.link}>{item.link}</p>
                        <div className="text-sm border flex w-fit bg-gray-50 items-center mt-2 rounded-md overflow-hidden">
                          <a href={`/${item.id}`} target="_blank" rel="noreferrer" className="px-3 py-1 font-mono text-blue-600 hover:bg-blue-50 border-r transition">
                            {window.location.host}/{item.id}
                          </a>
                          <button
                            onClick={() => handleCopy(item.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition text-gray-600 flex items-center gap-1 cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {copiedId === item.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto self-end sm:self-auto mt-2 sm:mt-0">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          <BarChart2 size={16} />
                          {analytics.length} Clicks
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Analytics Dropdown */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-gray-100 p-4 shadow-inner">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <BarChart2 size={14} /> Visitor Analytics
                        </h4>

                        {analytics.length === 0 ? (
                          <p className="text-sm text-gray-500 italic px-2">No clicks recorded yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                              <thead className="text-xs text-gray-500 uppercase bg-slate-100 border-b">
                                <tr>
                                  <th className="px-4 py-2">Time</th>
                                  <th className="px-4 py-2 border-l">IP Address</th>
                                  <th className="px-4 py-2 border-l">Referrer</th>
                                  <th className="px-4 py-2 border-l">Browser/Device</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {analytics.map((visit, idx) => (
                                  <tr key={idx} className="hover:bg-slate-100 transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap">{new Date(visit.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-2 border-l font-mono text-xs">{visit.ip || 'Unknown'}</td>
                                    <td className="px-4 py-2 border-l truncate max-w-[150px]">{visit.referrer || 'Direct'}</td>
                                    <td className="px-4 py-2 border-l truncate max-w-[200px]" title={visit.userAgent}>{visit.userAgent || 'Unknown'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function RedirectPage() {
  const { id } = useParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const response = await axios.get(`${API_BASE}/urls/${id}`);
        const link = response.data.link;
        // Proceed to redirect the browser to the original URL
        window.location.replace(link);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("URL not found. It may have been deleted or doesn't exist.");
        } else {
          setError("Something went wrong while trying to reach the URL.");
        }
      }
    };

    if (id) {
      fetchAndRedirect();
    }
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
        <p className="text-xl text-gray-700 mb-8 text-center">{error}</p>
        <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
          Go back to Start
        </a>
      </div>
    );
  }

  // Loading state while fetching the URL to redirect
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <h1 className="text-2xl font-medium text-gray-700">Redirecting you...</h1>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:id" element={<RedirectPage />} />
    </Routes>
  );
}

export default App
