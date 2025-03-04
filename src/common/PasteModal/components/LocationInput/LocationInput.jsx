import React, { useState } from 'react'
import ss from './LocationInput.module.css'

const LocationInput = ({ location, onLocationChange }) => {
  const [showLocationInput, setShowLocationInput] = useState(!!location)

  const handleLocationChange = (e) => {
    onLocationChange(e.target.value)
  }

  return (
    <div className={ss.locationSection}>
      <div className={ss.locationHeader}>
        <span className={ss.locationTitle}>Location</span>
        {!showLocationInput && (
          <button 
            className={ss.addLocationButton}
            onClick={() => setShowLocationInput(true)}
          >
            + Add
          </button>
        )}
      </div>
      {showLocationInput && (
        <div className={ss.locationInputWrapper}>
          <input
            type="text"
            value={location || ''}
            onChange={handleLocationChange}
            placeholder="Enter location"
            className={ss.locationInput}
          />
          {location && (
            <button 
              className={ss.deleteButton}
              onClick={() => {
                onLocationChange('')
                setShowLocationInput(false)
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationInput 