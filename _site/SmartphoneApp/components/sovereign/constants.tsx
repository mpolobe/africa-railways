
import React from 'react';

export const CITIES = [
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588 },
  { name: 'Luanda', country: 'Angola', lat: -8.8390, lng: 13.2894 },
  { name: 'Porto-Novo', country: 'Benin', lat: 6.4969, lng: 2.6289 },
  { name: 'Gaborone', country: 'Botswana', lat: -24.6282, lng: 25.9231 },
  { name: 'Ouagadougou', country: 'Burkina Faso', lat: 12.3714, lng: -1.5197 },
  { name: 'Gitega', country: 'Burundi', lat: -3.4272, lng: 29.9309 },
  { name: 'Praia', country: 'Cabo Verde', lat: 14.9330, lng: -23.5133 },
  { name: 'Yaoundé', country: 'Cameroon', lat: 3.8480, lng: 11.5021 },
  { name: 'Bangui', country: 'CAR', lat: 4.3947, lng: 18.5582 },
  { name: 'N\'Djamena', country: 'Chad', lat: 12.1348, lng: 15.0557 },
  { name: 'Moroni', country: 'Comoros', lat: -11.7172, lng: 43.2473 },
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.3276, lng: 15.3136 },
  { name: 'Brazzaville', country: 'Congo', lat: -4.2634, lng: 15.2429 },
  { name: 'Yamoussoukro', country: 'Ivory Coast', lat: 6.8276, lng: -5.2796 },
  { name: 'Djibouti', country: 'Djibouti', lat: 11.5883, lng: 43.1450 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Malabo', country: 'Equatorial Guinea', lat: 3.7504, lng: 8.7821 },
  { name: 'Asmara', country: 'Eritrea', lat: 15.3229, lng: 38.9251 },
  { name: 'Mbabane', country: 'Eswatini', lat: -26.3055, lng: 31.1367 },
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0192, lng: 38.7525 },
  { name: 'Libreville', country: 'Gabon', lat: 0.4162, lng: 9.4673 },
  { name: 'Banjul', country: 'Gambia', lat: 13.4549, lng: -16.5790 },
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  { name: 'Conakry', country: 'Guinea', lat: 9.6412, lng: -13.5784 },
  { name: 'Bissau', country: 'Guinea-Bissau', lat: 11.8817, lng: -15.5984 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Maseru', country: 'Lesotho', lat: -29.3175, lng: 27.4837 },
  { name: 'Monrovia', country: 'Liberia', lat: 6.3156, lng: -10.8074 },
  { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913 },
  { name: 'Antananarivo', country: 'Madagascar', lat: -18.8792, lng: 47.5079 },
  { name: 'Lilongwe', country: 'Malawi', lat: -13.9387, lng: 33.7741 },
  { name: 'Bamako', country: 'Mali', lat: 12.6392, lng: -8.0029 },
  { name: 'Nouakchott', country: 'Mauritania', lat: 18.0735, lng: -15.9582 },
  { name: 'Port Louis', country: 'Mauritius', lat: -20.1609, lng: 57.5012 },
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416 },
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732 },
  { name: 'Windhoek', country: 'Namibia', lat: -22.5609, lng: 17.0658 },
  { name: 'Niamey', country: 'Niger', lat: 13.5116, lng: 2.1254 },
  { name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { name: 'Kigali', country: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  { name: 'São Tomé', country: 'STP', lat: 0.3302, lng: 6.7333 },
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },
  { name: 'Victoria', country: 'Seychelles', lat: -4.6191, lng: 55.4513 },
  { name: 'Freetown', country: 'Sierra Leone', lat: 8.4840, lng: -13.2299 },
  { name: 'Mogadishu', country: 'Somalia', lat: 2.0469, lng: 45.3182 },
  { name: 'Pretoria', country: 'South Africa', lat: -25.7479, lng: 28.2293 },
  { name: 'Juba', country: 'South Sudan', lat: 4.8517, lng: 31.5713 },
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599 },
  { name: 'Dodoma', country: 'Tanzania', lat: -6.1731, lng: 35.7419 },
  { name: 'Lomé', country: 'Togo', lat: 6.1375, lng: 1.2123 },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825 },
  { name: 'Lusaka', country: 'Zambia', lat: -15.3875, lng: 28.3228 },
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lng: 31.0530 }
];

export const Icons = {
  Train: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15h10"/><path d="M12 15V5"/><path d="M2 17h20"/><path d="M18 8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8z"/><path d="m14 15-2 5-2-5"/><path d="M10 8h4"/><path d="M10 10h4"/></svg>
  ),
  Mic: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
  ),
  Wifi: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  ),
  Location: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  )
};
