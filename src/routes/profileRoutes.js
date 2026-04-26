import { Router } from 'express';

import {
  createProfile,
  deleteProfileById,
  getProfileById,
  listProfiles,
  searchProfiles
} from '../controllers/profileController.js';

const router = Router();

router.get('/search', searchProfiles);
router.get('/', listProfiles);
router.post('/', createProfile);
router.get('/:id', getProfileById);
router.delete('/:id', deleteProfileById);

export default router;
