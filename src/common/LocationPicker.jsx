import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// 카카오맵 API 키
const KAKAO_MAP_KEY = 'ee1b3693b26a4127655cf078d33a6203';

// Leaflet 마커 아이콘 문제 해결
const DefaultIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDM2QzEyIDM2IDI0IDIzIDI0IDEyQzI0IDUuMzcyNTggMTguNjI3NCAwIDEyIDBDNS4zNzI1OCAwIDAgNS4zNzI1OCAwIDEyQzAgMjMgMTIgMzYgMTIgMzZaIiBmaWxsPSIjRkY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

L.Marker.prototype.options.icon = DefaultIcon;

// 카카오맵 API 로드 함수
const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao);
      return;
    }

    // 기존 스크립트가 있으면 제거
    const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      // kakao.maps.load를 사용하여 API 로딩 완료를 보장
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          resolve(window.kakao);
        });
      } else {
        reject(new Error('Kakao Maps API failed to load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Kakao Maps script'));
    };
    document.head.appendChild(script);
  });
};

// 카카오맵 컴포넌트
const KakaoMap = ({ selectedLocation, onLocationSelect }) => {
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);
        
        console.log('카카오맵 초기화 시작...');
        await loadKakaoMapScript();
        console.log('카카오맵 스크립트 로드 완료');
        
        if (mapRef.current && !kakaoMapRef.current) {
          const container = mapRef.current;
          const options = {
            center: new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng),
            level: 3
          };

          console.log('카카오맵 인스턴스 생성 중...', options);
          kakaoMapRef.current = new window.kakao.maps.Map(container, options);
          console.log('카카오맵 인스턴스 생성 완료');

          // 지도 클릭 이벤트
          window.kakao.maps.event.addListener(kakaoMapRef.current, 'click', async (mouseEvent) => {
            const latlng = mouseEvent.latLng;
            const lat = latlng.getLat();
            const lng = latlng.getLng();

            try {
              // 카카오 좌표 -> 주소 변환
              const geocoder = new window.kakao.maps.services.Geocoder();
              
              geocoder.coord2Address(lng, lat, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  const addr = result[0];
                  const name = addr.road_address ? 
                    `${addr.road_address.building_name || addr.road_address.region_3depth_name}` :
                    addr.address.region_3depth_name;
                  
                  const koreanAddress = addr.road_address ? 
                    addr.road_address.address_name : 
                    addr.address.address_name;
                  
                  onLocationSelect({
                    name: name,
                    koreanAddress: koreanAddress,
                    englishAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    lat: lat,
                    lng: lng
                  });
                } else {
                  onLocationSelect({
                    name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    koreanAddress: `좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    englishAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    lat: lat,
                    lng: lng
                  });
                }
              });
            } catch (error) {
              console.error('주소 변환 오류:', error);
              onLocationSelect({
                name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                koreanAddress: `좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                englishAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                lat: lat,
                lng: lng
              });
            }
          });

          // 초기 마커 설정
          if (selectedLocation.lat && selectedLocation.lng) {
            updateMarker(selectedLocation.lat, selectedLocation.lng);
          }
          
          setIsLoading(false);
          console.log('카카오맵 초기화 완료');
        }
      } catch (error) {
        console.error('카카오맵 초기화 실패:', error);
        setMapError(error.message);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

  // 선택된 위치가 변경될 때 지도 중심과 마커 업데이트
  useEffect(() => {
    if (kakaoMapRef.current && selectedLocation.lat && selectedLocation.lng) {
      const moveLatLng = new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
      kakaoMapRef.current.setCenter(moveLatLng);
      updateMarker(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation.lat, selectedLocation.lng]);

  const updateMarker = (lat, lng) => {
    if (!kakaoMapRef.current) return;

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 새 마커 생성
    const markerPosition = new window.kakao.maps.LatLng(lat, lng);
    markerRef.current = new window.kakao.maps.Marker({
      position: markerPosition
    });

    markerRef.current.setMap(kakaoMapRef.current);
  };

  if (isLoading) {
    return (
      <div className="kakao-map-container">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>카카오맵을 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="kakao-map-container">
        <div className="map-error">
          <p>❌ 카카오맵 로드 실패</p>
          <p>오류: {mapError}</p>
          <p>💡 해결 방법:</p>
          <ul>
            <li>카카오 개발자 콘솔에서 현재 도메인(localhost:3000)이 등록되어 있는지 확인</li>
            <li>JavaScript 키의 웹 플랫폼 설정 확인</li>
            <li>지도 API 사용 권한이 활성화되어 있는지 확인</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="kakao-map-container" />;
};

// 지도 클릭 이벤트 처리 컴포넌트
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: async (e) => {
      console.log('Map clicked:', e.latlng);
      const { lat, lng } = e.latlng;
      
      try {
        // 한글 주소 요청
        const responseKo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`,
          {
            headers: {
              'User-Agent': 'LocationPicker/1.0'
            }
          }
        );
        
        // 영어 주소 요청
        const responseEn = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'LocationPicker/1.0'
            }
          }
        );
        
        let koreanAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        let englishAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        if (responseKo.ok) {
          const dataKo = await responseKo.json();
          koreanAddress = dataKo.display_name || koreanAddress;
        }
        
        if (responseEn.ok) {
          const dataEn = await responseEn.json();
          englishAddress = dataEn.display_name || englishAddress;
        }
        
        // 더 의미 있는 이름 추출 (건물명이나 지역명)
        const meaningfulName = koreanAddress.split(',').slice(0, 2).join(', ');
        
        onLocationSelect({
          name: meaningfulName,
          koreanAddress: koreanAddress,
          englishAddress: englishAddress,
          lat: lat,
          lng: lng
        });
        
      } catch (error) {
        console.error('주소 검색 오류:', error);
        onLocationSelect({
          name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          koreanAddress: `좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          englishAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat: lat,
          lng: lng
        });
      }
    },
  });
  return null;
};

const LocationPicker = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
  console.log('LocationPicker rendered, isOpen:', isOpen);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || {
    name: '',
    koreanAddress: '',
    englishAddress: '',
    lat: 37.5665,
    lng: 126.9780
  });
  const [mapKey, setMapKey] = useState(0);
  const [mapType, setMapType] = useState('kakao'); // 'osm' | 'kakao'

  // 맵이 열릴 때마다 새로 렌더링
  useEffect(() => {
    if (isOpen) {
      console.log('Map opening, setting new key');
      setMapKey(prev => prev + 1);
    }
  }, [isOpen]);

  // OpenStreetMap 검색
  const searchPlacesOSM = async () => {
    try {
      const responseKo = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&limit=10&addressdetails=1&accept-language=ko`,
        {
          headers: {
            'User-Agent': 'LocationPicker/1.0'
          }
        }
      );
      
      const responseEn = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&limit=10&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'LocationPicker/1.0'
          }
        }
      );
      
      if (responseKo.ok && responseEn.ok) {
        const dataKo = await responseKo.json();
        const dataEn = await responseEn.json();
        
        const results = dataKo.map((itemKo, index) => {
          const itemEn = dataEn[index] || itemKo;
          return {
            place_name: itemKo.display_name.split(',')[0],
            korean_address: itemKo.display_name,
            english_address: itemEn.display_name,
            x: itemKo.lon,
            y: itemKo.lat
          };
        });
        setSearchResults(results);
      }
    } catch (error) {
      console.error('OSM 장소 검색 오류:', error);
      setSearchResults([]);
    }
  };

  // 카카오 장소 검색
  const searchPlacesKakao = async () => {
    try {
      await loadKakaoMapScript();
      
      const ps = new window.kakao.maps.services.Places();
      
      ps.keywordSearch(searchKeyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const results = data.map(place => ({
            place_name: place.place_name,
            korean_address: place.road_address_name || place.address_name,
            english_address: `${place.y}, ${place.x}`,
            x: place.x,
            y: place.y,
            category: place.category_name
          }));
          setSearchResults(results);
        } else {
          console.error('카카오 검색 실패:', status);
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('카카오 장소 검색 오류:', error);
      setSearchResults([]);
    }
  };

  const searchPlaces = async () => {
    if (!searchKeyword.trim()) return;

    if (mapType === 'kakao') {
      await searchPlacesKakao();
    } else {
      await searchPlacesOSM();
    }
  };

  const selectSearchResult = (place) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    
    console.log('Selected place:', { lat, lng, name: place.place_name });
    
    setSelectedLocation({
      name: place.place_name,
      koreanAddress: place.korean_address,
      englishAddress: place.english_address,
      lat: lat,
      lng: lng
    });

    setSearchResults([]);
    setSearchKeyword('');
    setMapKey(prev => prev + 1); // 맵 재렌더링
  };

  const handleConfirm = () => {
    console.log('Confirming location:', selectedLocation);
    onLocationSelect(selectedLocation);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPlaces();
    }
  };

  const handleLocationSelect = useCallback((location) => {
    console.log('Location selected via map click:', location);
    setSelectedLocation(location);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="location-picker-overlay">
      <div className="location-picker-modal">
        <div className="location-picker-header">
          <h3>위치 선택</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="location-picker-search">
          <div className="map-type-selector">
            <label>지도 타입:</label>
            <div className="map-type-buttons">
              <button 
                className={`map-type-btn ${mapType === 'kakao' ? 'active' : ''}`}
                onClick={() => {
                  setMapType('kakao');
                  setSearchResults([]);
                  setMapKey(prev => prev + 1);
                }}
              >
                카카오맵
              </button>
              <button 
                className={`map-type-btn ${mapType === 'osm' ? 'active' : ''}`}
                onClick={() => {
                  setMapType('osm');
                  setSearchResults([]);
                  setMapKey(prev => prev + 1);
                }}
              >
                OpenStreetMap
              </button>
            </div>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mapType === 'kakao' ? 
                "장소명을 입력하세요 (예: 서울역, 스타벅스)" : 
                "장소명이나 주소를 입력하세요 (예: 서울역, 강남구)"
              }
              className="search-input"
            />
            <button onClick={searchPlaces} className="search-btn">검색</button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((place, index) => (
                <div 
                  key={index}
                  className="search-result-item"
                  onClick={() => selectSearchResult(place)}
                >
                  <div className="place-name">{place.place_name}</div>
                  {place.category && <div className="place-category">{place.category}</div>}
                  <div className="place-address korean">{place.korean_address}</div>
                  <div className="place-address english">{place.english_address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="location-picker-map">
          {mapType === 'kakao' ? (
            <KakaoMap 
              selectedLocation={selectedLocation} 
              onLocationSelect={handleLocationSelect}
            />
          ) : (
            <>
              {console.log('Rendering OSM map with key:', mapKey, 'center:', [selectedLocation.lat, selectedLocation.lng])}
              <MapContainer
                key={mapKey}
                center={[selectedLocation.lat, selectedLocation.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                doubleClickZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {selectedLocation.lat && selectedLocation.lng && (
                  <Marker 
                    position={[selectedLocation.lat, selectedLocation.lng]}
                    icon={DefaultIcon}
                  />
                )}
              </MapContainer>
            </>
          )}
        </div>

        <div className="location-picker-info">
          <div className="selected-location">
            <h4>선택된 위치</h4>
            {selectedLocation.koreanAddress ? (
              <div className="location-info">
                <div className="location-name">{selectedLocation.name}</div>
                <div className="address-group">
                  <div className="location-address korean">{selectedLocation.koreanAddress}</div>
                  <div className="location-address english">{selectedLocation.englishAddress}</div>
                </div>
              </div>
            ) : (
              <div className="no-location">지도를 클릭하거나 검색으로 위치를 선택할 수 있습니다</div>
            )}
          </div>
        </div>

        <div className="location-picker-actions">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button className="confirm-btn" onClick={handleConfirm} disabled={!selectedLocation.lat}>
            선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker; 