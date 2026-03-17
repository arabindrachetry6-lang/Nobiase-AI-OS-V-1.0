import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Globe, Code, Copy, Check, Sparkles } from 'lucide-react';
import { geminiService } from '../services/gemini';

export default function Website() {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chatbot Builder State
  const [botName, setBotName] = useState('SolarHelp');
  const [botPersona, setBotPersona] = useState('Professional yet friendly');
  const [botMission, setBotMission] = useState('Resolve tickets');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [groundingEnabled, setGroundingEnabled] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleKeywordSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      const results = await geminiService.generateSEOSuggestions(keyword);
      setSuggestions(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChatbot = async () => {
    setGenerating(true);
    try {
      const code = await geminiService.generateChatbotWidget({
        name: botName,
        persona: botPersona,
        mission: botMission,
        knowledgeBase,
        grounding: groundingEnabled
      });
      setGeneratedCode(code);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Website</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your online presence and SEO.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* SEO Tools */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold">AI SEO Keyword Research</h3>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <input
              type="text"
              placeholder="Enter a keyword or niche (e.g., 'organic coffee')"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleKeywordSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={18} />}
              <span>Analyze</span>
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="table-container border border-slate-100 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold">Keyword</th>
                    <th className="px-6 py-4 text-sm font-semibold">Intent</th>
                    <th className="px-6 py-4 text-sm font-semibold">Content Idea</th>
                    <th className="px-6 py-4 text-sm font-semibold">Volume</th>
                    <th className="px-6 py-4 text-sm font-semibold">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {suggestions.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{item.keyword}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-[10px] uppercase tracking-wider font-bold">
                          {item.intent}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.contentIdea}>
                        {item.contentIdea}
                      </td>
                      <td className="px-6 py-4 text-sm">{item.volume}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.difficulty?.toLowerCase() === 'low' ? 'bg-emerald-100 text-emerald-600' :
                          item.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {item.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Chatbot Builder */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold">AI Chatbot Builder (CLEAR Framework)</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* 1. Context */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">1. Context: Define Mission</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bot Name</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. SolarHelp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Persona/Tone</label>
                    <input
                      type="text"
                      value={botPersona}
                      onChange={(e) => setBotPersona(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Professional yet friendly"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Success Metric/Goal</label>
                    <select
                      value={botMission}
                      onChange={(e) => setBotMission(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Resolve tickets</option>
                      <option>Book demos</option>
                      <option>Capture email leads</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 2. Logic */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">2. Logic: Knowledge Base</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Knowledge Base (FAQs, Pricing, etc.)</label>
                    <textarea
                      value={knowledgeBase}
                      onChange={(e) => setKnowledgeBase(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 h-32 resize-none"
                      placeholder="Paste your business info here..."
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Search size={18} className="text-slate-400" />
                      <span className="text-sm font-medium">Enable Google Search Tool</span>
                    </div>
                    <button
                      onClick={() => setGroundingEnabled(!groundingEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${groundingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${groundingEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </section>

              <button
                onClick={handleGenerateChatbot}
                disabled={generating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {generating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Code size={20} />}
                <span>Generate Chatbot Widget</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* 3. Engineering & 4. Adaptation */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">3. Engineering: Integration Code</h4>
                {generatedCode ? (
                  <div className="bg-slate-900 rounded-2xl p-6 relative group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(generatedCode)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <pre className="text-blue-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {generatedCode}
                    </pre>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
                    <Code size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Configure your bot and click generate</p>
                  </div>
                )}
              </section>

              {/* 5. Refinement: Live Preview */}
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">5. Refinement: Live Preview</h4>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{botName || 'AI Assistant'}</p>
                      <p className="text-xs text-slate-500">Online and ready to help</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm italic text-slate-500">
                    "Hello! I'm {botName}, your {botPersona.toLowerCase()} assistant. How can I help you {botMission.toLowerCase()} today?"
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
