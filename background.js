const problems = {};

/**
 * Schema:
 * 
 * number: {
 *  title: "",
 *  difficulty: "",
 *  latestSolvedDate: new Date(),
 *  scheduledDate: new Date()
 * }
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ problems });
});