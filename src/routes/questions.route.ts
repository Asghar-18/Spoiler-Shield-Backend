import { Router, Request, Response } from "express";
import { questionsService } from "../services/questions.service";
import { authenticateUser } from "../middleware/auth.middleware";
import { aiService } from "../services/ai.service";
import Joi from "joi";

const router = Router();

// Validation schemas
const questionIdSchema = Joi.object({
  questionId: Joi.string().uuid().required(),
});

const userIdSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const createQuestionSchema = Joi.object({
  title_id: Joi.string().uuid().required(),
  question_text: Joi.string().required(),
  chapter_limit: Joi.number().integer().min(1).required(),
});

const updateAnswerSchema = Joi.object({
  answer_text: Joi.string().required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "answered", "failed").required(),
});

const statusQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "answered", "failed").required(),
});

const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).optional(),
});

const titleQuerySchema = Joi.object({
  title_id: Joi.string().uuid().optional(),
});


// POST /api/questions - Create a new question
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  console.log("Incoming request body:", req.body); // 🧪 Add this line

  try {
    const { error: validationError } = createQuestionSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    const user = (req as any).user;
    const questionData = {
      user_id: user.id,
      ...req.body,
    };

    const result = await questionsService.createQuestion(questionData);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.post(
  "/:id/answer",
  authenticateUser,
  async (req: Request, res: Response) => {
    const questionId = req.params.id;
      console.log("🧠 Reached /:id/answer route with ID:", questionId);

    try {
      const answer = await aiService.generateAnswer(questionId);
      res.json({ success: true, answer });
    } catch (error: any) {
      console.error("AI Answer Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// GET /api/questions/user/:userId - Get user's questions
router.get(
  "/user/:userId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: paramError } = userIdSchema.validate(req.params);
      if (paramError) {
        return res.status(400).json({
          success: false,
          error: paramError.details[0].message,
        });
      }

      const { error: queryError } = titleQuerySchema.validate(req.query);
      if (queryError) {
        return res.status(400).json({
          success: false,
          error: queryError.details[0].message,
        });
      }

      const user = (req as any).user;
      // Users can only access their own questions unless they're admin
      if (user.id !== req.params.userId) {
        // TODO: Add admin check here
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const titleId = req.query.title_id as string;
      const result = await questionsService.getUserQuestions(
        req.params.userId,
        titleId
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

// GET /api/questions/my - Get current user's questions (convenience route)
router.get("/my", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: queryError } = titleQuerySchema.validate(req.query);
    if (queryError) {
      return res.status(400).json({
        success: false,
        error: queryError.details[0].message,
      });
    }

    const user = (req as any).user;
    const titleId = req.query.title_id as string;
    const result = await questionsService.getUserQuestions(user.id, titleId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/questions/status/:status - Get questions by status for current user
router.get(
  "/status/:status",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: validationError } = statusQuerySchema.validate({
        status: req.params.status,
      });
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.details[0].message,
        });
      }

      const user = (req as any).user;
      const status = req.params.status as "pending" | "answered" | "failed";
      const result = await questionsService.getQuestionsByStatus(
        user.id,
        status
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

// GET /api/questions/recent - Get recent questions for current user
router.get("/recent", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = daysQuerySchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message,
      });
    }

    const user = (req as any).user;
    const days = parseInt(req.query.days as string) || 7;
    const result = await questionsService.getRecentQuestions(user.id, days);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/questions/title/:titleId - Get questions by title for current user
router.get(
  "/title/:titleId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const titleId = req.params.titleId;
      if (!titleId) {
        return res.status(400).json({
          success: false,
          error: "Title ID is required",
        });
      }

      const user = (req as any).user;
      const result = await questionsService.getQuestionsByTitle(
        user.id,
        titleId
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

// GET /api/questions/:questionId - Get a single question
router.get(
  "/:questionId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: validationError } = questionIdSchema.validate(req.params);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.details[0].message,
        });
      }

      const result = await questionsService.getQuestionById(
        req.params.questionId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      const user = (req as any).user;
      // Users can only access their own questions unless they're admin
      if (result.data?.user_id !== user.id) {
        // TODO: Add admin check here
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

// PUT /api/questions/:questionId/answer - Update question with answer
router.put(
  "/:questionId/answer",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: paramError } = questionIdSchema.validate(req.params);
      if (paramError) {
        return res.status(400).json({
          success: false,
          error: paramError.details[0].message,
        });
      }

      const { error: bodyError } = updateAnswerSchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          error: bodyError.details[0].message,
        });
      }

      // Check if question exists and user owns it
      const questionResult = await questionsService.getQuestionById(
        req.params.questionId
      );
      if (!questionResult.success) {
        return res.status(404).json(questionResult);
      }

      const user = (req as any).user;
      if (questionResult.data?.user_id !== user.id) {
        // TODO: Add admin check here for AI service
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const result = await questionsService.updateQuestionAnswer(
        req.params.questionId,
        req.body.answer_text
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

// PUT /api/questions/:questionId/status - Update question status
router.put(
  "/:questionId/status",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: paramError } = questionIdSchema.validate(req.params);
      if (paramError) {
        return res.status(400).json({
          success: false,
          error: paramError.details[0].message,
        });
      }

      const { error: bodyError } = updateStatusSchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          error: bodyError.details[0].message,
        });
      }

      // Check if question exists and user owns it
      const questionResult = await questionsService.getQuestionById(
        req.params.questionId
      );
      if (!questionResult.success) {
        return res.status(404).json(questionResult);
      }

      const user = (req as any).user;
      if (questionResult.data?.user_id !== user.id) {
        // TODO: Add admin check here
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const result = await questionsService.updateQuestionStatus(
        req.params.questionId,
        req.body.status
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

// DELETE /api/questions/:questionId - Delete a question
router.delete(
  "/:questionId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { error: validationError } = questionIdSchema.validate(req.params);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.details[0].message,
        });
      }

      // Check if question exists and user owns it
      const questionResult = await questionsService.getQuestionById(
        req.params.questionId
      );
      if (!questionResult.success) {
        return res.status(404).json(questionResult);
      }

      const user = (req as any).user;
      if (questionResult.data?.user_id !== user.id) {
        // TODO: Add admin check here
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const result = await questionsService.deleteQuestion(
        req.params.questionId
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

export { router as questionsRouter };
