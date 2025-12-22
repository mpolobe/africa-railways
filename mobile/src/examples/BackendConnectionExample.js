/**
 * Backend Connection Examples
 * Shows how to use the automatic backend switching
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import {
    sendReport,
    getReports,
    checkHealth,
    connectWebSocket,
    getCurrentBackend,
    IS_RAILWAYS,
    APP_NAME,
    API_URL
} from '../logic/reporting_tool';

export default function BackendConnectionExample() {
    const [status, setStatus] = useState('Not connected');
    const [reports, setReports] = useState([]);
    const [health, setHealth] = useState(null);
    const [wsMessages, setWsMessages] = useState([]);
    const backend = getCurrentBackend();

    // Check health on mount
    useEffect(() => {
        handleCheckHealth();
    }, []);

    // Example 1: Send a report
    const handleSendReport = async () => {
        try {
            setStatus('Sending report...');
            
            const report = {
                type: IS_RAILWAYS ? 'track_inspection' : 'wallet_transaction',
                location: IS_RAILWAYS ? 'Lusaka Central' : 'Digital Wallet',
                status: 'active',
                data: {
                    timestamp: new Date().toISOString(),
                    value: Math.random() * 100
                }
            };

            const result = await sendReport(report);
            setStatus(`✅ Report sent: ${JSON.stringify(result)}`);
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    // Example 2: Get reports
    const handleGetReports = async () => {
        try {
            setStatus('Fetching reports...');
            const data = await getReports();
            setReports(data);
            setStatus(`✅ Fetched ${data.length} reports`);
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    // Example 3: Check health
    const handleCheckHealth = async () => {
        try {
            setStatus('Checking health...');
            const data = await checkHealth();
            setHealth(data);
            setStatus(`✅ Backend is ${data.status}`);
        } catch (error) {
            setStatus(`❌ Health check failed: ${error.message}`);
        }
    };

    // Example 4: Connect WebSocket
    const handleConnectWebSocket = () => {
        try {
            setStatus('Connecting to WebSocket...');
            
            const ws = connectWebSocket((message) => {
                setWsMessages(prev => [...prev, message]);
                setStatus(`📨 Received: ${message.type}`);
            });

            // Clean up on unmount
            return () => ws.close();
        } catch (error) {
            setStatus(`❌ WebSocket error: ${error.message}`);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {IS_RAILWAYS ? '🚂' : '💰'} {APP_NAME} Backend Connection
                </Text>
                <Text style={styles.subtitle}>
                    Connected to: {backend.apiUrl}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Backend Info</Text>
                <Text style={styles.info}>App: {backend.appName}</Text>
                <Text style={styles.info}>Slug: {backend.slug}</Text>
                <Text style={styles.info}>API: {backend.apiUrl}</Text>
                <Text style={styles.info}>WebSocket: {backend.wsUrl}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <Text style={styles.status}>{status}</Text>
            </View>

            {health && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Health</Text>
                    <Text style={styles.info}>Status: {health.status}</Text>
                    <Text style={styles.info}>
                        Events: {health.event_count || 0}
                    </Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>
                
                <Button
                    title="Send Report"
                    onPress={handleSendReport}
                    color={IS_RAILWAYS ? '#0066CC' : '#FFB800'}
                />
                
                <View style={styles.spacer} />
                
                <Button
                    title="Get Reports"
                    onPress={handleGetReports}
                    color={IS_RAILWAYS ? '#0066CC' : '#FFB800'}
                />
                
                <View style={styles.spacer} />
                
                <Button
                    title="Check Health"
                    onPress={handleCheckHealth}
                    color={IS_RAILWAYS ? '#0066CC' : '#FFB800'}
                />
                
                <View style={styles.spacer} />
                
                <Button
                    title="Connect WebSocket"
                    onPress={handleConnectWebSocket}
                    color={IS_RAILWAYS ? '#0066CC' : '#FFB800'}
                />
            </View>

            {reports.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Reports ({reports.length})
                    </Text>
                    {reports.map((report, index) => (
                        <View key={index} style={styles.reportItem}>
                            <Text style={styles.reportText}>
                                {report.node_location || report.location}
                            </Text>
                            <Text style={styles.reportText}>
                                Status: {report.status}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {wsMessages.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        WebSocket Messages ({wsMessages.length})
                    </Text>
                    {wsMessages.slice(-5).map((msg, index) => (
                        <Text key={index} style={styles.wsMessage}>
                            {JSON.stringify(msg)}
                        </Text>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20
    },
    header: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'monospace'
    },
    section: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    info: {
        fontSize: 14,
        marginBottom: 5,
        color: '#666',
        fontFamily: 'monospace'
    },
    status: {
        fontSize: 14,
        color: '#333',
        padding: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 5,
        fontFamily: 'monospace'
    },
    spacer: {
        height: 10
    },
    reportItem: {
        padding: 10,
        backgroundColor: '#F9F9F9',
        borderRadius: 5,
        marginBottom: 5
    },
    reportText: {
        fontSize: 12,
        color: '#666'
    },
    wsMessage: {
        fontSize: 11,
        color: '#666',
        fontFamily: 'monospace',
        padding: 5,
        backgroundColor: '#F9F9F9',
        borderRadius: 3,
        marginBottom: 3
    }
});
