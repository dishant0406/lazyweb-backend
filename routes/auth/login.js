//router for express server
import { Router } from 'express';
import { isAuthenticated, login } from '../../controllers/index.js';

const router = Router();

router.post('/login', login);
router.get('/account', isAuthenticated)

export default router;

