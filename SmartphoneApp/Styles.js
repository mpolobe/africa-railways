import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: '#3B82F6', padding: 30, justifyContent: 'center' },
  authContent: { alignItems: 'center', width: '100%' },
  loginLogo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderWidth: 4, borderColor: '#FACC15' },
  brandName: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  brandSub: { color: '#DBEAFE', fontSize: 14, marginBottom: 40, textAlign: 'center' },
  authInput: { width: '100%', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 15, marginBottom: 15, fontSize: 16 },
  loginBtn: { width: '100%', backgroundColor: '#FACC15', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginBtnText: { fontWeight: '900', color: '#1E293B', fontSize: 16 },
  bioSection: { marginTop: 40, alignItems: 'center' },
  bioText: { color: '#FFFFFF', marginTop: 10 },

  goldWallet: { backgroundColor: '#FACC15', borderRadius: 28, padding: 24, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  balanceBrand: { fontSize: 14, fontWeight: '600', color: '#1E293B', opacity: 0.7 },
  balanceText: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
  topUpAction: { backgroundColor: '#1E40AF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  topUpActionText: { color: '#FFFFFF', fontWeight: 'bold' },
  servicesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
});
