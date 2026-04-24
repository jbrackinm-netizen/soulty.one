const { v4: uuidv4 } = require('uuid');

module.exports = (SECRETS, supabase) => {
  const express = require('express');
  const router = express.Router();

  // POST /api/memory/save
  router.post('/save', async (req, res) => {
    try {
      const { userId, projectId, type, content, metadata } = req.body;

      if (!userId || !content || !type) {
        return res.status(400).json({ error: 'userId, content, and type are required' });
      }

      const memory = {
        id: uuidv4(),
        user_id: userId,
        project_id: projectId || null,
        type, // 'task' | 'decision' | 'document' | 'conversation'
        content,
        metadata: metadata || {},
      };

      const { error } = await supabase.from('memories').insert([memory]);
      if (error) throw error;

      res.json({ success: true, id: memory.id });
    } catch (error) {
      console.error('Save memory error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/memory/project/:projectId
  router.get('/project/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      res.json({ memories: data });
    } catch (error) {
      console.error('Retrieve memory error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/memory/search
  router.post('/search', async (req, res) => {
    try {
      const { query, projectId, limit = 10 } = req.body;
      if (!query) return res.status(400).json({ error: 'query required' });

      const q = supabase
        .from('memories')
        .select('*')
        .textSearch('content', query, { type: 'websearch' })
        .limit(limit);

      if (projectId) q.eq('project_id', projectId);

      const { data, error } = await q;
      if (error) throw error;

      res.json({ results: data, count: data.length });
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
