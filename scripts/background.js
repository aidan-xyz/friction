// Background service worker for Friction extension

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['blockedSites', 'siteStats'], (data) => {
    if (!data.blockedSites) {
      chrome.storage.local.set({ blockedSites: [] });
    }
    if (!data.siteStats) {
      chrome.storage.local.set({ siteStats: {} });
    }
  });
  
  // Set up daily reset alarm
  chrome.alarms.create('dailyReset', { periodInMinutes: 1440 }); // 24 hours
});

// Listen for daily reset alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    resetDailyStats();
  }
});

// Reset stats at midnight
function resetDailyStats() {
  chrome.storage.local.get(['siteStats'], (data) => {
    const stats = data.siteStats || {};
    const now = new Date();
    
    // Check if we need to reset (new day)
    for (let site in stats) {
      const lastReset = stats[site].lastReset || 0;
      const lastResetDate = new Date(lastReset);
      
      if (now.getDate() !== lastResetDate.getDate() || 
          now.getMonth() !== lastResetDate.getMonth() ||
          now.getYear() !== lastResetDate.getYear()) {
        stats[site].visitsToday = 0;
        stats[site].lastReset = now.getTime();
      }
    }
    
    chrome.storage.local.set({ siteStats: stats });
  });
}

// Check if domain matches any blocked site
function isBlocked(url, blockedSites) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    
    return blockedSites.some(site => {
      const cleanSite = site.replace(/^www\./, '').replace(/^https?:\/\//, '').toLowerCase();
      // Exact match or subdomain match
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });
  } catch (e) {
    return false;
  }
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    return null;
  }
}

// Use onCommitted to catch after navigation starts but before page loads
chrome.webNavigation.onCommitted.addListener((details) => {
  // Only intercept main frame navigations (not iframes)
  if (details.frameId !== 0) return;
  
  const url = details.url;
  const tabId = details.tabId;
  
  // Don't intercept extension pages or chrome URLs
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:')) {
    return;
  }
  
  chrome.storage.local.get(['blockedSites', 'siteStats', 'activeTabs'], (data) => {
    const blockedSites = data.blockedSites || [];
    const siteStats = data.siteStats || {};
    const activeTabs = data.activeTabs || {};
    
    // Check if this tab already passed friction for this session
    const domain = extractDomain(url);
    if (activeTabs[tabId] && activeTabs[tabId] === domain) {
      return; // Already passed friction, allow navigation
    }
    
    if (isBlocked(url, blockedSites)) {
      // Initialize stats for this site if needed
      if (!siteStats[domain]) {
        siteStats[domain] = {
          visitsToday: 0,
          timeSpent: 0,
          lastVisit: Date.now(),
          lastReset: Date.now()
        };
      }
      
      // Check if we need to reset (new day)
      const now = new Date();
      const lastReset = new Date(siteStats[domain].lastReset);
      if (now.getDate() !== lastReset.getDate() || 
          now.getMonth() !== lastReset.getMonth() ||
          now.getYear() !== lastReset.getYear()) {
        siteStats[domain].visitsToday = 0;
        siteStats[domain].lastReset = now.getTime();
      }
      
      // Increment visit count
      siteStats[domain].visitsToday += 1;
      siteStats[domain].lastVisit = Date.now();
      
      // Save updated stats
      chrome.storage.local.set({ siteStats });
      
      // Redirect to interrupt page
      const interruptUrl = chrome.runtime.getURL('pages/interrupt.html') + 
        `?url=${encodeURIComponent(url)}&domain=${encodeURIComponent(domain)}&visits=${siteStats[domain].visitsToday}`;
      
      chrome.tabs.update(tabId, { url: interruptUrl });
    }
  });
});

// Listen for tab closures to clean up active tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(['activeTabs'], (data) => {
    const activeTabs = data.activeTabs || {};
    delete activeTabs[tabId];
    chrome.storage.local.set({ activeTabs });
  });
});

// Listen for messages from interrupt page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'frictionPassed') {
    const { tabId, domain } = message;
    
    // Mark this tab as having passed friction
    chrome.storage.local.get(['activeTabs'], (data) => {
      const activeTabs = data.activeTabs || {};
      activeTabs[tabId] = domain;
      chrome.storage.local.set({ activeTabs });
    });
  } else if (message.type === 'updateTimeSpent') {
    const { domain, seconds } = message;
    
    chrome.storage.local.get(['siteStats'], (data) => {
      const siteStats = data.siteStats || {};
      if (siteStats[domain]) {
        siteStats[domain].timeSpent += seconds;
        chrome.storage.local.set({ siteStats });
      }
    });
  } else if (message.type === 'getTotalTime') {
    chrome.storage.local.get(['siteStats'], (data) => {
      const siteStats = data.siteStats || {};
      let totalSeconds = 0;
      
      for (let site in siteStats) {
        totalSeconds += siteStats[site].timeSpent || 0;
      }
      
      sendResponse({ totalSeconds });
    });
    return true; // Keep channel open for async response
  }
});