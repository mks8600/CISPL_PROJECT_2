import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getOrders,
  getOrdersByVendor,
  getOrderById,
  createOrder as createOrderFn,
  updateOrderStatus as updateOrderStatusFn,
  addDeliverable as addDeliverableFn,
  removeDeliverable as removeDeliverableFn,
  getOrderStats,
  getVendorOrderStats,
} from '@/lib/mock-data/orders';

/**
 * @param {string} [vendorId]
 * @returns {{
 *   orders: import('@/lib/types').WorkOrder[],
 *   isLoading: boolean,
 *   stats: { total: number, pending: number, inProgress: number, completed: number },
 *   createOrder: (data: import('@/lib/types').CreateOrderFormData, createdBy: string) => import('@/lib/types').WorkOrder,
 *   updateOrderStatus: (orderId: string, status: import('@/lib/types').OrderStatus, changedBy: string, notes?: string) => import('@/lib/types').WorkOrder | null,
 *   addDeliverable: (orderId: string, file: { name: string, size: number, type: string }, uploadedBy: string) => import('@/lib/types').Deliverable | null,
 *   removeDeliverable: (orderId: string, deliverableId: string) => boolean,
 *   getOrder: (id: string) => import('@/lib/types').WorkOrder | undefined,
 *   refresh: () => void
 * }}
 */
export function useOrders(vendorId) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Use setTimeout to batch state updates asynchronously
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      const data = vendorId ? getOrdersByVendor(vendorId) : getOrders();
      setOrders(data);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [vendorId, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const createOrder = useCallback((data, createdBy) => {
    const newOrder = createOrderFn(data, createdBy);
    refresh();
    return newOrder;
  }, [refresh]);

  const updateOrderStatus = useCallback((
    orderId,
    status,
    changedBy,
    notes
  ) => {
    const updated = updateOrderStatusFn(orderId, status, changedBy, notes);
    refresh();
    return updated;
  }, [refresh]);

  const addDeliverable = useCallback((
    orderId,
    file,
    uploadedBy
  ) => {
    const deliverable = addDeliverableFn(orderId, file, uploadedBy);
    refresh();
    return deliverable;
  }, [refresh]);

  const removeDeliverable = useCallback((orderId, deliverableId) => {
    const result = removeDeliverableFn(orderId, deliverableId);
    refresh();
    return result;
  }, [refresh]);

  const getOrder = useCallback((id) => {
    return getOrderById(id);
  }, []);

  const stats = useMemo(() => {
    // Re-calculate stats when orders change
    void orders.length; // Dependency on orders
    return vendorId ? getVendorOrderStats(vendorId) : getOrderStats();
  }, [vendorId, orders]);

  return {
    orders,
    isLoading,
    stats,
    createOrder,
    updateOrderStatus,
    addDeliverable,
    removeDeliverable,
    getOrder,
    refresh,
  };
}
