import { Router } from 'express';
import { githubOAuth, github } from '../../controllers/index.js';
const router = Router();

router.get('/redirect', github)

router.get('/github', githubOAuth)

export default router;