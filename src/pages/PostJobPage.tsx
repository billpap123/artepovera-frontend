// src/pages/PostJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/PostJobPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const artistCategories = [ "Dancer", "Painter", "Digital Artist", "Graphic Designer", "Musician", "Sculptor", "Photographer", "Actress", "Actor", "Comedian", "Poet", "Writer", "Illustrator", "Calligrapher", "Filmmaker", "Animator", "Fashion Designer", "Architect", "Interior Designer", "Jewelry Designer", "Industrial Designer", "Ceramicist", "Woodworker" ];
const experienceLevels = ["0-3", "4-7", "7-10", ">10"];

const PostJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { userType } = useUserContext();
    const { job_id } = useParams<{ job_id: string }>();
    const isEditMode = Boolean(job_id);

    // --- State for all form fields ---
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [presence, setPresence] = useState<'Physical' | 'Online' | 'Both'>('Physical');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deadline, setDeadline] = useState('');
    
    // --- NEW: State for the updated payment logic ---
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

    // --- Data Fetching and Authorization Effect ---
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
                
                // Populate all form fields with the fetched data
                setTitle(job.title || '');
                setDescription(job.description || '');
                setLocation(job.location || '');
                setPresence(job.presence || 'Physical');
                setStartDate(job.start_date ? new Date(job.start_date).toISOString().split('T')[0] : '');
                setEndDate(job.end_date ? new Date(job.end_date).toISOString().split('T')[0] : '');
                setDeadline(job.application_deadline ? new Date(job.application_deadline).toISOString().split('T')[0] : '');
                setInsurance(job.insurance || false);
                setDesiredKeywords(job.desired_keywords || '');

                // Set payment details
                setPaymentType(job.payment_is_monthly ? 'monthly' : 'total');
                setTotalPayment(job.payment_total || '');
                setMonthlyPayment(job.payment_monthly_amount || '');
                setNumberOfMonths(job.number_of_months || 1);
                
                // Set category
                if (artistCategories.includes(job.category)) {
                    setCategory(job.category);
                } else {
                    setCategory('Other');
                    setCustomCategory(job.category);
                }

                // Set requirements
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

    // --- Form Handlers ---
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
        return <><Navbar /><div className="post-job-container"><p>Loading...</p></div></>;
    }
    
    return (
        <>
            <Navbar />
            <div className="post-job-page-container">
                <form onSubmit={handleSubmit} className="post-job-form">
                    <h1>{isEditMode ? 'Edit Job Posting' : 'Create a New Job Posting'}</h1>
                    <p className="form-subtitle">{isEditMode ? 'Update the details for your job listing.' : 'Provide details about the opportunity to attract the right artists.'}</p>

                    <fieldset>{/* Core Details */}</fieldset>
                    <fieldset>{/* Logistics */}</fieldset>
                    
                    {/* --- UPDATED COMPENSATION FIELDSET --- */}
                    <fieldset>
                        <legend>Compensation</legend>
                        <div className="form-group">
                            <label>Payment Structure*</label>
                            <div className="radio-group">
                                <label className={paymentType === 'total' ? 'active' : ''}>
                                    <input type="radio" value="total" name="paymentType" checked={paymentType === 'total'} onChange={() => setPaymentType('total')} />
                                    Total Project Amount
                                </label>
                                <label className={paymentType === 'monthly' ? 'active' : ''}>
                                    <input type="radio" value="monthly" name="paymentType" checked={paymentType === 'monthly'} onChange={() => setPaymentType('monthly')} />
                                    Monthly Salary
                                </label>
                            </div>
                        </div>

                        {paymentType === 'total' && (
                            <div className="form-group fade-in">
                                <label>Total Payment (EUR)*
                                    <input type="number" value={totalPayment} onChange={e => setTotalPayment(Number(e.target.value))} required min="0" placeholder="e.g., 1500" />
                                </label>
                            </div>
                        )}

                        {paymentType === 'monthly' && (
                            <div className="form-row fade-in">
                                <label>Monthly Wage (EUR)*
                                    <input type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(Number(e.target.value))} required min="0" placeholder="e.g., 500" />
                                </label>
                                <label>Number of Months*
                                    <input type="number" value={numberOfMonths} onChange={e => setNumberOfMonths(Number(e.target.value))} required min="1" placeholder="e.g., 3" />
                                </label>
                            </div>
                        )}
                        <div className="form-checkbox-group"><input type="checkbox" id="insurance" checked={insurance} onChange={e => setInsurance(e.target.checked)} /><label htmlFor="insurance">Insurance is included</label></div>
                    </fieldset>

                    <fieldset>{/* Requirements */}</fieldset>

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="submit-job-btn">
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Post This Job'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default PostJobPage;
