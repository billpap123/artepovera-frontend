// src/components/JobFilters.tsx
import React, { useState } from 'react';
import '../styles/JobFilters.css'; // We'll create this new CSS file
import { useTranslation } from "react-i18next";

// These could be imported from a shared types file
const artistCategories = [ "Dancer", "Painter", "Digital Artist", "Graphic Designer", "Musician", "Sculptor", "Photographer", "Actress", "Actor", "Comedian", "Poet", "Writer", "Illustrator", "Calligrapher", "Filmmaker", "Animator", "Fashion Designer", "Architect", "Interior Designer", "Jewelry Designer", "Industrial Designer", "Ceramicist", "Woodworker" ].sort();
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
    const { t } = useTranslation();



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
            <h3>{t('jobFilters.title')}</h3>
            <div className="filter-grid">
                <input
                    className="filter-input keyword-filter"
                    type="text"
                    placeholder={t('jobFilters.placeholders.keywords')}
                    value={filters.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                />
                <input
                    className="filter-input"
                    type="text"
                    placeholder={t('jobFilters.placeholders.location')}
                    value={filters.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                />
                <select className="filter-select" value={filters.category} onChange={(e) => handleInputChange('category', e.target.value)}>
                    <option value="">{t('jobFilters.options.allCategories')}</option>
                    {artistCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <select className="filter-select" value={filters.presence} onChange={(e) => handleInputChange('presence', e.target.value)}>
                    <option value="">{t('jobFilters.options.anyPresence')}</option>
                    <option value="Physical">{t('jobFilters.options.presencePhysical')}</option>
                    <option value="Online">{t('jobFilters.options.presenceOnline')}</option>
                    <option value="Both">{t('jobFilters.options.presenceHybrid')}</option>
                </select>
                <select className="filter-select" value={filters.experience} onChange={(e) => handleInputChange('experience', e.target.value)}>
                    <option value="">{t('jobFilters.options.allExperience')}</option>
                    {experienceLevels.map(level => (<option key={level} value={level}>{level} {t('jobFilters.options.yearsSuffix')}</option>))}
                </select>
                <div className="budget-filter-group">
                    <input
                        className="filter-input"
                        type="number"
                        placeholder={t('jobFilters.placeholders.minPayment')}
                        value={filters.minPayment}
                        onChange={(e) => handleInputChange('minPayment', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <span>-</span>
                    <input
                        className="filter-input"
                        type="number"
                        placeholder={t('jobFilters.placeholders.maxPayment')}
                        value={filters.maxPayment}
                        onChange={(e) => handleInputChange('maxPayment', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                </div>
                <select className="filter-select" value={filters.insurance} onChange={(e) => handleInputChange('insurance', e.target.value)}>
                    <option value="">{t('jobFilters.options.anyInsurance')}</option>
                    <option value="yes">{t('jobFilters.options.insuranceIncluded')}</option>
                    <option value="no">{t('jobFilters.options.noInsurance')}</option>
                </select>
                <button onClick={clearFilters} className="clear-filters-button">{t('jobFilters.buttons.clear')}</button>
            </div>
        </div>
    );
};

export default JobFilters;