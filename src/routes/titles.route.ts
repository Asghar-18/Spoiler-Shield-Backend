import { Router, Request, Response } from "express";
import { titlesService } from "../services/titles.service";
import { authenticateUser, optionalAuth } from "../middleware/auth.middleware";
import Joi from "joi";

const router = Router();

// Validation schemas
const titleIdSchema = Joi.object({
  titleId: Joi.string().uuid().required(),
});

const createTitleSchema = Joi.object({
  name: Joi.string().required(),
  author: Joi.string().required(),
  description: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
});

const updateTitleSchema = Joi.object({
  name: Joi.string().optional(),
  author: Joi.string().optional(),
  description: Joi.string().optional(),
  coverImage: Joi.string().uri().optional(),
}).min(1);

const searchSchema = Joi.object({
  q: Joi.string().min(1).required(),
});

const limitSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
});

// GET /api/titles - Get all titles
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { include_chapters } = req.query;

    let result;
    if (include_chapters === "true") {
      result = await titlesService.getTitlesWithChapterCounts();
    } else {
      result = await titlesService.getTitles();
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/titles/recent - Get recent titles
router.get("/recent", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = limitSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const result = await titlesService.getRecentTitles(limit);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/titles/popular - Get popular titles
router.get("/popular", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = limitSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const result = await titlesService.getPopularTitles(limit);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/titles/search - Search titles
router.get("/search", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { q: searchTerm, type } = req.query;

    if (!searchTerm || typeof searchTerm !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search term is required",
      });
    }

    let result;
    if (type === "author") {
      result = await titlesService.searchTitlesByAuthor(searchTerm);
    } else {
      result = await titlesService.searchTitles(searchTerm);
    }

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/titles/:titleId - Get a single title
router.get("/:titleId", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = titleIdSchema.validate(req.params);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    const { include_chapters } = req.query;

    let result;
    if (include_chapters === "true") {
      result = await titlesService.getTitleWithChapterCount(req.params.titleId);
    } else {
      result = await titlesService.getTitleById(req.params.titleId);
    }

    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/titles - Create a new title (admin only)
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = createTitleSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    // TODO: Add admin check here
    // const user = (req as any).user;
    // if (!user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }

    const result = await titlesService.createTitle(req.body);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/titles/:titleId - Update a title (admin only)
router.put(
  "/:titleId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: paramError } = titleIdSchema.validate(req.params);
      if (paramError) {
        return res.status(400).json({
          success: false,
          error: paramError.details[0].message,
        });
      }

      const { error: bodyError } = updateTitleSchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          error: bodyError.details[0].message,
        });
      }

      // TODO: Add admin check here
      // const user = (req as any).user;
      // if (!user.isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: 'Admin access required'
      //   });
      // }

      const result = await titlesService.updateTitle(
        req.params.titleId,
        req.body
      );
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

// DELETE /api/titles/:titleId - Delete a title (admin only)
router.delete(
  "/:titleId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: validationError } = titleIdSchema.validate(req.params);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.details[0].message,
        });
      }

      // TODO: Add admin check here
      // const user = (req as any).user;
      // if (!user.isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: 'Admin access required'
      //   });
      // }

      const result = await titlesService.deleteTitle(req.params.titleId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

export { router as titlesRouter };
