import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticateUser } from '../middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().optional()
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional()
}).min(1);

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

// POST /api/auth/signup - Register new user
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { error: validationError } = signUpSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { email, password, name } = req.body;
    const result = await authService.signUp(email, password, name);
    
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/signin - Sign in user
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { error: validationError } = signInSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { email, password } = req.body;
    const result = await authService.signIn(email, password);
    
    return res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/signout - Sign out user
router.post('/signout', authenticateUser, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Access token required'
      });
    }

    const result = await authService.signOut(token);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    // User is already validated by authenticateUser middleware
    const user = (req as any).user;
    
   return  res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { error: validationError } = resetPasswordSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { email } = req.body;
    const result = await authService.resetPassword(email);
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { error: validationError } = updateProfileSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Access token required'
      });
    }

    const result = await authService.updateProfile(token, req.body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh - Refresh session
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { error: validationError } = refreshTokenSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { refresh_token } = req.body;
    const result = await authService.refreshSession(refresh_token);
    
    return res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as authRouter };