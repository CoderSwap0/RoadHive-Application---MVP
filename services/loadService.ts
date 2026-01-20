
import { Load } from '../types';
import api from './api';
import { mockService } from './mockService';
// @ts-ignore
import { jsPDF } from 'jspdf';

// Helper: Map Backend SQL Row/JSON to UI Type
const mapLoad = (data: any): Load => {
    return {
        id: data.load_id,
        tenantId: data.tenant_id,
        loadNumber: `L-${data.load_number}`,
        shipperCompanyId: data.shipper_company_id,
        transporterCompanyId: data.assigned_transporter_id,
        assignedDriverId: data.assigned_driver_id,
        receiverEmail: data.receiver_email,
        title: data.title,
        materialType: data.material_type,
        weight: Number(data.weight),
        vehicleCount: data.vehicle_count,
        
        pickupCity: data.pickup_location?.city,
        pickupAddress: data.pickup_location?.address,
        pickupDate: data.pickup_location?.date,
        pickupCoordinates: data.pickup_location?.lat ? { lat: data.pickup_location.lat, lng: data.pickup_location.lng } : undefined,
            
        dropCity: data.drop_location?.city,
        dropAddress: data.drop_location?.address,
        dropDate: data.drop_location?.date,
        dropCoordinates: data.drop_location?.lat ? { lat: data.drop_location.lat, lng: data.drop_location.lng } : undefined,
            
        vehicleType: data.vehicle_type,
        bodyType: data.body_type,
        tyres: data.tyres,
        price: Number(data.price),
        priceType: data.price_type,
        
        goodsValue: Number(data.goods_value),
        insuranceRequired: data.insurance_required,
        insurancePremium: Number(data.insurance_premium),
        
        status: data.status,
        createdAt: data.created_at,
        bids: [],
        currentLocation: data.current_location?.lat ? data.current_location : undefined,
        lastUpdated: data.last_updated,

        // Financials
        platformFee: Number(data.platform_fee || 0),
        taxTotal: Number(data.tax_total || 0),
        totalAmount: Number(data.total_amount || 0),
        
        // Payments
        paymentStatus: data.payment_status || 'Pending',
        advanceAmount: Number(data.advance_amount || 0),
        balanceAmount: Number(data.balance_amount || 0),

        invoiceNumber: data.invoice_number,
        invoiceDate: data.invoice_date
    };
};

export const loadService = {
  async getAllLoads(): Promise<Load[]> {
    try {
        const res = await api.get('/loads');
        return res.data.map(mapLoad);
    } catch (err) {
        console.warn("Backend unavailable, using mock");
        return mockService.getLoads();
    }
  },

  async getDriverLoads(driverId: string): Promise<Load[]> {
    return this.getAllLoads(); 
  },

  async createLoad(load: any): Promise<Load | null> {
    try {
        const res = await api.post('/loads', load);
        return mapLoad(res.data);
    } catch (err) {
        console.error(err);
        return null;
    }
  },

  async updateTripStatus(loadId: string, status: string): Promise<void> {
    try {
        await api.patch(`/loads/${loadId}/status`, { status });
    } catch (err) {
        console.error("Failed to update status");
        throw err;
    }
  },

  async cancelLoad(loadId: string): Promise<void> {
    // Implement cancel endpoint
  },
  
  async placeBid(loadId: string, amount: number, details: string, driverId?: string) {
      try {
          const res = await api.post(`/loads/${loadId}/bids`, { 
              amount, 
              vehicleDetails: details,
              driverId
          });
          return mapLoad(res.data);
      } catch (err) {
          console.error("Failed to place bid", err);
          throw err;
      }
  },

  async requestDeliveryOtp(loadId: string) {
      try {
          const res = await api.post(`/loads/${loadId}/otp/request`);
          if (res.data.otp) {
              console.log(`%c 🔑 DELIVERY OTP for Load ${loadId}: ${res.data.otp} `, 'background: #0ea5e9; color: white; font-weight: bold; font-size: 16px; padding: 10px; border-radius: 6px; border: 2px solid white;');
          }
      } catch (err) {
          console.error("Failed to request OTP", err);
          throw err;
      }
  },

  async verifyDeliveryOtp(loadId: string, otp: string) {
      try {
          await api.post(`/loads/${loadId}/otp/verify`, { otp });
      } catch (err) {
          console.error("Failed to verify OTP", err);
          throw err;
      }
  },

  // --- Payments ---
  async payAdvance(loadId: string) {
      const res = await api.post(`/loads/${loadId}/pay-advance`);
      return res.data;
  },

  async payBalance(loadId: string) {
      const res = await api.post(`/loads/${loadId}/pay-balance`);
      return res.data;
  },

  // --- Invoice Generation ---
  downloadInvoice(load: Load) {
    if (load.status !== 'Completed') {
        alert("Invoice is only available for completed trips.");
        return;
    }

    try {
        const doc = new jsPDF();
        
        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(14, 165, 233); // Brand Blue
        doc.text("TAX INVOICE", 150, 20);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("RoadHive Logistics", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("123, Tech Park, Logistics Hub", 14, 26);
        doc.text("Mumbai, Maharashtra, 400001", 14, 31);
        doc.text("GSTIN: 27AABCU9603R1ZM", 14, 36);

        // --- Meta Data ---
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 45, 196, 45);

        doc.setTextColor(0, 0, 0);
        doc.text(`Invoice No:`, 14, 55);
        doc.text(load.invoiceNumber || `INV-${load.id.slice(0,6)}`, 40, 55);

        doc.text(`Date:`, 150, 55);
        doc.text(load.invoiceDate ? new Date(load.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(), 170, 55);

        doc.text(`Load ID:`, 14, 62);
        doc.text(load.loadNumber, 40, 62);

        // --- Bill To ---
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 70, 182, 25, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 20, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Shipper / Consignee", 20, 87); 
        doc.text(`${load.dropAddress}, ${load.dropCity}`, 20, 93);

        // --- Table Header ---
        let y = 110;
        doc.setFillColor(14, 165, 233);
        doc.rect(14, y, 182, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("Description", 20, y + 7);
        doc.text("Amount (INR)", 160, y + 7);

        // --- Table Rows ---
        y += 18;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        // 1. Transport Cost
        doc.text("Transport Charges / Freight", 20, y);
        doc.text((load.price || 0).toFixed(2), 180, y, { align: 'right' });
        doc.line(14, y + 2, 196, y + 2);

        // 2. Insurance
        if (load.insuranceRequired) {
            y += 10;
            doc.text("Transit Insurance Premium", 20, y);
            doc.text((load.insurancePremium || 0).toFixed(2), 180, y, { align: 'right' });
            doc.line(14, y + 2, 196, y + 2);
        }

        // 3. Platform Fee
        y += 10;
        doc.text("RoadHive Platform Fee (7.5%)", 20, y);
        const fee = load.platformFee || ((load.price + (load.insurancePremium || 0)) * 0.075);
        doc.text(fee.toFixed(2), 180, y, { align: 'right' });
        doc.line(14, y + 2, 196, y + 2);

        // 4. Taxes
        y += 10;
        doc.text("CGST (9%)", 20, y);
        const tax = (load.taxTotal || fee * 0.18) / 2;
        doc.text(tax.toFixed(2), 180, y, { align: 'right' });
        doc.line(14, y + 2, 196, y + 2);

        y += 10;
        doc.text("SGST (9%)", 20, y);
        doc.text(tax.toFixed(2), 180, y, { align: 'right' });
        doc.line(14, y + 2, 196, y + 2);

        // --- Totals Section ---
        y += 20;
        const total = load.totalAmount || (load.price + (load.insurancePremium || 0) + fee + (tax * 2));
        
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount", 120, y);
        doc.text(`${total.toFixed(2)}`, 190, y, { align: 'right' });

        y += 8;
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Less: Advance Paid (30%)", 120, y);
        doc.text(`(${load.advanceAmount?.toFixed(2) || '0.00'})`, 190, y, { align: 'right' });

        y += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(230, 240, 255);
        doc.rect(115, y - 8, 80, 14, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("NET BALANCE DUE", 120, y+1);
        
        const balance = total - (load.advanceAmount || 0);
        doc.text(`INR ${balance.toFixed(2)}`, 190, y+1, { align: 'right' });

        // --- Digital Stamp & Signature ---
        const stampY = 240;
        const stampX = 145;

        // Stamp Box
        doc.setDrawColor(14, 165, 233);
        doc.setLineWidth(1);
        doc.rect(stampX, stampY, 45, 20); 

        doc.setFontSize(7);
        doc.setTextColor(14, 165, 233);
        doc.setFont("helvetica", "bold");
        doc.text("ROADHIVE LOGISTICS", stampX + 22.5, stampY + 5, { align: 'center' });
        doc.text("MUMBAI - HQ", stampX + 22.5, stampY + 9, { align: 'center' });
        doc.text("PAYMENT VERIFIED", stampX + 22.5, stampY + 16, { align: 'center' });

        // Signature Scribble
        doc.setDrawColor(0, 0, 100); 
        doc.setLineWidth(1);
        doc.lines([[5, -2], [5, 2], [5, -5], [10, 5], [5, -2]], stampX + 5, stampY + 12, [1, 1]);

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text("Authorized Signatory", stampX + 22.5, stampY + 28, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("This is a computer generated invoice and requires no physical signature.", 105, 280, { align: 'center' });

        doc.save(`Invoice_${load.loadNumber}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
    }
  },

  downloadInsurance(load: Load) {
    // ... existing implementation ...
    if (!load.insuranceRequired) return;

    try {
      const doc = new jsPDF();
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("CERTIFICATE OF INSURANCE", 105, 25, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Certificate No: INS-${load.id.substring(0,8)}`, 14, 50);
      doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 14, 55);
      
      doc.save(`Insurance_Certificate_${load.id}.pdf`);
    } catch (e) {
      alert("Failed to generate PDF");
    }
  }
};
