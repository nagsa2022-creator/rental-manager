import { getDatabase } from './database';

// ─── OWNERS ───
export async function getAllOwners() {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM owners ORDER BY name');
}
export async function getOwner(id) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM owners WHERE id = ?', id);
}
export async function saveOwner({ id, name, phone, upi_id, bank_info, notes }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE owners SET name=?, phone=?, upi_id=?, bank_info=?, notes=? WHERE id=?',
      name, phone, upi_id, bank_info, notes, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO owners (name, phone, upi_id, bank_info, notes) VALUES (?,?,?,?,?)',
    name, phone, upi_id, bank_info, notes);
  return r.lastInsertRowId;
}
export async function deleteOwner(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM owners WHERE id = ?', id);
}

// ─── PROPERTIES ───
export async function getPropertiesByOwner(ownerId) {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM properties WHERE owner_id = ? ORDER BY name', ownerId);
}
export async function getAllProperties() {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT p.*, o.name as owner_name FROM properties p 
    LEFT JOIN owners o ON p.owner_id = o.id ORDER BY o.name, p.name`);
}
export async function getProperty(id) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM properties WHERE id = ?', id);
}
export async function saveProperty({ id, owner_id, name, type, address, has_floors, electricity_rate, notes }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE properties SET owner_id=?, name=?, type=?, address=?, has_floors=?, electricity_rate=?, notes=? WHERE id=?',
      owner_id, name, type, address, has_floors ? 1 : 0, electricity_rate || 0, notes, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO properties (owner_id, name, type, address, has_floors, electricity_rate, notes) VALUES (?,?,?,?,?,?,?)',
    owner_id, name, type, address, has_floors ? 1 : 0, electricity_rate || 0, notes);
  return r.lastInsertRowId;
}
export async function deleteProperty(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM properties WHERE id = ?', id);
}

// ─── FLOORS ───
export async function getFloorsByProperty(propertyId) {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM floors WHERE property_id = ? ORDER BY sort_order', propertyId);
}
export async function saveFloor({ id, property_id, name, has_submeter, sort_order }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE floors SET name=?, has_submeter=?, sort_order=? WHERE id=?',
      name, has_submeter ? 1 : 0, sort_order || 0, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO floors (property_id, name, has_submeter, sort_order) VALUES (?,?,?,?)',
    property_id, name, has_submeter ? 1 : 0, sort_order || 0);
  return r.lastInsertRowId;
}
export async function deleteFloor(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM floors WHERE id = ?', id);
}

// ─── ROOMS ───
export async function getRoomsByProperty(propertyId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT r.*, f.name as floor_name FROM rooms r 
    LEFT JOIN floors f ON r.floor_id = f.id WHERE r.property_id = ? ORDER BY f.sort_order, r.sort_order`, propertyId);
}
export async function getRoomsByFloor(floorId) {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM rooms WHERE floor_id = ? ORDER BY sort_order', floorId);
}
export async function saveRoom({ id, property_id, floor_id, name, sort_order }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE rooms SET name=?, floor_id=?, sort_order=? WHERE id=?',
      name, floor_id, sort_order || 0, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO rooms (property_id, floor_id, name, sort_order) VALUES (?,?,?,?)',
    property_id, floor_id, name, sort_order || 0);
  return r.lastInsertRowId;
}
export async function deleteRoom(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM rooms WHERE id = ?', id);
}

// ─── TENANTS ───
export async function getTenantsByProperty(propertyId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT t.*, r.name as room_name, f.name as floor_name 
    FROM tenants t LEFT JOIN rooms r ON t.room_id = r.id 
    LEFT JOIN floors f ON r.floor_id = f.id
    WHERE t.property_id = ? ORDER BY t.name`, propertyId);
}
export async function getActiveTenantsByProperty(propertyId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT t.*, r.name as room_name, f.name as floor_name, f.id as floor_id
    FROM tenants t LEFT JOIN rooms r ON t.room_id = r.id 
    LEFT JOIN floors f ON r.floor_id = f.id
    WHERE t.property_id = ? AND t.is_active = 1 ORDER BY t.name`, propertyId);
}
export async function getAllTenants() {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT t.*, p.name as property_name, o.name as owner_name, r.name as room_name
    FROM tenants t LEFT JOIN properties p ON t.property_id = p.id
    LEFT JOIN owners o ON p.owner_id = o.id
    LEFT JOIN rooms r ON t.room_id = r.id
    ORDER BY t.is_active DESC, t.name`);
}
export async function getTenant(id) {
  const db = await getDatabase();
  return db.getFirstAsync(`SELECT t.*, p.name as property_name, r.name as room_name, o.name as owner_name, o.upi_id as owner_upi
    FROM tenants t LEFT JOIN properties p ON t.property_id = p.id
    LEFT JOIN owners o ON p.owner_id = o.id
    LEFT JOIN rooms r ON t.room_id = r.id WHERE t.id = ?`, id);
}
export async function saveTenant({ id, property_id, room_id, name, phone, monthly_rent, rent_due_day, move_in_date, notes }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE tenants SET property_id=?, room_id=?, name=?, phone=?, monthly_rent=?, rent_due_day=?, move_in_date=?, notes=? WHERE id=?',
      property_id, room_id, name, phone, monthly_rent || 0, rent_due_day || 1, move_in_date, notes, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO tenants (property_id, room_id, name, phone, monthly_rent, rent_due_day, move_in_date, notes) VALUES (?,?,?,?,?,?,?,?)',
    property_id, room_id, name, phone, monthly_rent || 0, rent_due_day || 1, move_in_date, notes);
  return r.lastInsertRowId;
}
export async function deleteTenant(id) {
  const db = await getDatabase();
  await db.runAsync('UPDATE tenants SET is_active = 0 WHERE id = ?', id);
}

// ─── SECURITY DEPOSITS ───
export async function getDeposit(tenantId) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT * FROM security_deposits WHERE tenant_id = ?', tenantId);
}
export async function saveDeposit({ id, tenant_id, amount_collected, date_collected, amount_refunded, date_refunded, deduction_reason, status }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE security_deposits SET amount_collected=?, date_collected=?, amount_refunded=?, date_refunded=?, deduction_reason=?, status=? WHERE id=?',
      amount_collected, date_collected, amount_refunded, date_refunded, deduction_reason, status, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO security_deposits (tenant_id, amount_collected, date_collected, status) VALUES (?,?,?,?)',
    tenant_id, amount_collected, date_collected, status || 'held');
  return r.lastInsertRowId;
}

// ─── MONTHLY BILLS ───
export async function getOrCreateMonthlyBill(propertyId, month, year) {
  const db = await getDatabase();
  let bill = await db.getFirstAsync('SELECT * FROM monthly_bills WHERE property_id=? AND month=? AND year=?', propertyId, month, year);
  if (!bill) {
    // Auto-carry forward previous closing as opening
    const prev = month === 1
      ? await db.getFirstAsync('SELECT * FROM monthly_bills WHERE property_id=? AND month=12 AND year=?', propertyId, year - 1)
      : await db.getFirstAsync('SELECT * FROM monthly_bills WHERE property_id=? AND month=? AND year=?', propertyId, month - 1, year);
    const opening = prev ? prev.main_meter_closing : 0;
    const r = await db.runAsync('INSERT INTO monthly_bills (property_id, month, year, main_meter_opening) VALUES (?,?,?,?)',
      propertyId, month, year, opening);
    bill = await db.getFirstAsync('SELECT * FROM monthly_bills WHERE id=?', r.lastInsertRowId);
    // Create tenant dues for all active tenants
    const tenants = await getActiveTenantsByProperty(propertyId);
    for (const t of tenants) {
      await db.runAsync('INSERT OR IGNORE INTO tenant_dues (monthly_bill_id, tenant_id, rent) VALUES (?,?,?)',
        bill.id, t.id, t.monthly_rent);
    }
    // Create submeter readings for floors with submeters
    const floors = await getFloorsByProperty(propertyId);
    for (const f of floors) {
      if (f.has_submeter) {
        // Carry forward previous submeter closing
        let prevReading = 0;
        if (prev) {
          const pr = await db.getFirstAsync('SELECT closing_reading FROM submeter_readings WHERE monthly_bill_id=? AND floor_id=?', prev.id, f.id);
          if (pr) prevReading = pr.closing_reading;
        }
        await db.runAsync('INSERT OR IGNORE INTO submeter_readings (monthly_bill_id, floor_id, opening_reading) VALUES (?,?,?)',
          bill.id, f.id, prevReading);
      }
    }
  }
  return bill;
}
export async function updateMonthlyBill(id, fields) {
  const db = await getDatabase();
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  await db.runAsync(`UPDATE monthly_bills SET ${sets} WHERE id=?`, ...Object.values(fields), id);
}

// ─── SUBMETER READINGS ───
export async function getSubmeterReadings(monthlyBillId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT sr.*, f.name as floor_name FROM submeter_readings sr
    LEFT JOIN floors f ON sr.floor_id = f.id WHERE sr.monthly_bill_id = ?`, monthlyBillId);
}
export async function updateSubmeterReading(id, opening, closing) {
  const db = await getDatabase();
  const units = Math.max(0, (closing || 0) - (opening || 0));
  await db.runAsync('UPDATE submeter_readings SET opening_reading=?, closing_reading=?, units_used=? WHERE id=?',
    opening, closing, units, id);
}

// ─── TENANT DUES ───
export async function getDuesByBill(monthlyBillId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT td.*, t.name as tenant_name, t.phone, t.rent_due_day, t.room_id,
    r.name as room_name, r.floor_id
    FROM tenant_dues td LEFT JOIN tenants t ON td.tenant_id = t.id
    LEFT JOIN rooms r ON t.room_id = r.id
    WHERE td.monthly_bill_id = ?`, monthlyBillId);
}
export async function updateTenantDue(id, fields) {
  const db = await getDatabase();
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  await db.runAsync(`UPDATE tenant_dues SET ${sets} WHERE id=?`, ...Object.values(fields), id);
}
export async function getTenantLedger(tenantId) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT td.*, mb.month, mb.year FROM tenant_dues td
    LEFT JOIN monthly_bills mb ON td.monthly_bill_id = mb.id
    WHERE td.tenant_id = ? ORDER BY mb.year DESC, mb.month DESC`, tenantId);
}

// ─── OWNER PAYOUTS ───
export async function getOrCreatePayout(monthlyBillId, ownerId) {
  const db = await getDatabase();
  let p = await db.getFirstAsync('SELECT * FROM owner_payouts WHERE monthly_bill_id=? AND owner_id=?', monthlyBillId, ownerId);
  if (!p) {
    await db.runAsync('INSERT INTO owner_payouts (monthly_bill_id, owner_id) VALUES (?,?)', monthlyBillId, ownerId);
    p = await db.getFirstAsync('SELECT * FROM owner_payouts WHERE monthly_bill_id=? AND owner_id=?', monthlyBillId, ownerId);
  }
  return p;
}
export async function updatePayout(id, fields) {
  const db = await getDatabase();
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  await db.runAsync(`UPDATE owner_payouts SET ${sets} WHERE id=?`, ...Object.values(fields), id);
}
export async function getAnnualSummary(ownerId, propertyId, year) {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT mb.month, mb.year, op.total_rent, op.electricity_paid, op.water_paid,
    op.other_expenses, op.net_payout, op.is_paid
    FROM owner_payouts op LEFT JOIN monthly_bills mb ON op.monthly_bill_id = mb.id
    WHERE op.owner_id=? AND mb.property_id=? AND mb.year=? ORDER BY mb.month`, ownerId, propertyId, year);
}

// ─── EXPENSES ───
export async function getExpenses(propertyId) {
  const db = await getDatabase();
  if (propertyId) return db.getAllAsync('SELECT * FROM expenses WHERE property_id=? ORDER BY date DESC', propertyId);
  return db.getAllAsync(`SELECT e.*, p.name as property_name FROM expenses e
    LEFT JOIN properties p ON e.property_id = p.id ORDER BY e.date DESC`);
}
export async function saveExpense({ id, property_id, owner_id, date, category, description, amount, paid_by, notes }) {
  const db = await getDatabase();
  if (id) {
    await db.runAsync('UPDATE expenses SET property_id=?, owner_id=?, date=?, category=?, description=?, amount=?, paid_by=?, notes=? WHERE id=?',
      property_id, owner_id, date, category, description, amount, paid_by, notes, id);
    return id;
  }
  const r = await db.runAsync('INSERT INTO expenses (property_id, owner_id, date, category, description, amount, paid_by, notes) VALUES (?,?,?,?,?,?,?,?)',
    property_id, owner_id, date, category, description, amount, paid_by, notes);
  return r.lastInsertRowId;
}
export async function deleteExpense(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

// ─── CATEGORIES ───
export async function getCategories() {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM expense_categories ORDER BY is_custom, name');
}
export async function addCategory(name) {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO expense_categories (name, is_custom) VALUES (?, 1)', name);
}

// ─── DASHBOARD STATS ───
export async function getDashboardStats() {
  const db = await getDatabase();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const totalOwners = await db.getFirstAsync('SELECT COUNT(*) as c FROM owners');
  const totalProperties = await db.getFirstAsync('SELECT COUNT(*) as c FROM properties');
  const totalTenants = await db.getFirstAsync('SELECT COUNT(*) as c FROM tenants WHERE is_active=1');
  const monthDues = await db.getFirstAsync(`SELECT COALESCE(SUM(total_due),0) as due, COALESCE(SUM(amount_received),0) as received
    FROM tenant_dues td LEFT JOIN monthly_bills mb ON td.monthly_bill_id = mb.id
    WHERE mb.month=? AND mb.year=?`, month, year);
  return {
    owners: totalOwners?.c || 0,
    properties: totalProperties?.c || 0,
    tenants: totalTenants?.c || 0,
    monthlyDue: monthDues?.due || 0,
    monthlyReceived: monthDues?.received || 0,
    monthlyPending: (monthDues?.due || 0) - (monthDues?.received || 0),
  };
}

// ─── ELECTRICITY SPLIT CALCULATOR ───
export async function calculateElectricitySplits(monthlyBillId) {
  const db = await getDatabase();
  const bill = await db.getFirstAsync('SELECT * FROM monthly_bills WHERE id=?', monthlyBillId);
  if (!bill) return;
  const property = await getProperty(bill.property_id);
  const floors = await getFloorsByProperty(bill.property_id);
  const subReadings = await getSubmeterReadings(monthlyBillId);
  const dues = await getDuesByBill(monthlyBillId);
  const totalBill = bill.main_meter_bill || 0;
  if (totalBill <= 0 || dues.length === 0) return;

  if (floors.length === 0 || subReadings.length === 0) {
    // Simple case: no floors/submeters — split equally among all active tenants
    const share = totalBill / dues.length;
    for (const d of dues) {
      const totalDue = d.rent + share;
      const balance = totalDue - (d.amount_received || 0);
      await updateTenantDue(d.id, { electricity_share: Math.round(share), total_due: Math.round(totalDue), balance: Math.round(balance) });
    }
    return;
  }

  // Complex case: split by submeter readings, then equally within floor
  const totalSubUnits = subReadings.reduce((s, r) => s + (r.units_used || 0), 0);
  if (totalSubUnits <= 0) return;

  for (const sr of subReadings) {
    const floorShare = totalSubUnits > 0 ? (sr.units_used / totalSubUnits) * totalBill : 0;
    const floorTenants = dues.filter(d => d.floor_id === sr.floor_id);
    if (floorTenants.length === 0) continue;
    const perTenant = floorShare / floorTenants.length;
    for (const d of floorTenants) {
      const totalDue = d.rent + perTenant;
      const balance = totalDue - (d.amount_received || 0);
      await updateTenantDue(d.id, { electricity_share: Math.round(perTenant), total_due: Math.round(totalDue), balance: Math.round(balance) });
    }
  }

  // Handle tenants not on any floor (direct property tenants)
  const floorIds = subReadings.map(sr => sr.floor_id);
  const noFloorTenants = dues.filter(d => !d.floor_id || !floorIds.includes(d.floor_id));
  if (noFloorTenants.length > 0) {
    const share = totalBill / dues.length; // fallback equal split
    for (const d of noFloorTenants) {
      const totalDue = d.rent + share;
      const balance = totalDue - (d.amount_received || 0);
      await updateTenantDue(d.id, { electricity_share: Math.round(share), total_due: Math.round(totalDue), balance: Math.round(balance) });
    }
  }
}
