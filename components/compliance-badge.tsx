import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ComplianceBadgeProps {
  cbseStatus?: string;
  fireNocStatus?: string;
  lastAuditDate?: Date;
}

export default function ComplianceBadge({
  cbseStatus,
  fireNocStatus,
  lastAuditDate,
}: ComplianceBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return CheckCircle;
      case 'amber':
        return AlertTriangle;
      case 'red':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const fireNocColor = getStatusColor(fireNocStatus || '');
  const FireNocIcon = getStatusIcon(fireNocStatus || '');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">CBSE Status</p>
          <p className="text-sm text-gray-600">{cbseStatus || 'Not Available'}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
          cbseStatus === 'Permanent' 
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-amber-100 text-amber-800 border-amber-200'
        }`}>
          {cbseStatus || 'N/A'}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">Fire NOC Status</p>
          <p className="text-sm text-gray-600">Fire safety compliance</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${fireNocColor}`}>
          <FireNocIcon className="h-4 w-4" />
          <span className="capitalize">{fireNocStatus || 'N/A'}</span>
        </div>
      </div>

      {lastAuditDate && (
        <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">Last Audit Date</p>
            <p className="text-sm text-gray-600">Most recent compliance audit</p>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(lastAuditDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
