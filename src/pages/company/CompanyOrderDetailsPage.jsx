import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrders } from '@/lib/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge, OrderPriorityBadge } from '@/components/orders/OrderStatusBadge';
import { getVendorById } from '@/lib/mock-data/vendors';

import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  Building2, 
  FileText,
  Clock,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyOrderDetailsPage() {
  const params = useParams();
  const { getOrder } = useOrders();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orderId = params.id;
    const timeoutId = setTimeout(() => {
      const fetchedOrder = getOrder(orderId);
      setOrder(fetchedOrder || null);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [params.id, getOrder]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Order not found</h2>
        <p className="text-slate-500 mt-2">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link to="/company/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const vendor = getVendorById(order.assignedVendorId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link 
          to="/company/orders" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{order.title}</h1>
            <p className="text-slate-500 font-mono">{order.id}</p>
          </div>
          <div className="flex gap-2">
            <OrderPriorityBadge priority={order.priority} />
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Film Type</p>
                    <p className="font-medium">{order.filmType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Quantity</p>
                    <p className="font-medium">{order.quantity} {order.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Due Date</p>
                    <p className="font-medium">{formatDate(order.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Created</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-2">Specifications</p>
                <p className="text-slate-700">{order.specifications}</p>
              </div>

              {order.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-2">Notes</p>
                  <p className="text-slate-700">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              {order.deliverables.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No deliverables uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.deliverables.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded border">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.fileName}</p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.fileSize)} - {formatDateTime(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assigned Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendor ? (
                <div className="space-y-3">
                  <p className="font-semibold text-lg">{vendor.name}</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Specialization:</span>{' '}
                      {vendor.specialization}
                    </p>
                    <p>
                      <span className="text-slate-500">Contact:</span>{' '}
                      {vendor.contactPerson}
                    </p>
                    <p>
                      <span className="text-slate-500">Email:</span>{' '}
                      {vendor.email}
                    </p>
                    <p>
                      <span className="text-slate-500">Phone:</span>{' '}
                      {vendor.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Vendor information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((entry, index) => (
                  <div key={index} className="relative pl-6">
                    {index !== order.statusHistory.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-slate-200" />
                    )}
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-blue-100 border-2 border-blue-600" />
                    <div>
                      <p className="font-medium capitalize">
                        {entry.status.replace('-', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(entry.changedAt)}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-slate-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
