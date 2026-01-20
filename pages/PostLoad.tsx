import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Button } from '../components/UI';
import { loadService } from '../services/loadService';
import { MapPin, Calendar, Truck, Package, DollarSign, Mail, ShieldCheck } from 'lucide-react';

export const PostLoad: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    receiverEmail: '',
    materialType: '',
    weight: '',
    vehicleCount: 1,
    pickupCity: '',
    pickupAddress: '',
    pickupDate: '',
    dropCity: '',
    dropAddress: '',
    dropDate: '',
    vehicleType: 'Truck',
    bodyType: 'Open',
    tyres: '',
    price: '',
    priceType: 'Fixed',
    
    // Insurance Fields
    goodsValue: '',
    insuranceOptIn: false
  });

  const [premium, setPremium] = useState(0);

  // Calculate Premium when goodsValue or optIn changes
  useEffect(() => {
    if (formData.insuranceOptIn && formData.goodsValue) {
      const val = parseFloat(formData.goodsValue);
      if (!isNaN(val)) {
        // Flat 0.5% premium rate
        setPremium(val * 0.005);
      }
    } else {
      setPremium(0);
    }
  }, [formData.goodsValue, formData.insuranceOptIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await loadService.createLoad({
        ...formData,
        weight: Number(formData.weight),
        vehicleCount: Number(formData.vehicleCount),
        tyres: Number(formData.tyres),
        price: Number(formData.price),
        vehicleType: formData.vehicleType as any,
        bodyType: formData.bodyType as any,
        priceType: formData.priceType as any,
        // Insurance Data
        goodsValue: formData.goodsValue ? Number(formData.goodsValue) : 0,
        insuranceRequired: formData.insuranceOptIn, // Map mapped to correct property
        insurancePremium: premium
      });
      navigate('/loads');
    } catch (error) {
      console.error(error);
      alert('Failed to post load. Ensure database connection is active.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post a New Load</h1>
        <p className="text-gray-500 mt-1">Fill in the details to find the best transporter.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Load Details */}
        <Card className="p-6">
          <div className="flex items-center mb-4 text-brand-600">
            <Package className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Load Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Load Title" 
              name="title" 
              placeholder="e.g. Steel Pipes to Delhi" 
              required 
              value={formData.title} 
              onChange={handleChange}
              className="md:col-span-2"
            />
            <Input 
              label="Receiver Email (For Tracking Access)" 
              name="receiverEmail" 
              type="email"
              placeholder="receiver@example.com" 
              required 
              value={formData.receiverEmail} 
              onChange={handleChange}
              icon={Mail}
              className="md:col-span-2"
            />
            <Input 
              label="Material Type" 
              name="materialType" 
              placeholder="e.g. Steel, FMCG, Agri" 
              required 
              value={formData.materialType} 
              onChange={handleChange}
            />
            <Input 
              label="Weight (Tons)" 
              name="weight" 
              type="number" 
              required 
              value={formData.weight} 
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Section 2: Route Details */}
        <Card className="p-6">
          <div className="flex items-center mb-4 text-brand-600">
            <MapPin className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Route & Schedule</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Visual connector for desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 transform -translate-x-1/2"></div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Pickup</h4>
              <Input 
                label="City" name="pickupCity" required 
                value={formData.pickupCity} onChange={handleChange} 
              />
              <Input 
                label="Address" name="pickupAddress" required 
                value={formData.pickupAddress} onChange={handleChange} 
              />
              <Input 
                label="Date" name="pickupDate" type="date" required icon={Calendar}
                value={formData.pickupDate} onChange={handleChange} 
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Drop</h4>
              <Input 
                label="City" name="dropCity" required 
                value={formData.dropCity} onChange={handleChange} 
              />
              <Input 
                label="Address" name="dropAddress" required 
                value={formData.dropAddress} onChange={handleChange} 
              />
              <Input 
                label="Expected Date" name="dropDate" type="date" required icon={Calendar}
                value={formData.dropDate} onChange={handleChange} 
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Insurance Option (New) */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center mb-4 text-brand-600">
            <ShieldCheck className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Transit Insurance</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Declared Goods Value (₹)" 
                name="goodsValue" 
                type="number" 
                placeholder="e.g. 500000"
                value={formData.goodsValue}
                onChange={handleChange}
              />
              <div className="flex items-center pt-6">
                 <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition w-full">
                    <input 
                      type="checkbox" 
                      name="insuranceOptIn"
                      checked={formData.insuranceOptIn}
                      onChange={handleChange}
                      className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Opt for Insurance</span>
                      <p className="text-xs text-gray-500">Premium: 0.5% of declared value</p>
                    </div>
                 </label>
              </div>
            </div>
            
            {formData.insuranceOptIn && (
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center animate-in fade-in">
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Insurance Premium Calculated</p>
                    <p className="text-xs text-blue-600">This amount will be added to your invoice.</p>
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    ₹{premium.toLocaleString()}
                  </div>
              </div>
            )}
          </div>
        </Card>

        {/* Section 4: Vehicle & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4 text-brand-600">
              <Truck className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-medium">Vehicle Requirements</h3>
            </div>
            <div className="space-y-4">
              <Select 
                label="Vehicle Type" 
                name="vehicleType"
                options={[
                  { label: 'Truck', value: 'Truck' },
                  { label: 'Trailer', value: 'Trailer' },
                  { label: 'Container', value: 'Container' },
                ]}
                value={formData.vehicleType}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Body Type" 
                  name="bodyType"
                  options={[
                    { label: 'Open', value: 'Open' },
                    { label: 'Closed', value: 'Closed' },
                  ]}
                  value={formData.bodyType}
                  onChange={handleChange}
                />
                <Input 
                  label="Tyres" 
                  name="tyres" 
                  type="number" 
                  placeholder="e.g. 6, 10, 12"
                  value={formData.tyres}
                  onChange={handleChange}
                />
              </div>
              <Input 
                label="Vehicles Required" 
                name="vehicleCount" 
                type="number" 
                min="1"
                value={formData.vehicleCount}
                onChange={handleChange}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4 text-brand-600">
              <DollarSign className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-medium">Pricing</h3>
            </div>
            <div className="space-y-4">
              <Input 
                label="Expected Price (₹)" 
                name="price" 
                type="number" 
                required 
                value={formData.price}
                onChange={handleChange}
              />
              <Select 
                label="Price Type" 
                name="priceType"
                options={[
                  { label: 'Fixed Price', value: 'Fixed' },
                  { label: 'Negotiable', value: 'Negotiable' },
                ]}
                value={formData.priceType}
                onChange={handleChange}
              />
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Fixed prices usually get faster bids, but negotiable prices work better for complex routes.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Post Load
          </Button>
        </div>
      </form>
    </div>
  );
};