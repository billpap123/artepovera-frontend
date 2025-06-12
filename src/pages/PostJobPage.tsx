// src/pages/PostJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/PostJobPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// In a real app, this would be fetched from your /api/categories endpoint
const artistCategories = [ "Dancer", "Painter", "Digital Artist", "Graphic Designer", "Musician", "Sculptor", "Photographer", "Actress", "Actor", "Comedian", "Poet", "Writer", "Illustrator", "Calligrapher", "Filmmaker", "Animator", "Fashion Designer", "Architect", "Interior Designer", "Jewelry Designer", "Industrial Designer", "Ceramicist", "Woodworker" ].sort();
const experienceLevels = ["0-3", "4-7", "7-10", ">10"];

const PostJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { userType } = useUserContext();
    const { job_id } = useParams<{ job_id: string }>();
    const isEditMode = Boolean(job_id);

    // --- Form State ---
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [presence, setPresence] = useState<'Physical' | 'Online' | 'Both'>('Physical');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [paymentType, setPaymentType] = useState<'total' | 'monthly'>('total');
    const [totalPayment, setTotalPayment] = useState<number | ''>('');
    const [monthlyPayment, setMonthlyPayment] = useState<number | ''>('');
    const [numberOfMonths, setNumberOfMonths] = useState<number | ''>(1);
    const [insurance, setInsurance] = useState(false);
    const [desiredKeywords, setDesiredKeywords] = useState('');
    const [militaryService, setMilitaryService] = useState<'Not Applicable' | 'Completed' | 'Not Required'>('Not Applicable');
    const [degreeRequired, setDegreeRequired] = useState(false);
    const [degreeDetails, setDegreeDetails] = useState('');
    const [experience, setExperience] = useState<'0-3' | '4-7' | '7-10' | '>10'>('0-3');
    const [languages, setLanguages] = useState([{ language: '', certificate: '' }]);

    // --- UI State ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pageLoading, setPageLoading] = useState(isEditMode);

    // --- Data Fetching for Edit Mode & Auth Check ---
    useEffect(() => {
        if (userType === null) return;
        if (userType !== 'Employer') { navigate('/main'); return; }

        const fetchJobDataForEdit = async () => {
            if (!isEditMode) {
                setPageLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/job-postings/${job_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const job = response.data;
                
                setTitle(job.title || '');
                setDescription(job.description || '');
                setLocation(job.location || '');
                setPresence(job.presence || 'Physical');
                setStartDate(job.start_date ? new Date(job.start_date).toISOString().split('T')[0] : '');
                setEndDate(job.end_date ? new Date(job.end_date).toISOString().split('T')[0] : '');
                setDeadline(job.application_deadline ? new Date(job.application_deadline).toISOString().split('T')[0] : '');
                setInsurance(job.insurance || false);
                setDesiredKeywords(job.desired_keywords || '');

                setPaymentType(job.payment_is_monthly ? 'monthly' : 'total');
                setTotalPayment(job.payment_total || '');
                setMonthlyPayment(job.payment_monthly_amount || '');
                setNumberOfMonths(job.number_of_months || 1);
                
                if (artistCategories.includes(job.category)) {
                    setCategory(job.category);
                } else {
                    setCategory('Other');
                    setCustomCategory(job.category);
                }

                if (job.requirements) {
                    setMilitaryService(job.requirements.military_service || 'Not Applicable');
                    setDegreeRequired(job.requirements.university_degree?.required || false);
                    setDegreeDetails(job.requirements.university_degree?.details || '');
                    setExperience(job.requirements.experience_years || '0-3');
                    setLanguages(job.requirements.foreign_languages?.length ? job.requirements.foreign_languages : [{ language: '', certificate: '' }]);
                }

            } catch (err) {
                console.error("Failed to fetch job data for editing:", err);
                setError("Could not load job data. It may have been deleted.");
            } finally {
                setPageLoading(false);
            }
        };

        fetchJobDataForEdit();
    }, [job_id, isEditMode, userType, navigate]);

    const handleAddLanguage = () => setLanguages([...languages, { language: '', certificate: '' }]);
    const handleLanguageChange = (index: number, field: 'language' | 'certificate', value: string) => {
        const newLangs = [...languages];
        newLangs[index][field] = value;
        setLanguages(newLangs);
    };
    const handleRemoveLanguage = (index: number) => setLanguages(languages.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const finalCategory = category === 'Other' ? customCategory.trim() : category;
        
        let finalTotalPayment = 0;
        if (paymentType === 'total') {
            if (totalPayment === '' || totalPayment <= 0) {
                setError("Please enter a valid total payment amount.");
                return;
            }
            finalTotalPayment = totalPayment;
        } else { // 'monthly'
            if (monthlyPayment === '' || monthlyPayment <= 0 || numberOfMonths === '' || numberOfMonths <= 0) {
                setError("Please enter a valid monthly wage and number of months.");
                return;
            }
            finalTotalPayment = monthlyPayment * numberOfMonths;
        }

        if (!title || !finalCategory) {
            setError("Title and Category are required.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        
        const jobData = {
            title, category: finalCategory, description, location, presence,
            start_date: startDate || null,
            end_date: endDate || null,
            application_deadline: deadline || null,
            payment_total: finalTotalPayment,
            payment_is_monthly: paymentType === 'monthly',
            payment_monthly_amount: paymentType === 'monthly' ? monthlyPayment : null,
            number_of_months: paymentType === 'monthly' ? numberOfMonths : null,
            insurance,
            desired_keywords: desiredKeywords,
            requirements: {
                military_service: militaryService,
                university_degree: { required: degreeRequired, details: degreeRequired ? degreeDetails : undefined },
                experience_years: experience,
                foreign_languages: languages.filter(l => l.language.trim() !== ''),
            },
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_BASE_URL}/api/job-postings/${job_id}`, jobData, { headers: { Authorization: `Bearer ${token}` } });
                alert("Job updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/api/job-postings`, jobData, { headers: { Authorization: `Bearer ${token}` } });
                alert("Job posted successfully!");
            }
            navigate('/my-jobs');
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pageLoading) {
        return <><Navbar /><div className="post-job-container"><p>Loading job details...</p></div></>;
    }
    
    return (
        <>
            <Navbar />
            <div className="post-job-page-container">
                <form onSubmit={handleSubmit} className="post-job-form">
                    <h1>{isEditMode ? 'Edit Job Posting' : 'Create a new job posting'}</h1>
                    <p className="form-subtitle">{isEditMode ? 'Update the details for your job listing.' : 'Provide details about the opportunity to attract the right artists.'}</p>

                    <fieldset>
                        <legend>Core Details</legend>
                        <div className="form-group">
                            <label htmlFor="job-title">Job title*</label>
                            <input id="job-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Mural Artist for Downtown Cafe"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="job-category">Category*</label>
                            <select id="job-category" value={category} onChange={e => setCategory(e.target.value)} required>
                                <option value="" disabled>Select a category...</option>
                                {artistCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                <option value="Other">Other (Please specify)</option>
                            </select>
                        </div>
                        {category === 'Other' && (
                            <div className="form-group fade-in">
                                <label htmlFor="custom-category">Please specify category*</label>
                                <input id="custom-category" type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g., VFX Artist, Puppet Master" required />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="job-description">Description</label>
                            <textarea id="job-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Briefly describe the project, the artist's role, and key deliverables."/>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Logistics</legend>
                        <div className="form-group">
                            <label htmlFor="job-location">Location</label>
                            <input id="job-location" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Athens, Greece" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="job-presence">Work presence*</label>
                            <select id="job-presence" value={presence} onChange={e => setPresence(e.target.value as any)}>
                                <option value="Physical">Physical / On-site</option>
                                <option value="Online">Online / Remote</option>
                                <option value="Both">Both / Hybrid</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="start-date">Approx. start date</label>
                                <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="end-date">Approx. end date</label>
                                <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="deadline">Application deadline</label>
                            <input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>Compensation</legend>
                        <div className="form-group">
                            <label>Payment structure*</label>
                            <div className="radio-group">
                                <label className={paymentType === 'total' ? 'active' : ''}>
                                    <input type="radio" value="total" name="paymentType" checked={paymentType === 'total'} onChange={() => setPaymentType('total')} />
                                    Total project compensation
                                </label>
                                <label className={paymentType === 'monthly' ? 'active' : ''}>
                                    <input type="radio" value="monthly" name="paymentType" checked={paymentType === 'monthly'} onChange={() => setPaymentType('monthly')} />
                                    Monthly salary
                                </label>
                            </div>
                        </div>
                        {paymentType === 'total' && (
                            <div className="form-group fade-in">
                                <label htmlFor="total-payment">Total payment (EUR)*</label>
                                <input id="total-payment" type="number" value={totalPayment} onChange={e => setTotalPayment(Number(e.target.value))} required min="0" placeholder="e.g., 1500" />
                            </div>
                        )}
                        {paymentType === 'monthly' && (
                            <div className="form-row fade-in">
                                <div className="form-group">
                                    <label htmlFor="monthly-payment">Monthly wage (EUR)*</label>
                                    <input id="monthly-payment" type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(Number(e.target.value))} required min="0" placeholder="e.g., 500" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="num-months">Number of months*</label>
                                    <input id="num-months" type="number" value={numberOfMonths} onChange={e => setNumberOfMonths(Number(e.target.value))} required min="1" placeholder="e.g., 3" />
                                </div>
                            </div>
                        )}
                        <div className="form-checkbox-group">
                            <input type="checkbox" id="insurance" checked={insurance} onChange={e => setInsurance(e.target.checked)} />
                            <label htmlFor="insurance">Insurance is included</label>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Requirements & desired skills</legend>
                        <div className="form-group">
                            <label htmlFor="experience">Years of experience required</label>
                            <select id="experience" value={experience} onChange={e => setExperience(e.target.value as any)}>
                                {experienceLevels.map(level => (<option key={level} value={level}>{level} years</option>))}
                            </select>
                        </div>
                        <div className="form-checkbox-group">
                            <input type="checkbox" id="degreeRequired" checked={degreeRequired} onChange={e => setDegreeRequired(e.target.checked)} />
                            <label htmlFor="degreeRequired">University degree is a requirement</label>
                        </div>
                        {degreeRequired && 
                            <div className="form-group fade-in">
                                <label htmlFor="degree-details">Specify degree</label>
                                <input id="degree-details" type="text" value={degreeDetails} onChange={e => setDegreeDetails(e.target.value)} placeholder="e.g., Bachelor's in Fine Arts" />
                            </div>
                        }
                        <div className="form-group">
                            <label htmlFor="military-service">Military service status</label>
                            <select id="military-service" value={militaryService} onChange={e => setMilitaryService(e.target.value as any)}>
                                <option value="Not Applicable">Not applicable</option>
                                <option value="Completed">Completed</option>
                                <option value="Not Required">Not required</option>
                            </select>
                        </div>
                        <div className="language-section">
                            <h4>Language Certificates</h4>
                            {languages.map((lang, index) => (
                                <div key={index} className="language-entry">
                                    <input type="text" placeholder="Language (e.g., English)" value={lang.language} onChange={e => handleLanguageChange(index, 'language', e.target.value)} />
                                    <input type="text" placeholder="Certificate (e.g., C2 Proficiency)" value={lang.certificate} onChange={e => handleLanguageChange(index, 'certificate', e.target.value)} />
                                    {languages.length > 1 && <button type="button" onClick={() => handleRemoveLanguage(index)} className="remove-btn">-</button>}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddLanguage} className="add-btn">+ Add language</button>
                        </div>
                        <div className="form-group">
                            <label htmlFor="keywords">Desired keywords</label>
                            <textarea id="keywords" value={desiredKeywords} onChange={e => setDesiredKeywords(e.target.value)} rows={2} placeholder="e.g., vibrant, abstract, digital illustration, large-scale" />
                        </div>
                    </fieldset>

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="submit-job-btn">
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Post this job'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default PostJobPage;
