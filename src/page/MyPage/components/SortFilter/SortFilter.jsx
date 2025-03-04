import React, { useState, useRef, useEffect } from 'react';
import ss from './SortFilter.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const SortFilter = ({ sortBy, setSortBy, visibility, setVisibility }) => {
    const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const visibilityRef = useRef(null);
    const sortRef = useRef(null);

    const visibilityOptions = [
        { value: 'all', label: 'All Items' },
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' }
    ];

    const sortOptions = [
        { value: 'latest', label: 'Latest' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'title_asc', label: 'Title (A to Z)' },
        { value: 'title_desc', label: 'Title (Z to A)' },
        { value: 'likes', label: 'Most Liked' },
        { value: 'views', label: 'Most Viewed' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (visibilityRef.current && !visibilityRef.current.contains(event.target)) {
                setIsVisibilityOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCurrentLabel = (options, currentValue) => {
        return options.find(option => option.value === currentValue)?.label;
    };

    return (
        <div className={ss.container}>
            <div className={ss.filterGroup} ref={visibilityRef}>
                <button
                    className={ss.dropdownButton}
                    onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                >
                    {getCurrentLabel(visibilityOptions, visibility)}
                    <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`${ss.icon} ${isVisibilityOpen ? ss.open : ''}`}
                    />
                </button>
                {isVisibilityOpen && (
                    <div className={ss.dropdownMenu}>
                        {visibilityOptions.map(option => (
                            <button
                                key={option.value}
                                className={`${ss.dropdownItem} ${visibility === option.value ? ss.active : ''}`}
                                onClick={() => {
                                    setVisibility(option.value);
                                    setIsVisibilityOpen(false);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={ss.sortGroup} ref={sortRef}>
                <button
                    className={ss.dropdownButton}
                    onClick={() => setIsSortOpen(!isSortOpen)}
                >
                    {getCurrentLabel(sortOptions, sortBy)}
                    <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`${ss.icon} ${isSortOpen ? ss.open : ''}`}
                    />
                </button>
                {isSortOpen && (
                    <div className={ss.dropdownMenu}>
                        {sortOptions.map(option => (
                            <button
                                key={option.value}
                                className={`${ss.dropdownItem} ${sortBy === option.value ? ss.active : ''}`}
                                onClick={() => {
                                    setSortBy(option.value);
                                    setIsSortOpen(false);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SortFilter; 