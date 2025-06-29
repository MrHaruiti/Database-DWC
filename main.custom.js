console.log('main.custom.js script loaded');

// Removed import of flightManager.js due to missing file and 404 error
// import { FlightManager } from './flightManager.js';

// const flightManager = new FlightManager();

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

importButton.addEventListener('click', async () => {
  showErrorModal('Import functionality is disabled due to missing flightManager.');
});

async function importFlightsSequential(flights) {
  showErrorModal('Import functionality is disabled due to missing flightManager.');
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
