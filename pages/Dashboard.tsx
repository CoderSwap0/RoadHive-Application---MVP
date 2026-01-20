import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Input, Select } from '../components/UI';
import { Load, User, Role } from '../types';
import { loadService } from '../services/loadService';
import { userService } from '../services/userService';
import { 
  Package, Truck, CheckCircle, Clock, ArrowUpRight, ArrowRight, 
  Users, Shield, Box, Database, MapPin, Calendar, TrendingUp, 
  AlertCircle, DollarSign, Navigation, FileText, X, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../App';
import { DriverDashboard } from './DriverDashboard';
import { ReceiverDashboard } from './ReceiverDashboard';
import { useToast } from '../context/ToastContext';

// --- Shared Components ---

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; subtext?: string }> = ({ label, value, icon: Icon, color, subtext }) => (
  <Card className="p-6 transition-all hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </Card>
);

// --- Role Specific Dashboards ---

const ShipperDashboard: React.FC<{ loads: Load[] }> = ({ loads }) => {
  // Correct Status Matching based on DB strings
  const activeLoads = loads.filter(l => l.status === 'Active' || l.status === 'In Transit' || l.status === 'Assigned').length;
  const completedLoads = loads.filter(l => l.status === 'Completed').length;
  const pendingBids = loads.filter(l => l.status === 'Pending').length; // Assuming 'Pending' status relates to bid process or active with no assignee
  
  // Actually, based on previous logic: 'Active' is open for bids. 'Assigned' is accepted.
  // Let's refine based on typical workflow:
  const awaitingBids = loads.filter(l => l.status === 'Active').length;

  const stats = [
    { label: 'Total Loads', value: loads.length, icon: Package, color: 'bg-blue-50 text-blue-600', subtext: 'All time posted' },
    { label: 'Active Shipments', value: activeLoads, icon: Truck, color: 'bg-green-50 text-green-600', subtext: 'Currently in progress' },
    { label: 'Completed', value: completedLoads, icon: CheckCircle, color: 'bg-purple-50 text-purple-600', subtext: 'Delivered successfully' },
    { label: 'Open for Bids', value: awaitingBids, icon: AlertCircle, color: 'bg-yellow-50 text-yellow-600', subtext: 'Awaiting transporters' },
  ];

  const chartData = [
    { name: 'Mon', loads: 4 }, { name: 'Tue', loads: 3 }, { name: 'Wed', loads: 7 },
    { name: 'Thu', loads: 2 }, { name: 'Fri', loads: 6 }, { name: 'Sat', loads: 4 }, { name: 'Sun', loads: 1 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipper Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your logistics operations</p>
        </div>
        <Link to="/post-load">
          <Button>
            <ArrowUpRight className="h-4 w-4" /> Post New Load
          </Button>
        </Link>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-medium text-gray-900">Weekly Load Activity</h3>
             <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-brand-500 focus:ring-brand-500">
               <option>Last 7 Days</option>
               <option>Last 30 Days</option>
             </select>
          </div>
          {/* Fixed: Added w-full and min-w-0 to ensure parent has width for Recharts */}
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="loads" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-0 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Loads</h3>
            <Link to="/loads" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-y-auto flex-1 p-0 max-h-[300px]">
            {loads.slice(0, 5).map((load, idx) => (
              <div key={load.id} className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 truncate max-w-[150px]">{load.pickupCity} → {load.dropCity}</span>
                  <Badge status={load.status} />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{load.vehicleType}</span>
                  <span className="font-medium text-gray-700">₹{load.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {loads.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No loads posted yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const TransporterDashboard: React.FC<{ loads: Load[]; onRefresh: () => void }> = ({ loads, onRefresh }) => {
  const { showToast } = useToast();
  
  // Correct KPIs
  // Assigned to me (Transporter)
  const myLoads = loads.filter(l => l.transporterCompanyId || l.status === 'Assigned' || l.status === 'In Transit'); 
  
  const assignedLoadsCount = myLoads.filter(l => l.status === 'Assigned').length;
  const activeTrips = myLoads.filter(l => l.status === 'In Transit').length;
  
  // Calculate Revenue from completed trips assigned to this transporter
  const revenue = myLoads
    .filter(l => l.status === 'Completed')
    .reduce((sum, load) => sum + (load.price || 0), 0);

  // Mock fleet count (or fetch from API if available)
  const trucksAvailable = 12;

  // Bid Modal State
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Drivers when opening modal
  const fetchDrivers = async () => {
      const drivers = await userService.getDrivers();
      setAvailableDrivers(drivers.map(d => ({ value: d.id, label: d.name })));
  };

  const handleOpenBid = (load: Load) => {
      setSelectedLoad(load);
      setBidAmount(load.price.toString()); // Pre-fill with asking price
      setVehicleDetails('');
      setSelectedDriver('');
      setIsBidModalOpen(true);
      fetchDrivers();
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLoad) return;
      setSubmitting(true);
      try {
          await loadService.placeBid(
              selectedLoad.id, 
              Number(bidAmount), 
              vehicleDetails, 
              selectedDriver
          );
          setIsBidModalOpen(false);
          showToast("Bid placed and Load Assigned successfully!", "success");
          onRefresh(); // Refresh the list to show the new status
      } catch (e) {
          showToast("Failed to place bid", "error");
          console.error(e);
      } finally {
          setSubmitting(false);
      }
  };

  const handleDownloadInsurance = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    loadService.downloadInsurance(load);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transporter Dashboard</h1>
          <p className="text-gray-500 mt-1">Find loads and manage your fleet</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
            <Truck className="h-4 w-4 mr-2" /> My Fleet
            </Button>
            <Link to="/loads">
                <Button>
                <MapPin className="h-4 w-4 mr-2" /> Find Loads
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Loads" value={assignedLoadsCount} icon={Clock} color="bg-orange-50 text-orange-600" />
        <StatCard label="Trucks Available" value={trucksAvailable} icon={Truck} color="bg-green-50 text-green-600" />
        <StatCard label="Active Trips" value={activeTrips} icon={Navigation} color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={DollarSign} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Load Board (Recommended for You)</h3>
            <div className="space-y-4">
                {loads.filter(l => l.status === 'Active').slice(0, 10).map(load => (
                <Card key={load.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-300 transition-colors cursor-pointer group">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge status={load.status} />
                            <span className="text-xs text-gray-500 font-mono">{load.id}</span>
                            {load.insuranceRequired && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Insured
                                </span>
                            )}
                        </div>
                        <div className="font-bold text-lg text-gray-900 group-hover:text-brand-600 transition-colors">
                            {load.pickupCity} <span className="text-gray-400">→</span> {load.dropCity}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Box className="h-3 w-3"/> {load.materialType}</span>
                            <span className="flex items-center gap-1"><Truck className="h-3 w-3"/> {load.vehicleType}</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3"/> {load.weight} Tons</span>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="font-bold text-xl text-gray-900">₹{load.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mb-2">{load.priceType}</div>
                        <div className="flex gap-2 justify-end">
                            {load.insuranceRequired && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="px-2" 
                                    onClick={(e) => handleDownloadInsurance(e, load)}
                                    title="Download Insurance Doc"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                </Button>
                            )}
                            <Button size="sm" className="w-full sm:w-auto" onClick={() => handleOpenBid(load)}>Place Bid</Button>
                        </div>
                    </div>
                </Card>
                ))}
                {loads.filter(l => l.status === 'Active').length === 0 && (
                    <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">No active loads available at the moment.</div>
                )}
            </div>
        </div>
        
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Market Rates</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Mumbai - Delhi</span>
                        <span className="font-medium text-green-600">₹3.5k / ton</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Bangalore - Chennai</span>
                        <span className="font-medium text-green-600">₹2.1k / ton</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Kolkata - Hyderabad</span>
                        <span className="font-medium text-green-600">₹4.2k / ton</span>
                    </div>
                </div>
            </Card>
            <Card className="p-6 bg-brand-900 text-white">
                <h3 className="font-bold mb-2">Premium Member?</h3>
                <p className="text-sm text-brand-100 mb-4">Get access to exclusive high-value loads and faster payments.</p>
                <Button size="sm" className="bg-white text-brand-900 hover:bg-brand-50 w-full">Upgrade Now</Button>
            </Card>
        </div>
      </div>

      {/* Bid Modal */}
      {isBidModalOpen && selectedLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsBidModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold mb-1">Place Bid & Assign</h2>
                <p className="text-sm text-gray-500 mb-4">{selectedLoad.pickupCity} to {selectedLoad.dropCity}</p>
                
                <form onSubmit={handleSubmitBid} className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                        <div className="flex justify-between mb-1">
                            <span>Asking Price:</span>
                            <span className="font-medium">₹{selectedLoad.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Load Weight:</span>
                            <span className="font-medium">{selectedLoad.weight} Tons</span>
                        </div>
                    </div>

                    <Input 
                        label="Bid Amount (₹)" 
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        required
                        icon={DollarSign}
                    />
                    
                    <Input 
                        label="Vehicle Details" 
                        placeholder="e.g., Tata 407, MH-12-AB-1234"
                        value={vehicleDetails}
                        onChange={e => setVehicleDetails(e.target.value)}
                        required
                        icon={Truck}
                    />

                    <Select
                        label="Assign Driver"
                        options={[{value: '', label: 'Select Driver'}, ...availableDrivers]}
                        value={selectedDriver}
                        onChange={e => setSelectedDriver(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsBidModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={submitting}>Submit & Assign</Button>
                    </div>
                </form>
            </Card>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        if (!confirm("This will initialize the database schema, add default users and seed sample loads. Continue?")) return;
        setSeeding(true);
        try {
        const { seedDatabase } = await import('../services/seed');
        await seedDatabase();
        showToast("Database seeded successfully!", "success");
        } catch (e: any) {
        console.error(e);
        showToast(`Failed to seed: ${e.message}`, "error");
        } finally {
        setSeeding(false);
        }
    };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
            <p className="text-gray-500 mt-1">Platform overview and management</p>
         </div>
         <Button variant="outline" onClick={handleSeed} isLoading={seeding}>
           <Database className="h-4 w-4 mr-2" /> Initialize Database
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gray-900 text-white border-none relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
             <div className="p-3 bg-gray-800 rounded-lg"><Shield className="h-6 w-6 text-green-400" /></div>
             <div>
               <p className="text-gray-400 text-xs uppercase tracking-wider">System Status</p>
               <p className="font-bold text-lg">All Systems Operational</p>
             </div>
          </div>
        </Card>
        <StatCard label="Total Users" value="1,240" icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Active Loads" value="85" icon={Truck} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Platform Revenue" value="₹4.2M" icon={TrendingUp} color="bg-green-50 text-green-600" />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/users')}>
                        <Users className="h-6 w-6 text-brand-600" />
                        <span>Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/loads')}>
                        <Package className="h-6 w-6 text-brand-600" />
                        <span>All Shipments</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2">
                        <FileText className="h-6 w-6 text-brand-600" />
                        <span>Reports</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2">
                        <AlertCircle className="h-6 w-6 text-brand-600" />
                        <span>Alerts (3)</span>
                    </Button>
                </div>
            </Card>
            
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Activity Log</h3>
                <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                            <div className="h-2 w-2 rounded-full bg-brand-400 mt-1.5"></div>
                            <div>
                                <p className="text-gray-900">New user registration: <span className="font-medium">Logistics Pro Ltd.</span></p>
                                <p className="text-gray-500 text-xs">2 mins ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
       </div>
    </div>
  );
}


// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadData = () => {
    setLoading(true);
    loadService.getAllLoads().then(data => {
      setLoads(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && loads.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
        <p className="text-gray-500">Loading your dashboard...</p>
    </div>
  );

  // Render based on role
  switch (user?.role) {
    case 'SHIPPER':
      return <ShipperDashboard loads={loads} />;
    case 'TRANSPORTER':
      return <TransporterDashboard loads={loads} onRefresh={loadData} />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'DRIVER':
      return <DriverDashboard />;
    case 'RECEIVER':
      return <ReceiverDashboard />;
    default:
      return <ShipperDashboard loads={loads} />;
  }
};