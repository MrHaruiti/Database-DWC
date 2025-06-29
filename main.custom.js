console.log('main.custom.js script loaded');

import { FlightManager } from './flightManager.js';

const flightManager = new FlightManager();

const arrivalsTableBody = document.querySelector('#arrivalsTable tbody');
const departuresTableBody = document.querySelector('#departuresTable tbody');

const departureTimeModal = document.getElementById('departureTimeModal');
const departureTimeInput = document.getElementById('departureTimeInput');
const departureTimeError = document.getElementById('departureTimeError');
const departureTimeConfirm = document.getElementById('departureTimeConfirm');
const departureTimeCancel = document.getElementById('departureTimeCancel');

const errorModal = document.getElementById('errorModal');
const errorModalDesc = document.getElementById('errorModalDesc');
const errorModalClose = document.getElementById('errorModalClose');

function clearTable(tableBody) {
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

function sortFlightsByTime(flights) {
  return flights.sort((a, b) => {
    const timeA = a.time;
    const timeB = b.time;
    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;
    return 0;
  });
}

function renderArrivals() {
  clearTable(arrivalsTableBody);
  sortFlightsByTime(flightManager.arrivals);
  flightManager.arrivals.forEach((flight, index) => {
    const frequencyDisplay = flight.frequency || 'Diário';
    const row = document.createElement('tr');

    row.innerHTML = 
      '<td>' + flight.airline + '</td>' +
      '<td>' + flight.flight + '</td>' +
      '<td>' + flight.from + '</td>' +
      '<td>' + flight.icao + '</td>' +
      '<td>' + flight.time + '</td>' +
      '<td>' + flight.aircraft + '</td>' +
      '<td>' + flight.tps + '</td>' +
      '<td>' + frequencyDisplay + '</td>' +
      '<td><button data-index="' + index + '" class="delete-arrival">Delete</button></td>';

    arrivalsTableBody.appendChild(row);
  });
}

function renderDepartures() {
  clearTable(departuresTableBody);
  sortFlightsByTime(flightManager.departures);
  flightManager.departures.forEach((flight, index) => {
    const frequencyDisplay = flight.frequency || 'Diário';
    const row = document.createElement('tr');

    row.innerHTML = 
      '<td>' + flight.airline + '</td>' +
      '<td>' + flight.flight + '</td>' +
      '<td>' + flight.to + '</td>' +
      '<td>' + flight.icao + '</td>' +
      '<td>' + flight.time + '</td>' +
      '<td>' + flight.aircraft + '</td>' +
      '<td>' + flight.tps + '</td>' +
      '<td>' + frequencyDisplay + '</td>' +
      '<td><button data-index="' + index + '" class="delete-departure">Delete</button></td>';

    departuresTableBody.appendChild(row);
  });
}

function renderAll() {
  renderArrivals();
  renderDepartures();
}

function deleteArrival(index) {
  const flightToDelete = flightManager.arrivals[index];
  flightManager.arrivals.splice(index, 1);

  // Find and delete corresponding departure flight
  const depIndex = flightManager.departures.findIndex(depFlight => 
    depFlight.airline === flightToDelete.airline &&
    depFlight.flight === flightManager.formatFlightNumber(flightToDelete.flight, (/^(EMIRATES AIRLINES|FLYDUBAI)$/i.test(flightToDelete.airline) ? -1 : 1)) &&
    depFlight.to === flightToDelete.from
  );
  if (depIndex !== -1) {
    flightManager.departures.splice(depIndex, 1);
  }

  flightManager.save();
  renderAll();
}

function deleteDeparture(index) {
  flightManager.departures.splice(index, 1);
  flightManager.save();
  renderAll();
}

arrivalsTableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-arrival')) {
    const index = parseInt(e.target.getAttribute('data-index'));
    deleteArrival(index);
  }
});

departuresTableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-departure')) {
    const index = parseInt(e.target.getAttribute('data-index'));
    deleteDeparture(index);
  }
});

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed - attaching tab event listeners');
  const tabButtons = document.querySelectorAll('.tab-nav button');
  const tabs = document.querySelectorAll('.tab');
  console.log('Found tab buttons:', tabButtons.length);
  console.log('Found tabs:', tabs.length);

  tabButtons.forEach(button => {
    console.log('Attaching click listener to button:', button.id);
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      console.log('Tab button clicked:', button.id, 'target:', target);

      // Remove active class from all buttons and tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabs.forEach(tab => tab.classList.remove('active'));

      // Add active class to clicked button and corresponding tab
      button.classList.add('active');
      const activeTab = document.getElementById(target);
      if (activeTab) {
        activeTab.classList.add('active');
      }
    });
  });
});

// Import and Export handlers

const importFileInput = document.getElementById('importFileInput');
const importButton = document.getElementById('importButton');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportXlsxButton = document.getElementById('exportXlsxButton');

importButton.addEventListener('click', async () => {
  const file = importFileInput.files[0];
  if (!file) {
    showErrorModal('Please select a file to import.');
    return;
  }
  const reader = new FileReader();
  const fileName = file.name.toLowerCase();

  reader.onload = async (e) => {
    try {
      let data;
      if (fileName.endsWith('.json')) {
        data = JSON.parse(e.target.result);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        showErrorModal('Unsupported file format. Please select a JSON or XLSX file.');
        return;
      }
      await importFlightsSequential(data);
    } catch (error) {
      showErrorModal('Error importing file: ' + error.message);
    }
  };

  if (fileName.endsWith('.json')) {
    reader.readAsText(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    reader.readAsBinaryString(file);
  }
});

async function importFlightsSequential(flights) {
  let conflicts = 0;
  for (const flight of flights) {
    try {
      // Normalize frequency field if needed
      if (!flight.frequency && flight.Frequência) {
        flight.frequency = flight.Frequência;
      }
      // Check if flight already exists in arrivals
      const exists = flightManager.arrivals.some(f =>
        f.airline === flight.airline &&
        f.flight === flight.flight &&
        f.from === flight.from &&
        f.tps === flight.tps &&
        f.time === flight.time
      );
      if (exists) {
        continue; // Skip duplicate
      }
      await flightManager.addFlight(flight, getDepartureTimeFromModal);
    } catch (e) {
      conflicts++;
    }
  }
  if (conflicts > 0) {
    showErrorModal(conflicts + ' flights were not imported due to conflicts.');
  }
  renderAll();
}

// Modal handling functions

function openModal(modal) {
  modal.style.display = 'flex';
}

function closeModal(modal) {
  modal.style.display = 'none';
}

function showErrorModal(message) {
  errorModalDesc.textContent = message;
  openModal(errorModal);
}

// Departure time modal logic

let departureTimeResolve;
let departureTimeReject;

departureTimeInput.addEventListener('input', () => {
  if (departureTimeInput.value) {
    departureTimeError.style.display = 'none';
    departureTimeConfirm.disabled = false;
  } else {
    departureTimeError.style.display = 'block';
    departureTimeConfirm.disabled = true;
  }
});

departureTimeConfirm.addEventListener('click', () => {
  if (departureTimeInput.value) {
    closeModal(departureTimeModal);
    departureTimeResolve(departureTimeInput.value);
  }
});

departureTimeCancel.addEventListener('click', () => {
  closeModal(departureTimeModal);
  departureTimeReject(new Error('Departure time input cancelled'));
});

departureTimeModal.querySelector('.modal-close').addEventListener('click', () => {
  closeModal(departureTimeModal);
  departureTimeReject(new Error('Departure time input cancelled'));
});

errorModalClose.addEventListener('click', () => {
  closeModal(errorModal);
});

async function getDepartureTimeFromModal(airline, arrivalTime) {
  departureTimeInput.value = arrivalTime || '';
  departureTimeError.style.display = 'none';
  departureTimeConfirm.disabled = !departureTimeInput.value;
  openModal(departureTimeModal);
  return new Promise((resolve, reject) => {
    departureTimeResolve = resolve;
    departureTimeReject = reject;
  });
}
