import React from 'react';

const ProximityPlaceButtons = ({ 
  selectedPlace, 
  onPlaceClick, 
  onClearPlaces, 
  showingNearbyPlaces 
}) => {
  
  const proximityPlaces = [
    {
      id: 'restaurant',
      label: 'ร้านอาหาร',
      icon: '🍽️',
      color: 'bg-red-500 hover:bg-red-600',
      lightColor: 'bg-red-100 text-red-700 border-red-300'
    },
    {
      id: 'health',
      label: 'สถานพยาบาล',
      icon: '🏥',
      color: 'bg-green-500 hover:bg-green-600',
      lightColor: 'bg-green-100 text-green-700 border-green-300'
    },
    {
      id: 'school',
      label: 'สถานศึกษา',
      icon: '🎓',
      color: 'bg-blue-500 hover:bg-blue-600',
      lightColor: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    {
      id: 'convenience',
      label: 'ร้านสะดวกซื้อ',
      icon: '🏪',
      color: 'bg-orange-500 hover:bg-orange-600',
      lightColor: 'bg-orange-100 text-orange-700 border-orange-300'
    },
    {
      id: 'transport',
      label: 'ขนส่งสาธารณะ',
      icon: '🚌',
      color: 'bg-purple-500 hover:bg-purple-600',
      lightColor: 'bg-purple-100 text-purple-700 border-purple-300'
    }
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Place Buttons - Horizontal scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 pb-1">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap mr-2">
            สถานที่ใกล้เคียง:
          </span>
          
          {proximityPlaces.map(place => {
            const isSelected = selectedPlace === place.id;
            
            return (
              <button
                key={place.id}
                onClick={() => onPlaceClick(place.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200 whitespace-nowrap border
                  ${isSelected 
                    ? `${place.lightColor} border shadow-sm` 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">{place.icon}</span>
                <span>{place.label}</span>
                {isSelected && showingNearbyPlaces && (
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Clear Button */}
        {showingNearbyPlaces && (
          <button
            onClick={onClearPlaces}
            className="
              flex items-center gap-1 px-3 py-1.5 ml-4
              bg-gray-100 text-gray-600 rounded-lg text-sm font-medium
              hover:bg-gray-200 transition-colors whitespace-nowrap
              border border-gray-200
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">ล้าง</span>
          </button>
        )}
      </div>

      {/* Active Status Indicator */}
      {showingNearbyPlaces && selectedPlace && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">
              กำลังแสดง{proximityPlaces.find(p => p.id === selectedPlace)?.label}ใกล้เคียง
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProximityPlaceButtons;