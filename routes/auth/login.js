//router for express server
import { Router } from 'express';
import { login } from '../../controllers/auth/login.js';

const router = Router();

router.post('/login', login);

export default router;

