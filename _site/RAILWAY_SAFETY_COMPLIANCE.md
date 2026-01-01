# 🛡️ Railway Safety Compliance Documentation

## Overview

This document outlines how the Africa Railways OCC system meets international railway digital safety standards and provides complete accountability for TAZARA/ZRL corridor operations.

## Compliance Standards

### SADC Railway Protocols
- ✅ 7-year audit trail retention
- ✅ Complete access control documentation
- ✅ Immutable change records
- ✅ Administrator accountability

### International Railway Safety Standards
- ✅ ISO 27001 (Information Security Management)
- ✅ IEC 62443 (Industrial Automation Security)
- ✅ Railway-specific digital safety requirements

## Audit Trail System

### What is Logged

Every administrative action is automatically logged with:

1. **Who** - Administrator details
   - Admin ID (UUID)
   - Admin email
   - Admin name
   - IP address
   - User agent

2. **What** - Action details
   - Action type (approval, suspension, role change, etc.)
   - Action description
   - Severity level (low, medium, high, critical)

3. **When** - Timestamp
   - Performed at (ISO 8601 format)
   - Timezone-aware (UTC)
   - Millisecond precision

4. **Where** - Context
   - Target user affected
   - Station assignments
   - System location

5. **Why** - Justification
   - Reason field (required for critical actions)
   - Notes field (optional)

6. **Snapshot** - State capture
   - Old value (before change)
   - New value (after change)
   - Complete profile snapshot (JSONB)

### Logged Actions

#### Staff Management
- `staff_approved` - Staff account approved
- `staff_suspended` - Staff account suspended
- `staff_revoked` - Staff access revoked
- `staff_role_changed` - Staff role modified

#### Station Management
- `station_assigned` - Station assigned to staff
- `station_removed` - Station removed from staff

#### Profile Management
- `profile_updated` - Profile information changed
- `profile_deleted` - Profile removed

#### System Configuration
- `settings_changed` - System settings modified
- `system_config_changed` - Configuration updated

### Severity Levels

#### Critical (Red)
- Staff suspensions
- Access revocations
- Security-related changes
- **Requires**: Reason field mandatory

#### High (Orange)
- Staff approvals
- Role changes
- Permission modifications
- **Requires**: Audit review

#### Medium (Yellow)
- Station assignments
- Profile updates
- Configuration changes
- **Requires**: Standard logging

#### Low (Green)
- Informational actions
- Non-security changes
- **Requires**: Basic logging

## Railway Safety Benefits

### 1. Accountability

**Scenario**: Train manifest tampering detected

**Investigation Process**:
```sql
-- Find who approved the staff member involved
SELECT 
  aal.admin_email,
  aal.admin_name,
  aal.performed_at,
  aal.reason,
  aal.snapshot
FROM admin_audit_log aal
WHERE aal.target_user_email = 'suspect@example.com'
AND aal.action_type = 'staff_approved'
ORDER BY aal.performed_at DESC;
```

**Result**: Complete trail showing:
- Which administrator granted access
- When access was granted
- What permissions were given
- Why access was granted (if reason provided)

### 2. Compliance

**Requirement**: SADC Railway protocols mandate 7-year history

**Implementation**:
```sql
-- Audit logs are immutable (no updates/deletes)
CREATE POLICY "No updates to audit logs"
  ON admin_audit_log FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from audit logs"
  ON admin_audit_log FOR DELETE
  USING (false);

-- Retention policy (7 years)
-- Logs older than 7 years can be archived but not deleted
```

**Compliance Features**:
- ✅ Immutable records
- ✅ Timestamp precision
- ✅ Complete change history
- ✅ Export capabilities (CSV)
- ✅ Searchable archive

### 3. Forensics

**Scenario**: Identity swapping suspected

**Protection**: Snapshot column captures exact state

```sql
-- Example snapshot at time of approval
{
  "id": "uuid",
  "email": "staff@example.com",
  "phone_number": "+260971234567",
  "full_name": "John Doe",
  "role": "operator",
  "status": "pending",
  "created_at": "2024-12-30T10:00:00Z"
}
```

**Benefits**:
- Phone number at time of approval preserved
- Role at time of approval preserved
- Cannot be altered retroactively
- Prevents "identity swapping" attacks

**Investigation Query**:
```sql
-- Compare current profile with historical snapshot
SELECT 
  p.email,
  p.phone_number as current_phone,
  aal.snapshot->>'phone_number' as approval_phone,
  p.role as current_role,
  aal.snapshot->>'role' as approval_role,
  aal.performed_at as approved_at
FROM profiles p
JOIN admin_audit_log aal ON aal.target_user_id = p.id
WHERE aal.action_type = 'staff_approved'
AND (
  p.phone_number != aal.snapshot->>'phone_number'
  OR p.role != aal.snapshot->>'role'
);
```

## Administrator View

### Audit Trail Dashboard

Access via OCC Portal: `/occ/audit-log`

**Features**:
- Real-time audit log viewer
- Filter by action type, severity, date range
- Search by admin or target user
- Export to CSV for compliance reporting
- Admin activity summary
- Staff approval history

**Example Queries**:

#### Recent Admin Actions
```sql
SELECT * FROM recent_admin_actions LIMIT 50;
```

#### Admin Activity Summary
```sql
SELECT * FROM admin_activity_summary;
```

#### Staff Approval History
```sql
SELECT * FROM staff_approval_history
WHERE staff_email = 'staff@example.com';
```

#### User Audit History
```sql
SELECT * FROM get_user_audit_history('user-uuid');
```

## Compliance Reporting

### Monthly Compliance Report

```sql
-- Generate monthly compliance report
SELECT 
  DATE_TRUNC('month', performed_at) as month,
  action_type,
  severity,
  COUNT(*) as action_count,
  COUNT(DISTINCT admin_email) as unique_admins,
  COUNT(DISTINCT target_user_email) as affected_users
FROM admin_audit_log
WHERE performed_at >= NOW() - INTERVAL '12 months'
GROUP BY 
  DATE_TRUNC('month', performed_at),
  action_type,
  severity
ORDER BY month DESC, action_count DESC;
```

### Critical Actions Report

```sql
-- All critical actions in last 30 days
SELECT 
  admin_email,
  admin_name,
  action_description,
  target_user_email,
  reason,
  performed_at
FROM admin_audit_log
WHERE severity = 'critical'
AND performed_at >= NOW() - INTERVAL '30 days'
ORDER BY performed_at DESC;
```

### Suspicious Activity Detection

```sql
-- Detect unusual patterns
SELECT 
  admin_email,
  COUNT(*) as actions_today,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_today,
  ARRAY_AGG(DISTINCT action_type) as action_types
FROM admin_audit_log
WHERE performed_at >= CURRENT_DATE
GROUP BY admin_email
HAVING COUNT(*) > 50  -- Threshold for unusual activity
OR COUNT(*) FILTER (WHERE severity = 'critical') > 5;
```

## Data Retention Policy

### Active Records (0-2 years)
- **Storage**: Primary database
- **Access**: Real-time via dashboard
- **Performance**: Indexed for fast queries

### Archive Records (2-7 years)
- **Storage**: Archive database or cold storage
- **Access**: On-demand via export
- **Compliance**: SADC requirement

### Disposal (7+ years)
- **Process**: Secure deletion after 7 years
- **Approval**: Requires compliance officer sign-off
- **Documentation**: Disposal certificate generated

## Security Measures

### Access Control

Only administrators can view audit logs:

```sql
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );
```

### Immutability

Audit logs cannot be modified or deleted:

```sql
-- No updates allowed
CREATE POLICY "No updates to audit logs"
  ON admin_audit_log FOR UPDATE
  USING (false);

-- No deletes allowed
CREATE POLICY "No deletes from audit logs"
  ON admin_audit_log FOR DELETE
  USING (false);
```

### Encryption

- **At Rest**: Database encryption enabled
- **In Transit**: TLS 1.3 for all connections
- **Backups**: Encrypted backups with key rotation

## Integration with Railway Operations

### Train Manifest Security

When a train manifest is accessed or modified:

```typescript
// Log manifest access
await supabase.from('admin_audit_log').insert({
  admin_email: currentUser.email,
  action_type: 'manifest_accessed',
  action_description: `Accessed manifest for Train ${trainId}`,
  severity: 'medium',
  old_value: null,
  new_value: { train_id: trainId, manifest_id: manifestId }
});
```

### Station Access Control

When staff accesses station controls:

```typescript
// Verify station access and log
const hasAccess = await checkStationAccess(userId, stationCode);
if (hasAccess) {
  await logStationAccess(userId, stationCode, action);
} else {
  await logUnauthorizedAttempt(userId, stationCode, action);
}
```

### Emergency Override

For emergency situations:

```typescript
// Emergency override with mandatory reason
await supabase.from('admin_audit_log').insert({
  admin_email: currentUser.email,
  action_type: 'emergency_override',
  action_description: `Emergency override: ${description}`,
  severity: 'critical',
  reason: emergencyReason,  // REQUIRED
  notes: additionalContext
});
```

## Compliance Checklist

### Daily
- [ ] Review critical actions
- [ ] Check for suspicious patterns
- [ ] Verify backup completion

### Weekly
- [ ] Generate activity report
- [ ] Review admin activity summary
- [ ] Check system health

### Monthly
- [ ] Generate compliance report
- [ ] Review retention policy
- [ ] Audit administrator access

### Quarterly
- [ ] Security audit
- [ ] Policy review
- [ ] Training updates

### Annually
- [ ] Full compliance audit
- [ ] Data retention review
- [ ] Policy updates

## Incident Response

### Security Incident Detected

1. **Immediate Actions**:
   ```sql
   -- Identify affected users
   SELECT DISTINCT target_user_email
   FROM admin_audit_log
   WHERE admin_email = 'suspect@example.com'
   AND performed_at >= 'incident-start-time';
   ```

2. **Suspend Access**:
   ```sql
   -- Suspend all affected accounts
   UPDATE profiles
   SET status = 'suspended'
   WHERE email IN (SELECT target_user_email FROM ...);
   ```

3. **Generate Report**:
   ```sql
   -- Export complete audit trail
   COPY (
     SELECT * FROM admin_audit_log
     WHERE performed_at BETWEEN 'start' AND 'end'
   ) TO '/tmp/incident-report.csv' CSV HEADER;
   ```

4. **Notify Authorities**:
   - Railway safety board
   - SADC compliance office
   - Local authorities (if required)

## Training Requirements

### Administrator Training

All administrators must complete:

1. **Security Awareness** (Annual)
   - Audit trail importance
   - Compliance requirements
   - Incident reporting

2. **System Usage** (Quarterly)
   - Approval workflows
   - Audit log review
   - Report generation

3. **Emergency Procedures** (Bi-annual)
   - Emergency override process
   - Incident response
   - Communication protocols

## Conclusion

The Africa Railways OCC audit log system provides:

- ✅ Complete accountability for all administrative actions
- ✅ SADC Railway protocol compliance
- ✅ 7-year audit trail retention
- ✅ Forensic investigation capabilities
- ✅ Identity swapping prevention
- ✅ Real-time monitoring and alerting
- ✅ Compliance reporting automation

This ensures the highest level of safety and security for TAZARA/ZRL railway operations.

---

**Document Version**: 1.0
**Last Updated**: 2024-12-30
**Next Review**: 2025-03-30
**Owner**: OCC Security Team
**Compliance**: SADC Railway Protocols, ISO 27001, IEC 62443
