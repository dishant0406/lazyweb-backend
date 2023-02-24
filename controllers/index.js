import { isAuthenticated } from './auth/isAuthenticated.js'
import { login } from './auth/login.js'
import { github, githubOAuth } from './auth/githubauth.js'
import { showAllWebsites, addWebsite, getUserWebsites, updateResource, getResourcesByCategories, getResourcesByTags, bookmarkResource, getResourcesBookmarkedByUser, setPublicAvailability, showIsAvailableForApproval } from './website/websiteSearch.js';

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
  showIsAvailableForApproval
}