const store = require('../data/store');
const { logAudit } = require('../middleware/audit');

// In-memory or persisted search query tracker (Image 2: Analytics on frequently searched phrases)
let searchPhraseAnalytics = {
  'vpn setup': 42,
  'wifi disconnect': 35,
  'docker permission': 29,
  'password reset': 18,
  'monitors display': 14
};

const getArticles = (req, res) => {
  const kbColl = store.collection('knowledgeBases');
  const { query, category, operator = 'ANY' } = req.query;
  let articles = kbColl.find();

  if (category && category !== 'ALL') {
    articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  if (query && query.trim().length > 0) {
    const qClean = query.trim().toLowerCase();

    // Track search phrase in analytics
    searchPhraseAnalytics[qClean] = (searchPhraseAnalytics[qClean] || 0) + 1;

    // Advanced search logic: 'AND', 'OR', 'NOT', 'ALL', 'ANY' (from Image 2)
    const terms = qClean.split(/\s+/).filter(Boolean);

    articles = articles.filter(a => {
      const content = `${a.title} ${a.problemDescription} ${(a.tags || []).join(' ')}`.toLowerCase();

      if (operator === 'AND' || operator === 'ALL') {
        return terms.every(term => content.includes(term));
      } else if (operator === 'NOT') {
        return !terms.some(term => content.includes(term));
      } else {
        // 'OR' or 'ANY'
        return terms.some(term => content.includes(term));
      }
    });
  }

  res.json({
    success: true,
    count: articles.length,
    data: articles,
    analytics: {
      frequentlySearched: Object.entries(searchPhraseAnalytics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([phrase, count]) => ({ phrase, count }))
    }
  });
};

const getArticleById = (req, res) => {
  const kbColl = store.collection('knowledgeBases');
  const article = kbColl.findById(req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

  // Increment view count
  const updated = kbColl.findByIdAndUpdate(req.params.id, {
    viewCount: (article.viewCount || 0) + 1
  });

  res.json({ success: true, data: updated });
};

const createArticle = (req, res) => {
  const { title, shortDescription, category, tags, problemDescription, solutionSteps, author, attachmentName } = req.body;
  if (!title || !problemDescription) {
    return res.status(400).json({ success: false, message: 'Title and problem description are required' });
  }

  const kbColl = store.collection('knowledgeBases');
  const steps = Array.isArray(solutionSteps) ? solutionSteps : (solutionSteps || '').split('\n').filter(s => s.trim().length > 0);

  const newArticle = kbColl.insert({
    title,
    shortDescription: shortDescription || title,
    category: category || 'General Support',
    tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()),
    problemDescription,
    solutionSteps: steps,
    attachmentName: attachmentName || null,
    viewCount: 1,
    helpfulVotes: 0,
    author: author || 'IT Support Team'
  });

  const io = req.app.get('io');
  if (io) io.emit('kb_article_created', newArticle);

  logAudit(
    io,
    author || 'IT Support',
    'itsm_lead',
    'KB_ARTICLE_PUBLISHED',
    'KnowledgeBase',
    newArticle._id,
    `Published Knowledge Base article: "${title}" in category ${category}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newArticle });
};

const voteHelpful = (req, res) => {
  const { id } = req.params;
  const kbColl = store.collection('knowledgeBases');
  const article = kbColl.findById(id);
  if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

  const updated = kbColl.findByIdAndUpdate(id, {
    helpfulVotes: (article.helpfulVotes || 0) + 1
  });

  res.json({ success: true, data: updated });
};

// AI Search Assistant (Image 2: "AI Bot can be used to help search KB")
const aiKbAssistant = (req, res) => {
  const { query } = req.body;
  const kbColl = store.collection('knowledgeBases');
  const articles = kbColl.find();

  let matched = [];
  if (query) {
    const q = query.toLowerCase();
    matched = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.problemDescription.toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  const recommendation = matched.length > 0
    ? `I found ${matched.length} relevant standard solution(s). Article "${matched[0].title}" has a high resolution success rate.`
    : `No exact KB match found. I recommend submitting a formal incident ticket so our IT tier-2 team can investigate.`;

  res.json({
    success: true,
    recommendation,
    matchedArticles: matched.slice(0, 3)
  });
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  voteHelpful,
  aiKbAssistant
};
