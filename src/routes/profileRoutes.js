import { Router } from 'express';

import { USER_ROLES } from '../constants/auth.js';
import {
  createProfile,
  deleteProfileById,
  getProfileById,
  listProfiles,
  searchProfiles
} from '../controllers/profileController.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const allowReadAccess = requireRole([USER_ROLES.admin, USER_ROLES.analyst]);
const requireAdmin = requireRole([USER_ROLES.admin]);

router.get('/search', allowReadAccess, searchProfiles);
router.get('/', allowReadAccess, listProfiles);
router.post('/', requireAdmin, createProfile);
router.get('/:id', allowReadAccess, getProfileById);
router.delete('/:id', requireAdmin, deleteProfileById);

export default router;
