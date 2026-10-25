import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  Eye,
  Tag,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOperator, setSearchOperator] = useState('ANY'); // 'AND', 'OR', 'NOT', 'ALL', 'ANY' (Image 2)
  const [frequentSearches, setFrequentSearches] = useState([]);
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Article Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workstation / Software');
  const [tags, setTags] = useState('troubleshooting, support');
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');

  useEffect(() => {
    loadArticles();

    const handleCreated = () => loadArticles();
    socket.on('kb_article_created', handleCreated);

    return () => {
      socket.off('kb_article_created', handleCreated);
    };
  }, []);

  const loadArticles = async (query = '', operator = searchOperator) => {
    try {
      setLoading(true);
      const res = await api.getKBArticles({ query, operator });
      setArticles(res.data.data);
      if (res.data.analytics?.frequentlySearched) {
        setFrequentSearches(res.data.analytics.frequentlySearched);
      }
      if (res.data.data.length > 0 && !selectedArticle) {
        setSelectedArticle(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    loadArticles(searchQuery, searchOperator);
  };

  const handleAiAssistant = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.aiKbAssistant({ query: searchQuery });
      setAiResponse(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (id) => {
    try {
      await api.voteHelpfulKB(id);
      loadArticles(searchQuery);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      await api.createKBArticle({
        title,
        category,
        tags: tags.split(',').map((t) => t.trim()),
        problemDescription,
        solutionSteps,
        author: currentUser.name
      });
      setShowCreateModal(false);
      setTitle('');
      setProblemDescription('');
      setSolutionSteps('');
      loadArticles();
    } catch (err) {
      alert('Failed to publish article');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">IT Service Knowledge Base (KB)</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Lead: Vishan Fernando
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Self-Service Incident Deflection • Automated Ticket Resolution Sync & Standard Operating Procedures
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Publish KB Article</span>
        </button>
      </div>

      {/* Search Input Bar with Boolean Logic (Image 2: AND, OR, NOT, ALL, ANY) */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search solutions by keyword, error message, or technology (e.g. Docker, Wi-Fi, VPN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={searchOperator}
            onChange={(e) => {
              setSearchOperator(e.target.value);
              loadArticles(searchQuery, e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
          >
            <option value="ANY">ANY (OR Match)</option>
            <option value="ALL">ALL (AND Match)</option>
            <option value="NOT">NOT (Exclude Terms)</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
          >
            Search KB
          </button>

          <button
            type="button"
            onClick={handleAiAssistant}
            className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium flex items-center gap-1.5"
          >
            <span>Ask AI Bot</span>
          </button>
        </div>

        {/* Frequent Search Phrases Analytics (Image 2) */}
        {frequentSearches.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Frequently Searched:</span>
            <div className="flex flex-wrap gap-1.5">
              {frequentSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item.phrase);
                    loadArticles(item.phrase);
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[10px]"
                >
                  {item.phrase} ({item.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Bot Recommendation Card */}
        {aiResponse && (
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-cyan-300">
              <span>🤖 AI Knowledge Assistant Response:</span>
            </div>
            <p className="text-slate-200">{aiResponse.recommendation}</p>
          </div>
        )}
      </form>

      {/* Grid: Article Cards & Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          {articles.map((art) => {
            const isSelected = selectedArticle?._id === art._id;
            return (
              <div
                key={art._id}
                onClick={() => setSelectedArticle(art)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{art.category}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {art.viewCount || 1}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ThumbsUp className="w-3 h-3" /> {art.helpfulVotes || 0}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5">{art.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{art.problemDescription}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(art.tags || []).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reader Pane */}
        <div className="lg:col-span-7">
          {selectedArticle ? (
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-6">
              <div className="border-b border-slate-700/60 pb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedArticle.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>Author: {selectedArticle.author}</span>
                  <span>•</span>
                  <span>Views: {selectedArticle.viewCount || 1}</span>
                  <span>•</span>
                  <button
                    onClick={() => handleVote(selectedArticle._id)}
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({selectedArticle.helpfulVotes || 0})</span>
                  </button>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Problem Statement</span>
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 leading-relaxed">
                  {selectedArticle.problemDescription}
                </div>
              </div>

              {/* Solution Steps */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Verified Solution Steps</span>
                </span>
                <div className="space-y-2">
                  {(selectedArticle.solutionSteps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-slate-200 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs">
              Select an article to view resolution steps.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Publish Article */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Publish Knowledge Base Article</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to resolve Docker permission denied socket"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Workstation / Software">Workstation / Software</option>
                    <option value="Network & Wireless">Network & Wireless</option>
                    <option value="Database / Infrastructure">Database / Infrastructure</option>
                    <option value="Security / Access">Security / Access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Problem Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the symptoms, error messages, and trigger conditions..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Solution Steps (One step per line) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Step 1: Check group membership&#10;Step 2: Run sudo usermod -aG docker $USER&#10;Step 3: Refresh shell via newgrp docker"
                  value={solutionSteps}
                  onChange={(e) => setSolutionSteps(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
