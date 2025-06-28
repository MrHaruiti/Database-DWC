document.addEventListener('DOMContentLoaded', function() {
  try {
    // Flight data arrays
    let { arrivals, departures } = loadFlightsFromStorage();

    // Helper to detect narrowbody/widebody
    const narrowbodyModels = ['Embraer', 'E190', 'E195', 'A318', 'A319', 'A320', 'A321', 'B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739', 'B73X'];
    const widebodyModels = ['A306', 'A312', 'A313', 'A332', 'A333', 'A338', 'A339', 'A342', 'A343', 'A345', 'A346', 'A359', 'A35K', 'A388', 'B742', 'B743', 'B744', 'B748', 'B752', 'B753', 'B762', 'B763', 'B764', 'B772', 'B77L', 'B77W', 'B778', 'B779', 'B788', 'B789', 'B78X'];

    // Helper to get departure time offset in minutes
    function getDepartureOffset(aircraft, icao) {
      const icaoInitial = icao.charAt(0).toUpperCase();
      if (narrowbodyModels.includes(aircraft)) {
        if (icaoInitial === 'O') return 60;
        return 120;
      } else if (widebodyModels.includes(aircraft)) {
        if (icaoInitial === 'O' || icaoInitial === 'U' || icaoInitial === 'H') return 90;
        if (['D','F','G'].includes(icaoInitial)) return 120;
        if (['B','E','L','V'].includes(icaoInitial)) return 180;
        if (['Z','R','W'].includes(icaoInitial)) return 240;
        if (['C','K','Y','M','T','S','P','A','N'].includes(icaoInitial)) return 300;
      }
      return 120; // default
    }

    // Add flight function
    function addFlight(flight, frequencyDays = []) {
      // Check for time conflict in arrivals
      const conflict = arrivals.some(f => f.time === flight.time && f.tps === flight.tps);
      if (conflict) {
        alert('Conflito de horário no mesmo TPS!');
        return false;
      }
      flight.frequencyDays = frequencyDays;
      arrivals.push(flight);

      // Generate departure flight
      let depFlightNum = '';
      if (/^(EMIRATES AIRLINES|FLYDUBAI)$/i.test(flight.airline)) {
        depFlightNum = (parseInt(flight.flight) - 1).toString();
      } else {
        depFlightNum = (parseInt(flight.flight) + 1).toString();
      }

      let depTime = '';
      if (/^(EMIRATES AIRLINES|FLYDUBAI)$/i.test(flight.airline)) {
        depTime = prompt('Digite o horário do departure para ' + flight.airline + ':', flight.time);
        if (!depTime) {
          alert('Horário de departure obrigatório para ' + flight.airline);
          return false;
        }
      } else {
        const offset = getDepartureOffset(flight.aircraft, flight.icao);
        const arrivalDate = new Date(`2000-01-01T${flight.time}`);
        const departureDate = new Date(arrivalDate.getTime() + offset * 60000);
        depTime = departureDate.toTimeString().slice(0,5);
      }

      const departureFlight = {
        airline: flight.airline,
        flight: depFlightNum,
        to: flight.from,
        icao: flight.icao,
        time: depTime,
        aircraft: flight.aircraft,
        tps: flight.tps,
        frequency: flight.frequency,
        frequencyDays: frequencyDays
      };

      departures.push(departureFlight);

      saveFlightsToStorage(arrivals, departures);
      renderTable('arrivalsTable', arrivals, true);
      renderTable('departuresTable', departures, false);
      return true;
    }

    // Backup modal functionality
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
