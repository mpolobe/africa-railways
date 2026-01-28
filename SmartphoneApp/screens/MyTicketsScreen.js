import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { getTickets, getSyncStatus, forceSync } from '../services/ticketService';

const { width } = Dimensions.get('window');

const MyTicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, confirmed, used
  const [syncStatus, setSyncStatus] = useState({ isOnline: false, pendingOperations: 0 });

  const loadTickets = useCallback(async () => {
    try {
      const userTickets = await getTickets();
      setTickets(userTickets);
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadTickets();
    });
    
    return unsubscribe;
  }, [navigation, loadTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await forceSync();
    await loadTickets();
    setRefreshing(false);
  }, [loadTickets]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.booking_status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'used': return '#64748B';
      case 'cancelled': return '#ef4444';
      case 'expired': return '#ef4444';
      default: return '#10b981';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'used': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
      case 'expired': return 'close-circle';
      default: return 'checkmark-circle';
    }
  };

  const openQRModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const renderTicketCard = (ticket) => {
    const status = ticket.booking_status || 'confirmed';
    const qrData = ticket.qr_data || JSON.stringify({ ticketId: ticket.ticket_id });
    
    return (
      <TouchableOpacity
        key={ticket.id || ticket.ticket_id}
        style={[styles.ticketCard, !ticket.synced && styles.ticketCardPending]}
        onPress={() => openQRModal(ticket)}
        activeOpacity={0.8}
      >
        {/* Sync indicator */}
        {!ticket.synced && (
          <View style={styles.pendingSyncBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color="#FFB800" />
            <Text style={styles.pendingSyncText}>Pending sync</Text>
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <Ionicons name={getStatusIcon(status)} size={16} color={getStatusColor(status)} />
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>

        {/* Route */}
        <Text style={styles.routeText}>{ticket.route}</Text>

        {/* Route Info Message */}
        <View style={styles.routeInfoContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#38bdf8" />
          <Text style={styles.routeInfoText}>
            Departs from {ticket.from_station || ticket.route?.split(' → ')[0]} on {ticket.travel_date} at {ticket.departure_time}. Arrives at {ticket.to_station || ticket.route?.split(' → ')[1]} at {ticket.arrival_time || '18:00'}.
          </Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{ticket.travel_date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>{ticket.departure_time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Class</Text>
            <Text style={styles.detailValue}>{ticket.class}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Seat</Text>
            <Text style={styles.detailValue}>{ticket.seat}</Text>
          </View>
        </View>

        {/* QR Preview */}
        <View style={styles.qrPreviewContainer}>
          <View style={styles.qrPreview}>
            <QRCode
              value={qrData}
              size={60}
              backgroundColor="white"
              color="#020617"
            />
          </View>
          <View style={styles.qrInfo}>
            <Text style={styles.qrInfoText}>Tap to view full QR code</Text>
            <Text style={styles.ticketIdText}>ID: {ticket.ticket_id}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748B" />
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Paid:</Text>
          <Text style={styles.priceValue}>
            {ticket.total_price_afrc ? `${ticket.total_price_afrc} AFRC` : `$${ticket.total_price_usd}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQRModal = () => (
    <Modal
      visible={showQRModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowQRModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowQRModal(false)}
          >
            <Ionicons name="close" size={28} color="#F1F5F9" />
          </TouchableOpacity>

          {selectedTicket && (
            <>
              {/* Header */}
              <Text style={styles.modalTitle}>Your Ticket</Text>
              <Text style={styles.modalRoute}>{selectedTicket.route}</Text>

              {/* Route Info Message */}
              <View style={styles.modalRouteInfo}>
                <Ionicons name="information-circle" size={18} color="#38bdf8" />
                <Text style={styles.modalRouteInfoText}>
                  Departs from {selectedTicket.from_station || selectedTicket.route?.split(' → ')[0]} on {selectedTicket.travel_date} at {selectedTicket.departure_time}. Arrives at {selectedTicket.to_station || selectedTicket.route?.split(' → ')[1]} at {selectedTicket.arrival_time || '18:00'}.
                </Text>
              </View>

              {/* QR Code */}
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={selectedTicket.qr_data || JSON.stringify({ ticketId: selectedTicket.ticket_id })}
                    size={width * 0.6}
                    backgroundColor="white"
                    color="#020617"
                  />
                </View>
                <Text style={styles.qrInstruction}>
                  Show this QR code to the conductor
                </Text>
              </View>

              {/* Ticket Details */}
              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Ticket ID</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.ticket_id}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Date</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.travel_date}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Departure</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.departure_time}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Arrival</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.arrival_time || '18:00'}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Class</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.class}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Seat</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.seat}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Train</Text>
                  <Text style={styles.modalDetailValue}>{selectedTicket.train}</Text>
                </View>
              </View>

              {/* Sync Status */}
              <View style={styles.blockchainInfo}>
                <Ionicons 
                  name={selectedTicket.synced ? "cloud-done" : "cloud-offline-outline"} 
                  size={16} 
                  color={selectedTicket.synced ? "#10b981" : "#FFB800"} 
                />
                <Text style={[styles.blockchainText, !selectedTicket.synced && { color: '#FFB800' }]}>
                  {selectedTicket.synced ? 'Synced to cloud' : 'Saved locally • Will sync when online'}
                </Text>
              </View>

              {/* View NFT Button */}
              <TouchableOpacity
                style={styles.viewNFTButton}
                onPress={() => {
                  setShowQRModal(false);
                  navigation.navigate('NFTGallery');
                }}
              >
                <Ionicons name="images" size={20} color="#020617" />
                <Text style={styles.viewNFTButtonText}>View NFT Collection</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Sync Status Bar */}
      <View style={styles.syncStatusBar}>
        <View style={styles.syncStatusLeft}>
          <Ionicons 
            name={syncStatus.isOnline ? "wifi" : "wifi-outline"} 
            size={16} 
            color={syncStatus.isOnline ? "#10b981" : "#64748B"} 
          />
          <Text style={styles.syncStatusText}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        {syncStatus.pendingOperations > 0 && (
          <View style={styles.syncPendingBadge}>
            <Text style={styles.syncPendingText}>
              {syncStatus.pendingOperations} pending
            </Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'confirmed', 'used'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.filterTabActive
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text style={[
              styles.filterTabText,
              filter === filterOption && styles.filterTabTextActive
            ]}>
              {filterOption === 'confirmed' ? 'Active' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38bdf8"
          />
        }
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#64748B" />
            <Text style={styles.emptyTitle}>No Tickets Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? "You haven't purchased any tickets yet"
                : `No ${filter} tickets`}
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('TicketBooking')}
            >
              <Text style={styles.bookButtonText}>Book a Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTickets.map(renderTicketCard)
        )}
      </ScrollView>

      {renderQRModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  syncStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncStatusText: {
    color: '#64748B',
    fontSize: 12,
  },
  syncPendingBadge: {
    backgroundColor: '#FFB80020',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncPendingText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#38bdf8',
  },
  filterTabText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingTop: 0,
  },
  ticketCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  ticketCardPending: {
    borderColor: '#FFB80050',
    borderStyle: 'dashed',
  },
  pendingSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pendingSyncText: {
    color: '#FFB800',
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeText: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    gap: 8,
  },
  routeInfoText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detailItem: {
    width: '50%',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  qrPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  qrPreview: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 8,
  },
  qrInfo: {
    flex: 1,
    marginLeft: 12,
  },
  qrInfoText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  ticketIdText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  priceValue: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingTop: 15,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalRoute: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  modalRouteInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  modalRouteInfoText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
  },
  qrInstruction: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  modalDetails: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalDetailLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  modalDetailValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  blockchainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  blockchainText: {
    color: '#10b981',
    fontSize: 12,
  },
  viewNFTButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  viewNFTButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyTicketsScreen;
