import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function Alerts() {
  const { shipments } = useAppContext();
  
  const activeAlerts = shipments.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium');

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {activeAlerts.map(shipment => (
        <Link 
          key={shipment.id}
          to={`/shipment/${shipment.id}`}
          className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
            shipment.riskLevel === 'high' 
              ? 'bg-red-50/50 border-red-100 hover:border-red-300' 
              : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            shipment.riskLevel === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-bold mb-1 ${shipment.riskLevel === 'high' ? 'text-red-900' : 'text-amber-900'}`}>
              {shipment.name}
            </h4>
            <p className={`text-xs ${shipment.riskLevel === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
              {shipment.alert || 'Attention required for this route.'}
            </p>
          </div>
          <ChevronRight size={16} className={shipment.riskLevel === 'high' ? 'text-red-300' : 'text-amber-300'} />
        </Link>
      ))}
    </div>
  );
}
