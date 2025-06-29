import { FlightManager } from './flightManager.js';

const flightManager = new FlightManager();

const arrivalsTableBody = document.querySelector('#arrivalsTable tbody');
const departuresTableBody = document.querySelector('#departuresTable tbody');

function clearTable(tableBody) {
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

function renderArrivals() {
  clearTable(arrivalsTableBody);
  flightManager.arrivals.forEach((flight, index) => {
    const row = document.createElement('tr');

    row.innerHTML = \`
      <td>\${flight.airline}</td>
      <td>\${flight.flight}</td>
      <td>\${flight.from}</td>
      <td>\${flight.icao}</td>
      <td>\${flight.time}</td>
      <td>\${flight.aircraft}</td>
      <td>\${flight.tps}</td>
      <td>\${flight.frequency}</td>
      <td><button data-index="\${index}" class="delete-arrival">Delete</button></td>
    \`;

    arrivalsTableBody.appendChild(row);
  });
}

function renderDepartures() {
  clearTable(departuresTableBody);
  flightManager.departures.forEach((flight, index) => {
    const row = document.createElement('tr');

    row.innerHTML = \`
      <td>\${flight.airline}</td>
      <td>\${flight.flight}</td>
      <td>\${flight.to}</td>
      <td>\${flight.icao}</td>
      <td>\${flight.time}</td>
      <td>\${flight.aircraft}</td>
      <td>\${flight.tps}</td>
      <td>\${flight.frequency}</td>
      <td><button data-index="\${index}" class="delete-departure">Delete</button></td>
    \`;

    departuresTableBody.appendChild(row);
  });
}

function renderAll() {
  renderArrivals();
  renderDepartures();
}

function deleteArrival(index) {
  flightManager.arrivals.splice(index, 1);
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

// Import and Export handlers

const importFileInput = document.getElementById('importFileInput');
const importButton = document.getElementById('importButton');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportXlsxButton = document.getElementById('exportXlsxButton');

importButton.addEventListener('click', () => {
  const file = importFileInput.files[0];
  if (!file) {
    alert('Please select a file to import.');
    return;
  }
  const reader = new FileReader();
  const fileName = file.name.toLowerCase();

  reader.onload = (e) => {
    try {
      if (fileName.endsWith('.json')) {
        const data = JSON.parse(e.target.result);
        importFlights(data);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        importFlights(jsonData);
      } else {
        alert('Unsupported file format. Please select a JSON or XLSX file.');
      }
    } catch (error) {
      alert('Error importing file: ' + error.message);
    }
  };

  if (fileName.endsWith('.json')) {
    reader.readAsText(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    reader.readAsBinaryString(file);
  }
});

function importFlights(flights) {
  let conflicts = 0;
  flights.forEach((flight) => {
    try {
      // Normalize frequency field if needed
      if (!flight.frequency && flight.Frequência) {
        flight.frequency = flight.Frequência;
      }
      flightManager.addFlight(flight);
    } catch (e) {
      conflicts++;
    }
  });
  if (conflicts > 0) {
    alert(\`\${conflicts} flights were not imported due to conflicts.\`);
  }
  renderAll();
}

exportJsonButton.addEventListener('click', () => {
  const data = {
    arrivals: flightManager.arrivals,
    departures: flightManager.departures,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flights.json';
  a.click();
  URL.revokeObjectURL(url);
});

exportXlsxButton.addEventListener('click', () => {
  const wb = XLSX.utils.book_new();

  const arrivalsSheet = XLSX.utils.json_to_sheet(flightManager.arrivals);
  XLSX.utils.book_append_sheet(wb, arrivalsSheet, 'Arrivals');

  const departuresSheet = XLSX.utils.json_to_sheet(flightManager.departures);
  XLSX.utils.book_append_sheet(wb, departuresSheet, 'Departures');

  XLSX.writeFile(wb, 'flights.xlsx');
});

// On page load, render all data
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});
