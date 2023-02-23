import { Router } from 'express';
import { showAllWebsites, addWebsite, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags } from '../../controllers/index.js';
import { isAuthenticated } from '../../middleware/auth/protected.js';
const router = Router();

router.get('/', showAllWebsites)

router.post('/add', isAuthenticated, addWebsite)

router.get('/user', isAuthenticated, getUserWebsites)

router.put('/update/:resourceId', isAuthenticated, updateResource)

router.get('/by-categories', getResourcesByCategories)

router.get('/by-tags', getResourcesByTags)

export default router;