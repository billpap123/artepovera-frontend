// src/pages/PostJobPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/PostJobPage.css'; // You will need to create this new CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// These could be imported from a shared file later
const artistCategories = [ "Dancer", "Painter", "Digital Artist", "Graphic Designer", "Musician", "Sculptor", "Photographer", "Actress", "Actor", "Comedian", "Poet", "Writer", "Illustrator", "Calligrapher", "Filmmaker", "Animator", "Fashion Designer", "Architect", "Interior Designer", "Jewelry Designer", "Industrial Designer", "Ceramicist", "Woodworker" ];
const experienceLevels = ["0-3", "4-7", "7-10", ">10"];

const PostJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { userType } = useUserContext();

    // --- State for all new form fields ---
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState(''); // <-- ADD THIS NEW STATE

    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [presence, setPresence] = useState<'Physical' | 'Online' | 'Both'>('Physical');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deadline, setDeadline] = useState('');
    
    const [totalPayment, setTotalPayment] = useState<number | ''>('');
    const [isMonthly, setIsMonthly] = useState(false);
    const [monthlyPayment, setMonthlyPayment] = useState<number | ''>('');

    const [insurance, setInsurance] = useState(false);
    const [desiredKeywords, setDesiredKeywords] = useState('');
    
    // State for the 'requirements' object
    const [militaryService, setMilitaryService] = useState<'Not Applicable' | 'Completed' | 'Not Required'>('Not Applicable');
    const [degreeRequired, setDegreeRequired] = useState(false);
    const [degreeDetails, setDegreeDetails] = useState('');
    const [experience, setExperience] = useState<'0-3' | '4-7' | '7-10' | '>10'>('0-3');
    const [languages, setLanguages] = useState([{ language: '', certificate: '' }]);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // --- Dynamic field handlers ---
    const handleAddLanguage = () => {
        setLanguages([...languages, { language: '', certificate: '' }]);
    };
    
    const handleLanguageChange = (index: number, field: 'language' | 'certificate', value: string) => {
        const newLanguages = [...languages];
        newLanguages[index][field] = value;
        setLanguages(newLanguages);
    };

    const handleRemoveLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const finalCategory = category === 'Other' ? customCategory.trim() : category;

        if (!title || !finalCategory || totalPayment === '') {
          setError("Please fill out all required fields: Title, Category, and Total Payment.");
          return;
      }
  
        setIsSubmitting(true);

        const jobData = {
            title, category: finalCategory, description, location, presence,
            start_date: startDate || null,
            end_date: endDate || null,
            application_deadline: deadline || null,
            payment_total: totalPayment,
            payment_is_monthly: isMonthly,
            payment_monthly_amount: isMonthly ? (monthlyPayment || null) : null,
            insurance,
            desired_keywords: desiredKeywords,
            requirements: {
                military_service: militaryService,
                university_degree: {
                    required: degreeRequired,
                    details: degreeRequired ? degreeDetails : '',
                },
                experience_years: experience,
                // Only include languages where the language name has been filled out
                foreign_languages: languages.filter(l => l.language.trim() !== ''),
            },
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/job-postings`, jobData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Job posted successfully!");
            navigate('/main'); // Navigate to main dashboard on success
        } catch (err: any) {
            console.error("Error posting job:", err);
            setError(err.response?.data?.message || "An error occurred. Please ensure you are logged in as an Employer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if not an employer
    if (userType && userType !== 'Employer') {
        return (
            <>
                <Navbar />
                <div className="post-job-container" style={{ textAlign: 'center' }}>
                    <p className="error-message">Only employers can post jobs.</p>
                </div>
            </>
        );
    }
    
    return (
        <>
            <Navbar />
            <div className="post-job-page-container">
                <form onSubmit={handleSubmit} className="post-job-form">
                    <h1>Create a new job posting</h1>
                    <p className="form-subtitle">Provide details about the opportunity to attract the right artists.</p>

                    <fieldset>
                        <legend>Core details</legend>
                        <label>Job title*<input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Mural Artist for Downtown Cafe"/></label>
                        <label>Category*
    <select value={category} onChange={e => setCategory(e.target.value)} required>
        <option value="" disabled>Select a category...</option>
        {artistCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
        {/* Add this new option */}
        <option value="Other">Other (Please specify)</option>
    </select>
</label>

{/* This input will only appear when "Other" is selected from the dropdown */}
{category === 'Other' && (
    <div className="form-group fade-in">
        <label>Please specify category*</label>
        <input
            type="text"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="e.g., VFX Artist, Puppet Master"
            required
        />
    </div>
)}
                        <label>Short Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Briefly describe the project, the artist's role, and key deliverables."/></label>
                    </fieldset>

                    <fieldset>
                        <legend>Logistics</legend>
                        <label>Employer's location<input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Athens, Greece" /></label>
                        <label>Work presence*
                            <select value={presence} onChange={e => setPresence(e.target.value as any)}>
                                <option value="Physical">Physical / On-site</option>
                                <option value="Online">Online / Remote</option>
                                <option value="Both">Both / Hybrid</option>
                            </select>
                        </label>
                        <div className="form-row">
                            <label>Approx. start date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
                            <label>Approx. end date<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
                        </div>
                        <label>Application deadline<input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
                    </fieldset>
                    
                    <fieldset>
                        <legend>Compensation</legend>
                        <label>Total payment (EUR)*<input type="number" value={totalPayment} onChange={e => setTotalPayment(Number(e.target.value))} required min="0" placeholder="e.g., 1500" /></label>
                        <div className="form-checkbox-group"><input type="checkbox" id="isMonthly" checked={isMonthly} onChange={e => setIsMonthly(e.target.checked)} /><label htmlFor="isMonthly">Payment is per month</label></div>
                        {isMonthly && <label>Monthly amount (EUR)<input type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(Number(e.target.value))} min="0" placeholder="e.g., 500" /></label>}
                        <div className="form-checkbox-group"><input type="checkbox" id="insurance" checked={insurance} onChange={e => setInsurance(e.target.checked)} /><label htmlFor="insurance">Insurance is included</label></div>
                    </fieldset>

                    <fieldset>
                        <legend>Requirements & desired skills</legend>
                        <label>Years of experience required
                            <select value={experience} onChange={e => setExperience(e.target.value as any)}>
                                {experienceLevels.map(level => (<option key={level} value={level}>{level} years</option>))}
                            </select>
                        </label>
                        <div className="form-checkbox-group"><input type="checkbox" id="degreeRequired" checked={degreeRequired} onChange={e => setDegreeRequired(e.target.checked)} /><label htmlFor="degreeRequired">University Degree is a Requirement</label></div>
                        {degreeRequired && <label>Specify degree<input type="text" value={degreeDetails} onChange={e => setDegreeDetails(e.target.value)} placeholder="e.g., Bachelor's in Fine Arts" /></label>}
                        <label>Military service status
                            <select value={militaryService} onChange={e => setMilitaryService(e.target.value as any)}>
                                <option value="Not Applicable">Not applicable</option>
                                <option value="Completed">Completed</option>
                                <option value="Not Required">Not required</option>
                            </select>
                        </label>
                        <div className="language-section">
                            <h4>Language certificates</h4>
                            {languages.map((lang, index) => (
                                <div key={index} className="language-entry">
                                    <input type="text" placeholder="Language (e.g., English)" value={lang.language} onChange={e => handleLanguageChange(index, 'language', e.target.value)} />
                                    <input type="text" placeholder="Certificate (e.g., C2 Proficiency)" value={lang.certificate} onChange={e => handleLanguageChange(index, 'certificate', e.target.value)} />
                                    {languages.length > 1 && <button type="button" onClick={() => handleRemoveLanguage(index)} className="remove-btn">-</button>}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddLanguage} className="add-btn">+ Add language</button>
                        </div>
                        <label>Desired Keywords <textarea value={desiredKeywords} onChange={e => setDesiredKeywords(e.target.value)} rows={2} placeholder="e.g., vibrant, abstract, digital illustration, large-scale" /></label>
                    </fieldset>

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="submit-job-btn">
                        {isSubmitting ? 'Submitting...' : 'Post This Job'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default PostJobPage;