const ORDERS_STORAGE_KEY = 'crystal_orders';

// Initial seed data
const seedOrders = [
  {
    id: 'order-001',
    title: 'Polyester Film Batch A',
    filmType: 'Polyester',
    quantity: 500,
    unit: 'meters',
    specifications: 'Thickness: 50 microns, Width: 1200mm, Clear finish',
    priority: 'high',
    status: 'in-progress',
    assignedVendorId: 'vendor-1',
    dueDate: '2026-03-15',
    createdAt: '2026-02-20T10:00:00Z',
    createdBy: 'company-1',
    notes: 'Urgent requirement for automotive client',
    deliverables: [],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-20T10:00:00Z', changedBy: 'company-1' },
      { status: 'in-progress', changedAt: '2026-02-22T09:00:00Z', changedBy: 'vendor-user-1', notes: 'Started production' },
    ],
  },
  {
    id: 'order-002',
    title: 'PVC Packaging Film',
    filmType: 'PVC',
    quantity: 1000,
    unit: 'meters',
    specifications: 'Thickness: 30 microns, Width: 800mm, Food grade',
    priority: 'medium',
    status: 'pending',
    assignedVendorId: 'vendor-2',
    dueDate: '2026-03-20',
    createdAt: '2026-02-22T14:00:00Z',
    createdBy: 'company-2',
    notes: 'Standard packaging requirement',
    deliverables: [],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-22T14:00:00Z', changedBy: 'company-2' },
    ],
  },
  {
    id: 'order-003',
    title: 'Multi-layer Barrier Film',
    filmType: 'Multi-layer',
    quantity: 300,
    unit: 'meters',
    specifications: 'Thickness: 100 microns, Width: 1500mm, Oxygen barrier',
    priority: 'urgent',
    status: 'in-progress',
    assignedVendorId: 'vendor-3',
    dueDate: '2026-03-05',
    createdAt: '2026-02-18T08:00:00Z',
    createdBy: 'company-1',
    notes: 'Critical for pharmaceutical client - priority shipment',
    deliverables: [
      {
        id: 'del-001',
        orderId: 'order-003',
        fileName: 'quality_report.pdf',
        fileSize: 245000,
        fileType: 'application/pdf',
        uploadedAt: '2026-02-25T11:00:00Z',
        uploadedBy: 'vendor-user-3',
      },
    ],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-18T08:00:00Z', changedBy: 'company-1' },
      { status: 'in-progress', changedAt: '2026-02-19T10:00:00Z', changedBy: 'vendor-user-3', notes: 'Production started immediately' },
    ],
  },
  {
    id: 'order-004',
    title: 'Industrial Shrink Film',
    filmType: 'Polyethylene',
    quantity: 2000,
    unit: 'meters',
    specifications: 'Thickness: 25 microns, Width: 600mm, High shrink ratio',
    priority: 'low',
    status: 'completed',
    assignedVendorId: 'vendor-1',
    dueDate: '2026-02-25',
    createdAt: '2026-02-10T09:00:00Z',
    createdBy: 'company-2',
    notes: 'Completed ahead of schedule',
    deliverables: [
      {
        id: 'del-002',
        orderId: 'order-004',
        fileName: 'final_inspection.pdf',
        fileSize: 180000,
        fileType: 'application/pdf',
        uploadedAt: '2026-02-24T16:00:00Z',
        uploadedBy: 'vendor-user-1',
      },
      {
        id: 'del-003',
        orderId: 'order-004',
        fileName: 'delivery_receipt.pdf',
        fileSize: 95000,
        fileType: 'application/pdf',
        uploadedAt: '2026-02-25T10:00:00Z',
        uploadedBy: 'vendor-user-1',
      },
    ],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-10T09:00:00Z', changedBy: 'company-2' },
      { status: 'in-progress', changedAt: '2026-02-12T08:00:00Z', changedBy: 'vendor-user-1' },
      { status: 'completed', changedAt: '2026-02-24T17:00:00Z', changedBy: 'vendor-user-1', notes: 'All units passed QC' },
    ],
  },
  {
    id: 'order-005',
    title: 'Protective Laminate Film',
    filmType: 'Laminate',
    quantity: 750,
    unit: 'meters',
    specifications: 'Thickness: 75 microns, Width: 1000mm, UV resistant',
    priority: 'medium',
    status: 'pending',
    assignedVendorId: 'vendor-2',
    dueDate: '2026-03-25',
    createdAt: '2026-02-25T11:00:00Z',
    createdBy: 'company-1',
    notes: 'For outdoor signage application',
    deliverables: [],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-25T11:00:00Z', changedBy: 'company-1' },
    ],
  },
  {
    id: 'order-006',
    title: 'Anti-static Film Roll',
    filmType: 'Polyester',
    quantity: 400,
    unit: 'meters',
    specifications: 'Thickness: 40 microns, Width: 900mm, ESD safe',
    priority: 'high',
    status: 'completed',
    assignedVendorId: 'vendor-3',
    dueDate: '2026-02-20',
    createdAt: '2026-02-05T10:00:00Z',
    createdBy: 'company-1',
    notes: 'Electronics industry requirement',
    deliverables: [
      {
        id: 'del-004',
        orderId: 'order-006',
        fileName: 'esd_certification.pdf',
        fileSize: 320000,
        fileType: 'application/pdf',
        uploadedAt: '2026-02-19T14:00:00Z',
        uploadedBy: 'vendor-user-3',
      },
    ],
    statusHistory: [
      { status: 'pending', changedAt: '2026-02-05T10:00:00Z', changedBy: 'company-1' },
      { status: 'in-progress', changedAt: '2026-02-07T09:00:00Z', changedBy: 'vendor-user-3' },
      { status: 'completed', changedAt: '2026-02-19T15:00:00Z', changedBy: 'vendor-user-3', notes: 'ESD certification attached' },
    ],
  },
];

// Initialize orders in localStorage if not present
function initializeOrders() {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(seedOrders));
  }
}

// Get all orders
export function getOrders() {
  if (typeof window === 'undefined') return seedOrders;
  
  initializeOrders();
  const data = localStorage.getItem(ORDERS_STORAGE_KEY);
  return data ? JSON.parse(data) : seedOrders;
}

// Get orders by vendor ID
export function getOrdersByVendor(vendorId) {
  return getOrders().filter((order) => order.assignedVendorId === vendorId);
}

// Get order by ID
export function getOrderById(id) {
  return getOrders().find((order) => order.id === id);
}

// Create new order
export function createOrder(data, createdBy) {
  const orders = getOrders();
  const newOrder = {
    id: `order-${Date.now()}`,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
    createdBy,
    deliverables: [],
    statusHistory: [
      {
        status: 'pending',
        changedAt: new Date().toISOString(),
        changedBy: createdBy,
      },
    ],
  };
  
  orders.unshift(newOrder);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return newOrder;
}

// Update order status
export function updateOrderStatus(
  orderId,
  status,
  changedBy,
  notes
) {
  const orders = getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  
  if (orderIndex === -1) return null;
  
  orders[orderIndex].status = status;
  orders[orderIndex].statusHistory.push({
    status,
    changedAt: new Date().toISOString(),
    changedBy,
    notes,
  });
  
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return orders[orderIndex];
}

// Add deliverable to order (mock upload)
export function addDeliverable(
  orderId,
  file,
  uploadedBy
) {
  const orders = getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  
  if (orderIndex === -1) return null;
  
  const deliverable = {
    id: `del-${Date.now()}`,
    orderId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
  
  orders[orderIndex].deliverables.push(deliverable);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return deliverable;
}

// Remove deliverable from order
export function removeDeliverable(orderId, deliverableId) {
  const orders = getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  
  if (orderIndex === -1) return false;
  
  orders[orderIndex].deliverables = orders[orderIndex].deliverables.filter(
    (d) => d.id !== deliverableId
  );
  
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return true;
}

// Get order statistics
export function getOrderStats() {
  const orders = getOrders();
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in-progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };
}

// Get vendor-specific statistics
export function getVendorOrderStats(vendorId) {
  const orders = getOrdersByVendor(vendorId);
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in-progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };
}

// Reset orders to seed data (for demo purposes)
export function resetOrders() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(seedOrders));
}
