import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '../components/UI';
import { Map as TripMap } from '../components/Map';
import { Load, Coordinates, LoadStatus } from '../types';
import { loadService } from '../services/loadService';
import { tripService } from '../services/tripService';
import { socketService } from '../services/socketService';
import { useAuth } from '../App';
import { 
  MapPin, Navigation, CheckCircle, AlertTriangle, ArrowLeft, 
  Pause, Play, StopCircle, Crosshair, Battery, BatteryWarning,
  Siren, Info, Truck, Calendar, DollarSign, KeyRound, Lock
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

type TrackingMode = 'GPS' | 'SIMULATION' | 'OFF';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  icon: any;
}

export const ActiveTrip: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [load, setLoad] = useState<Load | null>(null);
  const [historyPath, setHistoryPath] = useState<Coordinates[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tracking State
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('OFF');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  
  // Alert State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  
  // Progress State
  const [progress, setProgress] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Refs for Simulation Fix
  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const currentLocationRef = useRef<Coordinates | undefined>(undefined);

  // --- Helper: Distance Calculation (Haversine) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  // --- Alert Logic ---
  const updateAlerts = useCallback((currentLoad: Load, coords: Coordinates) => {
    const newAlerts: Alert[] = [];

    // 1. Battery Check
    if (batteryLevel !== null && batteryLevel < 0.20 && !isCharging) {
      newAlerts.push({
        id: 'batt-low', type: 'critical', message: 'Low Battery: Connect charger to maintain GPS', icon: BatteryWarning
      });
    }

    // 2. Speed Check (Simulation/Real)
    const speedKmh = (coords.speed || 0) * 3.6;
    if (speedKmh > 80) {
      newAlerts.push({
        id: 'speed', type: 'warning', message: 'Speed Warning: Slow down (Limit 80km/h)', icon: Siren
      });
    }

    // 3. Proximity Check
    let targetCoords = currentLoad.status === 'Assigned' ? currentLoad.pickupCoordinates : currentLoad.dropCoordinates;
    let targetName = currentLoad.status === 'Assigned' ? 'Pickup' : 'Drop-off';

    if (targetCoords) {
      const dist = calculateDistance(coords.lat, coords.lng, targetCoords.lat, targetCoords.lng);
      if (dist < 2) {
         newAlerts.push({
           id: 'prox-close', type: 'info', message: `Approaching ${targetName} (< 2km)`, icon: MapPin
         });
      } else if (dist < 10) {
        newAlerts.push({
           id: 'prox-near', type: 'info', message: `${targetName} is nearby (${dist.toFixed(1)}km)`, icon: Navigation
         });
      }
    }

    // 4. Traffic (Random Mock if simulating)
    if (trackingMode === 'SIMULATION' && Math.random() > 0.95) {
       const exists = alerts.find(a => a.id === 'traffic');
       if (!exists) {
          newAlerts.push({
            id: 'traffic', type: 'warning', message: 'Heavy Traffic reported ahead (+10m delay)', icon: AlertTriangle
          });
       }
    } else {
        const traffic = alerts.find(a => a.id === 'traffic');
        if (traffic) newAlerts.push(traffic);
    }

    const uniqueAlerts = Array.from(new Map(newAlerts.map(item => [item.id, item])).values());
    setAlerts(uniqueAlerts);

  }, [batteryLevel, isCharging, trackingMode, alerts]);

  // --- Progress Calculation ---
  useEffect(() => {
    if (!load) return;

    if (load.status === 'Reached' || load.status === 'Completed') {
        setProgress(100);
        setDistanceRemaining(0);
        return;
    }

    if (load.status === 'Assigned' || load.status === 'Pending') {
        setProgress(0);
        return;
    }

    if (load.pickupCoordinates && load.dropCoordinates) {
        const total = calculateDistance(
            load.pickupCoordinates.lat, load.pickupCoordinates.lng,
            load.dropCoordinates.lat, load.dropCoordinates.lng
        );
        
        let remaining = total;
        // Use current location or fall back to pickup location if tracking hasn't started
        const currentPos = load.currentLocation || load.pickupCoordinates;
        
        if (currentPos) {
             remaining = calculateDistance(
                currentPos.lat, currentPos.lng,
                load.dropCoordinates.lat, load.dropCoordinates.lng
            );
        }
        
        setDistanceRemaining(remaining);

        if (total > 0) {
            const covered = total - remaining;
            const pct = (covered / total) * 100;
            setProgress(Math.max(0, Math.min(95, pct)));
        } else {
            setProgress(0);
        }
    }
  }, [load?.currentLocation, load?.status, load?.pickupCoordinates, load?.dropCoordinates]);


  // 1. Initial Load & Battery Setup
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => setBatteryLevel(battery.level));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      });
    }

    if (id && user) {
      loadService.getAllLoads().then(async (loads) => {
        const found = loads.find(l => l.id === id);
        if (found) {
          setLoad(found);
          currentLocationRef.current = found.currentLocation;
          
          const path = await tripService.getLocationHistory(found.id);
          setHistoryPath(path);
          socketService.connect(found.tenantId);
          
          const isDriver = user.role === 'DRIVER' || user.id === found.assignedDriverId;
          if (isDriver && found.status === 'In Transit') {
            setTrackingMode('GPS');
          }
        }
        setLoading(false);
      });
    }
    return () => {
      stopTracking();
      socketService.disconnect();
    };
  }, [id, user]);

  // 2. Socket Listeners
  useEffect(() => {
    const handleUpdate = (data: any) => {
       if (data.loadId === id) {
           setLoad(prev => {
               if (prev) {
                   const updated = { ...prev, currentLocation: data.coordinates, status: data.status };
                   currentLocationRef.current = data.coordinates;
                   return updated;
               }
               return null;
           });
           if (data.coordinates) {
               setHistoryPath(prev => [...prev, data.coordinates]);
           }
       }
    };
    socketService.subscribe('location_update', handleUpdate);
    return () => socketService.unsubscribe('location_update', handleUpdate);
  }, [id]);


  // 3. Trip Actions
  const handleStart = async () => {
    if (!load) return;
    await tripService.startTrip(load.id);
    setLoad(prev => prev ? { ...prev, status: 'In Transit' } : null);
    setTrackingMode('GPS');
    showToast("Trip started successfully!", "success");
  };

  const handlePause = async () => {
    if (!load) return;
    stopTracking(); 
    await tripService.pauseTrip(load.id);
    setLoad(prev => prev ? { ...prev, status: 'Paused' } : null);
    setTrackingMode('OFF');
    showToast("Trip paused.", "info");
  };

  const handleResume = async () => {
    if (!load) return;
    await tripService.resumeTrip(load.id);
    setLoad(prev => prev ? { ...prev, status: 'In Transit' } : null);
    setTrackingMode('GPS');
    showToast("Trip resumed!", "success");
  };

  const handleReached = async () => {
    if (!load) return;
    stopTracking();
    setTrackingMode('OFF');
    await tripService.completeTrip(load.id); // Sets status to 'Reached'
    
    // Automatically Request OTP when reaching
    try {
        await loadService.requestDeliveryOtp(load.id);
        setOtpSent(true);
        showToast("Arrived! OTP sent to receiver's email.", "success");
    } catch (e) {
        showToast("Arrived, but failed to send OTP.", "error");
    }

    if (load.dropCoordinates) {
        await tripService.updateLocation(load.id, load.dropCoordinates);
    }
    setLoad(prev => prev ? { ...prev, status: 'Reached' } : null);
  };
  
  const handleVerifyOtp = async () => {
      if (!load) return;
      setVerifying(true);
      try {
          await loadService.verifyDeliveryOtp(load.id, otp);
          setLoad(prev => prev ? { ...prev, status: 'Completed' } : null);
          showToast("Delivery Verified Successfully!", "success");
      } catch (e) {
          showToast("Invalid OTP. Please try again.", "error");
      } finally {
          setVerifying(false);
      }
  };


  // 4. GPS & Simulation
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  const processLocationUpdate = useCallback(async (lat: number, lng: number, heading?: number, speed?: number) => {
    if (!load || !id) return;

    const newCoords: Coordinates = { lat, lng, heading, speed };
    currentLocationRef.current = newCoords;

    // Update UI
    setLoad(prev => {
        if (!prev) return null;
        updateAlerts(prev, newCoords);
        return { ...prev, currentLocation: newCoords };
    });
    setHistoryPath(prev => [...prev, newCoords]);
    
    socketService.emit('location_update', { loadId: id, coordinates: newCoords, status: load.status });
    await tripService.updateLocation(id, newCoords);

  }, [load, id, updateAlerts]);

  useEffect(() => {
    stopTracking(); // Clear existing

    if (trackingMode === 'GPS') {
      if (!navigator.geolocation) {
        setGpsError("GPS not supported"); 
        return;
      }
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude, heading, speed } = pos.coords;
            processLocationUpdate(latitude, longitude, heading || 0, speed || 0);
        },
        (err) => setGpsError(err.message),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else if (trackingMode === 'SIMULATION') {
       simulationIntervalRef.current = window.setInterval(() => {
           let current = currentLocationRef.current;
           if (!current && load?.pickupCoordinates) {
               current = load.pickupCoordinates;
               currentLocationRef.current = current;
           }
           if (!current) return;
           
           const newLat = current.lat + (Math.random() * 0.001); 
           const newLng = current.lng + (Math.random() * 0.001);
           const simSpeed = (40 + Math.random() * 50) / 3.6; 
           processLocationUpdate(newLat, newLng, 45, simSpeed);
       }, 2000);
    }
    return () => stopTracking();
  }, [trackingMode, processLocationUpdate, load]);


  if (loading) return <div className="p-8 text-center">Loading Trip...</div>;
  if (!load) return <div className="p-8 text-center">Load not found or access denied.</div>;

  const isDriver = user?.role === 'DRIVER' || user?.role === 'TRANSPORTER';
  const showControls = isDriver && load.status !== 'Completed';

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col relative">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="!p-2">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="font-bold text-gray-900">{load.pickupCity} <span className="text-gray-400">→</span> {load.dropCity}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono">#{load.id}</span>
                        <span>•</span>
                        <Badge status={load.status} />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {batteryLevel !== null && (
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${batteryLevel < 0.2 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isCharging ? <Battery className="h-3 w-3 animate-pulse" /> : <Battery className="h-3 w-3" />}
                        {Math.round(batteryLevel * 100)}%
                    </div>
                )}
            </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-2 px-1">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-brand-500 transition-all duration-1000 ease-out relative" 
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div 
                className="absolute top-0 -ml-3 transition-all duration-1000 ease-out"
                style={{ left: `${progress}%`, top: '-4px' }}
            >
                <div className="bg-brand-600 text-white p-1 rounded-full shadow-md border-2 border-white">
                    <Truck className="h-3 w-3" />
                </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-2">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Pickup</span>
                <span>
                    {distanceRemaining !== null 
                        ? `${distanceRemaining.toFixed(1)} km remaining` 
                        : 'Calculating...'}
                </span>
                <span className="flex items-center gap-1">Drop <MapPin className="h-3 w-3" /></span>
            </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-300">
        <TripMap 
            currentLocation={load.currentLocation}
            pickupLocation={load.pickupCoordinates}
            dropLocation={load.dropCoordinates}
            pathHistory={historyPath}
            autoCenter={autoCenter}
            onUserInteraction={() => setAutoCenter(false)}
            className="h-full w-full"
        />

        {/* ALERTS OVERLAY */}
        {alerts.length > 0 && (
            <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
                {alerts.map(alert => (
                    <div 
                        key={alert.id}
                        className={`
                            max-w-md mx-auto w-full p-3 rounded-lg shadow-lg border backdrop-blur-md animate-in slide-in-from-top-2
                            flex items-center gap-3 pointer-events-auto
                            ${alert.type === 'critical' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
                            ${alert.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-800' : ''}
                            ${alert.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' : ''}
                        `}
                    >
                        <alert.icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 text-sm font-medium">{alert.message}</div>
                        <button onClick={() => setAlerts(p => p.filter(a => a.id !== alert.id))} className="p-1 hover:bg-black/5 rounded">
                           <span className="sr-only">Dismiss</span>
                           <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-[500]">
            
            {/* GPS Toggle for Demo */}
            {load.status === 'In Transit' && isDriver && (
                <div className="flex justify-center gap-3 mb-4">
                    <button 
                        onClick={() => setTrackingMode('GPS')} 
                        className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all border ${trackingMode==='GPS' ? 'bg-blue-600 text-white border-blue-500 scale-105' : 'bg-white/95 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                        GPS MODE
                    </button>
                    <button 
                         onClick={() => setTrackingMode('SIMULATION')} 
                         className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all border ${trackingMode==='SIMULATION' ? 'bg-purple-600 text-white border-purple-500 scale-105' : 'bg-white/95 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                        DEMO MODE
                    </button>
                    <button 
                         onClick={() => setAutoCenter(true)} 
                         className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all border ${autoCenter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white/95 text-gray-600 border-gray-200 hover:text-blue-500'}`}
                         title="Re-center Map"
                    >
                        <Crosshair className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Driver Action Card */}
            {showControls ? (
                <Card className="p-5 bg-white/95 backdrop-blur-xl shadow-2xl border-t-4 border-brand-500">
                    {load.status === 'Assigned' && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4 font-medium">Ready to start journey?</p>
                            <Button onClick={handleStart} size="lg" className="w-full shadow-lg shadow-brand-200 py-4 text-lg">
                                <Navigation className="h-6 w-6 mr-2" /> START TRIP
                            </Button>
                        </div>
                    )}

                    {load.status === 'In Transit' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={handlePause} variant="secondary" className="border border-gray-300 py-3 shadow-md hover:bg-gray-100 text-gray-800">
                                <Pause className="h-5 w-5 mr-2" /> PAUSE
                            </Button>
                            <Button onClick={handleReached} variant="danger" className="py-3 shadow-lg shadow-red-200">
                                <MapPin className="h-5 w-5 mr-2" /> ARRIVED
                            </Button>
                        </div>
                    )}

                    {load.status === 'Paused' && (
                        <div className="text-center">
                             <p className="text-sm text-yellow-800 bg-yellow-100 px-4 py-2 rounded-lg mb-4 font-medium border border-yellow-200 inline-block">Trip Paused</p>
                             <Button onClick={handleResume} size="lg" className="w-full py-4 text-lg shadow-lg">
                                <Play className="h-6 w-6 mr-2" /> RESUME TRIP
                            </Button>
                        </div>
                    )}
                    
                    {load.status === 'Reached' && (
                         <div className="text-center">
                             <p className="text-sm font-medium text-gray-800 mb-3">You have arrived at destination.</p>
                             <Button onClick={() => setOtpSent(true)} className="w-full py-3 shadow-md">
                                 <KeyRound className="h-5 w-5 mr-2" /> VERIFY DELIVERY
                             </Button>
                         </div>
                    )}
                </Card>
            ) : (
                /* Status Card for Viewers */
                load.status !== 'Completed' && (
                    <Card className="p-4 bg-white/95 backdrop-blur shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Current Speed</p>
                                <p className="text-xl font-mono font-bold text-gray-900">
                                    {load.currentLocation?.speed ? Math.round(load.currentLocation.speed * 3.6) : 0} <span className="text-sm text-gray-500">km/h</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                                <p className="font-bold text-brand-600">{load.status}</p>
                            </div>
                        </div>
                    </Card>
                )
            )}
        </div>
      </div>
      
      {/* OTP Verification Overlay */}
      {(load.status === 'Reached' || load.status === 'Completed') && otpSent && load.status !== 'Completed' && (
            <div className="fixed inset-0 z-[2000] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-white rounded-2xl p-6">
                    <div className="text-center mb-6">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Lock className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Proof of Delivery</h2>
                        <p className="text-gray-500 text-sm mt-1">Ask receiver for the OTP sent to <br/><span className="font-mono text-gray-800">{load.receiverEmail}</span></p>
                    </div>

                    <div className="space-y-4">
                        <Input 
                            placeholder="Enter 6-digit Code" 
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <Button 
                            className="w-full py-3 text-lg" 
                            onClick={handleVerifyOtp}
                            isLoading={verifying}
                            disabled={otp.length !== 6}
                        >
                            Verify & Complete
                        </Button>
                        <button 
                            onClick={() => loadService.requestDeliveryOtp(load.id).then(() => showToast("OTP Resent", "info"))}
                            className="w-full text-xs text-brand-600 hover:underline mt-2"
                        >
                            Resend Code
                        </button>
                    </div>
                </Card>
            </div>
      )}

      {/* Completion Success Overlay */}
      {load.status === 'Completed' && (
         <div className="fixed inset-0 z-[2000] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-sm bg-white rounded-2xl p-8 text-center animate-in zoom-in-95">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Trip Completed!</h2>
                <p className="text-gray-500 mt-2 mb-6">Delivery verified and status updated.</p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                    Back to Dashboard
                </Button>
            </Card>
         </div>
      )}
    </div>
  );
};  