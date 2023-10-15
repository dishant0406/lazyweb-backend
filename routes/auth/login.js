//router for express server
import { Router } from 'express';
import { isAuthenticated, login, verifyToken, decodedToken, getUserDetails, } from '../../controllers/index.js';
import { isAuthenticated as protect } from '../../middleware/auth/protected.js';
const router = Router();

router.post('/login', login);
router.get('/account', isAuthenticated)
router.get('/token', decodedToken)
router.get('/me', protect, getUserDetails)
router.get('/verify', protect, verifyToken)


export default router;

