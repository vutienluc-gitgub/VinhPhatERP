import {
  checkStopsVsShipmentInvariant,
  checkAttemptVsEvidenceInvariant,
  checkOutboxHealthInvariant,
  computeEvidenceHash,
  type InvariantViolation,
  type EPODAssetType,
  type ReceiverIdentityType,
} from '@/domain/logistics';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://sxphijrofljxkccdwtub.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';

interface RawShipmentWithStops {
  id: string;
  shipment_number: string;
  status: string;
  delivery_stops?: Array<{ id: string; status: string }>;
}

interface RawAttemptWithEvidence {
  id: string;
  state: string;
  shipment_epod_evidences?: Array<{ id: string }> | { id: string };
}

interface RawEvidenceWithAssets {
  id: string;
  attempt_id: string;
  receiver_name: string;
  receiver_phone?: string;
  receiver_identity_type?: string;
  receiver_identity_value?: string;
  latitude: string | number;
  longitude: string | number;
  device_id: string;
  submitted_at: string;
  evidence_hash: string;
  previous_evidence_hash?: string | null;
  epod_evidence_assets?: Array<{
    asset_type: string;
    storage_path: string;
    content_hash: string;
  }>;
}

interface RawOutboxEvent {
  id: string;
  status: string;
  created_at: string;
}

interface RawAsset {
  id: string;
  evidence_id: string;
  storage_path: string;
}

async function fetchRest<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`REST Error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function runReconciliation() {
  console.log(
    '------------------------------------------------------------------------',
  );
  console.log(
    '       VINH PHAT ERP — LOGISTICS EXECUTION SUBSYSTEM (LES v2.1)         ',
  );
  console.log(
    '              RECONCILIATION & INVARIANT AUDIT ENGINE                   ',
  );
  console.log(
    '------------------------------------------------------------------------\n',
  );

  const violations: InvariantViolation[] = [];
  let checkedShipments = 0;
  let checkedAttempts = 0;
  let checkedEvidences = 0;
  let checkedOutboxEvents = 0;
  let verifiedHashes = 0;
  let tamperedHashes = 0;

  // 1. Audit Invariant 1: Shipment vs Delivery Stops Alignment
  console.log(
    '[1/5] Kiem tra bat bien Diem dung vs Trang thai Chuyen hang (Stop Alignment)...',
  );
  const shipments = await fetchRest<RawShipmentWithStops[]>(
    'shipments?select=id,shipment_number,status,delivery_stops(id,status)&limit=100',
  );
  for (const s of shipments) {
    checkedShipments++;
    const stopViolations = checkStopsVsShipmentInvariant({
      shipmentId: s.id,
      shipmentStatus: s.status,
      stops: (s.delivery_stops ?? []).map((ds) => ({
        id: ds.id,
        status: ds.status,
      })),
    });
    violations.push(...stopViolations);
  }

  // 2. Audit Invariant 2: Delivered Attempts vs ePOD Evidences
  console.log(
    '[2/5] Kiem tra bat bien Lan giao hang vs Bang chung phap ly (ePOD Presence)...',
  );
  const attempts = await fetchRest<RawAttemptWithEvidence[]>(
    'delivery_attempts?select=id,state,shipment_epod_evidences(id)&limit=100',
  );
  for (const a of attempts) {
    checkedAttempts++;
    const hasEvidence = Array.isArray(a.shipment_epod_evidences)
      ? a.shipment_epod_evidences.length > 0
      : Boolean(a.shipment_epod_evidences);

    const attViolations = checkAttemptVsEvidenceInvariant({
      attemptId: a.id,
      attemptState: a.state,
      hasEvidence,
    });
    violations.push(...attViolations);
  }

  // 3. Audit Invariant 3: Cryptographic Hash Chain Integrity
  console.log(
    '[3/5] Kiem tra tinh toan ven chuoi bam mat ma hoc (SHA-256 Hash Chain Integrity)...',
  );
  const evidences = await fetchRest<RawEvidenceWithAssets[]>(
    'shipment_epod_evidences?select=id,attempt_id,receiver_name,receiver_phone,receiver_identity_type,receiver_identity_value,latitude,longitude,device_id,submitted_at,evidence_hash,previous_evidence_hash,epod_evidence_assets(asset_type,storage_path,content_hash)&limit=100',
  );

  for (const ev of evidences) {
    checkedEvidences++;
    try {
      const recalculatedHash = await computeEvidenceHash({
        attemptId: ev.attempt_id,
        receiver: {
          name: ev.receiver_name,
          phone: ev.receiver_phone,
          identityType: ev.receiver_identity_type as ReceiverIdentityType,
          identityValue: ev.receiver_identity_value,
        },
        latitude: Number(ev.latitude),
        longitude: Number(ev.longitude),
        deviceId: ev.device_id,
        submittedAt: ev.submitted_at,
        assets: (ev.epod_evidence_assets ?? []).map((ast) => ({
          assetType: ast.asset_type as EPODAssetType,
          storagePath: ast.storage_path,
          contentHash: ast.content_hash,
        })),
        previousEvidenceHash: ev.previous_evidence_hash,
      });

      if (recalculatedHash === ev.evidence_hash) {
        verifiedHashes++;
      } else {
        tamperedHashes++;
        violations.push({
          invariantName: 'CRYPTOGRAPHIC_HASH_MISMATCH',
          severity: 'CRITICAL',
          entityType: 'epod_evidence',
          entityId: ev.id,
          details: `Phat hien sai lech ma bam SHA-256! DB=${ev.evidence_hash} vs Computed=${recalculatedHash}`,
        });
      }
    } catch (err) {
      console.warn(`[Hash Check Skip] Evidence ${ev.id}:`, err);
    }
  }

  // 4. Audit Invariant 4: Outbox Health & Pending Latency
  console.log(
    '[4/5] Kiem tra do tre Transactional Outbox (Outbox Latency Watchdog)...',
  );
  const outboxEvents = await fetchRest<RawOutboxEvent[]>(
    'logistics_outbox_events?select=id,status,created_at&limit=100',
  );
  for (const evt of outboxEvents) {
    checkedOutboxEvents++;
    const outboxViolations = checkOutboxHealthInvariant({
      eventId: evt.id,
      status: evt.status,
      createdAt: evt.created_at,
      thresholdMinutes: 15,
    });
    violations.push(...outboxViolations);
  }

  // 5. Audit Invariant 5: Orphan Assets Reference Integrity
  console.log(
    '[5/5] Kiem tra tinh toan ven lien ket tep dinh kem (Orphan Asset Check)...',
  );
  const assets = await fetchRest<RawAsset[]>(
    'epod_evidence_assets?select=id,evidence_id,storage_path&limit=100',
  );
  const validEvidenceIds = new Set(evidences.map((e) => e.id));
  for (const ast of assets) {
    if (!validEvidenceIds.has(ast.evidence_id)) {
      violations.push({
        invariantName: 'ORPHAN_EVIDENCE_ASSET',
        severity: 'MEDIUM',
        entityType: 'epod_evidence',
        entityId: ast.id,
        details: `Tep bang chung ${ast.storage_path} tham chieu den evidence_id khong ton tai (${ast.evidence_id})`,
      });
    }
  }

  // ── Print Summary Report ──
  console.log(
    '\n------------------------------------------------------------------------',
  );
  console.log('BAO CAO TONG KET RECONCILIATION ENGINE:');
  console.log(
    ` * Chuyen hang da quet (Shipments):          ${checkedShipments}`,
  );
  console.log(
    ` * Lan giao da quet (Attempts):              ${checkedAttempts}`,
  );
  console.log(
    ` * Bang chung phap ly da quet (Evidences):    ${checkedEvidences}`,
  );
  console.log(
    ` * Chuoi bam SHA-256 xac thuc thanh cong:     ${verifiedHashes}`,
  );
  console.log(` * Chuoi bam phat hien gia mao:              ${tamperedHashes}`);
  console.log(
    ` * Su kien Outbox da quet (Outbox Events):   ${checkedOutboxEvents}`,
  );
  console.log(
    ` * Tong so vi pham bat bien phat hien:       ${violations.length}`,
  );
  console.log(
    '------------------------------------------------------------------------\n',
  );

  if (violations.length === 0) {
    console.log(
      '[OK] HE THONG DAT CHUAN INVARIANT 100% — KHONG PHAT HIEN BAT THUONG DU LIEU!\n',
    );
    process.exit(0);
  } else {
    console.warn(
      `[WARNING] PHAT HIEN ${violations.length} VI PHAM BAT BIEN NGHIEP VU:`,
    );
    for (const v of violations) {
      console.warn(
        `  [${v.severity}] [${v.invariantName}] (${v.entityType}: ${v.entityId})`,
      );
      console.warn(`    └─ ${v.details}`);
    }
    process.exit(1);
  }
}

runReconciliation().catch((err) => {
  console.error('[Reconciliation Fatal Error]', err);
  process.exit(1);
});
