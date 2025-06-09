// src/components/JobFilters.tsx
import React, { useState } from 'react';
import '../styles/JobFilters.css'; // We'll create this new CSS file

// These could be imported from a shared types file
const artistCategories = [ "Dancer", "Painter", "Digital Artist", "Graphic Designer", "Musician", "Sculptor", "Photographer", "Actress", "Actor", "Comedian", "Poet", "Writer", "Illustrator", "Calligrapher", "Filmmaker", "Animator", "Fashion Designer", "Architect", "Interior Designer", "Jewelry Designer", "Industrial Designer", "Ceramicist", "Woodworker" ];
const experienceLevels = ["0-3", "4-7", "7-10", ">10"];

// Define the shape of the filters
export interface Filters {
    keywords: string;
    location: string;
    minPayment: number | '';
    maxPayment: number | '';
    category: string;
    presence: 'Physical' | 'Online' | 'Both' | '';
    experience: string;
    insurance: 'yes' | 'no' | '';
}

interface JobFiltersProps {
    onFilterChange: (filters: Filters) => void;
}

const JobFilters: React.FC<JobFiltersProps> = ({ onFilterChange }) => {
    const [filters, setFilters] = useState<Filters>({
        keywords: '', location: '', minPayment: '', maxPayment: '',
        category: '', presence: '', experience: '', insurance: ''
    });

    const handleInputChange = (field: keyof Filters, value: string | number) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters: Filters = {
            keywords: '', location: '', minPayment: '', maxPayment: '',
            category: '', presence: '', experience: '', insurance: ''
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    return (
        <div className="job-filters">
            <h3>Find Your Next Opportunity</h3>
            <div className="filter-grid">
                <input className="filter-input keyword-filter" type="text" placeholder="Keywords (e.g., oil painting)" value={filters.keywords} onChange={(e) => handleInputChange('keywords', e.target.value)} />
                <input className="filter-input" type="text" placeholder="Location (e.g., Athens)" value={filters.location} onChange={(e) => handleInputChange('location', e.target.value)} />
                <select className="filter-select" value={filters.category} onChange={(e) => handleInputChange('category', e.target.value)}>
                    <option value="">All Categories</option>
                    {artistCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <select className="filter-select" value={filters.presence} onChange={(e) => handleInputChange('presence', e.target.value)}>
                    <option value="">Any Presence (Online/On-site)</option>
                    <option value="Physical">Physical / On-site</option>
                    <option value="Online">Online / Remote</option>
                    <option value="Both">Hybrid / Both</option>
                </select>
                <select className="filter-select" value={filters.experience} onChange={(e) => handleInputChange('experience', e.target.value)}>
                    <option value="">All Experience Levels</option>
                    {experienceLevels.map(level => (<option key={level} value={level}>{level} years</option>))}
                </select>
                <div className="budget-filter-group">
                    <input className="filter-input" type="number" placeholder="Min Payment (€)" value={filters.minPayment} onChange={(e) => handleInputChange('minPayment', e.target.value === '' ? '' : Number(e.target.value))} />
                    <span>-</span>
                    <input className="filter-input" type="number" placeholder="Max Payment (€)" value={filters.maxPayment} onChange={(e) => handleInputChange('maxPayment', e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <select className="filter-select" value={filters.insurance} onChange={(e) => handleInputChange('insurance', e.target.value)}>
                    <option value="">Any Insurance</option>
                    <option value="yes">Insurance Included</option>
                    <option value="no">No Insurance</option>
                </select>
                <button onClick={clearFilters} className="clear-filters-button">Clear Filters</button>
            </div>
        </div>
    );
};

export default JobFilters;