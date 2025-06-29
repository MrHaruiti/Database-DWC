console.log('main.custom.js script loaded');

// Re-enable import of flightManager.js now that it exists
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

function renderArrivals() {
  clearTable(arrivalsTableBody);
  // No data rendering due to missing flightManager
}

function renderDepartures() {
  clearTable(departuresTableBody);
  // No data rendering due to missing flightManager
}

function renderAll() {
  renderArrivals();
  renderDepartures();
}

function deleteArrival(index) {
  // No operation due to missing flightManager
}

function deleteDeparture(index) {
  // No operation due to missing flightManager
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

// Import and Export handlers - disabled due to missing flightManager

const importFileInput = document.getElementById('importFileInput');
const importButton = document.getElementById('importButton');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportXlsxButton = document.getElementById('exportXlsxButton');
const backupButton = document.getElementById('backupButton');

const flightForm = document.getElementById('flightForm');

backupButton.addEventListener('click', () => {
  try {
    const backupData = {
      arrivals: flightManager.arrivals,
      departures: flightManager.departures,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flight_backup_" + new Date().toISOString() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert('Backup created successfully!');
  } catch (error) {
    showErrorModal('Error creating backup: ' + error.message);
  }
});

flightForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(flightForm);
  const flight = {
    airline: formData.get('airline'),
    flight: formData.get('flight'),
    from: formData.get('from'),
    icao: formData.get('icao'),
    time: formData.get('time'),
    aircraft: formData.get('aircraft'),
    tps: formData.get('tps'),
    frequency: formData.get('frequency') || formData.get('freqType') || 'Diário',
  };

  try {
    await flightManager.addFlight(flight, getDepartureTimeFromModal);
    renderAll();
    alert('Flight added successfully!');
    flightForm.reset();
  } catch (error) {
    showErrorModal('Error adding flight: ' + error.message);
  }
});

importButton.addEventListener('click', async () => {
  // Implement import functionality using flightManager
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
