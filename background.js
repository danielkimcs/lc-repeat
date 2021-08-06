const problems = {};

/**
 * Schema:
 * 
 * number: {
 *  title: "",
 *  difficulty: "",
 *  link: "",
 *  current: {
 *    notes: "",
 *    solvedDate: new Date(),
 *    scheduledDate: new Date()
 *  },
 *  history: [
 * {...}, {...}
 *  ]
 * }
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ problems });
});