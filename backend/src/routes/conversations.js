const router = require('express').Router();
const { Conversation, Message } = require('../models');
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');

router.use(authenticate);

// GET /api/conversations — current user's conversations
router.get('/', async (req, res, next) => {
  try {
    const conversations = await Conversation.findAll({
      where: { userId: req.user.id },
      order: [['lastUpdated', 'DESC']],
    });
    res.json(conversations);
  } catch (err) { next(err); }
});

// GET /api/conversations/:id — with messages
router.get('/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Message, as: 'messages', order: [['createdAt', 'ASC']] }],
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) { next(err); }
});

// POST /api/conversations — start new conversation
router.post('/', async (req, res, next) => {
  try {
    const conversation = await Conversation.create({ userId: req.user.id });
    res.status(201).json(conversation);
  } catch (err) { next(err); }
});

// POST /api/conversations/:id/messages — send message, get AI reply
router.post('/:id/messages', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Message, as: 'messages', order: [['createdAt', 'ASC']] }],
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

    // Save user message
    await Message.create({ conversationId: conversation.id, role: 'user', content });

    // Get AI response (includes request raising logic)
    const { reply, request } = await aiService.chat(req.user, conversation, content);

    // Save assistant reply
    const assistantMessage = await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: reply,
    });

    // Link conversation to request if one was raised
    if (request) {
      await conversation.update({ requestId: request.id, lastUpdated: new Date() });
    } else {
      await conversation.update({ lastUpdated: new Date() });
    }

    res.json({ message: assistantMessage, request: request || null });
  } catch (err) { next(err); }
});

module.exports = router;
