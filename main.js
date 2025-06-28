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

    // Handle arrival form submission
    const arrivalForm = document.getElementById('arrivalForm');
    arrivalForm?.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      let isValid = true;
      
      // Validate required fields
      this.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });

      if (!isValid) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      // Add to arrivals table
      const arrivalsTable = document.getElementById('arrivalsTable')?.querySelector('tbody');
      if (arrivalsTable) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
          <td>${formData.get('airline')}</td>
          <td>${formData.get('flight')}</td>
          <td>${formData.get('from')}</td>
          <td>${formData.get('icao')}</td>
          <td>${formData.get('time')}</td>
          <td>${formData.get('aircraft')}</td>
          <td>${formData.get('tps')}</td>
          <td>${formData.get('freqMode')}</td>
        `;
        arrivalsTable.appendChild(newRow);

        // Add to departures table with time + 45 minutes
        const departuresTable = document.getElementById('departuresTable')?.querySelector('tbody');
        if (departuresTable) {
          const arrivalTime = new Date(`2000-01-01T${formData.get('time')}`);
          const departureTime = new Date(arrivalTime.getTime() + (45 * 60000));
          const formattedDepartureTime = departureTime.toTimeString().slice(0, 5);

          const departureRow = document.createElement('tr');
          departureRow.innerHTML = `
            <td>${formData.get('airline')}</td>
            <td>${formData.get('flight')}</td>
            <td>${formData.get('from')}</td>
            <td>${formData.get('icao')}</td>
            <td>${formattedDepartureTime}</td>
            <td>${formData.get('aircraft')}</td>
            <td>${formData.get('tps')}</td>
            <td>${formData.get('freqMode')}</td>
          `;
          departuresTable.appendChild(departureRow);
        }

        // Reset form and show success message
        this.reset();
        alert("Voo adicionado com sucesso!");
      }
    });

    // Backup functionality
    const backupModal = document.getElementById('backupModal');
    const backupButton = document.getElementById('backupButton');
    const confirmBackupBtn = document.getElementById('confirmBackup');
    const modalClose = document.querySelector('.modal-close');

    function showModal() {
      if(backupModal) {
        backupModal.style.display = "flex";
        backupModal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeModal() {
      if(backupModal) {
        backupModal.style.display = "none";
        backupModal.setAttribute('aria-hidden', 'true');
      }
    }

    backupButton?.addEventListener('click', showModal);
    modalClose?.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
      if(e.target === backupModal) {
        closeModal();
      }
    });

    confirmBackupBtn?.addEventListener('click', function() {
      this.textContent = 'Processing...';
      this.disabled = true;
      
      setTimeout(() => {
        alert("Backup realizado com sucesso!");
        closeModal();
        this.textContent = 'Yes, Backup Now';
        this.disabled = false;
      }, 1000);
    });

  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
