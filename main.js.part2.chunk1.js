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
          <td><button class="delete-arrival" data-flight="${flight.flight}">Delete</button></td>
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
          <td><button class="delete-departure" data-flight="${flight.flight}">Delete</button></td>
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

      document.querySelectorAll('.delete-departure').forEach(button => {
        button.addEventListener('click', () => {
          flightManager.departures = flightManager.departures.filter(f => f.flight !== button.dataset.flight);
          flightManager.save();
          updateTables();
        });
      });
    }

    // Load flights from storage and update tables on page load
    const storedFlights = loadFlightsFromStorage();
    flightManager.arrivals = storedFlights.arrivals;
    flightManager.departures = storedFlights.departures;
    updateTables();

  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
