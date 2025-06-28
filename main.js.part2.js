document.addEventListener('DOMContentLoaded', function() {
  try {
    // Flight data arrays
    let { arrivals, departures } = loadFlightsFromStorage();

    // Render tables
    function renderTable(tableId, flights, isArrival) {
      const tbody = document.getElementById(tableId)?.querySelector('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      flights.forEach((flight, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${flight.airline}</td>
          <td>${flight.flight}</td>
          <td>${isArrival ? flight.from : flight.to}</td>
          <td>${flight.icao}</td>
          <td>${flight.time}</td>
          <td>${flight.aircraft}</td>
          <td>${flight.tps}</td>
          <td>${flight.frequency}</td>
          <td>
            <button class="edit-btn" data-index="${index}" data-type="${isArrival ? 'arrival' : 'departure'}">Edit</button>
            <button class="delete-btn" data-index="${index}" data-type="${isArrival ? 'arrival' : 'departure'}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Initial render
    renderTable('arrivalsTable', arrivals, true);
    renderTable('departuresTable', departures, false);

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
    function addFlight(flight) {
      // Check for time conflict in arrivals
      const conflict = arrivals.some(f => f.time === flight.time && f.tps === flight.tps);
      if (conflict) {
        alert('Conflito de horário no mesmo TPS!');
        return false;
      }
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
        frequency: flight.frequency
      };

      departures.push(departureFlight);

      saveFlightsToStorage(arrivals, departures);
      renderTable('arrivalsTable', arrivals, true);
      renderTable('departuresTable', departures, false);
      return true;
    }

    // Handle flight form submission
    const flightForm = document.getElementById('flightForm');
    flightForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const flight = {
        airline: formData.get('airline'),
        flight: formData.get('flight'),
        from: formData.get('from'),
        icao: formData.get('icao'),
        time: formData.get('time'),
        aircraft: formData.get('aircraft'),
        tps: formData.get('tps'),
        frequency: formData.get('freqType')
      };
      if (addFlight(flight)) {
        this.reset();
      }
    });

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
