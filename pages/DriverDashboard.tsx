import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Load } from '../types';
import { loadService } from '../services/loadService';
import { useAuth } from '../App';
import { MapPin, Calendar, ArrowRight, Package, CheckCircle, Bell, AlertTriangle, ShieldCheck, Navigation, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedLoads, setAssignedLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        loadService.getDriverLoads(user.id).then(data => {
            setAssignedLoads(data);
            setLoading(false);
        });
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading your trips...</div>;

  const activeLoad = assignedLoads.find(l => ['In Transit', 'Reached'].includes(l.status));

  return (
   <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-xs text-gray-500 mt-0.5">Ready for the road?</p>
        </div>
        <div className="text-right">
             <span className="text-2xl font-bold text-brand-600">{assignedLoads.filter(l => l.status === 'Assigned').length}</span>
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">New Trips</p>
        </div>
      </div>

      {activeLoad && (
        <Card className="p-0 border-none shadow-lg overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Navigation className="h-24 w-24" /></div>
            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xs font-bold text-brand-200 uppercase tracking-wide mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Current Active Trip
                        </h3>
                        <h2 className="text-xl font-bold text-white leading-tight">{activeLoad.title}</h2>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">
                        {activeLoad.status}
                    </span>
                </div>
                
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white/10 rounded-full"><MapPin className="h-4 w-4 text-green-300"/></div>
                        <span className="text-sm font-medium text-white/90">{activeLoad.pickupCity}</span>
                    </div>
                    <div className="ml-3 border-l border-dashed border-white/30 h-4"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white/10 rounded-full"><MapPin className="h-4 w-4 text-red-300"/></div>
                        <span className="text-sm font-medium text-white/90">{activeLoad.dropCity}</span>
                    </div>
                </div>

                <Link to={`/trip/${activeLoad.id}`}>
                    <Button className="w-full bg-white text-brand-700 hover:bg-brand-50 border-none font-bold py-3 shadow-md">
                        Continue Navigation <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </Card>
      )}

      {/* Driver Alerts Section */}
      {!activeLoad && (
          <div className="grid grid-cols-2 gap-3">
             <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-yellow-400 gap-2 bg-yellow-50/50">
                 <AlertTriangle className="h-6 w-6 text-yellow-500" />
                 <div>
                     <p className="text-xs font-bold text-gray-700">Maintenance</p>
                     <p className="text-[10px] text-gray-500">Service due in 500km</p>
                 </div>
             </Card>
             
             <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-green-400 gap-2 bg-green-50/50">
                 <ShieldCheck className="h-6 w-6 text-green-500" />
                 <div>
                     <p className="text-xs font-bold text-gray-700">License</p>
                     <p className="text-[10px] text-gray-500">Valid until Dec 2025</p>
                 </div>
             </Card>
          </div>
      )}

      <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" /> Assigned Trips
          </h3>
          <div className="space-y-4">
            {assignedLoads.filter(l => l.status === 'Assigned').map(load => (
                <Card key={load.id} className="p-5 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-400">#{load.id.slice(0,8)}</span>
                        <Badge status="New" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{load.title}</h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                         <div className="text-center">
                             <p className="text-xs text-gray-400 uppercase">From</p>
                             <p className="font-semibold">{load.pickupCity}</p>
                         </div>
                         <ArrowRight className="h-4 w-4 text-gray-300" />
                         <div className="text-center">
                             <p className="text-xs text-gray-400 uppercase">To</p>
                             <p className="font-semibold">{load.dropCity}</p>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        <Link to={`/trip/${load.id}`} className="flex-1">
                            <Button className="w-full py-2.5 font-semibold">Start Trip</Button>
                        </Link>
                    </div>
                </Card>
            ))}
            {assignedLoads.filter(l => l.status === 'Assigned').length === 0 && (
                <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm">You're all caught up!</p>
                    <p className="text-xs mt-1">No new trips assigned.</p>
                </div>
            )}
          </div>
      </div>

      <div>
          <h3 className="font-bold text-gray-900 mb-3 mt-6">Completed History</h3>
          <Card className="divide-y divide-gray-100 overflow-hidden bg-white">
            {assignedLoads.filter(l => l.status === 'Completed').map((load) => (
                 <div key={load.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{load.title}</h4>
                            <p className="text-xs text-gray-500">{load.dropCity} • {load.dropDate}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-gray-900 text-sm">₹{load.price.toLocaleString()}</span>
                        <button 
                            onClick={() => loadService.downloadInvoice(load)}
                            className="text-[10px] text-brand-600 hover:underline flex items-center justify-end gap-1"
                        >
                            <FileText className="h-3 w-3" /> View Receipt
                        </button>
                    </div>
                </div>
            ))}
             {assignedLoads.filter(l => l.status === 'Completed').length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">
                     No completed trips yet.
                </div>
            )}
          </Card>
      </div>
   </div>
  );
};