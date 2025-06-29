export class FlightManager {
  constructor() {
    this.arrivals = JSON.parse(localStorage.getItem('arrivals') || '[]');
    this.departures = JSON.parse(localStorage.getItem('departures') || '[]');
    this.narrowbodyModels = ['Embraer', 'E190', 'E195', 'A318', 'A319', 'A320', 'A321', 'B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739', 'B73X'];
    this.widebodyModels = ['A306', 'A312', 'A313', 'A332', 'A333', 'A338', 'A339', 'A342', 'A343', 'A345', 'A346', 'A359', 'A35K', 'A388', 'B742', 'B743', 'B744', 'B748', 'B752', 'B753', 'B762', 'B763', 'B764', 'B772', 'B77L', 'B77W', 'B778', 'B779', 'B788', 'B789', 'B78X'];
  }

  save() {
    localStorage.setItem('arrivals', JSON.stringify(this.arrivals));
    localStorage.setItem('departures', JSON.stringify(this.departures));
  }

  getDepartureOffset(aircraft, icao) {
    const icaoInitial = icao.charAt(0).toUpperCase();
    if (this.narrowbodyModels.includes(aircraft)) {
      if (icaoInitial === 'O') return 60;
      return 120;
    } else if (this.widebodyModels.includes(aircraft)) {
      if (icaoInitial === 'O' || icaoInitial === 'U' || icaoInitial === 'H') return 90;
      if (['D','F','G'].includes(icaoInitial)) return 120;
      if (['B','E','L','V'].includes(icaoInitial)) return 180;
      if (['Z','R','W'].includes(icaoInitial)) return 240;
      if (['C','K','Y','M','T','S','P','A','N'].includes(icaoInitial)) return 300;
    }
    return 120;
  }

  formatFlightNumber(originalFlightNum, increment) {
    // Extract prefix, numeric part, and suffix
    const match = originalFlightNum.match(/^(\D*)(\d+)(\D*)$/);
    if (!match) {
      // If no numeric part, just return original or incremented number as string
      const num = parseInt(originalFlightNum);
      if (isNaN(num)) return originalFlightNum;
      return (num + increment).toString();
    }
    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const numLength = numStr.length;
    let num = parseInt(numStr);
    num += increment;
    if (num < 0) num = 0;
    const numPadded = num.toString().padStart(numLength, '0');
    return prefix + numPadded + suffix;
  }

  async addFlight(flight, getDepartureTimeCallback) {
    const conflict = this.arrivals.some(f => f.time === flight.time && f.tps === flight.tps);
    if (conflict) {
      throw new Error('Conflito de horário no mesmo TPS!');
    }
    this.arrivals.push(flight);

    let depFlightNum = '';
    if (/^(EMIRATES AIRLINES|FLYDUBAI)$/i.test(flight.airline)) {
      depFlightNum = this.formatFlightNumber(flight.flight, -1);
    } else {
      depFlightNum = this.formatFlightNumber(flight.flight, 1);
    }

    let depTime = '';
    if (/^(EMIRATES AIRLINES|FLYDUBAI)$/i.test(flight.airline)) {
      if (!getDepartureTimeCallback) {
        throw new Error('Departure time callback is required for this airline');
      }
      depTime = await getDepartureTimeCallback(flight.airline, flight.time);
      if (!depTime) {
        throw new Error('Horário de departure obrigatório para ' + flight.airline);
      }
    } else {
      const offset = this.getDepartureOffset(flight.aircraft, flight.icao);
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

    this.departures.push(departureFlight);
    this.save();
  }
}
