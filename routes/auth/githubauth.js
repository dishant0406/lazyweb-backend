import { Router } from 'express';
import { github, githubOAuth } from '../../controllers/index.js';
const router = Router();

router.get('/redirect', github)

router.get('/redirect/:id', github)

router.get('/github', githubOAuth)

export default router;