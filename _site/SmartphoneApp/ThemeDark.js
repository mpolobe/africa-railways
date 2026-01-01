import { StyleSheet } from 'react-native';

export const darkStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  dashTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginTop: 25, marginBottom: 15 },
  
  serviceCircleBase: { 
    width: 65, height: 65, borderRadius: 22, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  circleDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  circleLight: { backgroundColor: '#2563EB' },
  circleWhite: { backgroundColor: '#334155' },
  serviceLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },

  upcomingCard: { 
    backgroundColor: '#1E293B', padding: 22, borderRadius: 28, 
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155'
  },
  routeText: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  statusBadge: { backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  tripDetailsCard: { backgroundColor: '#1E293B', margin: 20, borderRadius: 30, padding: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  detailValue: { fontSize: 16, color: '#F8FAFC', fontWeight: '800', marginTop: 4 },

  navBar: { 
    flexDirection: 'row', backgroundColor: '#1E293B', paddingVertical: 15, 
    borderTopWidth: 1, borderColor: '#334155', paddingBottom: 30
  },
});
