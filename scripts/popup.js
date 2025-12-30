// Popup functionality

document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  
  document.getElementById('addSite').addEventListener('click', addSite);
  document.getElementById('siteInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });
});

function addSite() {
  const input = document.getElementById('siteInput');
  const site = input.value.trim().toLowerCase();
  
  if (!site) return;
  
  // Clean up the input (remove protocol, www, trailing slashes)
  const cleanSite = site
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
  
  chrome.storage.local.get(['blockedSites', 'siteTimestamps'], (data) => {
    const blockedSites = data.blockedSites || [];
    const siteTimestamps = data.siteTimestamps || {};
    
    if (blockedSites.includes(cleanSite)) {
      input.value = '';
      return; // Already exists
    }
    
    blockedSites.push(cleanSite);
    siteTimestamps[cleanSite] = Date.now(); // Store when it was added
    
    chrome.storage.local.set({ blockedSites, siteTimestamps }, () => {
      input.value = '';
      loadSites();
    });
  });
}

function removeSite(site) {
  chrome.storage.local.get(['blockedSites', 'siteTimestamps'], (data) => {
    const blockedSites = data.blockedSites || [];
    const siteTimestamps = data.siteTimestamps || {};
    const index = blockedSites.indexOf(site);
    
    if (index === -1) return;
    
    // Check if 14 days have passed
    const addedTime = siteTimestamps[site] || 0;
    const daysSinceAdded = (Date.now() - addedTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceAdded < 14) {
      const daysLeft = Math.ceil(14 - daysSinceAdded);
      alert(`You can only remove this site ${daysLeft} day${daysLeft !== 1 ? 's' : ''} from now.\n\nThis friction is intentional - stick with it.`);
      return;
    }
    
    // Allow removal after 14 days
    blockedSites.splice(index, 1);
    delete siteTimestamps[site];
    chrome.storage.local.set({ blockedSites, siteTimestamps }, () => {
      loadSites();
    });
  });
}

function loadSites() {
  chrome.storage.local.get(['blockedSites', 'siteTimestamps'], (data) => {
    const blockedSites = data.blockedSites || [];
    const siteTimestamps = data.siteTimestamps || {};
    const sitesList = document.getElementById('sitesList');
    
    if (blockedSites.length === 0) {
      sitesList.innerHTML = '<div class="empty-state">No blocked sites yet.<br>Add one to get started.</div>';
      return;
    }
    
    sitesList.innerHTML = blockedSites.map(site => {
      const addedTime = siteTimestamps[site] || Date.now();
      const daysSinceAdded = (Date.now() - addedTime) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.max(0, Math.ceil(14 - daysSinceAdded));
      const canRemove = daysSinceAdded >= 14;
      
      const lockInfo = canRemove ? '' : `<span class="lock-info">${daysLeft}d lock</span>`;
      
      return `
        <div class="site-item">
          <div class="site-info">
            <span class="site-name">${site}</span>
            ${lockInfo}
          </div>
          <button class="remove-btn ${canRemove ? '' : 'locked'}" data-site="${site}">
            ${canRemove ? 'Remove' : '🔒'}
          </button>
        </div>
      `;
    }).join('');
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        removeSite(btn.dataset.site);
      });
    });
  });
}