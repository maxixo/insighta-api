import { Router } from 'express';

import { handleGithubCallback, redirectToGithub } from '../controllers/authController.js';

const router = Router();

router.get('/github', redirectToGithub);
router.get('/github/callback', handleGithubCallback);

export default router;
