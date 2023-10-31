import { isAuthenticated, getUserDetails } from './auth/isAuthenticated.js'
import { login, verifyToken, loginExt } from './auth/login.js'
import { github, githubOAuth } from './auth/githubauth.js'
import { showAllWebsites, refetchImageAndUpdateResource, refetchMetaAndUpdateResource, addWebsiteOnlyByURL, getUserWebsitesNotPublic, bulkBookmarkResources, getUserBookmarkedResources, generateUI, deleteAllResources, setResourceAvailableForApproval, getResourcesThatMatchDescription, rejectResource, addWebsite, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags, bookmarkResource, getResourcesBookmarkedByUser, setPublicAvailability, showIsAvailableForApproval, getAllCategories, getAllTags, likeAResource } from './website/websiteSearch.js';
import { decodedToken } from './auth/decodedToken.js';

export {
  isAuthenticated,
  login,
  addWebsiteOnlyByURL,
  getUserWebsitesNotPublic,
  loginExt,
  github,
  githubOAuth,
  showAllWebsites,
  addWebsite,
  getUserWebsites,
  updateResource,
  getResourcesByCategories,
  getResourcesByTags,
  bookmarkResource,
  getResourcesBookmarkedByUser,
  getUserBookmarkedResources,
  setPublicAvailability,
  showIsAvailableForApproval,
  decodedToken,
  getAllCategories,
  getAllTags,
  likeAResource,
  getUserDetails,
  rejectResource,
  setResourceAvailableForApproval,
  getResourcesThatMatchDescription,
  deleteAllResources,
  generateUI,
  bulkBookmarkResources,
  verifyToken,
  refetchImageAndUpdateResource,
  refetchMetaAndUpdateResource
}