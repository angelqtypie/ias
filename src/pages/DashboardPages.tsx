import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonButton,
  IonTextarea, IonSelect, IonSelectOption, IonLoading, IonToast, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonCheckbox, IonLabel, IonItem, IonIcon, IonButtons 
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

import {
  BarChart, Bar, Legend, XAxis, PieChart, Pie, Cell, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useHistory } from 'react-router-dom';
import { trashOutline, logOutOutline } from 'ionicons/icons';
import '../components/DashboardPage.css';

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'incidents' | 'bia' | 'biaReports' | 'feedbacks'>('dashboard');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [biaTitle, setBiaTitle] = useState('');
  const [biaDescription, setBiaDescription] = useState('');
  const [biaReports, setBiaReports] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedIncidentTitle, setSelectedIncidentTitle] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [selectedOperational, setSelectedOperational] = useState<string>('');
  const [selectedManagerial, setSelectedManagerial] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [operationalRecs, setOperationalRecs] = useState<string[]>([]);
  const [managerialRecs, setManagerialRecs] = useState<string[]>([]);

  const [selectedSolutions, setSelectedSolutions] = useState<{ [key: string]: string }>({});

const [solutionDrafts, setSolutionDrafts] = useState<Record<string, string>>({});
const [riskDrafts, setRiskDrafts] = useState<Record<string, string>>({});
const [auditLogs, setAuditLogs] = useState<{ [incidentId: string]: AuditLog[] }>({});
const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
const [toastMessage, setToastMessage] = useState('');
const [showToast, setShowToast] = useState(false);


  const history = useHistory();


  const currentUserRole = 'admin'; // Simulate user role

  const autoScoreRisk = (description: string): 'Low' | 'Medium' | 'High' => {
    const text = (description || '').toLowerCase();
    if (text.includes('breach') || text.includes('unauthorized') || text.includes('ransomware')) return 'High';
    if (text.includes('phishing') || text.includes('malware')) return 'Medium';
    return 'Low';
  }; 
  
interface AuditLog {
  id: string;
  changed_at: string;
  changed_by: string;
  action: string;
  details: string;
}



  const recommendationsByType: {
    [type: string]: {
      operational: string[],
      managerial: string[]
    }
  } = {
    "unauthorized access": {
      operational: [
        "Immediately revoke all access tokens.",
        "Reset passwords for affected users.",
        "Conduct a security audit."
      ],
      managerial: [
        "Increase monitoring of privileged accounts.",
        "Review access control policies.",
        "Conduct staff training on access protocols."
      ]
    },
    "data breach": {
      operational: [
        "Isolate affected systems.",
        "Notify affected parties.",
        "Engage incident response team."
      ],
      managerial: [
        "Strengthen data encryption practices.",
        "Update data protection policies.",
        "Conduct compliance review."
      ]
    },
    "phishing attempt": {
      operational: [
        "Block sender email/domain.",
        "Reset credentials if compromised.",
        "Educate employees about phishing signs."
      ],
      managerial: [
        "Develop incident response procedures.",
        "Implement phishing awareness training.",
        "Review email filtering policies."
      ]
    },
    "malware infection": {
      operational: [
        "Isolate infected devices.",
        "Run anti-malware scans.",
        "Reinstall OS if needed."
      ],
      managerial: [
        "Review endpoint security strategy.",
        "Invest in security software updates.",
        "Schedule regular malware scans."
      ]
    },
    "lost device": {
      operational: [
        "Remote wipe device.",
        "Change passwords immediately.",
        "Notify security team."
      ],
      managerial: [
        "Enforce device management policies.",
        "Conduct risk assessment for lost devices."
      ]
    }

    
  };
 
  const solutionsByType: { [key: string]: string[] } = {
  "unauthorized access": [
    "Change your password immediately.",
    "Log out from all devices.",
    "Notify your supervisor or security team."
  ],
  "data breach": [
    "Avoid sharing personal or sensitive information.",
    "Monitor your accounts for unusual activity.",
    "Follow instructions from the security team."
  ],
  "phishing attempt": [
    "Do not click any suspicious links or attachments.",
    "Change your password if you interacted with the email.",
    "Notify your supervisor or security team."
  ],
  "malware infection": [
    "Disconnect your device from the internet/network.",
    "Run an antivirus or anti-malware scan.",
    "Notify your supervisor or security team."
  ],
  "lost device": [
    "Report the lost device to your security team immediately.",
    "Change all passwords linked to the device.",
    "Monitor accounts for any unauthorized activity."
  ]
}  


const fetchAuditLogs = async (incidentId: string) => {
  const { data, error } = await supabase
    .from('incident_audit_logs')
    .select('*')
    .eq('incident_id', incidentId)
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
  return data;
};


  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (error) setToastMsg('Failed to load incidents: ' + error.message);
    else {
      const enriched = (data || []).map(i => ({
        ...i,
        risk_level: i.risk_level || autoScoreRisk(i.description),
      }));
      setIncidents(enriched);
      const notes: { [id: number]: string } = {};
      enriched.forEach(i => notes[i.id] = i.admin_note || '');
      setNoteDrafts(notes);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, full_name');
    if (!error && data) {
      const map: { [id: string]: string } = {};
      data.forEach(u => map[u.id] = u.full_name);
      setUsersMap(map);
    }
  };

  const fetchBIAReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bia_reports')
      .select('id, created_at, risk_level, operational, managerial, incident_id, incidents(title), bia_description')
      .order('created_at', { ascending: false });

    if (error) {
      setToastMsg('Failed to load BIA reports: ' + error.message);
    } else {
      setBiaReports(data || []);
    }
    setLoading(false);
  };

const fetchFeedbacks = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from('feedbacks')
    .select(`
      *,
      incidents(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch feedback error:', error);
    setToastMsg('Failed to load feedbacks: ' + error.message);
  } else {
    setFeedbacks(data || []);
  }

  setLoading(false);
};


const handleMarkAsResolved = async (feedbackId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('feedbacks')
    .update({ status: 'Resolved' })
    .eq('id', feedbackId);

  if (error) {
    console.error('Error marking as resolved:', error);
    return;
  }

  // Optimistically update UI
  setFeedbacks(prev =>
    prev.map(fb =>
      fb.id === feedbackId ? { ...fb, status: 'Resolved' } : fb
    )
  );
};

const [biaReportIncidents, setBiaReportIncidents] = useState<string[]>([]);

useEffect(() => {
  // On incidents load, set initial biaReportIncidents from incidents with bia_report === true
  const selectedIds = incidents.filter(i => i.bia_report).map(i => i.id);
  setBiaReportIncidents(selectedIds);
}, [incidents]);

const toggleBiaIncident = async (incidentId: string) => {
  // Optimistically remove checkbox immediately (disable it visually)
  setBiaReportIncidents(prev => [...prev, incidentId]); // add to selected

  // Update Supabase
  const { error } = await supabase
    .from('incidents')
    .update({ bia_report: true })  // always true on check
    .eq('id', incidentId);

  if (error) {
    console.error('Failed to update BIA report flag:', error);
    // Revert UI if failed
    setBiaReportIncidents(prev => prev.filter(id => id !== incidentId));
  }
};
useEffect(() => {
  const storedHidden = localStorage.getItem('hiddenIncidents');
  if (storedHidden) {
    setHiddenIncidents(JSON.parse(storedHidden));
  }
}, []);

const handleSendAdminSolution = async (feedbackId: string) => {
  const solution = selectedSolutions[feedbackId];
  if (!solution) return;

  const { error } = await supabase
    .from('feedbacks')
    .update({ admin_solution: solution })
    .eq('id', feedbackId);

  if (error) {
    console.error('Error updating admin solution:', error);
    return;
  }

  // Update local state
  setFeedbacks(prev =>
    prev.map(fb =>
      fb.id === feedbackId ? { ...fb, admin_solution: solution } : fb
    )
  );
};




  useEffect(() => {
    fetchIncidents();
    fetchUsers();
    fetchBIAReports();
    fetchFeedbacks();
  }, []);

const updateSolution = async (incidentId: string, solution: string) => {
  if (!currentUser) {
    console.error('No user logged in!');
    return;
  }

  try {
    // 1. Optionally get old incident data
    const { data: oldIncident, error: oldIncidentError } = await supabase
      .from('incidents')
      .select('admin_solution')
      .eq('id', incidentId)
      .single();

    if (oldIncidentError) {
      console.error('Failed to fetch old incident data:', oldIncidentError);
      return;
    }

    // 2. Update incident with new solution and timestamp
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ admin_solution: solution, updated_at: new Date().toISOString() })
      .eq('id', incidentId);

    if (updateError) {
      console.error('Failed to update incident solution:', updateError);
      return;
    }

    // 3. Insert audit log entry
    const { error: logError } = await supabase
      .from('incident_audit_logs')
      .insert({
        incident_id: incidentId,
        changed_by: currentUser.id,
        action: 'solution_submitted',
        old_status: null,
        new_status: null,
        details: solution,
        changed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to insert audit log:', logError);
      return;
    }

    // Optionally update UI state here
    setToastMsg('Solution updated successfully.');

  } catch (error) {
    console.error('Unexpected error in updateSolution:', error);
  }
};


const updateStatus = async (id: number, newStatus: string) => {
  const incident = incidents.find(i => i.id === id);
  const oldStatus = incident?.status || '';

  setLoading(true);

  const { error } = await supabase.from('incidents').update({ status: newStatus }).eq('id', id);

  if (error) {
    setToastMsg('Failed to update status: ' + error.message);
  } else {
    // INSERT AUDIT LOG
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('incident_audit_logs').insert([
      {
        incident_id: incident.id,
        changed_by: user?.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_at: new Date().toISOString(),
      },
    ]);

    setToastMsg('Status updated');
    fetchIncidents();
  }

  setLoading(false);
};
 

  const updateRiskLevel = async (id: number, risk: string) => {
    setLoading(true);
    await supabase.from('incidents').update({ risk_level: risk }).eq('id', id);
    fetchIncidents();
    setLoading(false);
  };


 const saveNote = async (incidentId: string) => {
  const incident = incidents.find(i => i.id === incidentId);
  if (!incident) return;

  const admin_solution = solutionDrafts[incidentId] ?? null;
  const risk_level = riskDrafts[incidentId] ?? null;
  const admin_notes = noteDrafts[incidentId] ?? '';

  const noChanges =
    (admin_solution === (incident.admin_solution ?? null)) &&
    (risk_level === (incident.risk_level ?? null)) &&
    (admin_notes.trim() === (incident.admin_notes ?? '').trim());

  if (noChanges) {
    setToastMessage('No changes to save.');
    setShowToast(true);
    return;
  }

  const { error } = await supabase
    .from('incidents')
    .update({
      admin_solution,
      risk_level,
      admin_notes,
    })
    .eq('id', incidentId);

  if (error) {
    console.error(`Failed to update incident ${incidentId}:`, error.message);
    setToastMessage('Failed to save. Please try again.');
    setShowToast(true);
  } else {
    console.log(`Incident ${incidentId} updated successfully.`);
    setToastMessage('Changes saved successfully.');
    setShowToast(true);
  }
};


const submitBiaReport = async () => {
  if (!selectedIncidentId || !selectedRiskLevel || !selectedOperational || !selectedManagerial) {
    setToastMsg('All fields are required.');
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from('bia_reports')
    .select('id')
    .eq('incident_id', selectedIncidentId);

  if (fetchError) {
    setToastMsg('Error checking existing BIA: ' + fetchError.message);
    return;
  }

  if (existing.length > 0) {
    setToastMsg('A BIA report already exists for this incident.');
    return;
  }

  setLoading(true);

  const { error } = await supabase.from('bia_reports').insert([
    {
      incident_id: selectedIncidentId,
      risk_level: selectedRiskLevel,
      operational: selectedOperational,
      managerial: selectedManagerial,
      bia_description: biaDescription || null, // Added this field
    }
  ]);

  if (error) {
    setToastMsg('Error saving BIA: ' + error.message);
  } else {
    setToastMsg('BIA report submitted');
    // Clear form
    setSelectedIncidentId(null);
    setSelectedIncidentTitle('');
    setSelectedRiskLevel('');
    setSelectedType('');
    setOperationalRecs([]);
    setManagerialRecs([]);
    setSelectedOperational('');
    setSelectedManagerial('');
    setBiaDescription('');
    fetchBIAReports();
    setActiveView('biaReports');
  }

  setLoading(false);
};

const [hiddenIncidents, setHiddenIncidents] = useState<string[]>([]);



  const chartData = [
    { status: 'Open', count: incidents.filter(i => i.status === 'Open').length },
    { status: 'In Progress', count: incidents.filter(i => i.status === 'In Progress').length },
    { status: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length }
  ];
  
// Risk level chart data
const riskChartData = [
  { risk: 'Low', count: incidents.filter(i => i.risk_level === 'Low').length },
  { risk: 'Medium', count: incidents.filter(i => i.risk_level === 'Medium').length },
  { risk: 'High', count: incidents.filter(i => i.risk_level === 'High').length }
];

// Total reports summary
const totalReports = incidents.length;
const resolvedReports = incidents.filter(i => i.status === 'Resolved').length;
const openReports = incidents.filter(i => i.status === 'Open').length;
const inProgressReports = incidents.filter(i => i.status === 'In Progress').length;

const totalFeedbacks = feedbacks.length;
const resolvedFeedbacks = feedbacks.filter(fb => fb.status === 'Resolved').length;
const pendingFeedbacks = totalFeedbacks - resolvedFeedbacks;

  const [expandedTitles, setExpandedTitles] = useState<string[]>([]);

  
  // Toggle expanded state for a title
  const toggleTitle = (title: string) => {
    setExpandedTitles(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };
  const logout = async () => {
    await supabase.auth.signOut();
    history.push('/auth');

  };

  const BackToDashboardButton = () => (
    <IonButton size="small" onClick={() => setActiveView('dashboard')}>
      Back to Dashboard
    </IonButton>
  );
  

  const renderDashboard = () => (
    <div style={{ padding: 16 }}>
      <IonCard className="ion-margin-bottom">
        <IonCardHeader><IonCardTitle className='incidentitle'>📊 Incident Status Overview</IonCardTitle></IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton onClick={() => setActiveView('incidents')}>📋 View Incident Reports</IonButton>
          <IonButton onClick={() => setActiveView('bia')}>📝 Create BIA Report</IonButton>
          <IonButton onClick={() => setActiveView('biaReports')}>📄 View BIA Reports</IonButton>
          <IonButton onClick={() => setActiveView('feedbacks')}>📥 View User Feedback</IonButton>
        </div>
        <IonCardHeader>
         <IonCardTitle className='incidentitle'>📈 Report Status Summary</IonCardTitle>
        </IonCardHeader>
         <IonCardContent>
          <div style={{ minHeight: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3880ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
              <div style={{ textAlign: 'center', padding: '16px' }}>
      <h2 style={{ fontSize: '2rem', color: '#3880ff' }}>{totalReports}</h2>
      <p>Total Reports</p>
      <p>🟢 {resolvedReports} Resolved</p>
      <p>🟡 {inProgressReports} In Progress</p>
      <p>🔴 {openReports} Open</p>
    </div>
        </IonCardContent>
<IonCard className="ion-margin-bottom">
  <IonCardHeader>
    <IonCardTitle className='incidentitle'>📊 Risk Level Overview</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
<ResponsiveContainer width="100%" height={280}>
  <PieChart>
    <Pie
      data={riskChartData}
      dataKey="count"
      nameKey="risk"
      cx="50%"
      cy="50%"
      outerRadius={100}
      label
    >
      {riskChartData.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={['#00C49F', '#FFBB28', '#FF8042'][index % 3]}
        />
      ))}
    </Pie>
    <Tooltip />
    <Legend
      layout="horizontal"
      verticalAlign="bottom"
      align="center"
    />
  </PieChart>
</ResponsiveContainer>

  </IonCardContent>
</IonCard>

<IonCard className="ion-margin-bottom">
  <IonCardHeader>
    <IonCardTitle className='incidentitle'>📈 Feedbacks Summary</IonCardTitle>
  </IonCardHeader>
 <IonCardContent>
  <div style={{ textAlign: 'center', padding: '16px' }}>

    <h2 style={{ fontSize: '1.5rem', color: '#3880ff' }}>{totalFeedbacks}</h2>
    <p>Total Feedbacks</p>
    <p>✅ {resolvedFeedbacks} Resolved</p>
    <p>⏳ {pendingFeedbacks} Pending</p>
  </div>
</IonCardContent>
</IonCard>

      </IonCard>
    </div>
  );

const renderIncidents = () => {
  const visibleIncidents = incidents.filter(i => !hiddenIncidents.includes(i.id));

  return (
    
    <div style={{ padding: 16 }}>
      <>
        <BackToDashboardButton />
     {/* Toast for save feedback */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
      />
        {visibleIncidents.length === 0 ? (
          <p style={{ padding: 16 }}>No incidents available.</p>
        ) : (
          <IonList>
            {visibleIncidents.map((incident) => {
              const typeKey = (incident.title || '').toLowerCase().trim();
              const solutions = solutionsByType[typeKey] || [];
              const reporter = usersMap[incident.reported_by] || 'Unknown';

              const isResolved = incident.status === 'Resolved';
              const biaSelected = biaReportIncidents.includes(incident.id);

              return (
                <IonCard
                  key={incident.id}
                  className="ion-margin-bottom"
                  style={{ opacity: isResolved ? 0.6 : 1 }}
                >
                  <IonCardHeader>
                    <IonCardTitle className="incidentitle">
                      {incident.title}{' '}
                      {isResolved && (
                        <small style={{ color: 'green', marginLeft: 8 }}>(Resolved)</small>
                      )}
                    </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <IonItem>
                      <IonLabel>Status:</IonLabel>
                      <IonSelect
                        value={incident.status}
                        placeholder="Select Status"
                        onIonChange={e => updateStatus(incident.id, e.detail.value!)}
                        interface="alert"
                        disabled={isResolved}
                      >
                        <IonSelectOption value="Open">Open</IonSelectOption>
                        <IonSelectOption value="In Progress">Investigating</IonSelectOption>
                        <IonSelectOption value="Resolved">Resolved</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem>
                      <IonLabel><strong>Reported by:</strong> {reporter}</IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel><strong>Reported at:</strong> {new Date(incident.created_at).toLocaleString()}</IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel><strong>Description:</strong> {incident.description}</IonLabel>
                    </IonItem>

                    {currentUserRole === 'admin' && (
                      <>
                        <IonLabel className="ion-margin-top"><strong>Admin Solution</strong></IonLabel>
                        <IonSelect
                          placeholder="Select a solution"
                          value={solutionDrafts[incident.id] ?? incident.admin_solution ?? ''}
                          onIonChange={e =>
                            setSolutionDrafts(prev => ({
                              ...prev,
                              [incident.id]: e.detail.value!,
                            }))
                          }
                          interface="alert"
                          disabled={isResolved}
                        >
                          {solutions.map((sol, idx) => (
                            <IonSelectOption key={idx} value={sol}>{sol}</IonSelectOption>
                          ))}
                        </IonSelect>

                        <IonLabel className="ion-margin-top"><strong>Risk Level</strong></IonLabel>
                        <IonSelect
                          placeholder="Select Risk"
                          value={riskDrafts[incident.id] ?? incident.risk_level ?? ''}
                          onIonChange={e =>
                            setRiskDrafts(prev => ({
                              ...prev,
                              [incident.id]: e.detail.value!,
                            }))
                          }
                          disabled={isResolved}
                        >
                          <IonSelectOption value="Low">Low</IonSelectOption>
                          <IonSelectOption value="Medium">Medium</IonSelectOption>
                          <IonSelectOption value="High">High</IonSelectOption>
                        </IonSelect>
                      </>
                    )}

                    <IonLabel className="ion-margin-top"><strong>Admin Notes</strong></IonLabel>
                    <IonTextarea
                      placeholder="Enter notes"
                      value={noteDrafts[incident.id] ?? ''}
                      onIonChange={e =>
                        setNoteDrafts(prev => ({
                          ...prev,
                          [incident.id]: e.detail.value!,
                        }))
                      }
                      rows={3}
                      disabled={isResolved}
                    />
<IonButton
  expand="block"
  onClick={() => saveNote(incident.id)}
  className="ion-margin-top"
  disabled={
    isResolved ||
    (
      (solutionDrafts[incident.id] ?? null) === (incident.admin_solution ?? null) &&
      (riskDrafts[incident.id] ?? null) === (incident.risk_level ?? null) &&
      (noteDrafts[incident.id]?.trim() ?? '') === (incident.admin_notes ?? '').trim()
    )
  }
>
  Save
</IonButton>

                    {/* Show Add to BIA checkbox only if resolved and not added */}
                    {isResolved && !biaSelected && (
                      <IonItem lines="none">
                        <IonLabel>Add to BIA Report</IonLabel>
                        <IonCheckbox
                          checked={false}
                          onIonChange={() => toggleBiaIncident(incident.id)}
                        />
                      </IonItem>
                    )}

                    {/* Show Delete icon ONLY if resolved and already added */}
                    {isResolved && biaSelected && (
                      <IonItem lines="none" style={{ justifyContent: 'flex-center' }}>
                        <IonButton
                        className="delete-icon-button"
                          color="danger"
                          fill="clear"
                          size="large"
                        onClick={() => {
  const updated = [...hiddenIncidents, incident.id];
  setHiddenIncidents(updated);
  localStorage.setItem('hiddenIncidents', JSON.stringify(updated));
}}
 aria-label="Delete Report"
                        >
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </IonItem>
                    )}
                  </IonCardContent>
                </IonCard>
              );
            })}
          </IonList>
        )}
      </>
    </div>
  );
};


const renderBIAForm = () => {
  const biaEligibleIncidents = incidents.filter(i => i.bia_report); // ← Only those marked true

  return (
    <div style={{ padding: 16 }}>
      <BackToDashboardButton />
      <IonCard className="ion-margin-bottom">
        <IonCardHeader>
          <IonCardTitle>Create New BIA Report</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonLabel><strong>Select Incident</strong></IonLabel>
          <IonSelect
            placeholder="Select Incident"
            onIonChange={e => {
              const incidentId = e.detail.value;
              const incident = incidents.find(i => i.id === incidentId);
              if (!incident) return;
              const type = (incident.title || '').toLowerCase().trim();
              setSelectedIncidentId(incidentId);
              setSelectedIncidentTitle(incident.title || '');
              setSelectedType(type);
              setOperationalRecs(recommendationsByType[type]?.operational || []);
              setManagerialRecs(recommendationsByType[type]?.managerial || []);
            }}
          >
            {biaEligibleIncidents.map(i => (
              <IonSelectOption key={i.id} value={i.id}>
                {i.title}
              </IonSelectOption>
            ))}
          </IonSelect>

          <IonLabel className="ion-margin-top"><strong>Risk Level</strong></IonLabel>
          <IonSelect
            placeholder="Select Risk Level"
            value={selectedRiskLevel}
            onIonChange={e => setSelectedRiskLevel(e.detail.value)}
          >
            <IonSelectOption value="Low">Low</IonSelectOption>
            <IonSelectOption value="Medium">Medium</IonSelectOption>
            <IonSelectOption value="High">High</IonSelectOption>
          </IonSelect>

          {operationalRecs.length > 0 && (
            <>
              <IonLabel className="ion-margin-top"><strong>Operational Recommendation</strong></IonLabel>
              <IonSelect
                placeholder="Select Operational Recommendation"
                value={selectedOperational}
                onIonChange={e => setSelectedOperational(e.detail.value)}
              >
                {operationalRecs.map((rec, idx) => (
                  <IonSelectOption key={idx} value={rec}>{rec}</IonSelectOption>
                ))}
              </IonSelect>
            </>
          )}

          {managerialRecs.length > 0 && (
            <>
              <IonLabel className="ion-margin-top"><strong>Managerial Recommendation</strong></IonLabel>
              <IonSelect
                placeholder="Select Managerial Recommendation"
                value={selectedManagerial}
                onIonChange={e => setSelectedManagerial(e.detail.value)}
              >
                {managerialRecs.map((rec, idx) => (
                  <IonSelectOption key={idx} value={rec}>{rec}</IonSelectOption>
                ))}
              </IonSelect>
            </>
          )}

          <IonLabel className="ion-margin-top"><strong>BIA Summary (optional)</strong></IonLabel>
          <IonTextarea
            placeholder="Why this risk level and recommendations?"
            value={biaDescription}
            onIonChange={(e: CustomEvent) => setBiaDescription((e.detail.value || ''))}
          />

          <IonButton
            expand="block"
            className="ion-margin-top"
            onClick={submitBiaReport}
          >
            Submit BIA Report
          </IonButton>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

const renderBIAReports = () => (
  <div className="ion-padding">
    <BackToDashboardButton />
    {biaReports.length === 0 ? (
      <p>No BIA reports submitted.</p>
    ) : (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>BIA Reports</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {biaReports.map((bia) => (
            <IonCard key={bia.id} className="ion-margin-bottom">
              <IonCardHeader>
                <IonCardTitle>{bia.incidents?.title || 'Untitled Incident'}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>

  <p><strong>Risk Level:</strong> {bia.risk_level}</p>
  <p><strong>Operational:</strong> {bia.operational}</p>
  <p><strong>Managerial:</strong> {bia.managerial}</p>
  <p><strong>Summary:</strong> {bia.bia_description || 'No summary provided.'}</p>
  <p><strong>Created At:</strong> {new Date(bia.created_at).toLocaleString()}</p>


              </IonCardContent>
            </IonCard>
          ))}
        </IonCardContent>
      </IonCard>
    )}
  </div>
);


const renderFeedbacks = () => (
  <div style={{ padding: 16 }}>
    <BackToDashboardButton />
    {feedbacks.length === 0 ? (
      <p>No feedbacks available.</p>
    ) : (
      <IonList>
        {feedbacks.map(feedback => {
          const incidentType = feedback.incidents?.type?.toLowerCase().trim();

          return (
            <IonCard key={feedback.id} className="ion-margin-bottom">
              <IonCardHeader>
                <IonCardTitle>{feedback.incidents?.title || 'No Title'}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Feedback Type:</strong> {feedback.feedback_type}</p>
                <p><strong>Feedback:</strong> {feedback.feedback_text}</p>
                <p><strong>Reported by:</strong> {usersMap[feedback.incidents?.reported_by] || feedback.incidents?.reported_by || 'Unknown'}</p>
                <p><strong>Status:</strong> {feedback.status || 'Pending'}</p>

                {feedback.admin_solution && (
                  <p><strong>Admin Solution:</strong> {feedback.admin_solution}</p>
                )}

                {feedback.status !== 'Resolved' && (
                  <IonButton
                    color="success"
                    onClick={() => handleMarkAsResolved(feedback.id)}
                  >
                    Mark as Resolved
                  </IonButton>
                )}

                {!feedback.admin_solution && incidentType && recommendationsByType[incidentType] && (
                  <>
                    <IonLabel>Select Admin Solution:</IonLabel>
                    <IonSelect
                      value={selectedSolutions[feedback.id] || ''}
                      placeholder="Choose a solution"
                      onIonChange={(e) =>
                        setSelectedSolutions(prev => ({
                          ...prev,
                          [feedback.id]: e.detail.value
                        }))
                      }
                    >
                      {Object.entries(recommendationsByType[incidentType]).flatMap(
                        ([category, options]) => [
                          <IonSelectOption key={`${category}-label`} disabled>
                            -- {category.toUpperCase()} RECOMMENDATIONS --
                          </IonSelectOption>,
                          ...options.map((rec: string, idx: number) => (
                            <IonSelectOption key={`${category}-${idx}`} value={rec}>
                              {rec}
                            </IonSelectOption>
                          )),
                        ]
                      )}
                    </IonSelect>
                    <IonButton
                      className="ion-margin-top"
                      disabled={!selectedSolutions[feedback.id]}
                      onClick={() => handleSendAdminSolution(feedback.id)}
                    >
                      Send Reply
                    </IonButton>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          );
        })}
      </IonList>
    )}
  </div>
);


return (
  <IonPage className="admin-dashboard">

    <IonHeader>
      <IonToolbar>
           <IonTitle className="ion-text-center">
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <img src="https://i.postimg.cc/J4qY9FkM/20250527-2051-RIPSEC-Logo-Design-simple-compose-01jw8wm8tnf719wz513heerw7f-1-removebg-preview.png" alt="RIPSEC Logo" style={{ height: '50px' }} />
               <span style={{ fontWeight: 700, fontSize: 'var(--font-size-heading)' }}>RIPSEC Admin Dashboard</span>
             </div>
           </IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={logout}>LOGOUT
            <IonIcon icon={logOutOutline} slot="start" color='black'/>
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
<IonLoading isOpen={loading} message={'Please wait...'} />
<IonToast
  isOpen={toastMsg !== ''}
  message={toastMsg}
  duration={3000}
  onDidDismiss={() => setToastMsg('')}
/>
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'incidents' && renderIncidents()}
      {activeView === 'bia' && renderBIAForm()}
      {activeView === 'biaReports' && renderBIAReports()}
      {activeView === 'feedbacks' && renderFeedbacks()}
    </IonContent>
  </IonPage>
);

};

export default AdminDashboard;
