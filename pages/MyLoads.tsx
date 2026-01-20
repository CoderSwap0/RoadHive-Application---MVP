import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input } from '../components/UI';
import { Load } from '../types';
import { loadService } from '../services/loadService';
import { Search, MapPin, Calendar, FileCheck, XCircle, Eye, FileText, CreditCard, DollarSign, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const MyLoads: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentLoad, setActivePaymentLoad] = useState<Load | null>(null);
  const [paymentType, setPaymentType] = useState<'ADVANCE' | 'BALANCE'>('ADVANCE');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadLoads();
  }, []);

  const loadLoads = () => {
    loadService.getAllLoads().then(data => {
      setLoads(data);
      setLoading(false);
    });
  };

  const handleDownloadInsurance = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    loadService.downloadInsurance(load);
  };

  const handleDownloadInvoice = (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    loadService.downloadInvoice(load);
  };

  const handleCancelLoad = async (e: React.MouseEvent, load: Load) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this load? This action cannot be undone.')) return;
    try {
        await loadService.cancelLoad(load.id);
        loadLoads(); 
    } catch (error) {
        showToast("Failed to cancel load", "error");
    }
  };

  // Payment Handlers
  const openPaymentModal = (e: React.MouseEvent, load: Load, type: 'ADVANCE' | 'BALANCE') => {
      e.stopPropagation();
      setActivePaymentLoad(load);
      setPaymentType(type);
      setPaymentModalOpen(true);
  };

  const processPayment = async () => {
      if (!activePaymentLoad) return;
      setProcessingPayment(true);
      try {
          if (paymentType === 'ADVANCE') {
              await loadService.payAdvance(activePaymentLoad.id);
              showToast("Advance Payment Successful!", "success");
          } else {
              await loadService.payBalance(activePaymentLoad.id);
              showToast("Balance Payment Successful!", "success");
          }
          setPaymentModalOpen(false);
          loadLoads(); // Refresh to update status
      } catch (e) {
          showToast("Payment Failed", "error");
      } finally {
          setProcessingPayment(false);
      }
  };

  const filteredLoads = loads.filter(l => 
    l.title.toLowerCase().includes(filter.toLowerCase()) || 
    l.pickupCity.toLowerCase().includes(filter.toLowerCase()) ||
    l.dropCity.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Loads</h1>
          <p className="text-gray-500 mt-1">Manage and track your shipments</p>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            placeholder="Search loads..." 
            icon={Search} 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading your loads...</div>
        ) : filteredLoads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Search className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No loads found</h3>
            <p className="mt-1 text-gray-500">Get started by posting your first load.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Load Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-sm">{load.title}</span>
                        <span className="text-xs text-gray-500 mt-0.5">ID: {load.id} • {load.materialType} ({load.weight}T)</span>
                        <span className="text-xs text-gray-500">{load.vehicleType} • {load.bodyType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-700 font-medium">
                          <MapPin className="h-3 w-3 mr-1.5 text-green-600" /> {load.pickupCity}
                        </div>
                        <div className="flex items-center text-sm text-gray-700 font-medium">
                          <MapPin className="h-3 w-3 mr-1.5 text-red-600" /> {load.dropCity}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1 pl-4">
                          <Calendar className="h-3 w-3 mr-1" /> {load.pickupDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="text-sm font-bold text-gray-900">₹{load.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{load.priceType}</div>
                      {/* Payment Status Badge */}
                      {load.paymentStatus !== 'Pending' && (
                         <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1
                            ${load.paymentStatus === 'Fully_Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                         `}>
                            {load.paymentStatus === 'Advance_Paid' ? 'Advance Paid' : 'Fully Paid'}
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="flex flex-col gap-1.5 items-start">
                          <Badge status={load.status} />
                          {load.bids && load.bids.length > 0 && (
                            <div className="text-xs text-brand-600 font-medium px-1">
                              {load.bids.length} Bids Received
                            </div>
                          )}
                          {load.insuranceRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <FileCheck className="h-3 w-3 mr-1" /> Insured
                              </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                       <div className="flex justify-end items-center gap-2">
                           {/* Advance Payment Action */}
                           {(load.status === 'Assigned' || load.status === 'In Transit') && load.paymentStatus === 'Pending' && (
                               <Button 
                                variant="primary" 
                                size="sm" 
                                className="!py-1.5 !px-3 text-xs bg-brand-600 hover:bg-brand-700"
                                onClick={(e) => openPaymentModal(e, load, 'ADVANCE')}
                                title="Pay Advance to Start Trip"
                               >
                                 <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Advance
                               </Button>
                           )}

                           {/* Balance Payment Action */}
                           {load.status === 'Completed' && load.paymentStatus !== 'Fully_Paid' && (
                               <Button 
                                variant="primary" 
                                size="sm" 
                                className="!py-1.5 !px-3 text-xs bg-green-600 hover:bg-green-700 border-none"
                                onClick={(e) => openPaymentModal(e, load, 'BALANCE')}
                                title="Pay Remaining Balance"
                               >
                                 <DollarSign className="h-3.5 w-3.5 mr-1" /> Pay Balance
                               </Button>
                           )}

                           {load.status === 'Completed' && load.paymentStatus === 'Fully_Paid' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="!py-1.5 !px-2.5 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                onClick={(e) => handleDownloadInvoice(e, load)}
                                title="Download Invoice"
                               >
                                 <FileText className="h-4 w-4 mr-1" /> Invoice
                               </Button>
                           )}

                           {load.insuranceRequired && (
                               <Button 
                                variant="outline" 
                                size="sm" 
                                className="!py-1.5 !px-2.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={(e) => handleDownloadInsurance(e, load)}
                                title="Download Insurance Certificate"
                               >
                                 <FileCheck className="h-4 w-4" />
                               </Button>
                           )}
                           
                           <Button 
                             variant="outline" 
                             className="!py-1.5 !px-3 text-xs flex items-center"
                             onClick={() => navigate(`/trip/${load.id}`)}
                           >
                             <Eye className="h-3.5 w-3.5 mr-1" /> View
                           </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Demo Payment Modal */}
      {paymentModalOpen && activePaymentLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 relative animate-in zoom-in duration-200">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    Secure Payment
                </h2>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Freight Cost:</span>
                        <span className="font-medium">₹{activePaymentLoad.price.toLocaleString()}</span>
                    </div>
                    {activePaymentLoad.insurancePremium && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Insurance:</span>
                            <span className="font-medium">₹{activePaymentLoad.insurancePremium.toLocaleString()}</span>
                        </div>
                    )}
                     <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                        <span>Total Est. Amount:</span>
                        {/* Calculate on frontend for display, backend handles logic */}
                        <span>₹{((activePaymentLoad.price + (activePaymentLoad.insurancePremium || 0)) * 1.075 * 1.18).toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-lg mb-6 text-center border border-brand-100">
                    <p className="text-sm text-brand-800 mb-1">
                        {paymentType === 'ADVANCE' ? 'Advance Payment (30%)' : 'Remaining Balance'}
                    </p>
                    <p className="text-3xl font-bold text-brand-700">
                         ₹{paymentType === 'ADVANCE' 
                            ? ((activePaymentLoad.price + (activePaymentLoad.insurancePremium || 0)) * 1.075 * 1.18 * 0.30).toFixed(2)
                            : (activePaymentLoad.balanceAmount ? activePaymentLoad.balanceAmount.toFixed(2) : "Calculating...")
                         }
                    </p>
                </div>

                <div className="space-y-3">
                    <Button 
                        className="w-full py-3 text-lg bg-indigo-600 hover:bg-indigo-700" 
                        onClick={processPayment}
                        isLoading={processingPayment}
                    >
                        Pay with Stripe (Demo)
                    </Button>
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setPaymentModalOpen(false)}
                    >
                        Cancel
                    </Button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> 256-bit SSL Encrypted
                </p>
            </Card>
        </div>
      )}
    </div>
  );
};