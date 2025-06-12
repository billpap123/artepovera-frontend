// src/pages/EditJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import { FaTrash } from 'react-icons/fa';
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
                setError(err.response?.data?.message || "Could not load job data.");
            } finally {
                setLoading(false);
            }
        };

        if (job_id) fetchJobData();
    }, [job_id, userType, navigate]);

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
            alert('Job posting updated successfully!');
            navigate('/my-jobs');
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred while updating.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <><Navbar /><div className="job-form-container"><p>Loading...</p></div></>;
    if (error) return <><Navbar /><div className="job-form-container"><p className="error-message">{error}</p></div></>;
    
    return (
        <>
            <Navbar />
            <div className="job-form-container">
                <form onSubmit={handleSubmit} className="job-form">
                    <h2>Edit Job Posting</h2>
                    
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input type="text" id="title" name="title" value={jobData.title} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" value={jobData.description} onChange={handleChange} rows={6} required />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <input type="text" id="category" name="category" value={jobData.category} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input type="text" id="location" name="location" value={jobData.location} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="presence">Presence</label>
                            <select id="presence" name="presence" value={jobData.presence} onChange={handleChange}>
                                <option value="Physical">Physical</option>
                                <option value="Online">Online</option>
                                <option value="Both">Both</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group-row">
                         <div className="form-group">
                            <label htmlFor="start_date">Start Date</label>
                            <input type="date" id="start_date" name="start_date" value={jobData.start_date} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="end_date">End Date</label>
                            <input type="date" id="end_date" name="end_date" value={jobData.end_date} onChange={handleChange} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="application_deadline">Application Deadline</label>
                            <input type="date" id="application_deadline" name="application_deadline" value={jobData.application_deadline} onChange={handleChange} />
                        </div>
                    </div>

                    <fieldset>
                        <legend>Compensation</legend>
                        <div className="form-group form-group-inline">
                             <input type="checkbox" id="payment_is_monthly" name="payment_is_monthly" checked={jobData.payment_is_monthly} onChange={handleChange} />
                             <label htmlFor="payment_is_monthly">Is this a monthly salary?</label>
                        </div>
                        {jobData.payment_is_monthly ? (
                             <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="payment_monthly_amount">Monthly Amount (€)</label>
                                    <input type="number" id="payment_monthly_amount" name="payment_monthly_amount" value={jobData.payment_monthly_amount} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="number_of_months">Number of Months</label>
                                    <input type="number" id="number_of_months" name="number_of_months" value={jobData.number_of_months} onChange={handleChange} />
                                </div>
                            </div>
                        ) : (
                             <div className="form-group">
                                <label htmlFor="payment_total">Total Pay (€)</label>
                                <input type="number" id="payment_total" name="payment_total" value={jobData.payment_total} onChange={handleChange} />
                            </div>
                        )}
                        <div className="form-group form-group-inline">
                            <input type="checkbox" id="insurance" name="insurance" checked={jobData.insurance} onChange={handleChange} />
                            <label htmlFor="insurance">Insurance Provided</label>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>Requirements</legend>
                         <div className="form-group">
                            <label htmlFor="experience_years">Experience Years</label>
                            <select id="experience_years" name="requirements.experience_years" value={jobData.requirements.experience_years} onChange={handleChange}>
                                <option value="">Select range...</option>
                                <option value="0-3">0-3</option><option value="4-7">4-7</option>
                                <option value="7-10">7-10</option><option value=">10">&gt;10</option>
                            </select>
                        </div>
                         <div className="form-group form-group-inline">
                            <input type="checkbox" id="university_degree_required" name="university_degree.required" checked={jobData.requirements.university_degree.required} onChange={handleChange} />
                            <label htmlFor="university_degree_required">University Degree Required?</label>
                        </div>
                        {jobData.requirements.university_degree.required && (
                            <div className="form-group">
                                <label htmlFor="university_degree_details">Degree Details (Optional)</label>
                                <input type="text" id="university_degree_details" name="university_degree.details" value={jobData.requirements.university_degree.details} onChange={handleChange} />
                            </div>
                        )}
                         <div className="form-group">
                            <label htmlFor="military_service">Military Service</label>
                            <select id="military_service" name="requirements.military_service" value={jobData.requirements.military_service} onChange={handleChange}>
                                <option value="Not Applicable">Not Applicable</option>
                                <option value="Not Required">Not Required</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="form-group">
                             <label>Foreign Languages</label>
                             {jobData.requirements.foreign_languages.map((lang, index) => (
                                <div key={index} className="form-group-row language-row">
                                    <input type="text" placeholder="Language" value={lang.language} onChange={(e) => handleLanguageChange(index, 'language', e.target.value)} />
                                    <input type="text" placeholder="Certificate (e.g., C2)" value={lang.certificate} onChange={(e) => handleLanguageChange(index, 'certificate', e.target.value)} />
                                    <button type="button" onClick={() => removeLanguage(index)} className="remove-btn"><FaTrash /></button>
                                </div>
                            ))}
                            <button type="button" onClick={addLanguage} className="add-btn">Add Language</button>
                        </div>
                    </fieldset>

                    <div className="form-group">
                        <label htmlFor="desired_keywords">Desired Skills (comma-separated)</label>
                        <input type="text" id="desired_keywords" name="desired_keywords" value={jobData.desired_keywords} onChange={handleChange} placeholder="e.g., painting, sculpture, photoshop" />
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Update Job'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default EditJobPage;
