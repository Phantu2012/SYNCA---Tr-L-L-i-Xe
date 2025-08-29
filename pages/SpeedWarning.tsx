import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { InfoIcon } from '../components/Icons';

// HERE.com API Key provided by user
const HERE_API_KEY = "XQBo-jdyd764vuY1DnMpQgbdQblpfY9bo-a8xd9RAyg";

interface SpeedLimitInfo {
    limit: number;
    area: string;
}

// Fetches the speed limit for a given location using the HERE.com Fleet Telematics API.
const getHereSpeedLimit = async (lat: number, lon: number): Promise<SpeedLimitInfo | null> => {
    // FIX: Switched to the Fleet Telematics API endpoint which has proper CORS headers for browser requests and reliably provides speed limit data.
    // Also updated the parameter from 'prox' to 'proximal' and added logic to convert speed from m/s to km/h.
    const url = `https://fleet.ls.hereapi.com/2/reversegeocode.json?proximal=${lat},${lon},250&mode=retrieveAddresses&locationattributes=linkInfo&apiKey=${HERE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching from HERE API: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Error Body:", errorBody);
            return null;
        }

        const data = await response.json();
        
        const result = data?.Response?.View?.[0]?.Result?.[0];
        const speedLimitValue = result?.Location?.LinkInfo?.SpeedLimit?.Value;
        const address = result?.Location?.Address;

        if (speedLimitValue) {
            // Fleet API returns speed in m/s, convert it to km/h
            const speedMs = parseFloat(speedLimitValue);
            const limitKmh = Math.round(speedMs * 3.6);
            
            const area = address?.Label || address?.Street || 'Khu vực không xác định';
            return {
                limit: limitKmh,
                area: area,
            };
        }
        
        console.warn("HERE API response did not contain valid speed limit information for this location.", data);
        return null; // No speed limit data found
        
    } catch (error) {
        console.error("Failed to call HERE API:", error);
        return null;
    }
};


// A simple simulated route for the map display
const MOCK_ROUTE_POINTS = [
    { x: 20, y: 130 }, { x: 50, y: 125 }, { x: 80, y: 140 }, { x: 120, y: 110 },
    { x: 160, y: 100 }, { x: 200, y: 80 }, { x: 240, y: 60 }, { x: 280, y: 40 }
];
const TOTAL_DISTANCE = 15; // km

const MapDisplay: React.FC<{
    route: {x: number, y: number}[],
    currentIndex: number,
    destination: string,
    distance: number
}> = ({ route, currentIndex, destination, distance }) => {
    if (!route || route.length === 0) return null;

    const currentPos = route[currentIndex];
    const endPos = route[route.length - 1];
    const routeString = route.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="w-full max-w-lg mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center">
                 <div>
                    <h4 className="text-lg font-semibold text-white">Đang đến: {destination}</h4>
                    <p className="text-blue-400">Quãng đường còn lại: {distance.toFixed(1)} km</p>
                 </div>
            </div>
            <div className="relative mt-3 aspect-[2/1] bg-gray-700 rounded-md overflow-hidden border-2 border-gray-600">
                <svg width="100%" height="100%" viewBox="0 0 300 150">
                    <polyline points={routeString} fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                    <circle cx={endPos.x} cy={endPos.y} r="6" fill="#10B981" />
                    <circle cx={endPos.x} cy={endPos.y} r="10" fill="rgba(16, 185, 129, 0.5)" />
                    <circle cx={currentPos.x} cy={currentPos.y} r="8" fill="#f59e0b" stroke="white" strokeWidth="2" />
                </svg>
            </div>
        </div>
    );
};

const SpeedWarning: React.FC = () => {
    const [isDriving, setIsDriving] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [speedLimitInfo, setSpeedLimitInfo] = useState<SpeedLimitInfo | null>(null);
    const [statusMessage, setStatusMessage] = useState('Sẵn sàng kích hoạt chế độ lái xe.');
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    // FIX: Use environment-agnostic type for setInterval return value.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const positionWatcher = useRef<number | null>(null);

    // Speed simulation state
    const [routeIndex, setRouteIndex] = useState(0);
    const [distanceLeft, setDistanceLeft] = useState(TOTAL_DISTANCE);
    
    // Request Location Permission
    const requestLocation = () => {
        const hasRequested = localStorage.getItem('hasRequestedLocation');
        if (!hasRequested || !hasLocationPermission) {
            const consent = window.confirm("Synca cần biết vị trí của bạn để cung cấp tính năng Cảnh báo tốc độ giới hạn chính xác. Chúng tôi chỉ sử dụng vị trí khi bạn đang bật chế độ lái xe.");
            if (consent) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Location permission granted.", position.coords);
                        setHasLocationPermission(true);
                        startDrivingMode(position.coords);
                        localStorage.setItem('hasRequestedLocation', 'true');
                    },
                    (error) => {
                        console.error("Location permission denied.", error);
                        setStatusMessage("Không thể truy cập vị trí. Vui lòng cấp quyền để sử dụng tính năng này.");
                        setHasLocationPermission(false);
                    },
                    { enableHighAccuracy: true }
                );
            }
        } else {
            // Permission already granted, just get position
             navigator.geolocation.getCurrentPosition(p => startDrivingMode(p.coords), e => console.error(e));
        }
    };


    const startDrivingMode = (initialCoords?: GeolocationCoordinates) => {
        setIsDriving(true);
        setStatusMessage('Đang lấy dữ liệu tốc độ...');

        // Start watching position
        positionWatcher.current = navigator.geolocation.watchPosition(
            (position) => {
                const speedKmh = position.coords.speed ? position.coords.speed * 3.6 : currentSpeed;
                setCurrentSpeed(Math.round(speedKmh));
                getSpeedLimitForPosition(position.coords);
            },
            (error) => {
                console.error("Error watching position:", error);
                setStatusMessage("Mất tín hiệu GPS.");
            },
            { enableHighAccuracy: true }
        );

        // Start speed & map simulation
        intervalRef.current = setInterval(() => {
            setCurrentSpeed(prev => Math.max(0, Math.min(120, prev + (Math.random() - 0.45) * 10)));
            setRouteIndex(prev => (prev + 1) % MOCK_ROUTE_POINTS.length);
            setDistanceLeft(prev => Math.max(0, prev - (TOTAL_DISTANCE / MOCK_ROUTE_POINTS.length)));
        }, 2000);
        
        // Initial fetch
        if (initialCoords) {
             getSpeedLimitForPosition(initialCoords);
        }
    };
    
    const getSpeedLimitForPosition = async (coords: GeolocationCoordinates) => {
        setStatusMessage("Đang cập nhật giới hạn tốc độ...");
        const limitInfo = await getHereSpeedLimit(coords.latitude, coords.longitude);
        setSpeedLimitInfo(limitInfo);
        if(limitInfo) {
            setStatusMessage(`Đang di chuyển tại: ${limitInfo.area}`);
        } else {
            setStatusMessage("Không tìm thấy dữ liệu giới hạn tốc độ cho khu vực này.");
        }
    };


    const stopDrivingMode = () => {
        setIsDriving(false);
        setCurrentSpeed(0);
        setSpeedLimitInfo(null);
        setStatusMessage('Chế độ lái xe đã tắt.');
        setRouteIndex(0);
        setDistanceLeft(TOTAL_DISTANCE);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (positionWatcher.current !== null) {
            navigator.geolocation.clearWatch(positionWatcher.current);
            positionWatcher.current = null;
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            stopDrivingMode();
        };
    }, []);

    const isOverspeeding = speedLimitInfo && currentSpeed > speedLimitInfo.limit;

    return (
        <div>
            <PageHeader title="Chế độ Lái xe & Cảnh báo Tốc độ" subtitle="Lái xe an toàn hơn với cảnh báo tốc độ giới hạn theo thời gian thực." />
            
            <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-2xl">
                <div className={`relative w-64 h-64 flex items-center justify-center transition-all duration-500 ${isOverspeeding ? 'animate-pulse' : ''}`}>
                    <div className={`absolute inset-0 border-8 rounded-full ${isOverspeeding ? 'border-red-500' : 'border-gray-600'}`}></div>
                    <div className={`absolute inset-4 border-8 rounded-full ${isOverspeeding ? 'border-red-500/50' : 'border-gray-700'}`}></div>
                    
                    <div className="text-center">
                        <span className="text-gray-400 text-lg">Tốc độ hiện tại</span>
                        <h2 className={`text-7xl font-bold transition-colors ${isOverspeeding ? 'text-red-400' : 'text-white'}`}>{currentSpeed}</h2>
                        <span className="text-gray-400">km/h</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-lg text-gray-300">Tốc độ giới hạn</p>
                    <p className="text-4xl font-bold text-green-400">{speedLimitInfo ? speedLimitInfo.limit : '--'}</p>
                    <p className="mt-2 text-sm text-gray-400 h-5">{statusMessage}</p>
                </div>

                <button
                    onClick={isDriving ? stopDrivingMode : requestLocation}
                    className={`mt-8 px-10 py-4 text-xl font-bold rounded-full shadow-lg transform transition-transform hover:scale-105 ${
                        isDriving ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                >
                    {isDriving ? 'Dừng Lái xe' : 'Bắt đầu Lái xe'}
                </button>
            </div>

            {isDriving && (
                <MapDisplay 
                    route={MOCK_ROUTE_POINTS}
                    currentIndex={routeIndex}
                    destination="Trung tâm thành phố"
                    distance={distanceLeft}
                />
            )}

            <div className="mt-8 bg-gray-800/50 p-4 rounded-lg flex items-start gap-3">
                <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-white">Lưu ý quan trọng</h4>
                    <p className="text-sm text-gray-400">
                        Tính năng này sử dụng GPS và dữ liệu từ HERE.com. Dữ liệu có thể không chính xác 100% trong mọi điều kiện. Luôn tuân thủ biển báo giao thông và lái xe cẩn thận.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SpeedWarning;
