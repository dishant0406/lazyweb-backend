//router for express server
import { Router } from 'express';
import { isAuthenticated, login, decodedToken } from '../../controllers/index.js';

const router = Router();

router.post('/login', login);
router.get('/account', isAuthenticated)
router.get('/token', decodedToken)

export default router;

