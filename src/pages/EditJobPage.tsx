// src/pages/EditJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import { FaTrash } from 'react-icons/fa';
// STEP 1: Import the useTranslation hook
import { useTranslation } from 'react-i18next';
import '../styles/JobForm.css';

// --- Interfaces for Job data (matching JobDetailPage) ---
interface JobRequirements {
    military_service: 'Completed' | 'Not Required' | 'Not Applicable';
    university_degree: { required: boolean; details: string; };
    foreign_languages: { language: string; certificate: string; }[];
    experience_years: '0-3' | '4-7' | '7-10' | '>10' | '';
}

interface JobData {
    title: string;
    description: string;
    category: string;
    location: string;
    presence: 'Physical' | 'Online' | 'Both';
    start_date: string;
    end_date: string;
    application_deadline: string;
    payment_is_monthly: boolean;
    payment_total: number | string;
    payment_monthly_amount: number | string;
    number_of_months: number | string;
    insurance: boolean;
    desired_keywords: string;
    requirements: JobRequirements;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Helper function to format strings: Capitalize first letter, lowercase rest.
const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EditJobPage: React.FC = () => {
    // STEP 2: Initialize the hook to get the 't' function
    const { t } = useTranslation();
    const { job_id } = useParams<{ job_id: string }>();
    const navigate = useNavigate();
    const { userType } = useUserContext();

    const [jobData, setJobData] = useState<JobData>({
        title: '', description: '', category: '', location: '',
        presence: 'Physical', start_date: '', end_date: '', application_deadline: '',
        payment_is_monthly: false, payment_total: '', payment_monthly_amount: '',
        number_of_months: '', insurance: false, desired_keywords: '',
        requirements: {
            military_service: 'Not Applicable',
            university_degree: { required: false, details: '' },
            foreign_languages: [],
            experience_years: '',
        },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!userType) return;
        if (userType !== 'Employer') {
            navigate('/main');
            return;
        }

        const fetchJobData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/job-postings/${job_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;
                // Format dates for input[type=date] which requires YYYY-MM-DD
                const formattedData = {
                    ...data,
                    start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
                    end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
                    application_deadline: data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : '',
                    requirements: { // Ensure nested requirements object exists with defaults
                        military_service: data.requirements?.military_service || 'Not Applicable',
                        university_degree: data.requirements?.university_degree || { required: false, details: '' },
                        foreign_languages: data.requirements?.foreign_languages || [],
                        experience_years: data.requirements?.experience_years || '',
                    }
                };
                setJobData(formattedData);
            } catch (err: any) {
                setError(err.response?.data?.message || t('editJobPage.error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (job_id) fetchJobData();
    }, [job_id, userType, navigate, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Handle checkbox type
        const isCheckbox = type === 'checkbox';
        const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        
        // Handle nested state for requirements
        if (name.startsWith('requirements.')) {
            const keys = name.split('.');
            setJobData(prev => ({
                ...prev,
                [keys[0]]: { ...prev.requirements, [keys[1]]: finalValue }
            }));
        } else if (name.startsWith('university_degree.')) {
             const key = name.split('.')[1];
             setJobData(prev => ({
                ...prev,
                requirements: { ...prev.requirements, university_degree: { ...prev.requirements.university_degree, [key]: finalValue } }
            }));
        } else {
            // Apply capitalization for specific fields
            if (['title', 'category', 'location'].includes(name)) {
                setJobData(prev => ({ ...prev, [name]: capitalizeFirstLetter(value) }));
            } else {
                setJobData(prev => ({ ...prev, [name]: finalValue }));
            }
        }
    };

    const handleLanguageChange = (index: number, field: 'language' | 'certificate', value: string) => {
        const newLanguages = [...jobData.requirements.foreign_languages];
        newLanguages[index][field] = value;
        setJobData(prev => ({ ...prev, requirements: { ...prev.requirements, foreign_languages: newLanguages } }));
    };

    const addLanguage = () => {
        setJobData(prev => ({ ...prev, requirements: { ...prev.requirements, foreign_languages: [...prev.requirements.foreign_languages, { language: '', certificate: '' }] } }));
    };

    const removeLanguage = (index: number) => {
        const newLanguages = jobData.requirements.foreign_languages.filter((_, i) => i !== index);
        setJobData(prev => ({ ...prev, requirements: { ...prev.requirements, foreign_languages: newLanguages } }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/job-postings/${job_id}`, jobData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(t('editJobPage.success.updated'));
            navigate('/my-jobs');
        } catch (err: any) {
            setError(err.response?.data?.message || t('editJobPage.error.updateFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <><Navbar /><div className="job-form-container"><p>{t('editJobPage.loading')}</p></div></>;
    if (error) return <><Navbar /><div className="job-form-container"><p className="error-message">{error}</p></div></>;
    
    return (
        <>
            <Navbar />
            <div className="job-form-container">
                <form onSubmit={handleSubmit} className="job-form">
                    <h2>{t('editJobPage.title')}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="title">{t('editJobPage.labels.title')}</label>
                        <input type="text" id="title" name="title" value={jobData.title} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">{t('editJobPage.labels.description')}</label>
                        <textarea id="description" name="description" value={jobData.description} onChange={handleChange} rows={6} required />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="category">{t('editJobPage.labels.category')}</label>
                            <input type="text" id="category" name="category" value={jobData.category} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">{t('editJobPage.labels.location')}</label>
                            <input type="text" id="location" name="location" value={jobData.location} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="presence">{t('editJobPage.labels.presence')}</label>
                            <select id="presence" name="presence" value={jobData.presence} onChange={handleChange}>
                                <option value="Physical">{t('editJobPage.options.presence.physical')}</option>
                                <option value="Online">{t('editJobPage.options.presence.online')}</option>
                                <option value="Both">{t('editJobPage.options.presence.both')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group-row">
                         <div className="form-group">
                            <label htmlFor="start_date">{t('editJobPage.labels.startDate')}</label>
                            <input type="date" id="start_date" name="start_date" value={jobData.start_date} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="end_date">{t('editJobPage.labels.endDate')}</label>
                            <input type="date" id="end_date" name="end_date" value={jobData.end_date} onChange={handleChange} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="application_deadline">{t('editJobPage.labels.applicationDeadline')}</label>
                            <input type="date" id="application_deadline" name="application_deadline" value={jobData.application_deadline} onChange={handleChange} />
                        </div>
                    </div>

                    <fieldset>
                        <legend>{t('editJobPage.sections.compensation')}</legend>
                        <div className="form-group form-group-inline">
                             <input type="checkbox" id="payment_is_monthly" name="payment_is_monthly" checked={jobData.payment_is_monthly} onChange={handleChange} />
                             <label htmlFor="payment_is_monthly">{t('editJobPage.labels.monthlySalaryQuestion')}</label>
                        </div>
                        {jobData.payment_is_monthly ? (
                             <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="payment_monthly_amount">{t('editJobPage.labels.monthlyAmount')}</label>
                                    <input type="number" id="payment_monthly_amount" name="payment_monthly_amount" value={jobData.payment_monthly_amount} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="number_of_months">{t('editJobPage.labels.numberOfMonths')}</label>
                                    <input type="number" id="number_of_months" name="number_of_months" value={jobData.number_of_months} onChange={handleChange} />
                                </div>
                            </div>
                        ) : (
                             <div className="form-group">
                                <label htmlFor="payment_total">{t('editJobPage.labels.totalPay')}</label>
                                <input type="number" id="payment_total" name="payment_total" value={jobData.payment_total} onChange={handleChange} />
                            </div>
                        )}
                        <div className="form-group form-group-inline">
                            <input type="checkbox" id="insurance" name="insurance" checked={jobData.insurance} onChange={handleChange} />
                            <label htmlFor="insurance">{t('editJobPage.labels.insuranceProvided')}</label>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>{t('editJobPage.sections.requirements')}</legend>
                         <div className="form-group">
                            <label htmlFor="experience_years">{t('editJobPage.labels.experienceYears')}</label>
                            <select id="experience_years" name="requirements.experience_years" value={jobData.requirements.experience_years} onChange={handleChange}>
                                <option value="">{t('editJobPage.options.experience.select')}</option>
                                <option value="0-3">0-3</option><option value="4-7">4-7</option>
                                <option value="7-10">7-10</option><option value=">10">&gt;10</option>
                            </select>
                        </div>
                         <div className="form-group form-group-inline">
                            <input type="checkbox" id="university_degree_required" name="university_degree.required" checked={jobData.requirements.university_degree.required} onChange={handleChange} />
                            <label htmlFor="university_degree_required">{t('editJobPage.labels.degreeRequired')}</label>
                        </div>
                        {jobData.requirements.university_degree.required && (
                            <div className="form-group">
                                <label htmlFor="university_degree_details">{t('editJobPage.labels.degreeDetails')}</label>
                                <input type="text" id="university_degree_details" name="university_degree.details" value={jobData.requirements.university_degree.details} onChange={handleChange} />
                            </div>
                        )}
                         <div className="form-group">
                            <label htmlFor="military_service">{t('editJobPage.labels.militaryService')}</label>
                            <select id="military_service" name="requirements.military_service" value={jobData.requirements.military_service} onChange={handleChange}>
                                <option value="Not Applicable">{t('editJobPage.options.military.notApplicable')}</option>
                                <option value="Not Required">{t('editJobPage.options.military.notRequired')}</option>
                                <option value="Completed">{t('editJobPage.options.military.completed')}</option>
                            </select>
                        </div>
                        <div className="form-group">
                             <label>{t('editJobPage.labels.foreignLanguages')}</label>
                             {jobData.requirements.foreign_languages.map((lang, index) => (
                                <div key={index} className="form-group-row language-row">
                                    <input type="text" placeholder={t('editJobPage.labels.languagePlaceholder')} value={lang.language} onChange={(e) => handleLanguageChange(index, 'language', e.target.value)} />
                                    <input type="text" placeholder={t('editJobPage.labels.certificatePlaceholder')} value={lang.certificate} onChange={(e) => handleLanguageChange(index, 'certificate', e.target.value)} />
                                    <button type="button" onClick={() => removeLanguage(index)} className="remove-btn"><FaTrash /></button>
                                </div>
                            ))}
                            <button type="button" onClick={addLanguage} className="add-btn">{t('editJobPage.buttons.addLanguage')}</button>
                        </div>
                    </fieldset>

                    <div className="form-group">
                        <label htmlFor="desired_keywords">{t('editJobPage.labels.desiredSkills')}</label>
                        <input type="text" id="desired_keywords" name="desired_keywords" value={jobData.desired_keywords} onChange={handleChange} placeholder={t('editJobPage.labels.skillsPlaceholder')} />
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? t('editJobPage.buttons.updating') : t('editJobPage.buttons.update')}
                    </button>
                </form>
            </div>
        </>
    );
};

export default EditJobPage;
