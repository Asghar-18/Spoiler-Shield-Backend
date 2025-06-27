import { Router, Request, Response } from 'express';
import { chaptersService } from '../services/chapters.service';
import { authenticateUser, optionalAuth } from '../middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const titleIdSchema = Joi.object({
  titleId: Joi.string().uuid().required()
});

const chapterIdSchema = Joi.object({
  chapterId: Joi.string().uuid().required()
});

const createChapterSchema = Joi.object({
  title_id: Joi.string().uuid().required(),
  order: Joi.number().integer().min(1).required(),
  name: Joi.string().required(),
  content: Joi.string().allow('', null)
});

const updateChapterSchema = Joi.object({
  order: Joi.number().integer().min(1),
  name: Joi.string(),
  content: Joi.string().allow('', null)
}).min(1);

// GET /api/chapters/title/:titleId - Get all chapters for a title
router.get('/title/:titleId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const result = await chaptersService.getChaptersByTitle(req.params.titleId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chapters/:chapterId - Get a single chapter
router.get('/:chapterId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = chapterIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const result = await chaptersService.getChapterById(req.params.chapterId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chapters/title/:titleId/up-to/:order - Get chapters up to specific order
router.get('/title/:titleId/up-to/:order', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { titleId, order } = req.params;
    const maxOrder = parseInt(order);

    if (!titleId || isNaN(maxOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid title ID or order number'
      });
    }

    const result = await chaptersService.getChaptersUpTo(titleId, maxOrder);
    return  res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chapters/title/:titleId/order/:order - Get chapter by order
router.get('/title/:titleId/order/:order', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { titleId, order } = req.params;
    const chapterOrder = parseInt(order);

    if (!titleId || isNaN(chapterOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid title ID or order number'
      });
    }

    const result = await chaptersService.getChapterByOrder(titleId, chapterOrder);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chapters/title/:titleId/count - Get chapter count for a title
router.get('/title/:titleId/count', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const result = await chaptersService.getChapterCount(req.params.titleId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/chapters/title/:titleId/search - Search chapters
router.get('/title/:titleId/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { titleId } = req.params;
    const { q: searchTerm } = req.query;

    if (!titleId || !searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title ID and search term are required'
      });
    }

    const result = await chaptersService.searchChapters(titleId, searchTerm);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/chapters - Create a new chapter (admin only)
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = createChapterSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    // TODO: Add admin check here
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }

    const result = await chaptersService.createChapter(req.body);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/chapters/:chapterId - Update a chapter (admin only)
router.put('/:chapterId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: paramError } = chapterIdSchema.validate(req.params);
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      });
    }

    const { error: bodyError } = updateChapterSchema.validate(req.body);
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: bodyError.details[0].message
      });
    }

    // TODO: Add admin check here
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }

    const result = await chaptersService.updateChapter(req.params.chapterId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as chaptersRouter };