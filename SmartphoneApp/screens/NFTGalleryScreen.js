import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { getNFTs } from '../services/ticketService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// NFT Ticket types
const NFT_TYPES = {
  TICKET: 'ticket',           // Functional QR ticket for scanning
  SOUVENIR: 'souvenir',       // AI-generated African artwork souvenir
  MEMBERSHIP: 'membership',
  ACHIEVEMENT: 'achievement',
  COLLECTIBLE: 'collectible',
};

// African-themed artwork for NFT tickets based on route/destination
const AFRICAN_ARTWORK = {
  // Tanzania scenes
  'dar': {
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800', // Zanzibar beach
    theme: 'Indian Ocean Sunrise',
    colors: ['#FF6B35', '#F7931E', '#1E3A5F'],
    culture: 'Swahili Coast',
  },
  'mbeya': {
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', // African highlands
    theme: 'Southern Highlands',
    colors: ['#2D5016', '#8BC34A', '#4CAF50'],
    culture: 'Nyakyusa Heritage',
  },
  'tunduma': {
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', // Savanna
    theme: 'Border Crossing',
    colors: ['#D4A574', '#8B4513', '#FFD700'],
    culture: 'Trade Route Legacy',
  },
  // Zambia scenes
  'kapiri': {
    image: 'https://images.unsplash.com/photo-1534177616064-ef1385e44e60?w=800', // African railway
    theme: 'Railway Junction',
    colors: ['#1A1A2E', '#FFB800', '#E94560'],
    culture: 'TAZARA Heritage',
  },
  'lusaka': {
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', // Modern Africa
    theme: 'Capital City Vibes',
    colors: ['#2C3E50', '#E74C3C', '#27AE60'],
    culture: 'Urban Zambia',
  },
  'kasama': {
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800', // Waterfalls
    theme: 'Northern Wilderness',
    colors: ['#0077B6', '#00B4D8', '#90E0EF'],
    culture: 'Bemba Kingdom',
  },
  'ndola': {
    image: 'https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=800', // Copper mining
    theme: 'Copperbelt Pride',
    colors: ['#B87333', '#CD7F32', '#DAA520'],
    culture: 'Mining Heritage',
  },
  'mpika': {
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', // Wildlife
    theme: 'Wildlife Gateway',
    colors: ['#228B22', '#32CD32', '#90EE90'],
    culture: 'Safari Country',
  },
  'livingstone': {
    image: 'https://images.unsplash.com/photo-1568625502763-2a5ec6a94c47?w=800', // Victoria Falls
    theme: 'Smoke That Thunders',
    colors: ['#1E90FF', '#00CED1', '#FFFFFF'],
    culture: 'Victoria Falls',
  },
  'chinsali': {
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', // Rural Africa
    theme: 'Freedom Heritage',
    colors: ['#006400', '#228B22', '#FFD700'],
    culture: 'Independence Birthplace',
  },
  // Default African scenes
  'default': {
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800',
    theme: 'African Journey',
    colors: ['#FFB800', '#FF6B35', '#1A1A2E'],
    culture: 'Pan-African',
  },
};

// Get artwork based on destination
const getArtworkForRoute = (route) => {
  const routeLower = route.toLowerCase();
  for (const [key, artwork] of Object.entries(AFRICAN_ARTWORK)) {
    if (routeLower.includes(key)) {
      return artwork;
    }
  }
  return AFRICAN_ARTWORK.default;
};

// Sample NFT data - Tickets (functional) and Souvenirs (collectible artwork)
const SAMPLE_NFTS = [
  // ============ FUNCTIONAL TICKETS (QR Code for scanning) ============
  {
    id: 'TKT-TAZARA-001',
    type: NFT_TYPES.TICKET,
    name: 'TAZARA Express',
    route: 'Dar es Salaam → Kapiri Mposhi',
    date: '2026-01-15',
    departureTime: '14:00',
    class: 'First Class',
    seat: 'Car 3, Seat 12A',
    passengers: 1,
    status: 'valid',
    price: '45 AFRC',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
    txHash: '0x1234...abcd',
    mintedAt: '2026-01-13T10:30:00Z',
    // Links to souvenir
    souvenirId: 'SOU-TAZARA-001',
  },
  {
    id: 'TKT-TAZARA-002',
    type: NFT_TYPES.TICKET,
    name: 'Return Journey',
    route: 'Kapiri Mposhi → Dar es Salaam',
    date: '2026-01-20',
    departureTime: '08:00',
    class: 'First Class',
    seat: 'Car 3, Seat 12A',
    passengers: 1,
    status: 'valid',
    price: '45 AFRC',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
    txHash: '0x5678...efgh',
    mintedAt: '2026-01-13T10:30:00Z',
    souvenirId: 'SOU-TAZARA-002',
  },
  {
    id: 'TKT-TAZARA-003',
    type: NFT_TYPES.TICKET,
    name: 'Copperbelt Express',
    route: 'Ndola → Dar es Salaam',
    date: '2025-12-15',
    departureTime: '06:00',
    class: 'Business',
    seat: 'Car 5, Seat 8B',
    passengers: 2,
    status: 'used',
    price: '96 AFRC',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
    txHash: '0xcccc...dddd',
    mintedAt: '2025-12-10T09:00:00Z',
    souvenirId: 'SOU-TAZARA-003',
  },

  // ============ NFT SOUVENIRS (African artwork collectibles) ============
  {
    id: 'SOU-TAZARA-001',
    type: NFT_TYPES.SOUVENIR,
    name: 'Swahili Coast Sunrise',
    route: 'Dar es Salaam → Kapiri Mposhi',
    date: '2026-01-15',
    description: 'A stunning depiction of sunrise over the Indian Ocean as your journey begins from the historic Swahili Coast',
    artwork: getArtworkForRoute('Dar es Salaam'),
    rarity: 'Unique',
    artist: 'AI Generated',
    txHash: '0x1234...abcd',
    mintedAt: '2026-01-13T10:30:00Z',
    ticketId: 'TKT-TAZARA-001',
    traits: [
      { trait_type: 'Origin', value: 'Tanzania' },
      { trait_type: 'Destination', value: 'Zambia' },
      { trait_type: 'Theme', value: 'Indian Ocean Sunrise' },
      { trait_type: 'Culture', value: 'Swahili Coast' },
      { trait_type: 'Season', value: 'Dry Season' },
    ],
  },
  {
    id: 'SOU-TAZARA-002',
    type: NFT_TYPES.SOUVENIR,
    name: 'Railway Heritage Journey',
    route: 'Kapiri Mposhi → Dar es Salaam',
    date: '2026-01-20',
    description: 'Celebrating the historic TAZARA railway, a symbol of African unity and Chinese-African friendship',
    artwork: getArtworkForRoute('Kapiri Mposhi'),
    rarity: 'Unique',
    artist: 'AI Generated',
    txHash: '0x5678...efgh',
    mintedAt: '2026-01-13T10:30:00Z',
    ticketId: 'TKT-TAZARA-002',
    traits: [
      { trait_type: 'Origin', value: 'Zambia' },
      { trait_type: 'Destination', value: 'Tanzania' },
      { trait_type: 'Theme', value: 'Railway Junction' },
      { trait_type: 'Culture', value: 'TAZARA Heritage' },
      { trait_type: 'Season', value: 'Dry Season' },
    ],
  },
  {
    id: 'SOU-TAZARA-003',
    type: NFT_TYPES.SOUVENIR,
    name: 'Copperbelt Pride',
    route: 'Ndola → Dar es Salaam',
    date: '2025-12-15',
    description: 'From the copper mines of Zambia to the shores of Tanzania - a journey through industrial heritage',
    artwork: getArtworkForRoute('Ndola'),
    rarity: 'Unique',
    artist: 'AI Generated',
    txHash: '0xcccc...dddd',
    mintedAt: '2025-12-10T09:00:00Z',
    ticketId: 'TKT-TAZARA-003',
    traits: [
      { trait_type: 'Origin', value: 'Zambia' },
      { trait_type: 'Destination', value: 'Tanzania' },
      { trait_type: 'Theme', value: 'Copperbelt Pride' },
      { trait_type: 'Culture', value: 'Mining Heritage' },
      { trait_type: 'Season', value: 'Rainy Season' },
    ],
  },
  {
    id: 'SOU-TAZARA-004',
    type: NFT_TYPES.SOUVENIR,
    name: 'Victoria Falls Mist',
    route: 'Livingstone → Lusaka',
    date: '2025-11-20',
    description: 'The thundering waters of Mosi-oa-Tunya captured in this unique journey souvenir',
    artwork: getArtworkForRoute('Livingstone'),
    rarity: 'Rare',
    artist: 'AI Generated',
    txHash: '0xeeee...ffff',
    mintedAt: '2025-11-18T12:00:00Z',
    ticketId: null,
    traits: [
      { trait_type: 'Origin', value: 'Zambia' },
      { trait_type: 'Destination', value: 'Zambia' },
      { trait_type: 'Theme', value: 'Smoke That Thunders' },
      { trait_type: 'Culture', value: 'Victoria Falls' },
      { trait_type: 'Season', value: 'High Water' },
    ],
  },
  {
    id: 'SOU-TAZARA-005',
    type: NFT_TYPES.SOUVENIR,
    name: 'Bemba Kingdom Passage',
    route: 'Kasama → Mbeya',
    date: '2025-10-05',
    description: 'Journey through the ancient Bemba Kingdom, where tradition meets the modern railway',
    artwork: getArtworkForRoute('Kasama'),
    rarity: 'Epic',
    artist: 'AI Generated',
    txHash: '0xgggg...hhhh',
    mintedAt: '2025-10-03T08:00:00Z',
    ticketId: null,
    traits: [
      { trait_type: 'Origin', value: 'Zambia' },
      { trait_type: 'Destination', value: 'Tanzania' },
      { trait_type: 'Theme', value: 'Northern Wilderness' },
      { trait_type: 'Culture', value: 'Bemba Kingdom' },
      { trait_type: 'Season', value: 'Dry Season' },
    ],
  },

  // ============ MEMBERSHIP NFTs ============
  {
    id: 'NFT-MEM-001',
    type: NFT_TYPES.MEMBERSHIP,
    name: 'Gold Sentinel Member',
    tier: 'Gold',
    validUntil: '2027-01-13',
    benefits: ['20% discount', 'Priority boarding', 'Lounge access', 'Free seat selection'],
    status: 'active',
    artwork: {
      image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800',
      theme: 'Golden Membership',
      colors: ['#FFD700', '#FFA500', '#1A1A2E'],
      culture: 'Elite Traveler',
    },
    txHash: '0x9abc...ijkl',
    mintedAt: '2026-01-01T00:00:00Z',
  },

  // ============ ACHIEVEMENT NFTs ============
  {
    id: 'NFT-ACH-001',
    type: NFT_TYPES.ACHIEVEMENT,
    name: 'First Journey',
    description: 'Completed your first TAZARA journey',
    earnedAt: '2026-01-10',
    rarity: 'Common',
    artwork: {
      image: 'https://images.unsplash.com/photo-1534177616064-ef1385e44e60?w=800',
      theme: 'First Steps',
      colors: ['#10B981', '#059669', '#1A1A2E'],
      culture: 'New Explorer',
    },
    txHash: '0xdef0...mnop',
    mintedAt: '2026-01-10T18:00:00Z',
  },
  {
    id: 'NFT-ACH-002',
    type: NFT_TYPES.ACHIEVEMENT,
    name: 'Cross-Border Explorer',
    description: 'Traveled between Tanzania and Zambia',
    earnedAt: '2026-01-10',
    rarity: 'Rare',
    artwork: {
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
      theme: 'Border Crosser',
      colors: ['#3B82F6', '#1D4ED8', '#1A1A2E'],
      culture: 'International Voyager',
    },
    txHash: '0x1111...qrst',
    mintedAt: '2026-01-10T18:00:00Z',
  },
  {
    id: 'NFT-ACH-003',
    type: NFT_TYPES.ACHIEVEMENT,
    name: '1000km Traveler',
    description: 'Traveled over 1000km on TAZARA railways',
    earnedAt: '2026-01-15',
    rarity: 'Epic',
    artwork: {
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      theme: 'Distance Champion',
      colors: ['#8B5CF6', '#6D28D9', '#1A1A2E'],
      culture: 'Seasoned Traveler',
    },
    txHash: '0x3333...yyyy',
    mintedAt: '2026-01-15T20:00:00Z',
  },

  // ============ COLLECTIBLE NFTs ============
  {
    id: 'NFT-COL-001',
    type: NFT_TYPES.COLLECTIBLE,
    name: 'TAZARA 50th Anniversary',
    description: 'Limited edition commemorative NFT celebrating 50 years of Tanzania-Zambia Railway friendship',
    edition: '142/500',
    rarity: 'Legendary',
    artwork: {
      image: 'https://images.unsplash.com/photo-1534177616064-ef1385e44e60?w=800',
      theme: 'Golden Jubilee',
      colors: ['#F59E0B', '#D97706', '#1A1A2E'],
      culture: 'Historic Legacy',
    },
    txHash: '0x2222...uvwx',
    mintedAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'NFT-COL-002',
    type: NFT_TYPES.COLLECTIBLE,
    name: 'Kilimanjaro View',
    description: 'Rare NFT capturing the majestic Mount Kilimanjaro from the railway',
    edition: '77/200',
    rarity: 'Epic',
    artwork: {
      image: 'https://images.unsplash.com/photo-1568625502763-2a5ec6a94c47?w=800',
      theme: 'Roof of Africa',
      colors: ['#1E90FF', '#00CED1', '#1A1A2E'],
      culture: 'Natural Wonder',
    },
    txHash: '0x4444...zzzz',
    mintedAt: '2025-11-15T00:00:00Z',
  },
];

const NFTGalleryScreen = ({ navigation }) => {
  const [nfts, setNfts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNFTs = useCallback(async () => {
    try {
      const userNFTs = await getNFTs();
      // Combine user NFTs with sample NFTs for demo
      const allNFTs = [...userNFTs.map(nft => ({
        ...nft,
        type: NFT_TYPES.SOUVENIR,
        artwork: {
          image: nft.image_url,
          theme: nft.theme,
          colors: nft.colors || ['#FFB800', '#FF6B35', '#1A1A2E'],
          culture: nft.culture,
        },
      })), ...SAMPLE_NFTS];
      setNfts(allNFTs);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      setNfts(SAMPLE_NFTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNFTs();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadNFTs();
    });
    
    return unsubscribe;
  }, [navigation, loadNFTs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNFTs();
    setRefreshing(false);
  };

  const filteredNFTs = filter === 'all' 
    ? nfts 
    : nfts.filter(nft => nft.type === filter);

  const getTypeIcon = (type) => {
    switch (type) {
      case NFT_TYPES.TICKET: return 'qr-code';
      case NFT_TYPES.SOUVENIR: return 'image';
      case NFT_TYPES.MEMBERSHIP: return 'card';
      case NFT_TYPES.ACHIEVEMENT: return 'trophy';
      case NFT_TYPES.COLLECTIBLE: return 'diamond';
      default: return 'cube';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case NFT_TYPES.TICKET: return ['#1A1A2E', '#2D2D44'];
      case NFT_TYPES.SOUVENIR: return ['#FF6B35', '#F7931E'];
      case NFT_TYPES.MEMBERSHIP: return ['#00D4FF', '#0099CC'];
      case NFT_TYPES.ACHIEVEMENT: return ['#10B981', '#059669'];
      case NFT_TYPES.COLLECTIBLE: return ['#8B5CF6', '#6D28D9'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case NFT_TYPES.TICKET: return '🎫 Ticket';
      case NFT_TYPES.SOUVENIR: return '🎨 Souvenir';
      case NFT_TYPES.MEMBERSHIP: return '💳 Membership';
      case NFT_TYPES.ACHIEVEMENT: return '🏆 Achievement';
      case NFT_TYPES.COLLECTIBLE: return '💎 Collectible';
      default: return 'NFT';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return '#9CA3AF';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#9CA3AF';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
      case 'active': return '#10B981';
      case 'used': return '#6B7280';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const shareNFT = async (nft) => {
    try {
      await Share.share({
        message: `Check out my ${nft.name} NFT from Africa Railways!\n\nNFT ID: ${nft.id}\nBlockchain: SUI Network\nTx: ${nft.txHash}\n\n🚂 africarailways.com`,
        title: nft.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const openNFTDetail = (nft) => {
    setSelectedNFT(nft);
    setModalVisible(true);
  };

  const renderNFTCard = (nft) => {
    const colors = nft.artwork?.colors || getTypeColor(nft.type);
    const hasArtwork = nft.artwork?.image && nft.type !== NFT_TYPES.TICKET;
    
    return (
      <TouchableOpacity
        key={nft.id}
        style={styles.nftCard}
        onPress={() => openNFTDetail(nft)}
        activeOpacity={0.8}
      >
        {/* Souvenir cards show artwork image */}
        {hasArtwork ? (
          <View style={styles.nftCardWithImage}>
            <Image
              source={{ uri: nft.artwork.image }}
              style={styles.nftCardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.nftCardImageOverlay}
            >
              <View style={styles.nftCardImageHeader}>
                <View style={[styles.typeBadge, { backgroundColor: colors[0] }]}>
                  <Ionicons name={getTypeIcon(nft.type)} size={12} color="white" />
                  <Text style={styles.typeBadgeText}>
                    {nft.type === NFT_TYPES.SOUVENIR ? 'Souvenir' : nft.type}
                  </Text>
                </View>
                {nft.rarity && (
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(nft.rarity) }]}>
                    <Text style={styles.rarityText}>{nft.rarity}</Text>
                  </View>
                )}
              </View>
              <View style={styles.nftCardImageContent}>
                <Text style={styles.nftName} numberOfLines={2}>{nft.name}</Text>
                {nft.artwork?.theme && (
                  <Text style={styles.nftTheme}>{nft.artwork.theme}</Text>
                )}
                {nft.route && (
                  <Text style={styles.nftDetail}>{nft.route}</Text>
                )}
              </View>
            </LinearGradient>
          </View>
        ) : (
          /* Ticket cards show QR-focused design */
          <LinearGradient
            colors={colors}
            style={styles.nftCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.nftCardHeader}>
              <View style={styles.ticketTypeRow}>
                <Ionicons name={getTypeIcon(nft.type)} size={20} color="#FFB800" />
                <Text style={styles.ticketTypeText}>
                  {nft.type === NFT_TYPES.TICKET ? 'TICKET' : getTypeLabel(nft.type)}
                </Text>
              </View>
              {nft.status && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(nft.status) }]}>
                  <Text style={styles.statusText}>{nft.status.toUpperCase()}</Text>
                </View>
              )}
            </View>
            
            {/* Mini QR Code for tickets */}
            {nft.type === NFT_TYPES.TICKET && (
              <View style={styles.miniQRContainer}>
                <QRCode
                  value={JSON.stringify({
                    id: nft.id,
                    type: 'ticket',
                    wallet: nft.walletAddress || '0x0',
                    route: nft.route,
                    date: nft.date,
                  })}
                  size={60}
                  backgroundColor="white"
                  color="#0A0F1C"
                />
              </View>
            )}
            
            <View style={styles.nftCardContent}>
              <Text style={styles.nftName} numberOfLines={2}>{nft.name}</Text>
              
              {nft.type === NFT_TYPES.TICKET && (
                <>
                  <Text style={styles.nftDetail}>{nft.route}</Text>
                  <Text style={styles.nftDetailHighlight}>
                    {nft.date} • {nft.departureTime}
                  </Text>
                  <Text style={styles.nftDetail}>{nft.class} • {nft.seat}</Text>
                </>
              )}
              
              {nft.type === NFT_TYPES.MEMBERSHIP && (
                <Text style={styles.nftDetail}>Valid until {nft.validUntil}</Text>
              )}
              
              {nft.type === NFT_TYPES.ACHIEVEMENT && (
                <Text style={styles.nftDetail}>Earned {nft.earnedAt}</Text>
              )}
              
              {nft.type === NFT_TYPES.COLLECTIBLE && (
                <Text style={styles.nftDetail}>Edition {nft.edition}</Text>
              )}
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  const renderNFTDetailModal = () => {
    if (!selectedNFT) return null;
    
    const colors = selectedNFT.artwork?.colors || getTypeColor(selectedNFT.type);
    const hasArtwork = selectedNFT.artwork?.image;
    const isTicket = selectedNFT.type === NFT_TYPES.TICKET;
    const isSouvenir = selectedNFT.type === NFT_TYPES.SOUVENIR;
    
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header with artwork or gradient */}
            {hasArtwork && !isTicket ? (
              <View style={styles.modalHeaderWithImage}>
                <Image
                  source={{ uri: selectedNFT.artwork.image }}
                  style={styles.modalHeaderImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.modalHeaderImageOverlay}
                >
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <View style={styles.modalHeaderContent}>
                    <View style={[styles.typeBadgeLarge, { backgroundColor: colors[0] || '#FF6B35' }]}>
                      <Ionicons name={getTypeIcon(selectedNFT.type)} size={16} color="white" />
                      <Text style={styles.typeBadgeTextLarge}>{getTypeLabel(selectedNFT.type)}</Text>
                    </View>
                    <Text style={styles.modalTitle}>{selectedNFT.name}</Text>
                    {selectedNFT.artwork?.theme && (
                      <Text style={styles.modalTheme}>{selectedNFT.artwork.theme}</Text>
                    )}
                    {selectedNFT.artwork?.culture && (
                      <Text style={styles.modalCulture}>🌍 {selectedNFT.artwork.culture}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <LinearGradient
                colors={isTicket ? ['#1A1A2E', '#2D2D44'] : colors}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <Ionicons name={getTypeIcon(selectedNFT.type)} size={48} color={isTicket ? '#FFB800' : 'white'} />
                <Text style={styles.modalTitle}>{selectedNFT.name}</Text>
                
                {selectedNFT.status && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedNFT.status) }]}>
                    <Text style={styles.statusText}>{selectedNFT.status.toUpperCase()}</Text>
                  </View>
                )}
              </LinearGradient>
            )}
            
            <ScrollView style={styles.modalBody}>
              {/* QR Code for Tickets */}
              {isTicket && (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrTitle}>🎫 Scan at Station</Text>
                  <QRCode
                    value={JSON.stringify({
                      id: selectedNFT.id,
                      type: 'ticket',
                      wallet: selectedNFT.walletAddress || '0x0',
                      route: selectedNFT.route,
                      date: selectedNFT.date,
                      class: selectedNFT.class,
                      seat: selectedNFT.seat,
                      passengers: selectedNFT.passengers,
                      txHash: selectedNFT.txHash,
                    })}
                    size={180}
                    backgroundColor="white"
                    color="#0A0F1C"
                  />
                  <Text style={styles.qrLabel}>Present this QR code to the conductor</Text>
                  {selectedNFT.souvenirId && (
                    <TouchableOpacity 
                      style={styles.viewSouvenirButton}
                      onPress={() => {
                        const souvenir = nfts.find(n => n.id === selectedNFT.souvenirId);
                        if (souvenir) {
                          setSelectedNFT(souvenir);
                        }
                      }}
                    >
                      <Ionicons name="image" size={16} color="#FFB800" />
                      <Text style={styles.viewSouvenirText}>View Journey Souvenir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Souvenir Description */}
              {isSouvenir && selectedNFT.description && (
                <View style={styles.souvenirDescription}>
                  <Text style={styles.souvenirDescriptionText}>{selectedNFT.description}</Text>
                </View>
              )}

              {/* Traits for Souvenirs */}
              {isSouvenir && selectedNFT.traits && (
                <View style={styles.traitsContainer}>
                  <Text style={styles.sectionTitle}>Traits</Text>
                  <View style={styles.traitsGrid}>
                    {selectedNFT.traits.map((trait, index) => (
                      <View key={index} style={styles.traitItem}>
                        <Text style={styles.traitType}>{trait.trait_type}</Text>
                        <Text style={styles.traitValue}>{trait.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {/* NFT Details */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>NFT ID</Text>
                  <Text style={styles.detailValue}>{selectedNFT.id}</Text>
                </View>
                
                {selectedNFT.type === NFT_TYPES.TICKET && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Route</Text>
                      <Text style={styles.detailValue}>{selectedNFT.route}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{selectedNFT.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Class</Text>
                      <Text style={styles.detailValue}>{selectedNFT.class}</Text>
                    </View>
                  </>
                )}
                
                {selectedNFT.type === NFT_TYPES.MEMBERSHIP && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tier</Text>
                      <Text style={styles.detailValue}>{selectedNFT.tier}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Valid Until</Text>
                      <Text style={styles.detailValue}>{selectedNFT.validUntil}</Text>
                    </View>
                    {selectedNFT.benefits && (
                      <View style={styles.benefitsContainer}>
                        <Text style={styles.detailLabel}>Benefits</Text>
                        {selectedNFT.benefits.map((benefit, index) => (
                          <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
                
                {selectedNFT.type === NFT_TYPES.ACHIEVEMENT && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedNFT.description}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rarity</Text>
                      <Text style={[styles.detailValue, { color: getRarityColor(selectedNFT.rarity) }]}>
                        {selectedNFT.rarity}
                      </Text>
                    </View>
                  </>
                )}
                
                {selectedNFT.type === NFT_TYPES.COLLECTIBLE && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedNFT.description}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Edition</Text>
                      <Text style={styles.detailValue}>{selectedNFT.edition}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rarity</Text>
                      <Text style={[styles.detailValue, { color: getRarityColor(selectedNFT.rarity) }]}>
                        {selectedNFT.rarity}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              
              {/* Blockchain Info */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Blockchain</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Network</Text>
                  <Text style={styles.detailValue}>SUI Network</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction</Text>
                  <Text style={styles.detailValueSmall}>{selectedNFT.txHash}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Minted</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedNFT.mintedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareNFT(selectedNFT)}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                
                {selectedNFT.type === NFT_TYPES.TICKET && selectedNFT.status === 'valid' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('TicketDetails', { ticketId: selectedNFT.id });
                    }}
                  >
                    <Ionicons name="qr-code" size={20} color="#0A0F1C" />
                    <Text style={[styles.actionButtonText, { color: '#0A0F1C' }]}>Use Ticket</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0F1C', '#1A1F2E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NFT Gallery</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {nfts.filter(n => n.type === NFT_TYPES.TICKET && n.status === 'valid').length}
            </Text>
            <Text style={styles.statLabel}>Active Tickets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {nfts.filter(n => n.type === NFT_TYPES.SOUVENIR).length}
            </Text>
            <Text style={styles.statLabel}>Souvenirs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {nfts.filter(n => n.type === NFT_TYPES.ACHIEVEMENT || n.type === NFT_TYPES.COLLECTIBLE).length}
            </Text>
            <Text style={styles.statLabel}>Collectibles</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', icon: 'grid' },
          { key: NFT_TYPES.TICKET, label: 'Tickets', icon: 'qr-code' },
          { key: NFT_TYPES.SOUVENIR, label: 'Souvenirs', icon: 'image' },
          { key: NFT_TYPES.MEMBERSHIP, label: 'Membership', icon: 'card' },
          { key: NFT_TYPES.ACHIEVEMENT, label: 'Achievements', icon: 'trophy' },
          { key: NFT_TYPES.COLLECTIBLE, label: 'Collectibles', icon: 'diamond' },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterTab, filter === item.key && styles.filterTabActive]}
            onPress={() => setFilter(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={filter === item.key ? '#FFB800' : '#6B7280'}
            />
            <Text style={[styles.filterTabText, filter === item.key && styles.filterTabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* NFT Grid */}
      <ScrollView
        style={styles.nftGrid}
        contentContainerStyle={styles.nftGridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />
        }
      >
        {filteredNFTs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyStateText}>No NFTs found</Text>
            <Text style={styles.emptyStateSubtext}>
              Book a ticket or earn achievements to get NFTs
            </Text>
          </View>
        ) : (
          <View style={styles.nftGridInner}>
            {filteredNFTs.map(renderNFTCard)}
          </View>
        )}
      </ScrollView>
      
      {/* NFT Detail Modal */}
      {renderNFTDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  filterContainer: {
    maxHeight: 50,
    backgroundColor: '#0A0F1C',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  filterTabText: {
    color: '#6B7280',
    fontSize: 14,
  },
  filterTabTextActive: {
    color: '#FFB800',
    fontWeight: '600',
  },
  nftGrid: {
    flex: 1,
  },
  nftGridContent: {
    padding: 16,
  },
  nftGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nftCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nftCardGradient: {
    padding: 16,
    minHeight: 200,
  },
  nftCardWithImage: {
    minHeight: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nftCardImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
  },
  nftCardImageOverlay: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'space-between',
    padding: 12,
  },
  nftCardImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nftCardImageContent: {
    marginTop: 'auto',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  typeBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typeBadgeTextLarge: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketTypeText: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  miniQRContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nftCardContent: {
    flex: 1,
  },
  nftName: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  nftTheme: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  nftDetail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginBottom: 2,
  },
  nftDetailHighlight: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1F2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderWithImage: {
    height: 280,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeaderImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  modalHeaderImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalHeaderContent: {
    marginTop: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  modalTheme: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modalCulture: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  modalBody: {
    padding: 24,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  qrTitle: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  qrLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  viewSouvenirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB800',
    gap: 8,
  },
  viewSouvenirText: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '600',
  },
  souvenirDescription: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  souvenirDescriptionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  traitsContainer: {
    marginBottom: 24,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
    minWidth: '45%',
    flex: 1,
  },
  traitType: {
    color: '#9CA3AF',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  traitValue: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  benefitsContainer: {
    paddingVertical: 12,
  },
  benefitItem: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FFB800',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NFTGalleryScreen;
