document.addEventListener('DOMContentLoaded', function() {
  try {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const tabButtons = document.querySelectorAll('.tab-nav button');
    
    function switchTab(targetId) {
      tabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
      });
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      const targetTab = document.getElementById(targetId);
      const targetButton = document.querySelector(`[data-target="${targetId}"]`);
      
      if (targetTab && targetButton) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
        targetButton.classList.add('active');
      }
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        switchTab(targetId);
      });
    });

    // Initialize first tab
    const firstTab = tabButtons[0]?.getAttribute('data-target');
    if (firstTab) {
      switchTab(firstTab);
    }

    // LocalStorage helpers
    function saveFlightsToStorage(arrivals, departures) {
      localStorage.setItem('arrivals', JSON.stringify(arrivals));
      localStorage.setItem('departures', JSON.stringify(departures));
    }

    function loadFlightsFromStorage() {
      const arrivals = JSON.parse(localStorage.getItem('arrivals') || '[]');
      const departures = JSON.parse(localStorage.getItem('departures') || '[]');
      return { arrivals, departures };
    }
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
