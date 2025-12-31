/**
 * Export Utilities for TAZARA/ZRL Financial Systems
 * 
 * Generates CSV/Excel files formatted for ERP systems:
 * - SAP (used by TAZARA)
 * - Oracle Financials (used by ZRL)
 * - Standard accounting software
 * 
 * Provides institutional trust through auditability
 */

import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Download Payout CSV
 * Generates CSV formatted for SAP/Oracle ERP systems
 */
export const downloadPayoutCSV = async (projections, weekNumber = 1) => {
  const { payoutData, reconciliationData } = projections;
  
  try {
    // Define CSV headers compatible with standard ERP systems
    const headers = [
      "Transaction_Date",
      "Week_Number",
      "Reference_ID",
      "Description",
      "Segment",
      "Subscribers",
      "Bookings",
      "Gross_ZMW",
      "Sentinel_Fee_ZMW",
      "Net_Payout_ZMW",
      "Tax_Withholding_ZMW",
      "Status",
      "Settlement_Date",
      "GL_Account",
    ];
    
    const transactionDate = new Date().toISOString().split('T')[0];
    const settlementDate = payoutData.nextSettlement;
    
    // Generate rows from reconciliation data
    const rows = reconciliationData.map((segment, index) => {
      const refId = `SETTLE-W${weekNumber.toString().padStart(2, '0')}-${(index + 1).toString().padStart(3, '0')}`;
      const glAccount = getGLAccount(segment.source);
      
      return [
        transactionDate,
        weekNumber,
        refId,
        segment.source,
        getSegmentCode(segment.source),
        segment.subscribers,
        segment.bookings.toFixed(0),
        segment.grossSales.toFixed(2),
        segment.commission.toFixed(2),
        segment.railwayNet.toFixed(2),
        (segment.commission * 0.16).toFixed(2), // 16% VAT
        "Pending",
        settlementDate,
        glAccount,
      ];
    });
    
    // Add summary row
    const totalRow = [
      transactionDate,
      weekNumber,
      `SETTLE-W${weekNumber.toString().padStart(2, '0')}-TOTAL`,
      "TOTAL SETTLEMENT",
      "ALL",
      reconciliationData.reduce((sum, s) => sum + s.subscribers, 0),
      reconciliationData.reduce((sum, s) => sum + s.bookings, 0).toFixed(0),
      payoutData.totalSales.toFixed(2),
      payoutData.commissionRevenue.toFixed(2),
      payoutData.railwayPayout.toFixed(2),
      payoutData.taxWithholding.toFixed(2),
      "Pending",
      settlementDate,
      "4000-REVENUE",
    ];
    
    rows.push(totalRow);
    
    // Generate CSV content
    const csvContent = 
      headers.join(",") + "\n" + 
      rows.map(row => row.join(",")).join("\n");
    
    // Save and share file
    const filename = `TAZARA_Settlement_W${weekNumber}_${transactionDate}.csv`;
    await saveAndShareFile(csvContent, filename, 'text/csv');
    
    return {
      success: true,
      filename,
      rows: rows.length,
    };
    
  } catch (error) {
    console.error('CSV export error:', error);
    Alert.alert('Export Failed', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Download Detailed Audit Trail
 * Comprehensive export for audit purposes
 */
export const downloadAuditTrail = async (projections, weekNumber = 1) => {
  const { payoutData, reconciliationData } = projections;
  
  try {
    const transactionDate = new Date().toISOString().split('T')[0];
    
    // Detailed audit headers
    const headers = [
      "Audit_ID",
      "Transaction_Date",
      "Week_Number",
      "Segment",
      "Subscriber_Count",
      "Avg_Bookings_Per_User",
      "Total_Bookings",
      "Avg_Ticket_Price_ZMW",
      "Gross_Sales_ZMW",
      "Commission_Rate",
      "Commission_Amount_ZMW",
      "Railway_Share_Percent",
      "Railway_Net_ZMW",
      "Sentinel_Subscription_ZMW",
      "Sentinel_Total_ZMW",
      "Tax_Rate",
      "Tax_Amount_ZMW",
      "Verification_Hash",
    ];
    
    const rows = reconciliationData.map((segment, index) => {
      const auditId = `AUDIT-${transactionDate}-${index + 1}`;
      const avgBookingsPerUser = segment.subscribers > 0 
        ? (segment.bookings / segment.subscribers).toFixed(2) 
        : 0;
      const avgTicketPrice = segment.bookings > 0 
        ? (segment.grossSales / segment.bookings).toFixed(2) 
        : 0;
      const verificationHash = generateVerificationHash(segment);
      
      return [
        auditId,
        transactionDate,
        weekNumber,
        segment.source,
        segment.subscribers,
        avgBookingsPerUser,
        segment.bookings.toFixed(0),
        avgTicketPrice,
        segment.grossSales.toFixed(2),
        "10%",
        segment.commission.toFixed(2),
        "90%",
        segment.railwayNet.toFixed(2),
        (segment.subscribers * 50).toFixed(2), // Simplified
        (segment.commission + (segment.subscribers * 50)).toFixed(2),
        "16%",
        (segment.commission * 0.16).toFixed(2),
        verificationHash,
      ];
    });
    
    const csvContent = 
      headers.join(",") + "\n" + 
      rows.map(row => row.join(",")).join("\n");
    
    const filename = `TAZARA_Audit_Trail_W${weekNumber}_${transactionDate}.csv`;
    await saveAndShareFile(csvContent, filename, 'text/csv');
    
    return {
      success: true,
      filename,
      rows: rows.length,
    };
    
  } catch (error) {
    console.error('Audit trail export error:', error);
    Alert.alert('Export Failed', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Download SAP-Compatible Format
 * Specific format for SAP ERP import
 */
export const downloadSAPFormat = async (projections, weekNumber = 1) => {
  const { payoutData, reconciliationData } = projections;
  
  try {
    const transactionDate = new Date().toISOString().split('T')[0];
    
    // SAP-specific headers (based on SAP FI-CO module)
    const headers = [
      "Document_Type",
      "Company_Code",
      "Posting_Date",
      "Document_Date",
      "Reference",
      "Currency",
      "GL_Account",
      "Cost_Center",
      "Amount",
      "Debit_Credit",
      "Text",
      "Assignment",
      "Trading_Partner",
    ];
    
    const rows = [];
    const companyCode = "TAZARA";
    const currency = "ZMW";
    
    // Generate SAP journal entries
    reconciliationData.forEach((segment, index) => {
      const reference = `SENT-W${weekNumber}-${index + 1}`;
      const costCenter = getCostCenter(segment.source);
      const glAccount = getGLAccount(segment.source);
      
      // Debit entry (Railway receives)
      rows.push([
        "SA", // Standard Document
        companyCode,
        transactionDate,
        transactionDate,
        reference,
        currency,
        glAccount,
        costCenter,
        segment.railwayNet.toFixed(2),
        "D", // Debit
        `${segment.source} - Railway Revenue`,
        reference,
        "SENTINEL",
      ]);
      
      // Credit entry (Sentinel commission)
      rows.push([
        "SA",
        companyCode,
        transactionDate,
        transactionDate,
        reference,
        currency,
        "2100-PAYABLES",
        costCenter,
        segment.commission.toFixed(2),
        "C", // Credit
        `${segment.source} - Sentinel Commission`,
        reference,
        "SENTINEL",
      ]);
    });
    
    const csvContent = 
      headers.join(",") + "\n" + 
      rows.map(row => row.join(",")).join("\n");
    
    const filename = `SAP_Import_W${weekNumber}_${transactionDate}.csv`;
    await saveAndShareFile(csvContent, filename, 'text/csv');
    
    return {
      success: true,
      filename,
      rows: rows.length,
    };
    
  } catch (error) {
    console.error('SAP export error:', error);
    Alert.alert('Export Failed', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Download Oracle Financials Format
 * Specific format for Oracle ERP import
 */
export const downloadOracleFormat = async (projections, weekNumber = 1) => {
  const { payoutData, reconciliationData } = projections;
  
  try {
    const transactionDate = new Date().toISOString().split('T')[0];
    
    // Oracle-specific headers (based on Oracle GL Interface)
    const headers = [
      "Status",
      "Set_of_Books_ID",
      "Accounting_Date",
      "Currency_Code",
      "Date_Created",
      "Created_By",
      "Actual_Flag",
      "User_JE_Category_Name",
      "User_JE_Source_Name",
      "Segment1", // Account
      "Segment2", // Cost Center
      "Segment3", // Product
      "Entered_DR",
      "Entered_CR",
      "Reference1",
      "Reference2",
      "Reference3",
    ];
    
    const rows = [];
    const setOfBooksId = "1"; // TAZARA Books
    const createdBy = "SENTINEL_SYSTEM";
    
    reconciliationData.forEach((segment, index) => {
      const reference = `SENT-W${weekNumber}-${index + 1}`;
      
      // Debit entry
      rows.push([
        "NEW",
        setOfBooksId,
        transactionDate,
        "ZMW",
        transactionDate,
        createdBy,
        "A", // Actual
        "Revenue",
        "Sentinel",
        getGLAccount(segment.source),
        getCostCenter(segment.source),
        getProductCode(segment.source),
        segment.railwayNet.toFixed(2),
        "",
        reference,
        segment.source,
        `Week ${weekNumber}`,
      ]);
      
      // Credit entry
      rows.push([
        "NEW",
        setOfBooksId,
        transactionDate,
        "ZMW",
        transactionDate,
        createdBy,
        "A",
        "Payables",
        "Sentinel",
        "2100",
        getCostCenter(segment.source),
        getProductCode(segment.source),
        "",
        segment.commission.toFixed(2),
        reference,
        segment.source,
        `Week ${weekNumber}`,
      ]);
    });
    
    const csvContent = 
      headers.join(",") + "\n" + 
      rows.map(row => row.join(",")).join("\n");
    
    const filename = `Oracle_Import_W${weekNumber}_${transactionDate}.csv`;
    await saveAndShareFile(csvContent, filename, 'text/csv');
    
    return {
      success: true,
      filename,
      rows: rows.length,
    };
    
  } catch (error) {
    console.error('Oracle export error:', error);
    Alert.alert('Export Failed', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Save and share file
 */
async function saveAndShareFile(content, filename, mimeType) {
  if (Platform.OS === 'web') {
    // Web download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile save and share
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Export Payout Data',
      });
    } else {
      Alert.alert('Success', `File saved: ${filename}`);
    }
  }
}

/**
 * Get GL Account based on segment
 */
function getGLAccount(segmentName) {
  const accounts = {
    'Small-Scale Traders': '4100-TRADER-REV',
    'International Tourists': '4200-TOURIST-REV',
    'Domestic Leisure': '4300-DOMESTIC-REV',
    'Daily Commuters': '4400-COMMUTER-REV',
  };
  return accounts[segmentName] || '4000-REVENUE';
}

/**
 * Get Cost Center based on segment
 */
function getCostCenter(segmentName) {
  const costCenters = {
    'Small-Scale Traders': 'CC-TRADER',
    'International Tourists': 'CC-TOURIST',
    'Domestic Leisure': 'CC-DOMESTIC',
    'Daily Commuters': 'CC-COMMUTER',
  };
  return costCenters[segmentName] || 'CC-GENERAL';
}

/**
 * Get Product Code based on segment
 */
function getProductCode(segmentName) {
  const products = {
    'Small-Scale Traders': 'PROD-TRADER',
    'International Tourists': 'PROD-TOURIST',
    'Domestic Leisure': 'PROD-DOMESTIC',
    'Daily Commuters': 'PROD-COMMUTER',
  };
  return products[segmentName] || 'PROD-GENERAL';
}

/**
 * Get Segment Code
 */
function getSegmentCode(segmentName) {
  const codes = {
    'Small-Scale Traders': 'TRD',
    'International Tourists': 'TOU',
    'Domestic Leisure': 'DOM',
    'Daily Commuters': 'COM',
  };
  return codes[segmentName] || 'GEN';
}

/**
 * Generate verification hash for audit trail
 */
function generateVerificationHash(segment) {
  const data = `${segment.source}-${segment.subscribers}-${segment.bookings}-${segment.grossSales}`;
  // Simple hash for verification (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export default {
  downloadPayoutCSV,
  downloadAuditTrail,
  downloadSAPFormat,
  downloadOracleFormat,
};
