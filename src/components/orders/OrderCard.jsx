import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge, OrderPriorityBadge } from './OrderStatusBadge';
import { getVendorName } from '@/lib/mock-data/vendors';
import { Calendar, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrderCard({ order, portalType }) {
  const detailsPath = portalType === 'company' 
    ? `/company/orders/${order.id}` 
    : `/vendor/orders/${order.id}`;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{order.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Order ID: {order.id}
            </p>
          </div>
          <div className="flex gap-2">
            <OrderPriorityBadge priority={order.priority} />
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{order.filmType} - {order.quantity} {order.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due: {formatDate(order.dueDate)}</span>
          </div>
        </div>
        
        {portalType === 'company' && (
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned to: </span>
            <span className="font-medium">{getVendorName(order.assignedVendorId)}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link to={detailsPath} className="flex items-center gap-1">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
