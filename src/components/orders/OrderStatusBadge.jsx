import { Badge } from '@/components/ui/badge';

export function OrderStatusBadge({ status }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function OrderPriorityBadge({ priority }) {
  const priorityConfig = {
    low: {
      label: 'Low',
      className: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
    },
    medium: {
      label: 'Medium',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    high: {
      label: 'High',
      className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    },
    urgent: {
      label: 'Urgent',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
