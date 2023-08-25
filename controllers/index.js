import { isAuthenticated, getUserDetails } from './auth/isAuthenticated.js'
import { login } from './auth/login.js'
import { github, githubOAuth } from './auth/githubauth.js'
import { showAllWebsites, setResourceAvailableForApproval, rejectResource, addWebsite, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags, bookmarkResource, getResourcesBookmarkedByUser, setPublicAvailability, showIsAvailableForApproval, getAllCategories, getAllTags, likeAResource } from './website/websiteSearch.js';
import { decodedToken } from './auth/decodedToken.js';

export {
  isAuthenticated,
  login,
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
  setPublicAvailability,
  showIsAvailableForApproval,
  decodedToken,
  getAllCategories,
  getAllTags,
  likeAResource,
  getUserDetails,
  rejectResource,
  setResourceAvailableForApproval
}