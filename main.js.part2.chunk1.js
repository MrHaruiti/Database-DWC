import { FlightManager } from './flightManager.js';

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Frequency days checkbox toggle
    const freqTypeSelect = document.getElementById('freqType');
    const frequencyDaysDiv = document.getElementById('frequencyDays');

    function toggleFrequencyDays() {
      if (freqTypeSelect.value === 'semanal') {
        frequencyDaysDiv.style.display = 'block';
      } else {
        frequencyDaysDiv.style.display = 'none';
        // Uncheck all checkboxes when switching to diario
        frequencyDaysDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      }
    }

    freqTypeSelect.addEventListener('change', toggleFrequencyDays);
    toggleFrequencyDays();

    // Handle flight form submission updated to include frequency days
    const flightForm = document.getElementById('flightForm');
    flightForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const frequencyDays = [];
      if (freqTypeSelect.value === 'semanal') {
        frequencyDaysDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
          frequencyDays.push(cb.value);
        });
        if (frequencyDays.length === 0) {
          alert('Selecione pelo menos um dia da semana para frequência semanal.');
          return;
        }
      }
      // TODO: Add flight submission logic here
      try {
        const flight = {
          airline: formData.get('airline'),
          flight: formData.get('flight'),
          from: formData.get('from'),
          icao: formData.get('icao'),
          time: formData.get('time'),
          aircraft: formData.get('aircraft'),
          tps: formData.get('tps'),
          frequency: freqTypeSelect.value === 'semanal' ? frequencyDays : ['diario']
        };

        flightManager.addFlight(flight);
        flightManager.save();
        updateTables();
        flightForm.reset();
        toggleFrequencyDays();
        alert('Voo adicionado com sucesso!');
      } catch (error) {
        alert(error.message);
      }
    });

    // Initialize FlightManager and update tables on page load
    const flightManager = new FlightManager();

    function updateTables() {
      const arrivalsTableBody = document.querySelector('#arrivalsTable tbody');
      const departuresTableBody = document.querySelector('#departuresTable tbody');

      arrivalsTableBody.innerHTML = '';
      departuresTableBody.innerHTML = '';

      flightManager.arrivals.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${flight.airline}</td>
          <td>${flight.flight}</td>
          <td>${flight.from}</td>
          <td>${flight.icao}</td>
          <td>${flight.time}</td>
          <td>${flight.aircraft}</td>
          <td>${flight.tps}</td>
          <td>${Array.isArray(flight.frequency) ? flight.frequency.join(', ') : flight.frequency}</td>
          <td>
            <button class="edit-arrival" data-flight="${flight.flight}">Edit</button>
            <button class="delete-arrival" data-flight="${flight.flight}">Delete</button>
          </td>
        `;
        arrivalsTableBody.appendChild(row);
      });

      flightManager.departures.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${flight.airline}</td>
          <td>${flight.flight}</td>
          <td>${flight.to}</td>
          <td>${flight.icao}</td>
          <td>${flight.time}</td>
          <td>${flight.aircraft}</td>
          <td>${flight.tps}</td>
          <td>${Array.isArray(flight.frequency) ? flight.frequency.join(', ') : flight.frequency}</td>
          <td>
            <button class="edit-departure" data-flight="${flight.flight}">Edit</button>
            <button class="delete-departure" data-flight="${flight.flight}">Delete</button>
          </td>
        `;
        departuresTableBody.appendChild(row);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-arrival').forEach(button => {
        button.addEventListener('click', () => {
          flightManager.arrivals = flightManager.arrivals.filter(f => f.flight !== button.dataset.flight);
          flightManager.save();
          updateTables();
        });
      });

      // Add event listeners for edit buttons
      document.querySelectorAll('.edit-arrival').forEach(button => {
        button.addEventListener('click', () => {
          const flight = flightManager.arrivals.find(f => f.flight === button.dataset.flight);
          if (flight) {
            populateForm(flight, 'arrival');
          }
        });
      });

      document.querySelectorAll('.delete-departure').forEach(button => {
        button.addEventListener('click', () => {
          flightManager.departures = flightManager.departures.filter(f => f.flight !== button.dataset.flight);
          flightManager.save();
          updateTables();
        });
      });

      document.querySelectorAll('.edit-departure').forEach(button => {
        button.addEventListener('click', () => {
          const flight = flightManager.departures.find(f => f.flight === button.dataset.flight);
          if (flight) {
            populateForm(flight, 'departure');
          }
        });
      });
    }

    // Load flights from storage and update tables on page load
    const storedFlights = loadFlightsFromStorage();
    flightManager.arrivals = storedFlights.arrivals;
    flightManager.departures = storedFlights.departures;
    updateTables();

    // Function to populate form for editing
    function populateForm(flight, type) {
      flightForm.airline.value = flight.airline;
      flightForm.flight.value = flight.flight;
      flightForm.from.value = type === 'arrival' ? flight.from : flight.to;
      flightForm.icao.value = flight.icao;
      flightForm.time.value = flight.time;
      flightForm.aircraft.value = flight.aircraft;
      flightForm.tps.value = flight.tps;
      freqTypeSelect.value = Array.isArray(flight.frequency) && flight.frequency.length > 1 ? 'semanal' : 'diario';
      toggleFrequencyDays();

      if (freqTypeSelect.value === 'semanal' && Array.isArray(flight.frequency)) {
        frequencyDaysDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = flight.frequency.includes(cb.value);
        });
      } else {
        frequencyDaysDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
      }

      // Set a flag to indicate editing mode and store the type and flight number
      flightForm.dataset.editing = 'true';
      flightForm.dataset.editType = type;
      flightForm.dataset.editFlight = flight.flight;
    }

    // Modify form submission to handle editing
    flightForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const frequencyDays = [];
      if (freqTypeSelect.value === 'semanal') {
        frequencyDaysDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
          frequencyDays.push(cb.value);
        });
        if (frequencyDays.length === 0) {
          alert('Selecione pelo menos um dia da semana para frequência semanal.');
          return;
        }
      }

      const flight = {
        airline: formData.get('airline'),
        flight: formData.get('flight'),
        from: formData.get('from'),
        icao: formData.get('icao'),
        time: formData.get('time'),
        aircraft: formData.get('aircraft'),
        tps: formData.get('tps'),
        frequency: freqTypeSelect.value === 'semanal' ? frequencyDays : ['diario']
      };

      try {
        if (flightForm.dataset.editing === 'true') {
          // Editing mode
          const editType = flightForm.dataset.editType;
          const editFlight = flightForm.dataset.editFlight;

          if (editType === 'arrival') {
            // Update arrival flight
            const index = flightManager.arrivals.findIndex(f => f.flight === editFlight);
            if (index !== -1) {
              flightManager.arrivals[index] = flight;
            }
            // Also update corresponding departure flight
            const depIndex = flightManager.departures.findIndex(f => f.flight === editFlight);
            if (depIndex !== -1) {
              flightManager.departures[depIndex].airline = flight.airline;
              flightManager.departures[depIndex].to = flight.from;
              flightManager.departures[depIndex].icao = flight.icao;
              flightManager.departures[depIndex].time = flight.time; // Keep same time as arrival for now
              flightManager.departures[depIndex].aircraft = flight.aircraft;
              flightManager.departures[depIndex].tps = flight.tps;
              flightManager.departures[depIndex].frequency = flight.frequency;
            }
          } else if (editType === 'departure') {
            // Update departure flight
            const index = flightManager.departures.findIndex(f => f.flight === editFlight);
            if (index !== -1) {
              flightManager.departures[index] = flight;
            }
          }

          flightForm.dataset.editing = 'false';
          flightForm.dataset.editType = '';
          flightForm.dataset.editFlight = '';
        } else {
          // Adding new flight
          flightManager.addFlight(flight);
        }

        flightManager.save();
        updateTables();
        flightForm.reset();
        toggleFrequencyDays();
        alert('Voo salvo com sucesso!');
      } catch (error) {
        alert(error.message);
      }
    });

  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
