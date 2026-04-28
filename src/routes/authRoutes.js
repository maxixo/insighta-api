import { Router } from 'express';

import { redirectToGithub } from '../controllers/authController.js';

const router = Router();

router.get('/github', redirectToGithub);

export default router;
