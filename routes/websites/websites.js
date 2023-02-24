import { Router } from 'express';
import { showAllWebsites, addWebsite, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags, bookmarkResource, getResourcesBookmarkedByUser, setPublicAvailability } from '../../controllers/index.js';
import { isAuthenticated } from '../../middleware/auth/protected.js';
const router = Router();

router.get('/', showAllWebsites)

router.get('/user', isAuthenticated, getUserWebsites)

router.get('/bookmarked', isAuthenticated, getResourcesBookmarkedByUser)

router.get('/by-categories', getResourcesByCategories)

router.get('/by-tags', getResourcesByTags)

router.put('/update/:resourceId', isAuthenticated, updateResource)

router.put('/bookmark/:resourceId', isAuthenticated, bookmarkResource)

router.put('/set-public-availability/:resourceId', isAuthenticated, setPublicAvailability)

router.post('/add', isAuthenticated, addWebsite)

export default router;