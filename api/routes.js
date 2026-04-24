module.exports = (SECRETS, supabase) => {
  const express = require('express');
  const router = express.Router();

  // GET /api/routes/projects
  router.get('/projects', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ projects: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/routes/projects
  router.post('/projects', async (req, res) => {
    try {
      const { userId, name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });

      const { data, error } = await supabase
        .from('projects')
        .insert([{ user_id: userId, name, description }])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/routes/workflows
  router.get('/workflows', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ workflows: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/routes/workflows
  router.post('/workflows', async (req, res) => {
    try {
      const { userId, projectId, name, steps } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });

      const { data, error } = await supabase
        .from('workflows')
        .insert([{ user_id: userId, project_id: projectId, name, steps: steps || [] }])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/routes/task-logs
  router.get('/task-logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const { data, error } = await supabase
        .from('task_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      res.json({ logs: data, count: data.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
