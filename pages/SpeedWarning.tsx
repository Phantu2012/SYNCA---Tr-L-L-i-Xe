import React, { useState, useEffect, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { InfoIcon } from '../components/Icons';
import Modal from '../components/Modal';

// Make H object available from HERE Maps API scripts
declare const H: any;

const HERE_API_KEY = "XQBo-jdyd764vuY1DnMpQgbdQblpfY9bo-a8xd9RAyg";

interface SpeedLimitInfo {
    limit: number;
    area: string;
}
interface TripStats {
    distance: number; // in km
    startTime: number | null;
    maxSpeed: number;
    speeds: number[];
    overspeedCount: number;
}
interface RouteInfo {
    distance: number; // meters
    duration: number; // seconds
    nextManeuver: string | null;
    maneuverDistance: number | null; // meters
}

const getHereLocationName = async (lat: number, lon: number): Promise<string> => {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat}%2C${lon}&lang=vi-VN&apiKey=${HERE_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return 'Khu vực không xác định';
        const data = await response.json();
        return data?.items?.[0]?.address?.label || 'Khu vực không xác định';
    } catch (e) {
        return 'Khu vực không xác định';
    }
};

const getHereSpeedLimit = async (lat: number, lon: number): Promise<SpeedLimitInfo | null> => {
    const routeApiUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${lat},${lon}&destination=${lat},${lon}&return=polyline&spans=speedLimit&apiKey=${HERE_API_KEY}`;
    try {
        const [routeResponse, areaName] = await Promise.all([
            fetch(routeApiUrl),
            getHereLocationName(lat, lon),
        ]);
        if (!routeResponse.ok) return null;
        const routeData = await routeResponse.json();
        const speedLimitMps = routeData?.routes?.[0]?.sections?.[0]?.spans?.[0]?.speedLimit;
        if (typeof speedLimitMps === 'number') {
            return {
                limit: Math.round(speedLimitMps * 3.6),
                area: areaName,
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to call HERE API:", error);
        return null;
    }
};

const formatDuration = (seconds: number): string => {
    if (seconds < 60) return 'Dưới 1 phút';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let result = '';
    if (hours > 0) result += `${hours} giờ `;
    if (minutes > 0) result += `${minutes} phút`;
    return result.trim();
};

const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
};


const SpeedWarning: React.FC = () => {
    const [isDriving, setIsDriving] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [speedLimitInfo, setSpeedLimitInfo] = useState<SpeedLimitInfo | null>({ limit: 50, area: 'Khu dân cư' });
    const [isOverspeeding, setIsOverspeeding] = useState(false);
    const [hasSpoken, setHasSpoken] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [tripStats, setTripStats] = useState<TripStats>({ distance: 0, startTime: null, maxSpeed: 0, speeds: [], overspeedCount: 0 });
    const [isSummaryVisible, setIsSummaryVisible] = useState(false);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const platform = useRef<any>(null);
    const ui = useRef<any>(null);
    const userMarker = useRef<any>(null);
    const routeLine = useRef<any>(null);
    const watchId = useRef<number | null>(null);
    const lastPosition = useRef<GeolocationCoordinates | null>(null);
    const initialRouteInfo = useRef<RouteInfo | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        if (!mapRef.current || !H || !H.service) return;
        platform.current = new H.service.Platform({ apikey: HERE_API_KEY });
        
        // FIX: Use createDefaultLayers and then remove the vector layers. This prevents
        // the Tangram engine from initializing and causing a crash, which also allows
        // the incidents service to load properly.
        const defaultLayers = platform.current.createDefaultLayers();
        if (defaultLayers.vector) {
            delete defaultLayers.vector; // Critical step to disable vector maps
        }
        
        // Use the safe, raster-only base layer from the modified layers object.
        const newMap = new H.Map(
            mapRef.current,
            defaultLayers.raster.normal.map,
            { zoom: 15, center: { lat: 21.0285, lng: 105.8542 } }
        );
        map.current = newMap;
        
        new H.mapevents.Behavior(new H.mapevents.MapEvents(newMap));
        
        // Create the UI with the modified, vector-free layers object.
        ui.current = H.ui.UI.createDefault(newMap, defaultLayers);
        
        // Add incidents service layer. This now works because the Tangram crash is averted.
        try {
           const incidentsService = platform.current.getIncidentsService();
           if(incidentsService) {
                newMap.addLayer(incidentsService.createIncidentLayer());
           }
        } catch(e){
            console.error("Could not add incidents layer", e);
        }

        // Set initial position if available
        navigator.geolocation.getCurrentPosition(position => {
            lastPosition.current = position.coords;
            newMap.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        });

        return () => {
            if (map.current) {
                map.current.dispose();
                map.current = null;
            }
        };
    }, []);


    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&at=21.0285,105.8542&lang=vi-VN&apiKey=${HERE_API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            setSuggestions(data.items || []);
        } catch (error) {
            console.error("Autosuggest error:", error);
        }
    }, []);

    const performRouteCalculation = (origin: { latitude: number, longitude: number }, destination: { lat: number, lng: number }) => {
        const router = platform.current.getRoutingService(null, 8);
        const routeParams = {
            'routingMode': 'fast', 'transportMode': 'car',
            'origin': `${origin.latitude},${origin.longitude}`,
            'destination': `${destination.lat},${destination.lng}`,
            'return': 'polyline,summary,actions'
        };

        router.calculateRoute(routeParams, (result: any) => {
            if (result.routes.length) {
                const section = result.routes[0].sections[0];
                if (routeLine.current) map.current.removeObject(routeLine.current);
                
                const lineString = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                routeLine.current = new H.map.Polyline(lineString, { style: { lineWidth: 6, strokeColor: 'rgba(0, 128, 255, 0.7)' }});
                map.current.addObject(routeLine.current);
                map.current.getViewModel().setLookAtData({ bounds: routeLine.current.getBoundingBox() });

                const nextAction = section.actions?.[0];
                const newRouteInfo: RouteInfo = {
                    distance: section.summary.length,
                    duration: section.summary.duration,
                    nextManeuver: nextAction?.instruction || 'Bắt đầu đi theo lộ trình.',
                    maneuverDistance: nextAction?.length || null,
                };
                setRouteInfo(newRouteInfo);
                initialRouteInfo.current = newRouteInfo;
                handleStartDriving(); // Automatically start driving when route is set
            }
        }, console.error);
        setSuggestions([]);
        setSearchQuery('');
    };

    const calculateRoute = (destination: { lat: number, lng: number }) => {
        if (lastPosition.current) {
            performRouteCalculation(lastPosition.current, destination);
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => performRouteCalculation(position.coords, destination),
                (error) => alert("Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí."),
                { enableHighAccuracy: true }
            );
        }
    };

    const handleLocationUpdate = useCallback(async (position: GeolocationPosition) => {
        const { latitude, longitude, speed } = position.coords;
        const speedKmh = speed ? Math.round(speed * 3.6) : 0;
        setCurrentSpeed(speedKmh);

        if (map.current) {
            const userCoords = { lat: latitude, lng: longitude };
            map.current.setCenter(userCoords);
            if (!userMarker.current) {
                const icon = new H.map.Icon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/><path d="M12 2 L12 12 L18 12" fill="none" stroke="white" stroke-width="2" transform="rotate(45 12 12)"/></svg>', {size: {w: 32, h: 32}});
                userMarker.current = new H.map.Marker(userCoords, {icon: icon});
                map.current.addObject(userMarker.current);
            } else {
                userMarker.current.setGeometry(userCoords);
            }
        }
        
        if (lastPosition.current) {
            const haversineDistance = (coords1: any, coords2: any) => {
                const toRad = (x: number) => x * Math.PI / 180;
                const R = 6371; // km
                const dLat = toRad(coords2.latitude - coords1.latitude);
                const dLon = toRad(coords2.longitude - coords1.longitude);
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) * Math.sin(dLon / 2) ** 2;
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };
            const distanceIncrement = haversineDistance(lastPosition.current, position.coords);
            setTripStats(prev => ({
                ...prev,
                distance: prev.distance + distanceIncrement,
                maxSpeed: Math.max(prev.maxSpeed, speedKmh),
                speeds: [...prev.speeds, speedKmh]
            }));
        }
        lastPosition.current = position.coords;

        const limitInfo = await getHereSpeedLimit(latitude, longitude);
        if (limitInfo) {
            setSpeedLimitInfo(limitInfo);
            const over = speedKmh > limitInfo.limit;
            if (over && !isOverspeeding) {
                setTripStats(prev => ({ ...prev, overspeedCount: prev.overspeedCount + 1 }));
            }
            setIsOverspeeding(over);
        }
    }, [isOverspeeding]);

    useEffect(() => {
        if (isOverspeeding && !hasSpoken) {
            const alertVoiceURI = localStorage.getItem('alertVoiceURI');
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === alertVoiceURI);

            const utterance = new SpeechSynthesisUtterance(`Bạn đang chạy quá tốc độ. Giới hạn là ${speedLimitInfo?.limit} km/h.`);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            window.speechSynthesis.speak(utterance);
            setHasSpoken(true);
            setTimeout(() => setHasSpoken(false), 10000);
        }
    }, [isOverspeeding, hasSpoken, speedLimitInfo]);

    const handleStartDriving = () => {
        if (navigator.geolocation) {
            setIsDriving(true);
            setTripStats({ distance: 0, startTime: Date.now(), maxSpeed: 0, speeds: [], overspeedCount: 0 });
            setLocationError(null);
            setIsSummaryVisible(false);
            watchId.current = navigator.geolocation.watchPosition(
                handleLocationUpdate,
                (error) => {
                    console.error("Geolocation error:", error);
                    setLocationError("Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí.");
                    setIsDriving(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationError("Trình duyệt của bạn không hỗ trợ định vị.");
        }
    };
    
    const handleStopDriving = () => {
        setIsDriving(false);
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (tripStats.distance > 0.1 || (tripStats.startTime && (Date.now() - tripStats.startTime) / 1000 > 60)) {
            setIsSummaryVisible(true);
        }
        setRouteInfo(null);
        initialRouteInfo.current = null;
        if (routeLine.current) {
            map.current.removeObject(routeLine.current);
            routeLine.current = null;
        }
    };

    const avgSpeed = tripStats.speeds.length > 0 ? tripStats.speeds.reduce((a, b) => a + b, 0) / tripStats.speeds.length : 0;
    const tripDuration = tripStats.startTime ? (Date.now() - tripStats.startTime) / 1000 : 0;
    
    const getTripTimeMessage = () => {
        if(!initialRouteInfo.current) return 'Bắt đầu chuyến đi để xem thời gian';
        const arrivalTime = new Date(Date.now() + routeInfo!.duration * 1000);
        return `${formatDuration(routeInfo!.duration)} · ${arrivalTime.getHours()}:${String(arrivalTime.getMinutes()).padStart(2, '0')}`;
    }

    return (
        <div className="h-full flex flex-col">
            {!isDriving && (
                <PageHeader title="Cảnh báo Tốc độ & Dẫn đường" subtitle="Lái xe an toàn với cảnh báo tốc độ và tìm đường thông minh." />
            )}
            <div className="relative flex-grow flex flex-col md:flex-row-reverse gap-4">
                 <div className="w-full md:w-1/3 flex flex-col gap-4">
                     {/* Search and Suggestions */}
                    {!isDriving && (
                         <div className="relative bg-gray-800 p-4 rounded-lg shadow-lg">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleSearch(e.target.value);
                                }}
                                placeholder="Tìm kiếm điểm đến..."
                                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full mt-2 bg-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {suggestions.map((item) => (
                                        <li
                                            key={item.id}
                                            onClick={() => calculateRoute({ lat: item.position.lat, lng: item.position.lng })}
                                            className="p-3 cursor-pointer hover:bg-gray-600 text-white"
                                        >
                                            {item.title}
                                            <p className="text-sm text-gray-400">{item.address.label}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    
                    <div className={`transition-all duration-300 flex-grow ${isDriving ? 'bg-black' : 'bg-gray-800'} p-6 rounded-lg shadow-lg flex flex-col justify-between`}>
                        {isDriving ? (
                            <div className="flex flex-col h-full">
                                {routeInfo && (
                                    <div className="bg-green-600 text-white p-4 rounded-lg mb-4 shadow-xl">
                                        <div className="flex items-center gap-4">
                                            <svg className="w-10 h-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                                            <div>
                                                <p className="text-2xl font-bold">{formatDistance(routeInfo.maneuverDistance || 0)}</p>
                                                <p className="font-semibold">{routeInfo.nextManeuver}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="text-center flex-grow flex flex-col items-center justify-center">
                                    <p className="text-lg text-gray-400">Tốc độ hiện tại</p>
                                    <h2 className={`text-8xl font-bold transition-colors duration-300 ${isOverspeeding ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {currentSpeed}
                                    </h2>
                                    <p className="text-lg text-gray-400">km/h</p>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="text-gray-400">Giới hạn tốc độ: <span className="font-bold text-xl text-yellow-400">{speedLimitInfo?.limit || '--'} km/h</span></p>
                                    <p className="text-sm text-gray-500">{speedLimitInfo?.area || 'Đang xác định...'}</p>
                                </div>
                                {routeInfo && (
                                    <div className="bg-gray-900 p-3 rounded-lg mt-4 text-center">
                                        <p className="text-lg font-semibold text-white">{getTripTimeMessage()}</p>
                                        <p className="text-gray-400">{formatDistance(routeInfo.distance)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center my-auto">
                                <h2 className="text-2xl font-bold text-white mb-2">Chế độ Lái xe</h2>
                                <p className="text-gray-400 mb-6">Nhấn Bắt đầu để theo dõi tốc độ và nhận cảnh báo.</p>
                                <InfoIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                                {locationError && <p className="text-red-500 bg-red-900/50 p-3 rounded-md">{locationError}</p>}
                            </div>
                        )}
                        <button
                            onClick={isDriving ? handleStopDriving : handleStartDriving}
                            className={`w-full py-4 mt-6 text-xl font-bold rounded-lg transition-all duration-300 shadow-xl text-white ${
                                isDriving ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isDriving ? 'Kết thúc' : 'Bắt đầu'}
                        </button>
                    </div>
                 </div>

                <div ref={mapRef} className="w-full md:w-2/3 h-64 md:h-full rounded-lg shadow-lg bg-gray-700 min-h-[300px]"></div>
            </div>
            
             <Modal isOpen={isSummaryVisible} onClose={() => setIsSummaryVisible(false)} title="Tổng kết chuyến đi">
                <div className="space-y-4 text-gray-300">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-400">Quãng đường</p>
                            <p className="text-2xl font-bold text-white">{tripStats.distance.toFixed(2)} km</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Thời gian</p>
                            <p className="text-2xl font-bold text-white">{formatDuration(tripDuration)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Tốc độ TB.</p>
                            <p className="text-2xl font-bold text-white">{avgSpeed.toFixed(0)} km/h</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Tốc độ tối đa</p>
                            <p className="text-2xl font-bold text-white">{tripStats.maxSpeed} km/h</p>
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-400">Số lần vượt tốc độ</p>
                        <p className={`text-3xl font-bold ${tripStats.overspeedCount > 0 ? 'text-red-500' : 'text-green-400'}`}>
                            {tripStats.overspeedCount}
                        </p>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button onClick={() => setIsSummaryVisible(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">Đóng</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SpeedWarning;