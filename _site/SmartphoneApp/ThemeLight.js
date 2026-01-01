import { StyleSheet } from 'react-native';

export const lightStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  dashTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  sectionLabel: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E293B', 
    marginTop: 25, 
    marginBottom: 15 
  },
  
  // 6-Circle Grid Styling
  serviceCircleBase: { 
    width: 65, 
    height: 65, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#3B82F6', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, 
    shadowRadius: 10, 
    elevation: 4, 
    marginBottom: 10 
  },
  circleDark: { backgroundColor: '#1E40AF' },
  circleLight: { backgroundColor: '#DBEAFE' },
  circleWhite: { backgroundColor: '#FFFFFF' },
  serviceLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#94A3B8', 
    textAlign: 'center' 
  },

  // Cards
  upcomingCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 22, 
    borderRadius: 28, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2,
    flexDirection: 'row', 
    alignItems: 'center'
  },
  routeText: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  statusBadge: { 
    backgroundColor: '#4ADE80', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginTop: 8, 
    alignSelf: 'flex-start' 
  },
  statusText: { 
    color: '#FFFFFF', 
    fontSize: 11, 
    fontWeight: '800' 
  },

  // Bottom Nav
  navBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderColor: '#F1F5F9', 
    paddingBottom: 30
  },
});
