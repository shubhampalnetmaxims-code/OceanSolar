
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogoIcon, MailIcon, LockIcon, ChevronLeftIcon, UserIcon, PhoneIcon, MapPinIcon, LocateIcon,
  HomeIcon, EditIcon, TrashIcon, LogOutIcon, CameraIcon, HelpCircleIcon, XIcon, CheckCircleIcon,
  AlertTriangleIcon, InfoIcon, SupportIcon
} from './components/icons';

type AuthScreen = 'welcome' | 'email' | 'otp' | 'profileSetup';
type AppState = 'auth' | 'dashboard' | 'admin';
type ActiveTab = 'home' | 'profile' | 'support' | 'enquiryForm' | 'status';
type AdminScreen = 'login' | 'dashboard';
type AdminActiveTab = 'enquiries' | 'customers' | 'support';
type NotificationType = 'success' | 'error' | 'info';

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

type FileWithPreview = { file: File, preview: string };
type FilesData = { [key: string]: { name: string, type: string }[] };
const initialProfileState = { fullName: '', phone: '', address: '', city: '', postalCode: '', country: '' };
type Profile = typeof initialProfileState;

// --- New & Updated Types for Messaging and Support ---
type Message = {
    sender: 'admin' | 'customer';
    text: string;
    timestamp: string;
};
type EnquiryStatus = 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'Pending' | 'Confirmed';
type EnquirySubmission = {
  id: string;
  submittedAt: string;
  formData: EnquiryFormState;
  filesData: FilesData;
  userEmail: string;
  status: EnquiryStatus;
  messages: Message[];
};
type TicketStatus = 'Open' | 'Closed';
type SupportTicket = {
    id: string;
    userEmail: string;
    subject: string;
    createdAt: string;
    status: TicketStatus;
    messages: Message[];
};

const ENQUIRY_FORM_SECTIONS = [
  { title: 'Property Information', fields: ['propertyType', 'propertyTypeOther', 'ownership', 'buildingAge', 'propertyAddress'] },
  { title: 'Roof Details', fields: ['roofType', 'roofTypeOther', 'roofOrientation', 'roofArea', 'roofCondition', 'roofInstallYear', 'leaksLast5Years', 'leaksDescription'] },
  { title: 'Electrical & Utility Information', fields: ['electricityProvider', 'connectionType', 'avgMonthlyBill', 'avgMonthlyConsumption', 'meterLocation', 'meterLocationOther'] },
  { title: 'System Preferences', fields: ['systemType', 'backupRequirement', 'batteryType', 'desiredCapacity', 'budget'] },
  { title: 'Site Access & Installation Details', fields: ['roofAccess', 'shadeOnRoof', 'preferredInstallDate'] },
  { title: 'Additional Notes', fields: ['additionalNotes'] },
  { title: 'Signature & Consent', fields: ['consent', 'signature', 'signatureDate'] }
];

// --- Helper Functions ---
const setupMockData = () => {
    if (localStorage.getItem('oceanSolarProfiles')) return;
    const mockProfiles = {
        'test@gmail.com': { fullName: 'Alex Ray', phone: '555-123-4567', address: '123 Solar Way', city: 'Sunnyvale', postalCode: '94086', country: 'USA' },
        'jane.doe@example.com': { fullName: 'Jane Doe', phone: '555-0101-2222', address: '456 Solar Ave', city: 'Sunville', postalCode: '12345', country: 'USA' },
        'john.smith@example.com': { fullName: 'John Smith', phone: '555-0202-3333', address: '789 Power St', city: 'Gridley', postalCode: '67890', country: 'USA' }
    };
    const mockEnquiries: EnquirySubmission[] = [
        {
            id: 'ENQ-1678886400000', submittedAt: new Date('2024-07-21T09:00:00Z').toISOString(), userEmail: 'test@gmail.com', status: 'Submitted', messages: [],
            formData: { ...initialEnquiryState, propertyType: 'Residential', consent: true, signature: 'Alex Ray', signatureDate: '2024-07-21' },
            filesData: {}
        },
        {
            id: 'ENQ-1678886400001', submittedAt: new Date('2024-07-15T10:30:00Z').toISOString(), userEmail: 'jane.doe@example.com', status: 'In Review', messages: [{ sender: 'admin', text: 'Thank you for your submission. We are reviewing your details.', timestamp: new Date('2024-07-15T11:00:00Z').toISOString() }],
            formData: { ...initialEnquiryState, propertyType: 'Residential', ownership: 'Owned', buildingAge: '15 years', roofType: 'RCC (Concrete)', roofOrientation: ['South', 'West'], roofArea: '1200', roofCondition: 'Good', electricityProvider: 'City Power Corp', connectionType: 'Three Phase', avgMonthlyBill: '150', systemType: 'Hybrid', budget: '15000', consent: true, signature: 'Jane Doe', signatureDate: '2024-07-15' },
            filesData: { roofPhotos: [{ name: 'roof_angle1.jpg', type: 'image/jpeg' }, { name: 'roof_top.jpg', type: 'image/jpeg' }], electricityBill: [{ name: 'bill_june_2024.pdf', type: 'application/pdf' }] }
        },
        {
            id: 'ENQ-1678886400002', submittedAt: new Date('2024-07-18T14:00:00Z').toISOString(), userEmail: 'john.smith@example.com', status: 'Confirmed', messages: [],
            formData: { ...initialEnquiryState, propertyType: 'Commercial', ownership: 'Leased', buildingAge: '5 years', roofType: 'Metal Sheet', roofOrientation: ['Flat'], roofArea: '5000', roofCondition: 'Good', electricityProvider: 'State Utility', connectionType: 'Three Phase', avgMonthlyBill: '800', avgMonthlyConsumption: '4500', systemType: 'On-Grid', budget: '50000', consent: true, signature: 'John Smith', signatureDate: '2024-07-18' },
            filesData: { exteriorRoofPhoto: [{ name: 'building_overview.jpg', type: 'image/jpeg' }], mainPanelPhoto: [{ name: 'main_panel.jpg', type: 'image/jpeg' }], utilityMeterPhoto: [{ name: 'meter.jpg', type: 'image/jpeg' }] }
        }
    ];
    const mockSupportTickets: SupportTicket[] = [
      { id: 'TKT-12345', userEmail: 'jane.doe@example.com', subject: 'Question about battery types', createdAt: new Date('2024-07-20T11:00:00Z').toISOString(), status: 'Open', messages: [{ sender: 'customer', text: 'Can you explain the difference between Lithium-ion and Lead-acid batteries?', timestamp: new Date('2024-07-20T11:00:00Z').toISOString() }] },
      { id: 'TKT-54321', userEmail: 'test@gmail.com', subject: 'Installation timeline query', createdAt: new Date('2024-07-22T15:00:00Z').toISOString(), status: 'Open', messages: [{ sender: 'customer', text: 'What is the estimated time for installation after approval?', timestamp: new Date('2024-07-22T15:00:00Z').toISOString() }] }
    ];
    try {
        localStorage.setItem('oceanSolarProfiles', JSON.stringify(mockProfiles));
        localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(mockEnquiries));
        localStorage.setItem('oceanSolarSupportTickets', JSON.stringify(mockSupportTickets));
    } catch (error) { console.error("Failed to set up mock data in localStorage", error); }
};

// --- Component Prop Types ---
type TextInputProps = { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; placeholder?: string; type?: string; required?: boolean; };
type SelectInputProps = { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children?: React.ReactNode; required?: boolean; };
type FileUploadProps = { label: string; name: string; files: FileWithPreview[] | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: (name: string, index: number) => void; multiple?: boolean; required?: boolean; };
type StatusPillProps = { status: EnquiryStatus };
type EnquiryDetailViewCustomerProps = { enquiry: EnquirySubmission; onBack: () => void; onSendMessage: (id: string, text: string) => void; };
type SupportScreenProps = { supportTickets: SupportTicket[]; enquiries: EnquirySubmission[]; onCreateTicket: (subject: string, message: string) => void; onEnquiryClick: (enquiry: EnquirySubmission) => void; };
type AdminMessageFormProps = { itemId: string; itemType: 'enquiry' | 'ticket'; onSendMessage: (itemId: string, messageText: string, itemType: 'enquiry' | 'ticket') => void; };
type AdminEnquiryDetailViewProps = { enquiry: EnquirySubmission; customerProfile: Profile | undefined; onBack: () => void; onStatusChange: (enquiryId: string, newStatus: EnquiryStatus) => void; onSendMessage: (itemId: string, messageText: string, itemType: 'enquiry' | 'ticket') => void; };

// --- Stable Form Field & UI Components ---
const TextInput: React.FC<TextInputProps> = ({ label, name, value, onChange, placeholder, type = 'text', required = false }) => ( <div className="space-y-2"> <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label> <input type={type} name={name} id={name} placeholder={placeholder || label} value={value} onChange={onChange} required={required} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> );
const SelectInput: React.FC<SelectInputProps> = ({ label, name, value, onChange, children, required = false }) => ( <div className="space-y-2"> <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label> <div className="relative"> <select name={name} id={name} value={value} onChange={onChange} required={required} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pl-4 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">{children}</select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/></svg></div> </div> </div> );
const FileUpload: React.FC<FileUploadProps> = ({ label, name, files, onChange, onRemove, multiple = false, required = false }) => { const hasFiles = files && files.length > 0; const isRequired = required && !hasFiles; return ( <div className="space-y-2"> <label htmlFor={name} className="text-sm text-gray-300">{label}{required && <span className="text-red-400">*</span>}</label> <div className="relative"> <input type="file" name={name} id={name} multiple={multiple} onChange={onChange} required={isRequired} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" aria-label={label} accept="image/*" /> <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 flex items-center justify-center text-center min-h-[80px]"> <div className="pointer-events-none"><CameraIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" /><p className="text-sm text-gray-400">{hasFiles ? `${files.length} file(s) selected` : `Click to attach file(s)`}</p></div> </div> </div> {hasFiles && (<div className={`mt-3 grid gap-3 ${multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2'}`}>{files.map((fileWrapper, index) => (<div key={fileWrapper.preview} className="relative group aspect-square"><img src={fileWrapper.preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md border border-gray-700" /><button type="button" onClick={() => onRemove(name, index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-red-600" aria-label="Remove image"><XIcon className="w-4 h-4" /></button></div>))}</div>)} </div> ); };
const StatusPill: React.FC<StatusPillProps> = ({ status }) => { const statusColors: Record<EnquiryStatus, string> = { Submitted: 'bg-blue-500/20 text-blue-300', 'In Review': 'bg-yellow-500/20 text-yellow-300', Approved: 'bg-green-500/20 text-green-300', Rejected: 'bg-red-500/20 text-red-300', Pending: 'bg-orange-500/20 text-orange-300', Confirmed: 'bg-teal-500/20 text-teal-300', }; return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>{status}</span> };

const EnquiryDetailViewCustomer: React.FC<EnquiryDetailViewCustomerProps> = ({ enquiry, onBack, onSendMessage }) => { const [message, setMessage] = useState(''); const chatEndRef = useRef<HTMLDivElement>(null); useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [enquiry.messages]); const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSendMessage(enquiry.id, message); setMessage(''); }; return ( <div className="p-6 text-white animate-fade-in h-full flex flex-col"> <div className="flex items-center mb-4"><button onClick={onBack} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button><h1 className="text-xl font-bold ml-2">Enquiry Details</h1></div> <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-6 pb-4"> <div className="space-y-4"> {Object.entries(enquiry.formData).map(([key, value]) => { const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); const displayValue = Array.isArray(value) ? value.join(', ') : (value || 'N/A').toString(); if (value) return <div key={key}><strong className="text-gray-400 capitalize block">{label}</strong><p className="text-gray-200">{displayValue}</p></div>; return null; })} </div> <div className="space-y-4 pt-4 border-t border-gray-700"> <h2 className="text-lg font-semibold text-blue-400">Conversation</h2> <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-900/50 p-3 rounded-lg"> {enquiry.messages.map((msg, index) => ( <div key={index} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}> <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender === 'customer' ? 'bg-blue-600' : 'bg-gray-700'}`}> <p className="text-sm">{msg.text}</p> <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p> </div> </div> ))} <div ref={chatEndRef} /> </div> </div> </div> <form onSubmit={handleSubmit} className="mt-4 flex gap-2"><input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your reply..." className="flex-grow bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white" /><button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Send</button></form> </div> ); };
const SupportScreen: React.FC<SupportScreenProps> = ({ supportTickets, enquiries, onCreateTicket, onEnquiryClick }) => { const [view, setView] = useState<'list' | 'newTicket'>('list'); const [subject, setSubject] = useState(''); const [message, setMessage] = useState(''); const handleTicketSubmit = (e: React.FormEvent) => { e.preventDefault(); onCreateTicket(subject, message); setSubject(''); setMessage(''); setView('list'); }; if (view === 'newTicket') { return ( <div className="p-8 text-white animate-fade-in h-full flex flex-col"> <div className="flex items-center mb-6"><button onClick={() => setView('list')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button><h1 className="text-xl font-bold ml-2">New Support Ticket</h1></div> <form onSubmit={handleTicketSubmit} className="space-y-4"> <TextInput label="Subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required /> <div className="space-y-2"><label htmlFor="message" className="text-sm text-gray-300">Message<span className="text-red-400">*</span></label><textarea name="message" id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea></div> <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg">Submit Ticket</button> </form> </div> ); } return ( <div className="p-8 text-white animate-fade-in h-full flex flex-col"> <div className="flex justify-between items-center mb-6"> <h1 className="text-3xl font-bold">Support</h1> <button onClick={() => setView('newTicket')} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">New Ticket</button> </div> <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4"> <h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">My Tickets</h2> {supportTickets.length === 0 ? <p className="text-gray-400">No support tickets found.</p> : supportTickets.map(ticket => ( <div key={ticket.id} className="bg-gray-800/70 p-4 rounded-lg border border-gray-700"> <p className="font-semibold">{ticket.subject}</p> <p className="text-sm text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</p> <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${ticket.status === 'Open' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{ticket.status}</span> </div> ))} <h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2 mt-6">Enquiry Messages</h2> {enquiries.filter(e => e.messages.length > 0).length === 0 ? <p className="text-gray-400">No messages on enquiries.</p> : enquiries.filter(e => e.messages.length > 0).map(enq => ( <div key={enq.id} className="bg-gray-800/70 p-4 rounded-lg border border-gray-700 cursor-pointer" onClick={() => onEnquiryClick(enq)}> <p className="font-semibold">Conversation for {enq.id}</p> <p className="text-sm text-gray-400">Last message: {new Date(enq.messages[enq.messages.length - 1].timestamp).toLocaleString()}</p> </div> ))} </div> </div> ); };
const AdminMessageForm: React.FC<AdminMessageFormProps> = ({ itemId, itemType, onSendMessage }) => { const [text, setText] = useState(''); const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSendMessage(itemId, text, itemType); setText(''); }; return ( <form onSubmit={handleSubmit} className="flex gap-2"> <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-grow bg-gray-900 border border-gray-600 rounded-lg py-2 px-4 text-white" /> <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Send</button> </form> ); };
const AdminEnquiryDetailView: React.FC<AdminEnquiryDetailViewProps> = ({ enquiry, customerProfile, onBack, onStatusChange, onSendMessage }) => { const chatEndRef = useRef<HTMLDivElement>(null); useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [enquiry.messages]); return ( <div className="flex-1 overflow-y-auto p-6 bg-gray-900 text-white"> <div className="flex items-center mb-6"> <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 -ml-2"> <ChevronLeftIcon className="w-6 h-6" /> <span>Back to Enquiries</span> </button> </div> <div className="grid grid-cols-3 gap-6"> <div className="col-span-3 lg:col-span-2 space-y-6"> <div className="bg-gray-800 border border-gray-700 rounded-lg p-6"> <div className="flex justify-between items-start"> <div><h2 className="text-2xl font-bold text-white">{enquiry.id}</h2><p className="text-sm text-gray-400">Submitted on {new Date(enquiry.submittedAt).toLocaleString()}</p></div> <StatusPill status={enquiry.status} /> </div> <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm"><h3 className="font-semibold text-lg text-blue-400 mb-2">Customer Details</h3><p><strong className="text-gray-400 w-20 inline-block">Name:</strong> {customerProfile?.fullName || 'N/A'}</p><p><strong className="text-gray-400 w-20 inline-block">Email:</strong> {enquiry.userEmail}</p><p><strong className="text-gray-400 w-20 inline-block">Phone:</strong> {customerProfile?.phone || 'N/A'}</p></div> </div>
<div className="bg-gray-800 border border-gray-700 rounded-lg">
    <h3 className="text-lg font-semibold text-blue-400 p-4 border-b border-gray-700">Submitted Information</h3>
    <div className="p-6 space-y-6 text-sm">
        {ENQUIRY_FORM_SECTIONS.map(section => {
            const sectionFields = section.fields
                .map(fieldKey => {
                    const value = enquiry.formData[fieldKey as keyof EnquiryFormState];
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;

                    const label = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') : value.toString();

                    return (
                        <div key={fieldKey}>
                            <strong className="text-gray-400 capitalize block mb-1">{label}</strong>
                            <p className="text-gray-200 break-words">{displayValue}</p>
                        </div>
                    );
                })
                .filter(Boolean);

            if (sectionFields.length === 0) return null;

            return (
                <div key={section.title}>
                    <h4 className="text-base font-semibold text-gray-300 mb-3 border-b border-gray-700/50 pb-2">{section.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {sectionFields}
                    </div>
                </div>
            );
        })}
    </div>
</div>
 <div className="bg-gray-800 border border-gray-700 rounded-lg"><h3 className="text-lg font-semibold text-blue-400 p-4 border-b border-gray-700">Uploaded Files</h3><div className="p-6">{Object.keys(enquiry.filesData).length > 0 ? Object.entries(enquiry.filesData).map(([key, files]) => { if(!files || files.length === 0) return null; const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); return (<div key={key} className="mb-4"><strong className="text-gray-300 capitalize text-base">{label}</strong><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">{files.map((file, idx) => ( <div key={idx} className="bg-gray-900/70 p-2 rounded-md flex flex-col items-center justify-center text-center aspect-square border border-gray-600" title={file.name}> <CameraIcon className="w-8 h-8 text-gray-400 mb-2 shrink-0" /> <p className="text-white text-xs break-all leading-tight">{file.name}</p> </div> ))}</div></div>)}) : <p className="text-gray-400">No files were uploaded.</p>}</div></div> </div> <div className="col-span-3 lg:col-span-1 space-y-6"> <div className="bg-gray-800 border border-gray-700 rounded-lg p-6"><h3 className="text-lg font-semibold text-blue-400 mb-4">Update Status</h3><select value={enquiry.status} onChange={(e) => onStatusChange(enquiry.id, e.target.value as EnquiryStatus)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white"><option>Submitted</option><option>Pending</option><option>In Review</option><option>Confirmed</option><option>Approved</option><option>Rejected</option></select></div> <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col"><h3 className="text-lg font-semibold text-blue-400 mb-4">Conversation</h3><div className="flex-grow space-y-3 mb-4 flex flex-col"><div className="flex-grow space-y-2 max-h-80 overflow-y-auto bg-gray-900/50 p-2 rounded-lg">{enquiry.messages.length > 0 ? enquiry.messages.map((msg, index) => <div key={index} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`text-sm p-2 rounded-lg ${msg.sender === 'admin' ? 'bg-blue-800' : 'bg-gray-700'}`}>{msg.text}</div></div>) : <p className="text-gray-400 text-sm text-center p-4">No messages yet.</p>}<div ref={chatEndRef} /></div><AdminMessageForm itemId={enquiry.id} itemType="enquiry" onSendMessage={onSendMessage} /></div></div> </div> </div> </div> ); };

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('auth');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState<Profile>(initialProfileState);
  const [editedProfile, setEditedProfile] = useState<Profile>(initialProfileState);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState(initialEnquiryState);
  const [formFiles, setFormFiles] = useState<{ [key: string]: FileWithPreview[] }>({});
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquirySubmission | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [adminScreen, setAdminScreen] = useState<AdminScreen>('login');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminActiveTab>('enquiries');
  const [allEnquiries, setAllEnquiries] = useState<EnquirySubmission[]>([]);
  const [allCustomers, setAllCustomers] = useState<{ [email: string]: Profile }>({});
  const [allSupportTickets, setAllSupportTickets] = useState<SupportTicket[]>([]);
  const [adminSelectedEnquiry, setAdminSelectedEnquiry] = useState<EnquirySubmission | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void; } | null>(null);
  const [propertyLocation, setPropertyLocation] = useState<{lat: number, lon: number} | null>(null);


  const showNotification = (message: string, type: NotificationType = 'info', duration: number = 4000) => { setNotification({ message, type }); setTimeout(() => setNotification(null), duration); };
  
  const loadDataForCurrentUser = (userEmail: string) => {
    try {
      const allEnquiriesRaw = localStorage.getItem('oceanSolarAllEnquiries');
      if (allEnquiriesRaw) {
        const allEnquiriesParsed: EnquirySubmission[] = JSON.parse(allEnquiriesRaw);
        setEnquiries(allEnquiriesParsed.filter(e => e.userEmail === userEmail));
      }
      const allTicketsRaw = localStorage.getItem('oceanSolarSupportTickets');
      if (allTicketsRaw) {
        const allTicketsParsed: SupportTicket[] = JSON.parse(allTicketsRaw);
        setSupportTickets(allTicketsParsed.filter(t => t.userEmail === userEmail));
      }
    } catch (error) { console.error("Failed to load user data", error); }
  };

  useEffect(() => {
    setupMockData();
    const currentUserEmail = localStorage.getItem('oceanSolarCurrentUserEmail');
    if (currentUserEmail) {
      const storedProfiles = localStorage.getItem('oceanSolarProfiles');
      if (storedProfiles) {
        try {
          const profiles = JSON.parse(storedProfiles);
          const userProfile = profiles[currentUserEmail];
          if (userProfile) {
            setEmail(currentUserEmail); setProfile(userProfile); setAppState('dashboard'); setActiveTab('home'); loadDataForCurrentUser(currentUserEmail);
          } else { localStorage.removeItem('oceanSolarCurrentUserEmail'); }
        } catch (error) { console.error("Failed to parse profiles", error); localStorage.removeItem('oceanSolarProfiles'); localStorage.removeItem('oceanSolarCurrentUserEmail'); }
      }
    }
  }, []);

  useEffect(() => {
    return () => { Object.values(formFiles).flat().forEach((fileWrapper: FileWithPreview) => { if (fileWrapper && fileWrapper.preview) { URL.revokeObjectURL(fileWrapper.preview); } }); };
  }, [formFiles]);
  
  useEffect(() => {
    if (activeTab !== 'enquiryForm') {
        setPropertyLocation(null);
    }
  }, [activeTab]);

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!email) return; setAuthScreen('otp'); };
  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (otp.length !== 4) return; const storedProfiles = localStorage.getItem('oceanSolarProfiles'); const lowerCaseEmail = email.toLowerCase();
    if (storedProfiles) {
      try { const profiles = JSON.parse(storedProfiles); const userProfile = profiles[lowerCaseEmail];
        if (userProfile && userProfile.fullName) { setProfile(userProfile); localStorage.setItem('oceanSolarCurrentUserEmail', lowerCaseEmail); setAppState('dashboard'); loadDataForCurrentUser(lowerCaseEmail); } else { setAuthScreen('profileSetup'); }
      } catch (error) { console.error("Error reading profiles", error); setAuthScreen('profileSetup'); }
    } else { setAuthScreen('profileSetup'); }
  };
  const handleEnquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value } = e.target; if ((e.target as HTMLInputElement).type === 'checkbox') { setEnquiryForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked })); } else { setEnquiryForm(prev => ({ ...prev, [name]: value })); } };
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const { name, options } = e.target; const value: string[] = []; for (let i = 0, l = options.length; i < l; i++) { if (options[i].selected) { value.push(options[i].value); } } setEnquiryForm(prev => ({ ...prev, [name]: value })); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
        const fileArray = Array.from(files).map((file: File) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setFormFiles(prev => ({ ...prev, [name]: [...(prev[name] || []), ...fileArray] }));
    }
    e.target.value = '';
  };
  const handleRemoveFile = (name: string, index: number) => { setFormFiles(prev => { const filesForInput = prev[name] ? [...prev[name]] : []; if (filesForInput[index]) { URL.revokeObjectURL(filesForInput[index].preview); filesForInput.splice(index, 1); return { ...prev, [name]: filesForInput }; } return prev; }); };
  const handleEnquirySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filesData: FilesData = {};
    for (const key in formFiles) { 
      filesData[key] = formFiles[key].map(f => ({ 
        name: f.file.name,
        type: f.file.type,
      })); 
    }
    const newEnquiry: EnquirySubmission = { id: `ENQ-${Date.now()}`, submittedAt: new Date().toISOString(), formData: enquiryForm, filesData: filesData, userEmail: email, status: 'Submitted', messages: [] };
    try {
        const allEnquiriesRaw = localStorage.getItem('oceanSolarAllEnquiries');
        const allEnquiries = allEnquiriesRaw ? JSON.parse(allEnquiriesRaw) : [];
        allEnquiries.unshift(newEnquiry);
        localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(allEnquiries));
        setEnquiries(prev => [newEnquiry, ...prev]);
    } catch (error) { 
        console.error("Failed to save enquiry", error); 
        showNotification("An error occurred while submitting. Your files might be too large.", 'error'); 
        return; 
    }
    showNotification('Enquiry Submitted Successfully!', 'success');
    setEnquiryForm(initialEnquiryState);
    Object.values(formFiles).flat().forEach((f: FileWithPreview) => URL.revokeObjectURL(f.preview));
    setFormFiles({});
    setPropertyLocation(null);
    setActiveTab('status');
  };
  const handleProfileSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => { setProfile(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleEditedProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => { setEditedProfile(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleUpdateProfile = () => { try { const profiles = JSON.parse(localStorage.getItem('oceanSolarProfiles') || '{}'); profiles[email] = editedProfile; localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles)); setProfile(editedProfile); setIsEditingProfile(false); showNotification('Profile updated successfully!', 'success'); } catch (error) { console.error("Failed to update profile", error); showNotification("An error occurred while updating your profile.", 'error'); } };
  const handleDeleteAccount = () => { setConfirmModal({ message: 'Are you sure you want to delete your account? This action cannot be undone.', onConfirm: () => { try { const profiles = JSON.parse(localStorage.getItem('oceanSolarProfiles') || '{}'); delete profiles[email]; localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles)); showNotification('Account deleted successfully.', 'success'); } catch (error) { console.error("Failed to delete profile", error); showNotification('Failed to delete profile from storage.', 'error'); } setConfirmModal(null); handleLogout(); }, }); };
  const handleLogout = () => { localStorage.removeItem('oceanSolarCurrentUserEmail'); setAppState('auth'); setAuthScreen('welcome'); setActiveTab('home'); setEmail(''); setOtp(''); setProfile(initialProfileState); setIsEditingProfile(false); setEnquiryForm(initialEnquiryState); setEnquiries([]); Object.values(formFiles).flat().forEach((f: FileWithPreview) => URL.revokeObjectURL(f.preview)); setFormFiles({}); };
  const handleCompleteRegistration = () => { if (!profile.fullName || !profile.phone) { showNotification("Please enter full name and phone number.", 'error'); return; } try { const profiles = JSON.parse(localStorage.getItem('oceanSolarProfiles') || '{}'); const lowerCaseEmail = email.toLowerCase(); profiles[lowerCaseEmail] = profile; localStorage.setItem('oceanSolarProfiles', JSON.stringify(profiles)); localStorage.setItem('oceanSolarCurrentUserEmail', lowerCaseEmail); setAppState('dashboard'); loadDataForCurrentUser(lowerCaseEmail); } catch (error) { console.error("Failed to save profile", error); showNotification("An error occurred while saving your profile.", 'error'); } };
  
  const locateUser = async (updateStateCallback: (profileUpdate: Partial<Profile>) => void) => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'info');
      return { address: null, location: null };
    }
    setIsLocating(true);
    return new Promise<{ address: Partial<Profile> | null, location: { lat: number, lon: number } | null }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            if (!response.ok) throw new Error('Failed to fetch address.');
            const data = await response.json();
            const address = data.address;
            const profileUpdate = {
              address: `${address.road || ''} ${address.house_number || ''}`.trim() || data.display_name.split(',').slice(0, 2).join(', '),
              city: address.city || address.town || address.village || '',
              postalCode: address.postcode || '',
              country: address.country || '',
            };
            updateStateCallback(profileUpdate);
            resolve({ address: profileUpdate, location: { lat: latitude, lon: longitude } });
          } catch (error) {
            console.error('Error fetching address:', error);
            showNotification('Could not retrieve address information. Please enter it manually.', 'error');
            resolve({ address: null, location: null });
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
          resolve({ address: null, location: null });
        },
        { timeout: 10000 }
      );
    });
  };

  const handleLocateMe = () => locateUser((profileUpdate) => setProfile(prev => ({ ...prev, ...profileUpdate })));
  
  const handleLocateProperty = async () => {
    const { location } = await locateUser((addressUpdate) => {
      const fullAddress = `${addressUpdate.address}, ${addressUpdate.city}, ${addressUpdate.postalCode}, ${addressUpdate.country}`.replace(/ ,/g, '').replace(/^,|,$/g, '').trim();
      setEnquiryForm(prev => ({ ...prev, propertyAddress: fullAddress }));
    });
    if (location) {
      setPropertyLocation(location);
    }
  };


  // --- ADMIN FUNCTIONS ---
  const handleAdminLogin = () => {
    try {
      setAllEnquiries(JSON.parse(localStorage.getItem('oceanSolarAllEnquiries') || '[]'));
      setAllCustomers(JSON.parse(localStorage.getItem('oceanSolarProfiles') || '{}'));
      setAllSupportTickets(JSON.parse(localStorage.getItem('oceanSolarSupportTickets') || '[]'));
      setAdminScreen('dashboard');
    } catch (error) { console.error("Failed to load admin data", error); showNotification("Could not load admin data.", 'error'); }
  };
  const handleAdminLogout = () => { setAppState('auth'); setAuthScreen('welcome'); setAdminScreen('login'); setAllEnquiries([]); setAllCustomers({}); setAdminSelectedEnquiry(null); };
  const handleStatusChange = (enquiryId: string, newStatus: EnquiryStatus) => {
    const updatedEnquiries = allEnquiries.map(enq => enq.id === enquiryId ? { ...enq, status: newStatus } : enq);
    setAllEnquiries(updatedEnquiries);
    if(adminSelectedEnquiry?.id === enquiryId) { setAdminSelectedEnquiry(prev => prev ? {...prev, status: newStatus} : null); }
    localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(updatedEnquiries));
    showNotification(`Enquiry ${enquiryId} status updated to ${newStatus}.`, 'success');
  };
  const handleAdminSendMessage = (itemId: string, messageText: string, itemType: 'enquiry' | 'ticket') => {
    if (!messageText.trim()) return;
    const newMessage: Message = { sender: 'admin', text: messageText, timestamp: new Date().toISOString() };
    if (itemType === 'enquiry') {
      const updatedEnquiries = allEnquiries.map(enq => enq.id === itemId ? { ...enq, messages: [...enq.messages, newMessage] } : enq);
      setAllEnquiries(updatedEnquiries);
      if(adminSelectedEnquiry?.id === itemId) { setAdminSelectedEnquiry(prev => prev ? {...prev, messages: [...prev.messages, newMessage]} : null); }
      localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(updatedEnquiries));
    } else {
      const updatedTickets = allSupportTickets.map(t => t.id === itemId ? { ...t, messages: [...t.messages, newMessage] } : t);
      setAllSupportTickets(updatedTickets);
      localStorage.setItem('oceanSolarSupportTickets', JSON.stringify(updatedTickets));
    }
  };

  // --- CUSTOMER SUPPORT & MESSAGING FUNCTIONS ---
  const handleCustomerReply = (enquiryId: string, messageText: string) => {
    if (!messageText.trim()) return;
    const newMessage: Message = { sender: 'customer', text: messageText, timestamp: new Date().toISOString() };
    const allEnquiriesRaw = localStorage.getItem('oceanSolarAllEnquiries') || '[]';
    const allEnquiriesParsed: EnquirySubmission[] = JSON.parse(allEnquiriesRaw);
    const updatedEnquiries = allEnquiriesParsed.map(enq => enq.id === enquiryId ? { ...enq, messages: [...enq.messages, newMessage] } : enq);
    localStorage.setItem('oceanSolarAllEnquiries', JSON.stringify(updatedEnquiries));
    setEnquiries(updatedEnquiries.filter(e => e.userEmail === email));
    setSelectedEnquiry(updatedEnquiries.find(e => e.id === enquiryId) || null);
  };
  const handleCreateSupportTicket = (subject: string, message: string) => {
    if(!subject.trim() || !message.trim()) {
      showNotification("Subject and message cannot be empty.", 'error');
      return;
    }
    const newTicket: SupportTicket = { id: `TKT-${Date.now()}`, userEmail: email, subject, createdAt: new Date().toISOString(), status: 'Open', messages: [{ sender: 'customer', text: message, timestamp: new Date().toISOString() }] };
    const allTicketsRaw = localStorage.getItem('oceanSolarSupportTickets') || '[]';
    const allTicketsParsed: SupportTicket[] = JSON.parse(allTicketsRaw);
    allTicketsParsed.unshift(newTicket);
    localStorage.setItem('oceanSolarSupportTickets', JSON.stringify(allTicketsParsed));
    setSupportTickets(prev => [newTicket, ...prev]);
    showNotification('Support ticket created successfully!', 'success');
  };
  
  const handleSupportEnquiryClick = (enquiry: EnquirySubmission) => {
    setActiveTab('status');
    setSelectedEnquiry(enquiry);
  };

  // --- AUTH SCREENS ---
  const renderWelcomeScreen = () => ( <div className="flex flex-col h-full justify-end items-center text-center p-8 text-white"> <div className="flex-grow flex flex-col justify-center items-center"> <LogoIcon className="w-24 h-24 mb-4" /> <h1 className="text-5xl font-bold tracking-tight">Ocean Solar</h1> <p className="text-lg mt-2 text-gray-200">Harness the power of the sun.</p> </div> <div className="w-full"> <button onClick={() => setAuthScreen('email')} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-lg transition-transform transform active:scale-95"> Get Started </button> <p className="text-xs text-gray-400 mt-4"> Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthScreen('email'); }} className="font-semibold underline">Sign In</a> </p> </div> <div className="absolute top-4 right-4"> <button onClick={() => setAppState('admin')} className="bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"> Admin </button> </div> </div> );
  const renderEmailScreen = () => ( <div className="flex flex-col h-full p-8 text-white animate-fade-in"> <div className="flex items-center mb-6"> <button onClick={() => setAuthScreen('welcome')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button> </div> <div className="flex flex-col items-center text-center mb-8"> <LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Get Started</h2><p className="text-gray-300">Enter your email to continue</p> </div> <form className="space-y-4" onSubmit={handleEmailSubmit}> <div className="relative"> <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4">Continue</button> </form> </div> );
  const renderOtpScreen = () => ( <div className="flex flex-col h-full p-8 text-white animate-fade-in"> <div className="flex items-center mb-6"><button onClick={() => setAuthScreen('email')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button></div> <div className="flex flex-col items-center text-center mb-8"><LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Verify Email</h2><p className="text-gray-300 mt-2">A code has been sent to</p><p className="text-white font-semibold">{email}</p></div> <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-xs rounded-lg p-3 text-center mb-6">This is a dummy verification. <br/> Please enter any 4 digits to proceed.</div> <form className="space-y-4" onSubmit={handleOtpSubmit}> <div className="relative"><LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Enter 4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={4} required className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[1em]" /></div> <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-4">Verify</button> </form> </div> );
  const renderProfileSetupScreen = () => ( <div className="flex flex-col h-full p-8 text-white animate-fade-in"> <div className="flex flex-col items-center text-center mb-8"><LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Complete Profile</h2><p className="text-gray-300">Finish setting up your account</p></div> <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4"> <form className="space-y-4"> <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="fullName" placeholder="Full Name" value={profile.fullName} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div> <div className="relative"><PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" name="phone" placeholder="Phone Number" value={profile.phone} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div> <div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" name="email" placeholder="Email Address" value={email} disabled className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-400 placeholder-gray-500 cursor-not-allowed" /></div> <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="address" placeholder="Address" value={profile.address} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-12 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={handleLocateMe} disabled={isLocating} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Use current location">{isLocating ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <LocateIcon className="w-5 h-5" />}</button></div> <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="city" placeholder="City" value={profile.city} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div> <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="postalCode" placeholder="Postal Code" value={profile.postalCode} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div> <div className="relative"><MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="country" placeholder="Country" value={profile.country} onChange={handleProfileSetupChange} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div> </form> </div> <button onClick={handleCompleteRegistration} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95 mt-6">Complete Registration</button> </div> );
  const renderAuthScreen = () => { switch (authScreen) { case 'email': return renderEmailScreen(); case 'otp': return renderOtpScreen(); case 'profileSetup': return renderProfileSetupScreen(); case 'welcome': default: return renderWelcomeScreen(); } };
  
  // --- DASHBOARD SCREENS ---
  const renderHomeScreen = () => ( <div className="p-8 text-white animate-fade-in"> <h1 className="text-3xl font-bold mb-8">Home</h1> <div className="space-y-4"> <div onClick={() => setActiveTab('enquiryForm')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Solar Enquiry</h2><p className="text-gray-400 mt-1">Start a new enquiry for solar panel installation.</p></div> <div onClick={() => setActiveTab('status')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Check Status</h2><p className="text-gray-400 mt-1">View your submitted enquiries and messages.</p></div> <div onClick={() => setActiveTab('support')} className="bg-gray-800/70 p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/70 transition-colors"><h2 className="text-xl font-semibold">Support</h2><p className="text-gray-400 mt-1">Contact us for help and raise tickets.</p></div> </div> </div> );
  const renderProfileDashboardScreen = () => { const currentProfile = isEditingProfile ? editedProfile : profile; const profileFields: (keyof typeof profile)[] = ['fullName', 'phone', 'address', 'city', 'postalCode', 'country']; return ( <div className="p-8 text-white animate-fade-in flex flex-col h-full"> <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Profile</h1>{!isEditingProfile && (<button onClick={() => { setIsEditingProfile(true); setEditedProfile(profile); }} className="p-2 text-gray-300 hover:text-blue-400"><EditIcon className="w-6 h-6" /></button>)}</div> <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2"> <div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={email} disabled className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-400 cursor-not-allowed" /></div> {profileFields.map(field => { const label = String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); const Icon = {fullName: UserIcon, phone: PhoneIcon, address: MapPinIcon, city: MapPinIcon, postalCode: MapPinIcon, country: MapPinIcon}[field]; return (<div key={field} className="relative"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name={field} placeholder={label} value={currentProfile[field]} onChange={handleEditedProfileChange} disabled={!isEditingProfile} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900/70 disabled:cursor-not-allowed disabled:text-gray-300" /></div>); })} </div> {isEditingProfile ? (<div className="mt-6 flex space-x-4"><button onClick={() => setIsEditingProfile(false)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95">Cancel</button><button onClick={handleUpdateProfile} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95">Update Profile</button></div>) : (<div className="mt-6 space-y-4"><button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 bg-red-800/50 hover:bg-red-700/60 text-red-300 font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95"><TrashIcon className="w-5 h-5" /> Delete Account</button><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform active:scale-95"><LogOutIcon className="w-5 h-5" /> Log Out</button></div>)} </div> ); };
  const renderStatusScreen = () => {
    if (selectedEnquiry) return <EnquiryDetailViewCustomer enquiry={selectedEnquiry} onBack={() => setSelectedEnquiry(null)} onSendMessage={handleCustomerReply} />;
    return (
        <div className="p-8 text-white animate-fade-in h-full flex flex-col">
            <div className="flex items-center mb-6"><button onClick={() => setActiveTab('home')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button><h1 className="text-xl font-bold ml-2">Enquiry Status</h1></div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                {enquiries.length === 0 ? (<div className="text-center text-gray-400 mt-20 flex flex-col items-center"><HelpCircleIcon className="w-16 h-16 mb-4 text-gray-600" /><h3 className="font-semibold text-lg text-gray-300">No Enquiries Yet</h3><p>Your submitted enquiries will appear here.</p></div>) : (
                    enquiries.map(enquiry => (<button key={enquiry.id} onClick={() => setSelectedEnquiry(enquiry)} className="w-full text-left bg-gray-800/70 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/70 transition-colors"><div className="flex justify-between items-start"><div><p className="font-semibold text-white">{enquiry.id}</p><p className="text-sm text-gray-400">{new Date(enquiry.submittedAt).toLocaleDateString()}</p></div><StatusPill status={enquiry.status} /></div><p className="text-sm text-gray-300 mt-2">Property Type: {enquiry.formData.propertyType}</p></button>))
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
                <form id="enquiryForm" onSubmit={handleEnquirySubmit}> <div className="space-y-6">
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Property Information</h2><SelectInput label="Property Type" name="propertyType" value={enquiryForm.propertyType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Residential</option><option>Commercial</option><option>Industrial</option><option value="Other">Other</option></SelectInput>{enquiryForm.propertyType === 'Other' && <TextInput label="Please specify" name="propertyTypeOther" value={enquiryForm.propertyTypeOther} onChange={handleEnquiryChange} required />}<SelectInput label="Ownership" name="ownership" value={enquiryForm.ownership} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Owned</option><option>Rented</option><option>Leased</option></SelectInput><TextInput label="Building Age (approx.)" name="buildingAge" value={enquiryForm.buildingAge} onChange={handleEnquiryChange} placeholder="e.g., 10 years" />
                    <div className="relative">
                        <TextInput label="Property Address (if different)" name="propertyAddress" value={enquiryForm.propertyAddress} onChange={handleEnquiryChange} placeholder="Enter full property address" />
                        <button type="button" onClick={handleLocateProperty} disabled={isLocating} className="absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 p-1 text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Use current location">
                            {isLocating ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <LocateIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    {propertyLocation && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 aspect-video">
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${propertyLocation.lon - 0.005}%2C${propertyLocation.lat - 0.005}%2C${propertyLocation.lon + 0.005}%2C${propertyLocation.lat + 0.005}&layer=mapnik&marker=${propertyLocation.lat}%2C${propertyLocation.lon}`}
                                title="Property Location"
                            >
                            </iframe>
                        </div>
                    )}
                    </div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Roof Details</h2><SelectInput label="Roof Type" name="roofType" value={enquiryForm.roofType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>RCC (Concrete)</option><option>Metal Sheet</option><option>Asbestos</option><option>Tile</option><option value="Other">Other</option></SelectInput>{enquiryForm.roofType === 'Other' && <TextInput label="Please specify" name="roofTypeOther" value={enquiryForm.roofTypeOther} onChange={handleEnquiryChange} required />}<div className="space-y-2"><label htmlFor="roofOrientation" className="text-sm text-gray-300">Roof Orientation <span className="text-red-400">*</span></label><select multiple name="roofOrientation" id="roofOrientation" value={enquiryForm.roofOrientation} onChange={handleMultiSelectChange} required className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 custom-multiselect"><option>East</option><option>West</option><option>South</option><option>North</option><option>Flat</option></select></div><TextInput label="Roof Area Available (sq. ft.)" name="roofArea" value={enquiryForm.roofArea} onChange={handleEnquiryChange} required /><SelectInput label="Roof Condition" name="roofCondition" value={enquiryForm.roofCondition} onChange={handleEnquiryChange}><option value="">Select...</option><option>Good</option><option>Average</option><option>Poor</option></SelectInput><SelectInput label="Year Roof Was Installed" name="roofInstallYear" value={enquiryForm.roofInstallYear} onChange={handleEnquiryChange}><option value="">Select Year</option>{years.map(year => (<option key={year} value={year}>{year}</option>))}</SelectInput><div className="space-y-2"><label className="text-sm text-gray-300">Leaks in Last 5 Years?</label><div className="flex gap-4 pt-1"><label className="flex items-center gap-2"><input type="radio" name="leaksLast5Years" value="Yes" onChange={handleEnquiryChange} checked={enquiryForm.leaksLast5Years === "Yes"} className="h-4 w-4 bg-gray-800 border-gray-600 text-blue-500" /> Yes</label><label className="flex items-center gap-2"><input type="radio" name="leaksLast5Years" value="No" onChange={handleEnquiryChange} checked={enquiryForm.leaksLast5Years === "No"} className="h-4 w-4 bg-gray-800 border-gray-600 text-blue-500" /> No</label></div></div>{enquiryForm.leaksLast5Years === 'Yes' && <div className="space-y-2"><label htmlFor="leaksDescription" className="text-sm text-gray-300">If yes, describe:</label><textarea name="leaksDescription" id="leaksDescription" value={enquiryForm.leaksDescription} onChange={handleEnquiryChange} rows={3} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white"></textarea></div>}<FileUpload label="Upload Roof Photos" name="roofPhotos" files={formFiles.roofPhotos} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /><FileUpload label="Upload Exterior Roof Overview" name="exteriorRoofPhoto" files={formFiles.exteriorRoofPhoto} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /></div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Electrical Information</h2><TextInput label="Electricity Provider" name="electricityProvider" value={enquiryForm.electricityProvider} onChange={handleEnquiryChange} required /><SelectInput label="Connection Type" name="connectionType" value={enquiryForm.connectionType} onChange={handleEnquiryChange} required><option value="">Select...</option><option>Single Phase</option><option>Three Phase</option></SelectInput><TextInput label="Avg Monthly Bill (₹/$)" name="avgMonthlyBill" value={enquiryForm.avgMonthlyBill} onChange={handleEnquiryChange} type="number" required /><TextInput label="Avg Monthly Consumption (kWh)" name="avgMonthlyConsumption" value={enquiryForm.avgMonthlyConsumption} onChange={handleEnquiryChange} type="number" /><SelectInput label="Meter Location" name="meterLocation" value={enquiryForm.meterLocation} onChange={handleEnquiryChange}><option value="">Select...</option><option>Outside</option><option>Inside</option><option value="Other">Other</option></SelectInput>{enquiryForm.meterLocation === 'Other' && <TextInput label="Please specify" name="meterLocationOther" value={enquiryForm.meterLocationOther} onChange={handleEnquiryChange} required />}<FileUpload label="Upload Electricity Bill" name="electricityBill" files={formFiles.electricityBill} onChange={handleFileChange} onRemove={handleRemoveFile} required multiple /><FileUpload label="Upload Utility Meter Photo" name="utilityMeterPhoto" files={formFiles.utilityMeterPhoto} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /><FileUpload label="Upload Main Service Panel" name="mainPanelPhoto" files={formFiles.mainPanelPhoto} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /><FileUpload label="Upload Interior Attic Photo" name="atticPhoto" files={formFiles.atticPhoto} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /></div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">System Preferences</h2><SelectInput label="System Type" name="systemType" value={enquiryForm.systemType} onChange={handleEnquiryChange}><option value="">Select...</option><option>On-Grid</option><option>Off-Grid</option><option>Hybrid</option><option>Not Sure</option></SelectInput><SelectInput label="Backup Requirement" name="backupRequirement" value={enquiryForm.backupRequirement} onChange={handleEnquiryChange}><option value="">Select...</option><option>Full</option><option>Partial</option><option>None</option></SelectInput><SelectInput label="Battery Type" name="batteryType" value={enquiryForm.batteryType} onChange={handleEnquiryChange}><option value="">Select...</option><option>Lithium-ion</option><option>Lead-acid</option><option>Not Sure</option></SelectInput><TextInput label="Desired Capacity (if known)" name="desiredCapacity" value={enquiryForm.desiredCapacity} onChange={handleEnquiryChange} placeholder="e.g., 5 kW" /><TextInput label="Budget Range" name="budget" value={enquiryForm.budget} onChange={handleEnquiryChange} placeholder="e.g., ₹3,00,000" /></div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Site & Installation</h2><SelectInput label="Roof Access" name="roofAccess" value={enquiryForm.roofAccess} onChange={handleEnquiryChange}><option value="">Select...</option><option>Easy</option><option>Limited</option><option>Ladder Required</option></SelectInput><SelectInput label="Shade on Roof" name="shadeOnRoof" value={enquiryForm.shadeOnRoof} onChange={handleEnquiryChange}><option value="">Select...</option><option>None</option><option>Partial</option><option>Full</option></SelectInput><TextInput label="Preferred Install Date" name="preferredInstallDate" value={enquiryForm.preferredInstallDate} onChange={handleEnquiryChange} type="date" /><FileUpload label="Upload Site / Surroundings Photos" name="sitePhotos" files={formFiles.sitePhotos} onChange={handleFileChange} onRemove={handleRemoveFile} multiple /></div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Additional Notes</h2><textarea name="additionalNotes" value={enquiryForm.additionalNotes} onChange={handleEnquiryChange} rows={4} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 px-4 text-white" placeholder="Any other relevant information?"></textarea></div>
                    <div className="space-y-4"><h2 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Signature & Consent</h2><div className="flex items-start gap-3"><input type="checkbox" name="consent" id="consent" checked={enquiryForm.consent} onChange={handleEnquiryChange} required className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500" /><label htmlFor="consent" className="text-sm text-gray-300">I confirm the information is true and authorize a site inspection.</label></div><TextInput label="Signature (Type full name)" name="signature" value={enquiryForm.signature} onChange={handleEnquiryChange} required /><TextInput label="Date" name="signatureDate" value={enquiryForm.signatureDate} onChange={handleEnquiryChange} type="date" required /></div>
                </div></form>
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
      case 'support': content = <SupportScreen supportTickets={supportTickets} enquiries={enquiries} onCreateTicket={handleCreateSupportTicket} onEnquiryClick={handleSupportEnquiryClick} />; break;
      default: content = renderHomeScreen();
    }
    return (
      <div className="h-full flex flex-col"><div className="flex-grow overflow-y-auto">{content}</div>
        {['home', 'profile', 'support'].includes(activeTab) && (
          <div className="flex justify-around items-center bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-2">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}><HomeIcon className="w-6 h-6" /><span className="text-xs font-medium">Home</span></button>
            <button onClick={() => setActiveTab('support')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 ${activeTab === 'support' ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}><SupportIcon className="w-6 h-6" /><span className="text-xs font-medium">Support</span></button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 ${activeTab === 'profile' ? 'text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}><UserIcon className="w-6 h-6" /><span className="text-xs font-medium">Profile</span></button>
          </div>
        )}
      </div>
    );
  };
  
  // --- ADMIN SCREENS ---
  const renderAdminLoginScreen = () => ( <div className="flex flex-col h-full p-8 text-white animate-fade-in"> <div className="flex items-center mb-6"><button onClick={() => setAppState('auth')} className="p-2 -ml-2 text-gray-300 hover:text-white"><ChevronLeftIcon className="w-6 h-6" /></button></div> <div className="flex flex-col items-center text-center mb-8"><LogoIcon className="w-16 h-16 mb-2" /><h2 className="text-3xl font-bold">Admin Panel</h2><p className="text-gray-300">Please login to continue</p></div> <div className="space-y-4"><div className="relative"><MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" value="Solarocean@gmail.com" readOnly className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-300" /></div><div className="relative"><LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value="solar@123" readOnly className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 pr-4 pl-12 text-gray-300" /></div><button onClick={handleAdminLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg mt-4">Login</button></div></div> );
  const renderAdminDashboard = () => {
    const renderContent = () => { switch (adminActiveTab) { case 'enquiries': return renderAdminEnquiries(); case 'customers': return renderAdminCustomers(); case 'support': return renderAdminSupport(); default: return null; } };
    
    const handleTabClick = (tab: AdminActiveTab) => {
      setAdminSelectedEnquiry(null);
      setAdminSearchQuery('');
      setAdminActiveTab(tab);
    }

    return (
      <div className="h-full flex text-white bg-gray-900/50">
        <div className="w-64 bg-gray-900/80 border-r border-gray-700 flex flex-col justify-between">
          <div> <div className="p-4 border-b border-gray-700 flex items-center gap-3"><LogoIcon className="w-10 h-10" /><span className="font-semibold text-lg">Admin Panel</span></div> <nav className="mt-4 p-2 space-y-1"> <button onClick={() => handleTabClick('enquiries')} className={`w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 transition-colors ${adminActiveTab === 'enquiries' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}><MailIcon className="w-5 h-5" /><span>Enquiries</span></button> <button onClick={() => handleTabClick('customers')} className={`w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 transition-colors ${adminActiveTab === 'customers' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}><UserIcon className="w-5 h-5" /><span>Customers</span></button> <button onClick={() => handleTabClick('support')} className={`w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 transition-colors ${adminActiveTab === 'support' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}><SupportIcon className="w-5 h-5" /><span>Support</span></button> </nav> </div>
          <div className="p-2"><button onClick={handleAdminLogout} className="w-full text-left text-sm px-4 py-3 rounded-md flex items-center gap-3 text-red-400 hover:bg-red-500/20"><LogOutIcon className="w-5 h-5" /><span>Logout</span></button></div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>
      </div>
    );
  };
  const renderAdminEnquiries = () => {
    if (adminSelectedEnquiry) {
        const customerProfile = allCustomers[adminSelectedEnquiry.userEmail];
        return <AdminEnquiryDetailView
            enquiry={adminSelectedEnquiry}
            customerProfile={customerProfile}
            onBack={() => setAdminSelectedEnquiry(null)}
            onStatusChange={handleStatusChange}
            onSendMessage={handleAdminSendMessage}
        />;
    }
    
    const filteredEnquiries = allEnquiries.filter(enq => {
        const searchTerm = adminSearchQuery.toLowerCase();
        return (
            enq.id.toLowerCase().includes(searchTerm) ||
            enq.userEmail.toLowerCase().includes(searchTerm)
        );
    });

    return (
        <div className="flex-1 flex flex-col p-6 space-y-4 bg-gray-900 overflow-hidden">
            <h1 className="text-3xl font-bold text-gray-100 shrink-0">Enquiry Forms</h1>
            <input
                type="text"
                placeholder="Search by Enquiry ID or email..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            />
            {filteredEnquiries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400"><p>{adminSearchQuery ? 'No matching enquiries found.' : 'No enquiries have been submitted yet.'}</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                          <tr className="border-b border-gray-700">
                            <th scope="col" className="px-6 py-3">Enquiry ID</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                            {filteredEnquiries.map(enq => (
                                <tr key={enq.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-blue-400 whitespace-nowrap">{enq.id}</td>
                                    <td className="px-6 py-4">{enq.userEmail}</td>
                                    <td className="px-6 py-4">{new Date(enq.submittedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><StatusPill status={enq.status} /></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => setAdminSelectedEnquiry(enq)} className="font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-xs">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
  };
  const renderAdminCustomers = () => {
    const filteredCustomers = Object.entries(allCustomers).filter(([email, profile]) => {
        const searchTerm = adminSearchQuery.toLowerCase();
        return (
            email.toLowerCase().includes(searchTerm) ||
            profile.fullName.toLowerCase().includes(searchTerm)
        );
    });

    return (
        <div className="flex-1 flex flex-col p-6 space-y-4 bg-gray-900 overflow-hidden">
            <h1 className="text-3xl font-bold text-gray-100 shrink-0">Customers</h1>
             <input
                type="text"
                placeholder="Search by name or email..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            />
            {filteredCustomers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400"><p>{adminSearchQuery ? 'No matching customers found.' : 'No customers have registered yet.'}</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCustomers.map(([email, profile]) => (
                            <div key={email} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-2 h-fit">
                                <div>
                                    <h3 className="font-semibold text-lg text-white break-words">{profile.fullName}</h3>
                                    <p className="text-sm text-blue-400 break-words">{email}</p>
                                </div>
                                <div className="text-sm text-gray-300 border-t border-gray-700/50 pt-2 flex flex-col gap-1">
                                    <p><strong className="text-gray-400">Phone:</strong> {profile.phone || 'N/A'}</p>
                                    <p><strong className="text-gray-400">Address:</strong> {`${profile.address || ''}${profile.city ? `, ${profile.city}` : ''}` || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };
  const renderAdminSupport = () => ( <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900"> <h1 className="text-3xl font-bold mb-4 text-gray-100">Support Tickets</h1> {allSupportTickets.length === 0 ? (<div className="flex items-center justify-center h-full text-gray-400"><p>No support tickets.</p></div>) : ( allSupportTickets.map(ticket => ( <details key={ticket.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"> <summary className="p-4 cursor-pointer font-semibold flex justify-between items-center hover:bg-gray-700/50"><span>{ticket.subject} ({ticket.id})</span><span>{ticket.userEmail}</span></summary> <div className="p-6 border-t border-gray-700/50 text-sm space-y-3 bg-gray-800/50"><div className="space-y-2 max-h-60 overflow-y-auto bg-gray-900/50 p-2 rounded-lg">{ticket.messages.map((msg, index) => <div key={index} className={`text-xs ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}><span className={`px-2 py-1 rounded-lg ${msg.sender === 'admin' ? 'bg-blue-800' : 'bg-gray-700'}`}>{msg.text}</span></div>)}</div><AdminMessageForm itemId={ticket.id} itemType="ticket" onSendMessage={handleAdminSendMessage} /></div> </details> )) )} </div> );

  const renderCurrentState = () => { switch (appState) { case 'admin': return adminScreen === 'login' ? renderAdminLoginScreen() : renderAdminDashboard(); case 'dashboard': return renderDashboard(); case 'auth': default: return renderAuthScreen(); } };
  const NotificationComponent = () => { if (!notification) return null; const styles = { success: { bg: 'bg-green-500/90', border: 'border-green-400', icon: <CheckCircleIcon className="w-6 h-6 text-white" /> }, error: { bg: 'bg-red-500/90', border: 'border-red-400', icon: <AlertTriangleIcon className="w-6 h-6 text-white" /> }, info: { bg: 'bg-blue-500/90', border: 'border-blue-400', icon: <InfoIcon className="w-6 h-6 text-white" /> } }[notification.type]; return (<div className={`absolute top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md p-4 rounded-lg border shadow-lg z-50 flex items-start gap-3 animate-fade-in-down text-white backdrop-blur-sm ${styles.bg} ${styles.border}`}><div className="flex-shrink-0">{styles.icon}</div><p className="flex-grow text-sm font-semibold pt-0.5">{notification.message}</p><button onClick={() => setNotification(null)} className="p-1 -mr-2 -mt-2 text-white/80 hover:text-white"><XIcon className="w-5 h-5" /></button></div>); };
  const ConfirmModalComponent = () => { if (!confirmModal) return null; return (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-sm border border-gray-700"><div className="p-6 text-white"><h3 className="text-lg font-bold mb-4">Confirm Action</h3><p className="text-gray-300 text-sm">{confirmModal.message}</p></div><div className="bg-gray-700/50 px-6 py-3 flex justify-end gap-3 rounded-b-xl"><button onClick={() => setConfirmModal(null)} className="px-4 py-2 rounded-md bg-gray-600 text-white text-sm font-semibold hover:bg-gray-500">Cancel</button><button onClick={confirmModal.onConfirm} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500">Confirm</button></div></div></div>); };
  
  const showAuthBackground = appState === 'auth' && ['welcome', 'email', 'otp'].includes(authScreen);
  const isAdminDashboard = appState === 'admin' && adminScreen === 'dashboard';

  return (
    <main className="bg-gray-900 flex items-center justify-center min-h-screen">
       <div className={isAdminDashboard ? "w-full h-screen bg-gray-900" : "w-full max-w-sm h-[844px] max-h-[844px] bg-gray-900 overflow-hidden shadow-2xl rounded-3xl relative border-4 border-gray-800"}>
        <NotificationComponent /> <ConfirmModalComponent />
        {showAuthBackground && (<> <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2940&auto=format&fit=crop')" }}></div> <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> </>)}
        <div className="relative z-10 h-full">{renderCurrentState()}</div>
      </div>
    </main>
  );
};

export default App;
