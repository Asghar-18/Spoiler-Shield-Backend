import { Router, Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { authenticateUser } from '../middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const titleIdSchema = Joi.object({
  titleId: Joi.string().uuid().required()
});

const updateProgressSchema = Joi.object({
  title_id: Joi.string().uuid().required(),
  current_chapter: Joi.number().integer().min(1).required(),
  total_chapters: Joi.number().integer().min(1).required()
});

// GET /api/progress - Get all user progress
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const result = await progressService.getUserProgress(user.id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/progress/stats - Get user progress statistics
router.get('/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const result = await progressService.getUserProgressStats(user.id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/progress/title/:titleId - Get progress for a specific title
router.get('/title/:titleId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const result = await progressService.getProgressByTitle(user.id, req.params.titleId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/progress - Update user progress
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = updateProgressSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const { title_id, current_chapter, total_chapters } = req.body;
    
    const result = await progressService.updateProgress(
      user.id,
      title_id,
      current_chapter,
      total_chapters
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/progress/title/:titleId - Update progress for a specific title (alternative endpoint)
router.put('/title/:titleId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: paramError } = titleIdSchema.validate(req.params);
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: paramError.details[0].message
      });
    }

    const updateSchema = Joi.object({
      current_chapter: Joi.number().integer().min(1).required(),
      total_chapters: Joi.number().integer().min(1).required()
    });

    const { error: bodyError } = updateSchema.validate(req.body);
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: bodyError.details[0].message
      });
    }

    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const { current_chapter, total_chapters } = req.body;
    
    const result = await progressService.updateProgress(
      user.id,
      req.params.titleId,
      current_chapter,
      total_chapters
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/progress/title/:titleId/reset - Reset progress for a title
router.post('/title/:titleId/reset', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const result = await progressService.resetProgress(user.id, req.params.titleId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/progress/title/:titleId - Delete progress for a title
router.delete('/title/:titleId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const user = (req as any).user;
    
    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const result = await progressService.deleteProgress(user.id, req.params.titleId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as progressRouter };