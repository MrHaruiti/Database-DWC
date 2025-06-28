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
    });

  } catch (error) {
    console.error("Error initializing application:", error);
  }
});
