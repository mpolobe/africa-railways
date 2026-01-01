
export enum ReportType {
  RAIL_LEG_TRIP = 'Rail Leg Trip',
  STATION_VISIT = 'Station Visit',
  CITY_OBSERVATION = 'City Observation'
}

export interface RailReport {
  id: string;
  timestamp: number;
  location: string;
  type: ReportType;
  delayHours: number;
  reason: string;
  trackCondition: number;
  trackOrthodox: number;
  infraCondition: number;
  weather: string;
  observations: string;
  payments: {
    cash: boolean;
    card: boolean;
    mobileMoney: boolean;
    afrToken: boolean;
  };
}

export interface CityNode {
  name: string;
  country: string;
}
