import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '../components/UI';
import { Truck, AlertCircle, CheckCircle, Box, ScanLine, Camera, X } from 'lucide-react';
import { loadService } from '../services/loadService';
import QrScanner from 'react-qr-scanner';

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

export const ReceiverDashboard: React.FC = () => {
   const [manualId, setManualId] = useState('');
   const [scanResult, setScanResult] = useState<string | null>(null);
   const [isScannerOpen, setIsScannerOpen] = useState(false);
   const [scanError, setScanError] = useState<string | null>(null);

   const verifyDelivery = async (loadId: string) => {
       // Strip prefix if scanned from QR url format
       const cleanId = loadId.replace('roadhive-delivery:', '');
       
       try {
         // Call service to complete
         await loadService.updateTripStatus(cleanId, 'Completed');
         setScanResult(`Delivery for Load #${cleanId} verified successfully!`);
         setTimeout(() => setScanResult(null), 5000);
         setIsScannerOpen(false); // Close scanner on success
         setScanError(null);
       } catch (err) {
         setScanError("Failed to update trip status. Please try again.");
       }
   };

   const handleScan = (data: any) => {
    if (data && data.text) {
      verifyDelivery(data.text);
    }
   };

   const handleError = (err: any) => {
    console.error(err);
    setScanError("Could not access camera. Please ensure permissions are granted.");
   };

   return (
   <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inbound Deliveries</h1>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <Input 
                placeholder="Enter Load ID manually" 
                className="w-full sm:w-48" 
                value={manualId}
                onChange={e => setManualId(e.target.value)}
            />
            <Button onClick={() => verifyDelivery(manualId)} disabled={!manualId}>Verify</Button>
        </div>
      </div>
      
      {/* QR Scanner Section */}
      <Card className="bg-gray-900 text-white p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <ScanLine className="h-6 w-6 text-brand-400" />
                      Quick Delivery Verification
                  </h3>
                  <p className="text-gray-400 mb-4 max-w-lg">
                      Driver arrived? Scan the QR code on their device to instantly confirm receipt of goods and release payment.
                  </p>
                  <Button 
                    onClick={() => setIsScannerOpen(true)} 
                    className="bg-brand-500 hover:bg-brand-600 text-white border-none"
                  >
                      <Camera className="h-5 w-5 mr-2" />
                      Scan Driver QR Code
                  </Button>
              </div>
              <div className="hidden md:block opacity-50">
                  <QrCodeIcon />
              </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
      </Card>

      {scanResult && (
          <div className="p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle className="h-5 w-5" /> {scanResult}
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Arriving Today" value={3} icon={Truck} color="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Confirmation" value={1} icon={AlertCircle} color="bg-orange-50 text-orange-600" />
        <StatCard label="Received this Month" value={24} icon={CheckCircle} color="bg-green-50 text-green-600" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 font-medium text-sm text-gray-500 flex justify-between">
            <span>Shipment Details</span>
            <span>Status</span>
        </div>
        <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                            <Box className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Electronics Components</p>
                            <p className="text-sm text-gray-500">From: TechSuppliers Inc. • ID: #SH-892{i}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right mr-4">
                            <p className="text-xs text-gray-500">Estimated Arrival</p>
                            <p className="font-medium text-gray-900">Today, 4:00 PM</p>
                        </div>
                        <Button size="sm" variant="outline">Track</Button>
                    </div>
                </div>
            ))}
        </div>
      </Card>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
           <button 
             onClick={() => setIsScannerOpen(false)}
             className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-50"
           >
             <X className="h-6 w-6" />
           </button>
           
           <div className="w-full max-w-md aspect-square relative bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%', height: '100%' }}
                constraints={{
                  video: { facingMode: 'environment' }
                }}
              />
              {/* Scan Overlay */}
              <div className="absolute inset-0 border-2 border-brand-500/50 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-brand-400 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
              </div>
           </div>
           
           <div className="mt-8 text-center">
             <h3 className="text-white font-bold text-lg mb-2">Scan QR Code</h3>
             <p className="text-gray-400 text-sm max-w-xs mx-auto">
               Align the QR code from the driver's device within the frame to confirm delivery.
             </p>
             {scanError && (
               <p className="mt-4 text-red-400 text-sm bg-red-900/20 py-2 px-4 rounded">{scanError}</p>
             )}
           </div>
           
           <Button 
             variant="outline" 
             className="mt-6 border-white/20 text-white hover:bg-white/10"
             onClick={() => setIsScannerOpen(false)}
           >
             Cancel Scanning
           </Button>
        </div>
      )}
   </div>
   );
};

const QrCodeIcon = () => (
    <svg className="h-32 w-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM2 9h8M9 2v8M14 2v8M2 14h8M14 22v-8M22 9h-8M22 14h-8" />
        <rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="17" y="5" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="5" y="17" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="17" y="17" width="2" height="2" fill="currentColor" stroke="none" />
    </svg>
);