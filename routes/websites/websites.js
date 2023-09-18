import { Router } from 'express';
import { showAllWebsites, generateUI, bulkBookmarkResources, getUserBookmarkedResources, deleteAllResources, setResourceAvailableForApproval, getResourcesThatMatchDescription, addWebsite, rejectResource, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags, bookmarkResource, getResourcesBookmarkedByUser, setPublicAvailability, showIsAvailableForApproval, getAllCategories, getAllTags, likeAResource } from '../../controllers/index.js';
import { isAuthenticated } from '../../middleware/auth/protected.js';
const router = Router();

router.get('/', showAllWebsites)

router.get('/user', isAuthenticated, getUserWebsites)

router.get('/bookmarked', isAuthenticated, getResourcesBookmarkedByUser)

router.get('/is-available-for-approval', isAuthenticated, showIsAvailableForApproval)

router.post('/by-categories', getResourcesByCategories)

router.post('/by-tags', getResourcesByTags)

router.put('/update/:resourceId', isAuthenticated, updateResource)

router.put('/bookmark/:resourceId', isAuthenticated, bookmarkResource)

router.put('/approve/:resourceId', isAuthenticated, setPublicAvailability)

router.put('/reject/:resourceId', isAuthenticated, rejectResource)

router.put('/publish/:resourceId', isAuthenticated, setResourceAvailableForApproval)

router.post('/add', isAuthenticated, addWebsite)

router.get('/all-tags', getAllTags)

router.get('/all-categories', getAllCategories)

router.put('/like/:resourceId', isAuthenticated, likeAResource)

router.post('/search', getResourcesThatMatchDescription)

router.get('/delete-all', deleteAllResources)

router.post('/generate-ui', generateUI)

router.get('/bookmarks/:id', getUserBookmarkedResources)

router.post('/bulk-bookmark', isAuthenticated, bulkBookmarkResources)

export default router;