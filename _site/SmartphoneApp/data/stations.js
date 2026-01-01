export const STATIONS = [
  { id: '1', name: 'Cairo Ramses', city: 'Cairo', country: 'Egypt', lat: 30.0626, lng: 31.2469, image: 'https://images.unsplash.com/photo-1572120339161-04e3042c1745?auto=format&fit=crop&w=800&q=80' },
  { id: '2', name: 'Cape Town Central', city: 'Cape Town', country: 'South Africa', lat: -33.9231, lng: 18.4239, image: 'https://images.unsplash.com/photo-1580619305218-8423a7f79b0f?auto=format&fit=crop&w=800&q=80' },
  { id: '3', name: 'Nairobi Terminus', city: 'Nairobi', country: 'Kenya', lat: -1.3243, lng: 36.9248, image: 'https://images.unsplash.com/photo-1614359833859-1e7d436b292e?auto=format&fit=crop&w=800&q=80' },
  { id: '4', name: 'Casablanca Voyageurs', city: 'Casablanca', country: 'Morocco', lat: 33.5892, lng: -7.5912, image: 'https://images.unsplash.com/photo-1549944850-84e00be4203b?auto=format&fit=crop&w=800&q=80' },
  { id: '5', name: 'Lagos Terminus', city: 'Lagos', country: 'Nigeria', lat: 6.4474, lng: 3.3882, image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80' },
  { id: '6', name: 'Addis Ababa Furi-Labu', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9416, lng: 38.7495, image: 'https://images.unsplash.com/photo-1624314138470-5a2f24623f10?auto=format&fit=crop&w=800&q=80' },
  { id: '7', name: 'Dakar Station', city: 'Dakar', country: 'Senegal', lat: 14.6677, lng: -17.4334, image: 'https://images.unsplash.com/photo-1558285511-1045c9225d2b?auto=format&fit=crop&w=800&q=80' },
  { id: '8', name: 'Dar es Salaam Station', city: 'Dar es Salaam', country: 'Tanzania', lat: -6.8235, lng: 39.2695, image: 'https://images.unsplash.com/photo-1474487024539-6633b38d3bb3?auto=format&fit=crop&w=800&q=80' },
  { id: '9', name: 'Algiers Central', city: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588, image: 'https://images.unsplash.com/photo-1564507592333-c60657eaa0af?auto=format&fit=crop&w=800&q=80' },
  { id: '10', name: 'Lusaka Central', city: 'Lusaka', country: 'Zambia', lat: -15.4214, lng: 28.2815, image: 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&w=800&q=80' },
  // ... and the rest use a default placeholder
  { id: '11', name: 'Luanda Bungo', city: 'Luanda', country: 'Angola', lat: -8.8147, lng: 13.2302, image: 'https://images.unsplash.com/photo-1515165561355-0975877c8e65?auto=format&fit=crop&w=800&q=80' }
];

// Loop to ensure all 54 have at least a placeholder
for (let i = 12; i <= 54; i++) {
  if (!STATIONS[i-1]) {
    STATIONS.push({
      id: String(i),
      name: 'Station Hub ' + i,
      city: 'Capital City',
      country: 'African Nation',
      lat: 0,
      lng: 0,
      image: 'https://images.unsplash.com/photo-1474487024539-6633b38d3bb3?auto=format&fit=crop&w=800&q=80'
    });
  }
}
