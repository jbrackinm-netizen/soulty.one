const axios = require('axios');

module.exports = (SECRETS, supabase) => {
  const express = require('express');
  const router = express.Router();

  function selectModel(taskType) {
    if (taskType === 'reasoning' || taskType === 'planning') return 'claude';
    if (taskType === 'execution' || taskType === 'code' || taskType === 'tools') return 'gpt';
    if (taskType === 'vision' || taskType === 'image' || taskType === 'visual') return 'gemini';
    return 'claude';
  }

  async function callClaude(prompt, systemPrompt = '') {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system: systemPrompt || 'You are Nexus Brain, an AI orchestration system.',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': SECRETS['anthropic-api-key'],
            'anthropic-version': '2023-06-01',
          },
        }
      );
      return {
        success: true,
        model: 'claude',
        content: response.data.content[0].text,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error('Claude error:', error.response?.data || error.message);
      return { success: false, model: 'claude', error: error.message };
    }
  }

  async function callGPT(prompt, systemPrompt = '') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt || 'You are Nexus Brain, executing tasks.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: { Authorization: `Bearer ${SECRETS['openai-api-key']}` },
        }
      );
      return {
        success: true,
        model: 'gpt',
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error('GPT error:', error.response?.data || error.message);
      return { success: false, model: 'gpt', error: error.message };
    }
  }

  async function callGemini(prompt, imageUrl = null) {
    try {
      const parts = imageUrl
        ? [{ text: prompt }, { image_uri: { uri: imageUrl } }]
        : [{ text: prompt }];

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${SECRETS['gemini-api-key']}`,
        { contents: [{ parts }] }
      );
      return {
        success: true,
        model: 'gemini',
        content: response.data.candidates[0].content.parts[0].text,
      };
    } catch (error) {
      console.error('Gemini error:', error.response?.data || error.message);
      return { success: false, model: 'gemini', error: error.message };
    }
  }

  // POST /api/agents/route-task
  router.post('/route-task', async (req, res) => {
    try {
      const { taskType, prompt, systemPrompt, imageUrl } = req.body;
      if (!prompt) return res.status(400).json({ error: 'prompt required' });

      const model = selectModel(taskType);
      let result;
      if (model === 'claude') result = await callClaude(prompt, systemPrompt);
      else if (model === 'gpt') result = await callGPT(prompt, systemPrompt);
      else result = await callGemini(prompt, imageUrl);

      if (result.success) {
        await supabase.from('task_logs').insert({
          task_type: taskType,
          model_used: model,
          prompt: prompt.substring(0, 500),
          response: result.content.substring(0, 1000),
          usage: result.usage || null,
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Route task error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/ask-council — multi-model consensus
  router.post('/ask-council', async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: 'question required' });

      const [claudeRes, gptRes, geminiRes] = await Promise.all([
        callClaude(question, 'You are a strategic advisor. Respond concisely.'),
        callGPT(question, 'You are a tactical executor. Respond concisely.'),
        callGemini(question),
      ]);

      res.json({
        question,
        responses: {
          strategic: claudeRes.success ? claudeRes.content : null,
          tactical: gptRes.success ? gptRes.content : null,
          visual: geminiRes.success ? geminiRes.content : null,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Council error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
