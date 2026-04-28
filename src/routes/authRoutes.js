import { Router } from 'express';

import { handleGithubCallback, logout, redirectToGithub, refreshSession } from '../controllers/authController.js';

const router = Router();

router.get('/github', redirectToGithub);
router.get('/github/callback', handleGithubCallback);
router.post('/refresh', refreshSession);
router.post('/logout', logout);

export default router;
