
import React, { useState, useEffect } from 'react';
import { 
  LogoIcon, MailIcon, LockIcon, ChevronLeftIcon, UserIcon, PhoneIcon, MapPinIcon, LocateIcon,
  HomeIcon, EditIcon, TrashIcon, LogOutIcon, CameraIcon, HelpCircleIcon, XIcon, CheckCircleIcon,
  AlertTriangleIcon, InfoIcon
} from './components/icons';

type AuthScreen = 'welcome' | 'email' | 'otp' | 'profileSetup';
type AppState = 'auth' | 'dashboard' | 'admin';
type ActiveTab = 'home' | 'profile' | 'inDevelopment' | 'enquiryForm' | 'status';
type AdminScreen = 'login' | 'dashboard';
type AdminActiveTab = 'enquiries' | 'customers';
type NotificationType = 'success' | 'error' | 'info';

// Enquiry Form State and Types moved outside the component
const initialEnquiryState = {
    propertyType: '', propertyTypeOther: '', ownership: '', buildingAge: '', propertyAddress: '',
    roofType: '', roofTypeOther: '', roofOrientation: [] as string[], roofArea: '', roofCondition: '',
    roofInstallYear: '', roofAge: '', leaksLast5Years: '', leaksDescription: '',
    electricityProvider: '', connectionType: '', avgMonthlyBill: '', avgMonthlyConsumption: '',
    meterLocation: '', meterLocationOther: '',
    systemType: '', backupRequirement: '', batteryType: '', desiredCapacity: '', budget: '',
    roofAccess: '', shadeOnRoof: '', preferredInstallDate: '',
    additionalNotes: '', consent: false, signature: '', signatureDate: ''
};
type EnquiryFormState = typeof initialEnquiryState;
type EnquiryKeys = keyof EnquiryFormState;

type FileWithPreview = { file: File, preview: string, base64: string };
type FilesData = { [key: string]: { name: string, type: string, base64: string }[] };
const initialProfileState = {
  fullName: '', phone: '', address: '', city: '', postalCode: '', country: '',
};
type Profile = typeof initialProfileState;

type EnquirySubmission = {
  id: string;
  submittedAt: Date;
  formData: EnquiryFormState;
  filesData: FilesData;
  userEmail: string;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Rejected';
};

// --- Helper Functions ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

// Stable Form Field Components
const TextInput = ({ label, name, value, onChange, placeholder, type = 'text', required = false }: {
    label: string; name: EnquiryKeys; value: string; placeholder?: string; type?: string; required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => (
    <div className="space-y-2">
        <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label>
        <input type={type} name={name} id={name} placeholder={placeholder || label} value={value} onChange={onChange} required={required} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
);

const SelectInput = ({ label, name, value, onChange, children, required = false }: {
    label: string; name: EnquiryKeys; value: string; children?: React.ReactNode; required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
    <div className="space-y-2">
        <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label>
        <div className="relative">
            <select 
                name={name} 
                id={name} 
                value={value} 
                onChange={onChange} 
                required={required} 
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-4 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/>
                </svg>
            </div>
        </div>
    </div>
);

const FileUpload = ({ label, name, files, onChange, multiple = false, required = false }: {
    label: string; name: string; files: FileWithPreview[] | undefined; multiple?: boolean; required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    const hasFiles = files && files.length > 0;
    const isRequired = required && !hasFiles;

    return (
        <div className="space-y-2">
            <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label>
            <div className="relative">
                <input type="file" name={name} id={name} multiple={multiple} onChange={onChange} required={isRequired} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label={label} accept="image/*" />
                <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 flex items-center justify-center text-center min-h-[80px]">
                    <div className="pointer-events-none">
                        <CameraIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-400">
                            {hasFiles ? `${files.length} file(s) selected` : `Click to attach file(s)`}
                        </p>
                    </div>
                </div>
            </div>
            {hasFiles && (
                <div className={`mt-3 grid gap-3 ${multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2'}`}>
                    {files.map((fileWrapper, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={fileWrapper.preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md border border-gray-700" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('auth');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Profile State
  const [profile, setProfile] = useState<Profile>(initialProfileState);
  const [editedProfile, setEditedProfile] = useState<Profile>(initialProfileState);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState(initialEnquiryState);
  const [formFiles, setFormFiles] = useState<{ [key: string]: FileWithPreview[] }>({});
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>([]);

  // Admin State
  const [adminScreen, setAdminScreen] = useState<AdminScreen>('login');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminActiveTab>('enquiries');
  const [allEnquiries, setAllEnquiries] = useState<EnquirySubmission[]>([]);
  const [allCustomers, setAllCustomers] = useState<{ [email: string]: Profile }>({});

  // Notification and Modal State
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void; } | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info', duration: number = 4000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  };

  // Check for saved user session on initial load
  useEffect(() => {
    const currentUserEmail = localStorage.getItem('oceanSolarCurrentUserEmail');
    if (currentUserEmail) {
      const storedProfiles = localStorage.getItem('oceanSolarProfiles');
      if (storedProfiles) {
        try {
          const profiles = JSON.parse(storedProfiles);
          const userProfile = profiles[currentUserEmail];
          if (userProfile) {
            setEmail(currentUserEmail);
            setProfile(userProfile);
            setAppState('dashboard');
            setActiveTab('home');
          } else {
            localStorage.removeItem('oceanSolarCurrentUserEmail');
          }
        } catch (error) {
          console.error("Failed to parse profiles from localStorage", error);
          localStorage.removeItem('oceanSolarProfiles');
          localStorage.removeItem('oceanSolarCurrentUserEmail');
        }
      }
    }
  }, []);

  useEffect(() => {
    // Cleanup object URLs on unmount to prevent memory leaks
    return () => {
      Object.values(formFiles).flat().forEach((fileWrapper: FileWithPreview) => {
        if (fileWrapper && fileWrapper.preview) {
          URL.revokeObjectURL(fileWrapper.preview);
        }
      });
    };
  }, [formFiles]);

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    const lowerCaseEmail = email.toLowerCase();
    if (lowerCaseEmail === 'test@gmail.com') {
      const mockProfile = {
        fullName: 'Alex Ray',
        phone: '555-123-4567',
        address: '123 Solar Way',
        city: 'Sunnyvale',
        postalCode: '94086',
        country: 'USA',
      };
      setProfile(mockProfile);
      
      try {
        const storedProfiles = localStorage.getItem('oceanSolarProfiles');
        const profiles = storedProfiles ? JSON.parse(storedProfiles) : {};
        profiles[lowerCaseEmail] = mockProfile;
        localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles));
        localStorage.setItem('oceanSolarCurrentUserEmail', lowerCaseEmail);
      } catch (error) {
        console.error("Failed to save mock profile", error);
      }

      setAppState('dashboard');
      setActiveTab('home');
    } else {
      setAuthScreen('otp');
    }
  };
  
  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    
    const storedProfiles = localStorage.getItem('oceanSolarProfiles');
    const lowerCaseEmail = email.toLowerCase();
    
    if (storedProfiles) {
      try {
        const profiles = JSON.parse(storedProfiles);
        const userProfile = profiles[lowerCaseEmail];
        
        if (userProfile && userProfile.fullName) {
          setProfile(userProfile);
          localStorage.setItem('oceanSolarCurrentUserEmail', lowerCaseEmail);
          setAppState('dashboard');
        } else {
          setAuthScreen('profileSetup');
        }
      } catch (error) {
        console.error("Error reading profiles, proceeding to setup.", error);
        setAuthScreen('profileSetup');
      }
    } else {
      setAuthScreen('profileSetup');
    }
  };

  const handleEnquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
        setEnquiryForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setEnquiryForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setEnquiryForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    
    if (formFiles[name]) {
        formFiles[name].forEach(file => URL.revokeObjectURL(file.preview));
    }

    if (files && files.length > 0) {
        const fileArray = await Promise.all(Array.from(files).map(async (file: File) => {
            const base64 = await blobToBase64(file);
            return {
                file,
                preview: URL.createObjectURL(file),
                base64: base64,
            };
        }));
        setFormFiles(prev => ({...prev, [name]: fileArray}));
    } else {
        setFormFiles(prev => ({...prev, [name]: []}));
    }
  };

  const handleEnquirySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const filesData: FilesData = {};
    for (const key in formFiles) {
        filesData[key] = formFiles[key].map(f => ({
            name: f.file.name,
            type: f.file.type,
            base64: f.base64
        }));
    }

    const newEnquiry: EnquirySubmission = {
      id: `ENQ-${Date.now()}`,
      submittedAt: new Date(),
      formData: enquiryForm,
      filesData: filesData,
      userEmail: email,
      status: 'Submitted',
    };
    
    try {
        const allEnquiriesRaw = localStorage.getItem('oceanSolarAllEnquiries');
        const allEnquiries = allEnquiriesRaw ? JSON.parse(allEnquiriesRaw) : [];
        allEnquiries.unshift(newEnquiry);
        localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(allEnquiries));
        setEnquiries(prev => [newEnquiry, ...prev]); // Update local state for user view
    } catch (error) {
        console.error("Failed to save enquiry", error);
        showNotification("An error occurred while submitting your enquiry.", 'error');
        return;
    }

    showNotification('Enquiry Submitted Successfully!', 'success');
    setEnquiryForm(initialEnquiryState);
    Object.values(formFiles).flat().forEach((f: FileWithPreview) => URL.revokeObjectURL(f.preview));
    setFormFiles({});
    setActiveTab('home');
  };

  const handleProfileSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleEditedProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdateProfile = () => {
    try {
      const storedProfiles = localStorage.getItem('oceanSolarProfiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : {};
      profiles[email] = editedProfile;
      localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles));
      setProfile(editedProfile);
      setIsEditingProfile(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
       console.error("Failed to update profile", error);
       showNotification("An error occurred while updating your profile. Please try again.", 'error');
    }
  };
  
  const handleDeleteAccount = () => {
    setConfirmModal({
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      onConfirm: () => {
        try {
          const storedProfiles = localStorage.getItem('oceanSolarProfiles');
          if (storedProfiles) {
              const profiles = JSON.parse(storedProfiles);
              delete profiles[email];
              localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles));
          }
          showNotification('Account deleted successfully.', 'success');
        } catch (error) {
            console.error("Failed to delete profile", error);
            showNotification('Failed to delete profile from storage.', 'error');
        }
        setConfirmModal(null);
        handleLogout();
      },
    });
  };
  
  const handleLogout = () => {
    localStorage.removeItem('oceanSolarCurrentUserEmail');
    setAppState('auth');
    setAuthScreen('welcome');
    setActiveTab('home');
    setEmail('');
    setOtp('');
    setProfile(initialProfileState);
    setIsEditingProfile(false);
    setEnquiryForm(initialEnquiryState);
    setEnquiries([]);
    Object.values(formFiles).flat().forEach((f: FileWithPreview) => URL.revokeObjectURL(f.preview));
    setFormFiles({});
  };

  const handleCompleteRegistration = () => {
    if (!profile.fullName || !profile.phone) {
      showNotification("Please enter your full name and phone number to complete registration.", 'error');
      return;
    }
    try {
      const storedProfiles = localStorage.getItem('oceanSolarProfiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : {};
      const lowerCaseEmail = email.toLowerCase();
      profiles[lowerCaseEmail] = profile;
      localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles));
      localStorage.setItem('oceanSolarCurrentUserEmail', lowerCaseEmail);
      setAppState('dashboard');
    } catch (error) {
      console.error("Failed to save profile", error);
      showNotification("An error occurred while saving your profile. Please try again.", 'error');
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'info');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Failed to fetch address.');
          const data = await response.json();
          const address = data.address;
          setProfile(prev => ({
            ...prev,
            address: `${address.road || ''} ${address.house_number || ''}`.trim() || data.display_name.split(',').slice(0, 2).join(', '),
            city: address.city || address.town || address.village || '',
            postalCode: address.postcode || '',
            country: address.country || '',
          }));
        } catch (error) {
          console.error('Error fetching address:', error);
          showNotification('Could not retrieve address information. Please enter it manually.', 'error');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        if (error.code === error.PERMISSION_DENIED) errorMessage = "You denied the request for Geolocation.";
        else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Location information is unavailable.";
        else if (error.code === error.TIMEOUT) errorMessage = "The request to get user location timed out.";
        showNotification(errorMessage, 'error');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // --- ADMIN FUNCTIONS ---
  const handleAdminLogin = () => {
    try {
      const enquiriesRaw = localStorage.getItem('oceanSolarAllEnquiries');
      const profilesRaw = localStorage.getItem('oceanSolarProfiles');
      setAllEnquiries(enquiriesRaw ? JSON.parse(enquiriesRaw) : []);
      setAllCustomers(profilesRaw ? JSON.parse(profilesRaw) : {});
      setAdminScreen('dashboard');
    } catch (error) {
      console.error("Failed to load admin data", error);
      showNotification("Could not load admin data. The data might be corrupted.", 'error');
    }
  };

  const handleAdminLogout = () => {
    setAppState('auth');
    setAuthScreen('welcome');
    setAdminScreen('login');
    setAllEnquiries([]);
    setAllCustomers({});
  };


  // --- AUTH SCREENS ---

  const renderWelcomeScreen = () => (
    <div className="flex flex-col h-full justify-end items-center text-center p-8 text-white">
      <div className="flex-grow flex flex-col justify-center items-center">
        <LogoIcon className="w-24 h-24 mb-4" />
        <h1 className="text-5xl font-bold tracking-tight">Ocean Solar</h1>
        <p className="text-lg mt-2 text-gray-200">Harness the power of the sun.</p>
      </div>
      <div className="w-full">
        <button onClick={() => setAuthScreen('email')} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-lg transition-transform transform active:scale-95">
          Get Started
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthScreen('email'); }} className="font-semibold underline">Sign In</a>
        </p>
      </div>
       <div className="absolute top-4 right-4">
            <button onClick={() => setAppState('admin')} className="bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                Admin
            </button>
        </div>
    </div>
  );

  const renderEmailScreen = () => (
    <div className="flex flex-col h-full p-8 text-white animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => setAuthScreen('welcome')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button>
      </div>
      <div className="flex flex-col items-center text-center mb-8">
        <LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Get Started</h2><p className="text-gray-300">Enter your email to continue</p>
      </div>
      <form className="space-y-4" onSubmit={handleEmailSubmit}>
        <div className="relative">
          <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4">Continue</button>
      </form>
    </div>
  );
  
  const renderOtpScreen = () => (
    <div className="flex flex-col h-full p-8 text-white animate-fade-in">
      <div className="flex items-center mb-6"><button onClick={() => setAuthScreen('email')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button></div>
      <div className="flex flex-col items-center text-center mb-8"><LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Verify Email</h2><p className="text-gray-300 mt-2">A code has been sent to</p><p className="text-white font-semibold">{email}</p></div>
      <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-xs rounded-lg p-3 text-center mb-6">This is a dummy verification. <br/> Please enter any 4 digits to proceed.</div>
      <form className="space-y-4" onSubmit={handleOtpSubmit}>
        <div className="relative"><LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Enter 4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={4} required className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[1em]" /></div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4">Verify</button>
      </form>
    </div>
  );
  
  const renderProfileSetupScreen = () => (
     <div className="flex flex-col h-full p-8 text-white animate-fade-in">
        <div className="flex flex-col items-center text-center mb-8"><LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Complete Profile</h2><p className="text-gray-300">Finish setting up your account</p></div>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
            <form className="space-y-4">
                 <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="fullName" placeholder="Full Name" value={profile.fullName} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="relative"><PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" name="phone" placeholder="Phone Number" value={profile.phone} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" name="email" placeholder="Email Address" value={email} disabled className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-400 placeholder-gray-500 cursor-not-allowed" /></div>
                <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="address" placeholder="Address" value={profile.address} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={handleLocateMe} disabled={isLocating} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Use current location">{isLocating ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <LocateIcon className="w-5 h-5" />}</button></div>
                <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="city" placeholder="City" value={profile.city} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="postalCode" placeholder="Postal Code" value={profile.postalCode} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="country" placeholder="Country" value={profile.country} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </form>
        </div>
        <button onClick={handleCompleteRegistration} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-6">Complete Registration</button>
     </div>
  );

  const renderAuthScreen = () => {
    switch (authScreen) {
      case 'email': return renderEmailScreen();
      case 'otp': return renderOtpScreen();
      case 'profileSetup': return renderProfileSetupScreen();
      case 'welcome': default: return renderWelcomeScreen();
    }
  };
  
  // --- DASHBOARD SCREENS ---
  
  const renderHomeScreen = () => (
    <div className="p-8 text-white animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Home</h1>
      <div className="space-y-4">
        <div onClick={() => setActiveTab('enquiryForm')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Solar Enquiry</h2><p className="text-gray-400 mt-1">Start a new enquiry for solar panel installation.</p></div>
        <div onClick={() => setActiveTab('status')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Check Status</h2><p className="text-gray-400 mt-1">Check the status of your existing enquiries.</p></div>
        <div onClick={() => setActiveTab('inDevelopment')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Support</h2><p className="text-gray-400 mt-1">Contact us for help and queries.</p></div>
      </div>
    </div>
  );
  
  const renderProfileDashboardScreen = () => {
    const currentProfile = isEditingProfile ? editedProfile : profile;
    const profileFields: (keyof typeof profile)[] = ['fullName', 'phone', 'address', 'city', 'postalCode', 'country'];
    return (
      <div className="p-8 text-white animate-fade-in flex flex-col h-full">
        <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Profile</h1>{!isEditingProfile && (<button onClick={() => { setIsEditingProfile(true); setEditedProfile(profile); }} className="p-2 text-gray-300 hover:text-blue-400"><EditIcon className="w-6 h-6" /></button>)}</div>
        <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
           <div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={email} disabled className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-400 cursor-not-allowed" /></div>
          {profileFields.map(field => {
            const label = String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const Icon = {fullName: UserIcon, phone: PhoneIcon, address: MapPinIcon, city: MapPinIcon, postalCode: MapPinIcon, country: MapPinIcon}[field];
            return (<div key={field} className="relative"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name={field} placeholder={label} value={currentProfile[field]} onChange={handleEditedProfileChange} disabled={!isEditingProfile} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900/70 disabled:cursor-not-allowed disabled:text-gray-300" /></div>);
          })}
        </div>
        {isEditingProfile ? (<div className="mt-6 flex space-x-4"><button onClick={() => setIsEditingProfile(false)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95">Cancel</button><button onClick={handleUpdateProfile} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95">Update Profile</button></div>) : (<div className="mt-6 space-y-4"><button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 bg-red-800/50 hover:bg-red-700/60 text-red-300 font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95"><TrashIcon className="w-5 h-5" /> Delete Account</button><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95"><LogOutIcon className="w-5 h-5" /> Log Out</button></div>)}
      </div>
    );
  };
  
  const renderInDevelopmentScreen = () => (
    <div className="p-8 text-white animate-fade-in h-full flex flex-col">
      <div className="flex items-center mb-6"><button onClick={() => setActiveTab('home')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button><h1 className="text-xl font-bold ml-2">Back to Home</h1></div>
      <div className="flex-grow flex flex-col justify-center items-center text-center"><LogoIcon className="w-20 h-20 mb-4" /><h2 className="text-3xl font-bold">In Development</h2><p className="text-gray-300 mt-2">This feature is coming soon. Stay tuned!</p></div>
    </div>
  );

  const renderStatusScreen = () => {
    const statusColors = {
      Submitted: 'bg-blue-500/20 text-blue-300',
      'In Review': 'bg-yellow-500/20 text-yellow-300',
      Approved: 'bg-green-500/20 text-green-300',
      Rejected: 'bg-red-500/20 text-red-300',
    };

    return (
        <div className="p-8 text-white animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-6">
                <button onClick={() => setActiveTab('home')} className="p-2 -ml-2 text-gray-300 hover:text-white">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2">Enquiry Status</h1>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                {enquiries.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                        <HelpCircleIcon className="w-16 h-16 mb-4 text-gray-600" />
                        <h3 className="font-semibold text-lg text-gray-300">No Enquiries Yet</h3>
                        <p>Your submitted enquiries will appear here.</p>
                    </div>
                ) : (
                    enquiries.map(enquiry => (
                        <div key={enquiry.id} className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-white">{enquiry.id}</p>
                                    <p className="text-sm text-gray-400">
                                        {new Date(enquiry.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[enquiry.status]}`}>
                                    {enquiry.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-300 mt-2">
                                Property Type: {enquiry.formData.propertyType}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  const renderEnquiryForm = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

    return (
        <div className="p-6 text-white animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-4"><button onClick={() => setActiveTab('home')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button><h1 className="text-xl font-bold ml-2">Solar Enquiry Form</h1></div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-6 pb-4">
                <form id="enquiryForm" onSubmit={handleEnquirySubmit}>
                    <div className="space-y-6">
                        {/* Section 2 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">2. Property Information</h2>
                            <SelectInput label="Property Type" name="propertyType" value={enquiryForm.propertyType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Residential</option><option>Commercial</option><option>Industrial</option><option value="Other">Other</option></SelectInput>
                            {enquiryForm.propertyType === 'Other' && <TextInput label="Please specify" name="propertyTypeOther" value={enquiryForm.propertyTypeOther} onChange={handleEnquiryChange} required />}
                            <SelectInput label="Ownership" name="ownership" value={enquiryForm.ownership} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Owned</option><option>Rented</option><option>Leased</option></SelectInput>
                            <TextInput label="Building Age (approx.)" name="buildingAge" value={enquiryForm.buildingAge} onChange={handleEnquiryChange} placeholder="e.g., 10 years" />
                            <TextInput label="Property Address (if different from profile)" name="propertyAddress" value={enquiryForm.propertyAddress} onChange={handleEnquiryChange} placeholder="Enter full property address" />
                        </div>
                        {/* Section 3 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">3. Roof Details</h2>
                            <SelectInput label="Roof Type" name="roofType" value={enquiryForm.roofType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>RCC (Concrete)</option><option>Metal Sheet</option><option>Asbestos</option><option>Tile</option><option value="Other">Other</option></SelectInput>
                            {enquiryForm.roofType === 'Other' && <TextInput label="Please specify" name="roofTypeOther" value={enquiryForm.roofTypeOther} onChange={handleEnquiryChange} required />}
                            <div className="space-y-2"><label htmlFor="roofOrientation" className="text-sm text-gray-300">Roof Orientation <span className="text-red-400">*</span></label><select multiple name="roofOrientation" id="roofOrientation" value={enquiryForm.roofOrientation} onChange={handleMultiSelectChange} required className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 custom-multiselect"><option>East</option><option>West</option><option>South</option><option>North</option><option>Flat</option></select></div>
                            <TextInput label="Roof Area Available (approx. sq. ft.)" name="roofArea" value={enquiryForm.roofArea} onChange={handleEnquiryChange} required />
                            <SelectInput label="Roof Condition" name="roofCondition" value={enquiryForm.roofCondition} onChange={handleEnquiryChange}><option value="">Select...</option><option>Good</option><option>Average</option><option>Poor</option></SelectInput>
                            <SelectInput label="Year Roof Was Installed" name="roofInstallYear" value={enquiryForm.roofInstallYear} onChange={handleEnquiryChange}>
                                <option value="">Select Year</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </SelectInput>
                            <div className="space-y-2"><label className="text-sm text-gray-300">Any Leaks or Repairs in the Last 5 Years?</label><div className="flex gap-4 pt-1"><label className="flex items-center gap-2"><input type="radio" name="leaksLast5Years" value="Yes" onChange={handleEnquiryChange} checked={enquiryForm.leaksLast5Years === "Yes"} className="h-4 w-4 bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500" /> Yes</label><label className="flex items-center gap-2"><input type="radio" name="leaksLast5Years" value="No" onChange={handleEnquiryChange} checked={enquiryForm.leaksLast5Years === "No"} className="h-4 w-4 bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500" /> No</label></div></div>
                            {enquiryForm.leaksLast5Years === 'Yes' && <div className="space-y-2"><label htmlFor="leaksDescription" className="text-sm text-gray-300">If yes, please describe:</label><textarea name="leaksDescription" id="leaksDescription" value={enquiryForm.leaksDescription} onChange={handleEnquiryChange} rows={3} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>}
                            <FileUpload label="Upload Roof Photos" name="roofPhotos" files={formFiles.roofPhotos} onChange={handleFileChange} multiple />
                            <FileUpload label="Upload Exterior Roof Overview" name="exteriorRoofPhoto" files={formFiles.exteriorRoofPhoto} onChange={handleFileChange} multiple />
                        </div>
                        {/* Section 4 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">4. Electrical & Utility Information</h2>
                            <TextInput label="Electricity Provider" name="electricityProvider" value={enquiryForm.electricityProvider} onChange={handleEnquiryChange} required />
                            <SelectInput label="Electricity Connection Type" name="connectionType" value={enquiryForm.connectionType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Single Phase</option><option>Three Phase</option></SelectInput>
                            <TextInput label="Average Monthly Electricity Bill (₹ / $)" name="avgMonthlyBill" value={enquiryForm.avgMonthlyBill} onChange={handleEnquiryChange} type="number" required />
                            <TextInput label="Average Monthly Consumption (kWh)" name="avgMonthlyConsumption" value={enquiryForm.avgMonthlyConsumption} onChange={handleEnquiryChange} type="number" />
                            <SelectInput label="Meter Location" name="meterLocation" value={enquiryForm.meterLocation} onChange={handleEnquiryChange}><option value="">Select...</option><option>Outside</option><option>Inside</option><option value="Other">Other</option></SelectInput>
                            {enquiryForm.meterLocation === 'Other' && <TextInput label="Please specify" name="meterLocationOther" value={enquiryForm.meterLocationOther} onChange={handleEnquiryChange} required />}
                            <FileUpload label="Upload Electricity Bill" name="electricityBill" files={formFiles.electricityBill} onChange={handleFileChange} required multiple />
                            <FileUpload label="Upload Utility Meter Photo" name="utilityMeterPhoto" files={formFiles.utilityMeterPhoto} onChange={handleFileChange} multiple />
                            <FileUpload label="Upload Main Service Panel Photo" name="mainPanelPhoto" files={formFiles.mainPanelPhoto} onChange={handleFileChange} multiple />
                            <FileUpload label="Upload Interior Attic Photo" name="atticPhoto" files={formFiles.atticPhoto} onChange={handleFileChange} multiple />
                        </div>
                        {/* Section 5 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">5. System Preferences</h2>
                            <SelectInput label="Preferred Solar System Type" name="systemType" value={enquiryForm.systemType} onChange={handleEnquiryChange}><option value="">Select...</option><option>On-Grid</option><option>Off-Grid</option><option>Hybrid</option><option>Not Sure (Need Advice)</option></SelectInput>
                            <SelectInput label="Backup Requirement" name="backupRequirement" value={enquiryForm.backupRequirement} onChange={handleEnquiryChange}><option value="">Select...</option><option>Full Backup</option><option>Partial Backup</option><option>No Backup</option></SelectInput>
                            <SelectInput label="Battery Type (if applicable)" name="batteryType" value={enquiryForm.batteryType} onChange={handleEnquiryChange}><option value="">Select...</option><option>Lithium-ion</option><option>Lead-acid</option><option>Not Sure</option></SelectInput>
                            <TextInput label="Desired Capacity (if known)" name="desiredCapacity" value={enquiryForm.desiredCapacity} onChange={handleEnquiryChange} placeholder="e.g., 5 kW" />
                            <TextInput label="Estimated Budget Range" name="budget" value={enquiryForm.budget} onChange={handleEnquiryChange} placeholder="e.g., ₹3,00,000" />
                        </div>
                        {/* Section 6 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">6. Site Access & Installation Details</h2>
                            <SelectInput label="Roof Access" name="roofAccess" value={enquiryForm.roofAccess} onChange={handleEnquiryChange}><option value="">Select...</option><option>Easy</option><option>Limited</option><option>Ladder Required</option></SelectInput>
                            <SelectInput label="Shade on Roof" name="shadeOnRoof" value={enquiryForm.shadeOnRoof} onChange={handleEnquiryChange}><option value="">Select...</option><option>None</option><option>Partial</option><option>Full</option></SelectInput>
                            <TextInput label="Preferred Installation Date" name="preferredInstallDate" value={enquiryForm.preferredInstallDate} onChange={handleEnquiryChange} type="date" />
                            <FileUpload label="Upload Site / Surroundings Photos" name="sitePhotos" files={formFiles.sitePhotos} onChange={handleFileChange} multiple />
                        </div>
                        {/* Section 7 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">7. Additional Notes</h2>
                            <textarea name="additionalNotes" value={enquiryForm.additionalNotes} onChange={handleEnquiryChange} rows={4} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any other relevant information or concerns?"></textarea>
                        </div>
                        {/* Section 8 */}
                        <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">8. Signature & Consent</h2>
                            <div className="flex items-start gap-3"><input type="checkbox" name="consent" id="consent" checked={enquiryForm.consent} onChange={handleEnquiryChange} required className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500" /><label htmlFor="consent" className="text-sm text-gray-300">I confirm that the information provided above is true and authorize a site inspection.</label></div>
                            <TextInput label="Signature (Type your full name)" name="signature" value={enquiryForm.signature} onChange={handleEnquiryChange} required />
                            <TextInput label="Date" name="signatureDate" value={enquiryForm.signatureDate} onChange={handleEnquiryChange} type="date" required />
                        </div>
                    </div>
                </form>
            </div>
            <button type="submit" form="enquiryForm" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4 flex-shrink-0">Submit Enquiry</button>
        </div>
    );
  };

  const renderDashboard = () => {
    let content;
    switch (activeTab) {
      case 'home': content = renderHomeScreen(); break;
      case 'profile': content = renderProfileDashboardScreen(); break;
      case 'enquiryForm': content = renderEnquiryForm(); break;
      case 'status': content = renderStatusScreen(); break;
      case 'inDevelopment': content = renderInDevelopmentScreen(); break;
      default: content = renderHomeScreen();
    }
    
    return (
      <div className="h-full flex flex-col"><div className="flex-grow overflow-y-auto">{content}</div>
        {activeTab !== 'inDevelopment' && activeTab !== 'enquiryForm' && activeTab !== 'status' && (
          <div className="flex justify-around items-center bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-2">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}><HomeIcon className="w-6 h-6" /><span className="text-xs font-medium">Home</span></button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 ${activeTab === 'profile' ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}><UserIcon className="w-6 h-6" /><span className="text-xs font-medium">Profile</span></button>
          </div>
        )}
      </div>
    );
  };
  
  // --- ADMIN SCREENS ---

  const renderAdminLoginScreen = () => (
     <div className="flex flex-col h-full p-8 text-white animate-fade-in">
        <div className="flex items-center mb-6">
            <button onClick={() => setAppState('auth')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button>
        </div>
        <div className="flex flex-col items-center text-center mb-8">
            <LogoIcon className="w-16 h-16 mb-2" />
            <h2 className="text-3xl font-bold">Admin Panel</h2>
            <p className="text-gray-300">Please login to continue</p>
        </div>
        <div className="space-y-4">
            <div className="relative">
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value="Solarocean@gmail.com" readOnly className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-300 placeholder-gray-400" />
            </div>
            <div className="relative">
                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value="solar@123" readOnly className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-300 placeholder-gray-400" />
            </div>
            <button onClick={handleAdminLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4">Login</button>
        </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const renderContent = () => {
      switch (adminActiveTab) {
        case 'enquiries': return renderAdminEnquiries();
        case 'customers': return renderAdminCustomers();
        default: return null;
      }
    };
    
    return (
      <div className="h-full flex text-white bg-gray-900/50">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900/80 border-r border-gray-700 flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
              <LogoIcon className="w-10 h-10" />
              <span className="font-semibold text-lg">Admin Panel</span>
            </div>
            <nav className="mt-4 p-2 space-y-1">
              <button onClick={() => setAdminActiveTab('enquiries')} className={`w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 transition-colors ${adminActiveTab === 'enquiries' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                <MailIcon className="w-5 h-5" />
                <span>Enquiries</span>
              </button>
              <button onClick={() => setAdminActiveTab('customers')} className={`w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 transition-colors ${adminActiveTab === 'customers' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                <UserIcon className="w-5 h-5" />
                <span>Customers</span>
              </button>
            </nav>
          </div>
           <div className="p-2">
            <button onClick={handleAdminLogout} className="w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 text-red-400 hover:bg-red-500/20 transition-colors">
              <LogOutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>
      </div>
    );
  };
  
  const renderAdminEnquiries = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-gray-100">Enquiry Forms</h1>
      {allEnquiries.length === 0 ? (<div className="flex items-center justify-center h-full text-gray-400"><p>No enquiries have been submitted yet.</p></div>) : (
        allEnquiries.map(enq => (
          <details key={enq.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <summary className="p-4 cursor-pointer font-semibold flex justify-between items-center hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-blue-400">{enq.id}</span>
                <span className="text-xs font-normal text-gray-400">{new Date(enq.submittedAt).toLocaleString()}</span>
              </div>
              <span className="text-sm font-medium text-gray-300">{enq.userEmail}</span>
            </summary>
            <div className="p-6 border-t border-gray-700/50 text-sm space-y-6 bg-gray-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(enq.formData).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const displayValue = Array.isArray(value) ? value.join(', ') : (value || 'N/A').toString();
                if(value) return <div key={key} className="bg-gray-900/50 p-3 rounded-md"><strong className="text-gray-400 capitalize block mb-1">{label}</strong><p className="text-gray-200">{displayValue}</p></div>
                return null;
              })}
              </div>

              {Object.entries(enq.filesData).map(([key, files]) => {
                if(!files || files.length === 0) return null;
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="pt-4 border-t border-gray-700/50">
                    <strong className="text-gray-300 capitalize text-base">{label}</strong>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                      {files.map((file, idx) => (
                        <a key={idx} href={file.base64} target="_blank" rel="noopener noreferrer" className="block relative aspect-square group">
                          <img src={file.base64} alt={file.name} className="w-full h-full object-cover rounded-md border border-gray-600 group-hover:opacity-80 transition-opacity" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-xs text-center p-1 break-all">{file.name}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        ))
      )}
    </div>
  );
  
  const renderAdminCustomers = () => (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-gray-100">Customers</h1>
      {Object.keys(allCustomers).length === 0 ? (<div className="flex items-center justify-center h-full text-gray-400"><p>No customers have registered yet.</p></div>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(allCustomers).map(([email, profile]) => (
          <div key={email} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-2">
            <div>
              <h3 className="font-semibold text-lg text-white">{profile.fullName}</h3>
              <p className="text-sm text-blue-400">{email}</p>
            </div>
            <div className="text-sm text-gray-300 border-t border-gray-700/50 pt-2 flex flex-col gap-1">
              <p><strong className="text-gray-400">Phone:</strong> {profile.phone || 'N/A'}</p>
              <p><strong className="text-gray-400">Address:</strong> {`${profile.address || ''}${profile.city ? `, ${profile.city}` : ''}${profile.postalCode ? `, ${profile.postalCode}` : ''}${profile.country ? `, ${profile.country}` : ''}` || 'N/A'}</p>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );

  const renderCurrentState = () => {
    switch (appState) {
        case 'admin':
            return adminScreen === 'login' ? renderAdminLoginScreen() : renderAdminDashboard();
        case 'dashboard':
            return renderDashboard();
        case 'auth':
        default:
            return renderAuthScreen();
    }
  };

  const NotificationComponent = () => {
    if (!notification) return null;
    const styles = {
        success: { bg: 'bg-green-500/90', border: 'border-green-400', icon: <CheckCircleIcon className="w-6 h-6 text-white" /> },
        error: { bg: 'bg-red-500/90', border: 'border-red-400', icon: <AlertTriangleIcon className="w-6 h-6 text-white" /> },
        info: { bg: 'bg-blue-500/90', border: 'border-blue-400', icon: <InfoIcon className="w-6 h-6 text-white" /> }
    }[notification.type];

    return (
        <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md p-4 rounded-lg border shadow-lg z-50 flex items-start gap-3 animate-fade-in-down text-white backdrop-blur-sm ${styles.bg} ${styles.border}`}>
            <div className="flex-shrink-0">{styles.icon}</div>
            <p className="flex-grow text-sm font-semibold pt-0.5">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="p-1 -mr-2 -mt-2 text-white/80 hover:text-white"><XIcon className="w-5 h-5" /></button>
        </div>
    );
  };

  const ConfirmModalComponent = () => {
    if (!confirmModal) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-sm border border-gray-700">
                <div className="p-6 text-white"><h3 className="text-lg font-bold mb-4">Confirm Action</h3><p className="text-gray-300 text-sm">{confirmModal.message}</p></div>
                <div className="bg-gray-700/50 px-6 py-3 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={() => setConfirmModal(null)} className="px-4 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold hover:bg-gray-500 transition-colors">Cancel</button>
                    <button onClick={confirmModal.onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
  };
  
  const showAuthBackground = appState === 'auth' && ['welcome', 'email', 'otp'].includes(authScreen);
  const isAdminDashboard = appState === 'admin' && adminScreen === 'dashboard';

  return (
    <main className="bg-gray-900 flex items-center justify-center min-h-screen">
       <div className={
        isAdminDashboard
          ? "w-full h-screen bg-gray-900"
          : "w-full max-w-sm h-[844px] max-h-[844px] bg-gray-900 overflow-hidden shadow-2xl rounded-3xl relative border-4 border-gray-800"
      }>
        <NotificationComponent />
        <ConfirmModalComponent />

        {showAuthBackground && (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2940&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          </>
        )}

        <div className="relative z-10 h-full">
            {renderCurrentState()}
        </div>
      </div>
    </main>
  );
};

export default App;