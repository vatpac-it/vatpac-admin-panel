export class Airport {
  _id: string;
  icao: string;
  apName: string;
  city: string;
  country: string;
  fir: string;
  lat: number;
  lon: number;
  apPax: number;
  apNo: number;
  ctfPax: number;
  ctfTeam: number;
  ctfProtect: boolean;
  ratingMin: number;
  ratingMax: number;
  apPaxBL: number;
  sdRatio: number;
  sdAct: number;
  stations: {station: string, available: boolean}[];
}
