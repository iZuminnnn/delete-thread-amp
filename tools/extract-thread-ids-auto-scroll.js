// Auto-scroll script to extract all thread IDs from virtual DOM
// Paste this into browser DevTools console (F12)
// Script will auto-scroll and collect thread IDs every 3 seconds

(function autoExtractThreadIds() {
  const threadIds = new Set();
  let scrollInterval = null;
  let collectInterval = null;
  let lastScrollPosition = 0;
  let noChangeCount = 0;
  const MAX_NO_CHANGE = 3; // Stop after 3 times no new threads found
  let isRunning = true;
  
  // Function to collect thread IDs from current DOM
  function collectThreadIds() {
    const beforeCount = threadIds.size;
    
    // Extract from href attributes
    document.querySelectorAll('a[href*="/threads/T-"]').forEach(link => {
      const href = link.getAttribute('href');
      const match = href.match(/\/threads\/(T-[a-f0-9-]+)/i);
      if (match && match[1]) {
        threadIds.add(match[1]);
      }
    });
    
    // Extract from text content (fallback)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const matches = node.textContent.match(/T-[a-f0-9-]{8,}/gi);
      if (matches) {
        matches.forEach(id => {
          if (/^T-[a-f0-9-]+$/i.test(id)) {
            threadIds.add(id);
          }
        });
      }
    }
    
    const afterCount = threadIds.size;
    const newCount = afterCount - beforeCount;
    
    if (newCount > 0) {
      noChangeCount = 0;
      console.log(`📊 Collected ${newCount} new thread IDs (Total: ${afterCount})`);
    } else {
      noChangeCount++;
      console.log(`⏳ No new threads found (${noChangeCount}/${MAX_NO_CHANGE})`);
    }
    
    return newCount;
  }
  
  // Function to scroll down
  function scrollDown() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    if (currentScroll >= maxScroll - 10) {
      // Reached bottom, try scrolling a bit more or wait
      window.scrollBy(0, 100);
      setTimeout(() => window.scrollBy(0, -50), 100);
    } else {
      // Scroll down smoothly
      window.scrollBy({
        top: 500,
        behavior: 'smooth'
      });
    }
    
    // Check if we're stuck (same position)
    if (Math.abs(currentScroll - lastScrollPosition) < 10) {
      noChangeCount++;
    } else {
      noChangeCount = 0;
    }
    lastScrollPosition = currentScroll;
  }
  
  // Function to stop and finalize
  function stopAndFinalize() {
    isRunning = false;
    
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    
    if (collectInterval) {
      clearInterval(collectInterval);
      collectInterval = null;
    }
    
    const sortedIds = Array.from(threadIds).sort();
    
    console.log('\n' + '='.repeat(50));
    console.log(`%c✅ Collection Complete!`, 'color: green; font-weight: bold; font-size: 16px;');
    console.log(`%cFound ${sortedIds.length} unique thread IDs`, 'color: blue; font-size: 14px;');
    console.log('='.repeat(50));
    console.log(sortedIds.join('\n'));
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const textToCopy = sortedIds.join('\n');
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('\n%c📋 Thread IDs copied to clipboard!', 'color: green; font-weight: bold;');
      }).catch(err => {
        console.warn('⚠️ Could not copy to clipboard:', err);
      });
    }
    
    // Create download link
    const blob = new Blob([sortedIds.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thread-ids.txt';
    a.textContent = '📥 Download thread-ids.txt';
    a.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; z-index: 99999; font-weight: bold;';
    document.body.appendChild(a);
    
    // Save to window for further use
    window.extractedThreadIds = sortedIds;
    console.log('\n💡 Thread IDs saved to window.extractedThreadIds');
    
    return sortedIds;
  }
  
  // Start collecting
  console.log('%c🚀 Starting auto-scroll collection...', 'color: green; font-weight: bold; font-size: 14px;');
  console.log('📝 Script will:');
  console.log('   1. Auto-scroll down every 1 second');
  console.log('   2. Collect thread IDs every 3 seconds');
  console.log('   3. Stop when no new threads found 3 times in a row');
  console.log('   4. Press Ctrl+C or call stopCollection() to stop manually\n');
  
  // Initial collection
  collectThreadIds();
  
  // Auto-scroll every 1 second
  scrollInterval = setInterval(() => {
    if (!isRunning) return;
    scrollDown();
  }, 1000);
  
  // Collect thread IDs every 3 seconds
  collectInterval = setInterval(() => {
    if (!isRunning) return;
    
    const newCount = collectThreadIds();
    
    // Check if we should stop
    if (noChangeCount >= MAX_NO_CHANGE) {
      console.log('\n%c⏹️ No new threads found. Stopping...', 'color: orange; font-weight: bold;');
      stopAndFinalize();
    }
  }, 3000);
  
  // Expose stop function
  window.stopCollection = function() {
    console.log('\n%c⏹️ Manual stop requested', 'color: orange; font-weight: bold;');
    stopAndFinalize();
  };
  
  console.log('\n💡 Tip: Call stopCollection() to stop manually');
  
  return {
    stop: stopAndFinalize,
    getIds: () => Array.from(threadIds).sort(),
    getCount: () => threadIds.size
  };
})();
