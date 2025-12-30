// Pattern interrupt logic

const QUOTES_SHORT = [
  "Time you enjoy wasting is not wasted time.",
  "The cost of a thing is the amount of life you exchange for it.",
  "You will never find time for anything. You must make it.",
  "Lost time is never found again.",
  "The bad news is time flies. The good news is you're the pilot."
];

const QUOTES_LONG = [
  "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
  "The quality of your life is determined by the quality of your attention.",
  "You can do anything, but not everything. Choose wisely.",
  "The difference between who you are and who you want to be is what you do.",
  "Every moment you spend on someone else's definition of success is a moment stolen from your own."
];

let originalUrl = '';
let domain = '';
let visits = 0;
let tabId = null;

// Parse URL parameters
function init() {
  const params = new URLSearchParams(window.location.search);
  originalUrl = decodeURIComponent(params.get('url') || '');
  domain = decodeURIComponent(params.get('domain') || '');
  visits = parseInt(params.get('visits') || '1');
  
  // Get tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      tabId = tabs[0].id;
      showFrictionLevel();
    }
  });
}

function showFrictionLevel() {
  const content = document.getElementById('content');
  
  if (visits === 1) {
    showLoadingBar(10, content);
  } else if (visits === 2) {
    showLoadingBar(20, content);
  } else if (visits === 3) {
    showQuoteTyping(QUOTES_SHORT, content);
  } else if (visits === 4) {
    showQuoteTyping(QUOTES_LONG, content);
  } else if (visits === 5) {
    showPuzzle('basic', content);
  } else if (visits === 6) {
    showPuzzle('hard', content);
  } else if (visits === 7) {
    showLocked(5, content);
  } else if (visits === 8) {
    showLocked(10, content);
  } else {
    // visits > 8: exponential lockout
    const lockMinutes = Math.min(5 * Math.pow(2, visits - 7), 120); // Cap at 2 hours
    showLocked(lockMinutes, content);
  }
}

function showLoadingBar(seconds, container) {
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-message">Please wait...</div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="countdown" id="countdown">${seconds}s</div>
    </div>
  `;
  
  const progressFill = document.getElementById('progressFill');
  const countdown = document.getElementById('countdown');
  let remaining = seconds;
  
  const interval = setInterval(() => {
    remaining--;
    const progress = ((seconds - remaining) / seconds) * 100;
    progressFill.style.width = progress + '%';
    countdown.textContent = remaining + 's';
    
    if (remaining <= 0) {
      clearInterval(interval);
      allowNavigation();
    }
  }, 1000);
  
  // Start progress animation
  setTimeout(() => {
    progressFill.style.width = '100%';
  }, 100);
}

function showQuoteTyping(quotesArray, container) {
  const quote = quotesArray[Math.floor(Math.random() * quotesArray.length)];
  
  container.innerHTML = `
    <div class="quote-container">
      <div class="quote-prompt">Type the following to continue:</div>
      <div class="quote-display">${quote}</div>
      <input type="text" class="quote-input" id="quoteInput" placeholder="Type here..." autocomplete="off" spellcheck="false">
    </div>
  `;
  
  const input = document.getElementById('quoteInput');
  input.focus();
  
  input.addEventListener('input', () => {
    const typed = input.value;
    const correct = quote.startsWith(typed);
    
    if (!correct && typed.length > 0) {
      input.classList.add('incorrect');
      setTimeout(() => input.classList.remove('incorrect'), 300);
    } else {
      input.classList.remove('incorrect');
    }
    
    if (typed === quote) {
      input.classList.add('correct');
      setTimeout(() => allowNavigation(), 500);
    }
  });
}

function showPuzzle(difficulty, container) {
  const isHard = difficulty === 'hard';
  const gridSize = isHard ? 4 : 3;
  const totalCells = gridSize * gridSize;
  const targetCount = isHard ? 5 : 3;
  
  // Generate random pattern
  const pattern = new Set();
  while (pattern.size < targetCount) {
    pattern.add(Math.floor(Math.random() * totalCells));
  }
  
  const instructions = isHard 
    ? `Select exactly ${targetCount} cells to match the pattern shown below, then click Submit`
    : `Select exactly ${targetCount} cells to create a diagonal line, then click Submit`;
  
  let cells = '';
  for (let i = 0; i < totalCells; i++) {
    cells += `<div class="puzzle-cell" data-index="${i}"></div>`;
  }
  
  container.innerHTML = `
    <div class="puzzle-container">
      <div class="puzzle-prompt">${instructions}</div>
      ${isHard ? `<div class="puzzle-pattern" id="pattern"></div>` : ''}
      <div class="puzzle-grid ${difficulty}">
        ${cells}
      </div>
      <button class="puzzle-submit" id="submitPuzzle">Submit</button>
      <div class="puzzle-feedback" id="puzzleFeedback"></div>
    </div>
  `;
  
  if (isHard) {
    // Show pattern briefly
    const patternDiv = document.getElementById('pattern');
    patternDiv.innerHTML = '<div class="puzzle-grid hard">' + 
      Array.from({length: totalCells}, (_, i) => 
        `<div class="puzzle-cell ${pattern.has(i) ? 'selected' : ''}"></div>`
      ).join('') + '</div>';
    
    setTimeout(() => {
      patternDiv.style.opacity = '0';
      patternDiv.style.transition = 'opacity 0.5s';
      setTimeout(() => patternDiv.remove(), 500);
    }, 3000);
  }
  
  const selected = new Set();
  const puzzleCells = document.querySelectorAll('.puzzle-cell');
  
  puzzleCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const index = parseInt(cell.dataset.index);
      
      if (selected.has(index)) {
        selected.delete(index);
        cell.classList.remove('selected');
      } else {
        selected.add(index);
        cell.classList.add('selected');
      }
    });
  });
  
  document.getElementById('submitPuzzle').addEventListener('click', () => {
    const feedback = document.getElementById('puzzleFeedback');
    
    let correct = false;
    if (isHard) {
      // Check if pattern matches
      correct = selected.size === pattern.size && 
                [...selected].every(i => pattern.has(i));
    } else {
      // Check for diagonal (any diagonal line of 3)
      const diagonals = [
        [0, 4, 8], // top-left to bottom-right
        [2, 4, 6], // top-right to bottom-left
      ];
      correct = diagonals.some(diag => 
        selected.size === 3 && diag.every(i => selected.has(i))
      );
    }
    
    if (correct) {
      feedback.style.color = '#4ade80';
      feedback.textContent = 'Correct!';
      setTimeout(() => allowNavigation(), 1000);
    } else {
      feedback.style.color = '#ef4444';
      feedback.textContent = 'Incorrect. Try again.';
      setTimeout(() => feedback.textContent = '', 2000);
    }
  });
}

function showLocked(minutes, container) {
  const unlockTime = Date.now() + (minutes * 60 * 1000);
  
  container.innerHTML = `
    <div class="locked-container">
      <div class="locked-icon">🔒</div>
      <div class="locked-message">Site Locked</div>
      <div class="locked-timer" id="lockedTimer">${formatTime(minutes * 60)}</div>
      <div class="locked-explanation">
        You've visited this site ${visits} times today.<br>
        Take a break and come back later.
      </div>
    </div>
  `;
  
  const timerEl = document.getElementById('lockedTimer');
  
  const interval = setInterval(() => {
    const remaining = Math.max(0, unlockTime - Date.now());
    timerEl.textContent = formatTime(Math.floor(remaining / 1000));
    
    if (remaining <= 0) {
      clearInterval(interval);
      allowNavigation();
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function allowNavigation() {
  // Notify background that friction has been passed
  chrome.runtime.sendMessage({
    type: 'frictionPassed',
    tabId: tabId,
    domain: domain
  });
  
  // Navigate to original URL
  window.location.href = originalUrl;
}

// Initialize on load
init();