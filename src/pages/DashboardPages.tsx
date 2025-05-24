import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonButton,
  IonTextarea, IonSelect, IonSelectOption, IonLoading, IonToast, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonLabel, IonItem, IonIcon, IonButtons
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { logOut } from 'ionicons/icons';
import '../components/DashboardPage.css';

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'incidents' | 'bia' | 'biaReports' | 'feedbacks'>('dashboard');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<{ [id: number]: string }>({});
  const [biaTitle, setBiaTitle] = useState('');
  const [biaDescription, setBiaDescription] = useState('');
  const [biaReports, setBiaReports] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const currentUserRole = 'admin'; // Simulate user role

  const autoScoreRisk = (description: string): 'Low' | 'Medium' | 'High' => {
    const text = (description || '').toLowerCase();
    if (text.includes('breach') || text.includes('unauthorized') || text.includes('ransomware')) return 'High';
    if (text.includes('phishing') || text.includes('malware')) return 'Medium';
    return 'Low';
  };
 
  const solutionsByType: { [key: string]: string[] } = {
    "unauthorized access": [
      "Immediately revoke all access tokens.",
      "Reset passwords for affected users.",
      "Conduct a security audit."
    ],
    "data breach": [
      "Notify affected parties.",
      "Isolate affected systems.",
      "Engage incident response team."
    ],
    "phishing attempt": [
      "Block sender email/domain.",
      "Educate employees about phishing signs.",
      "Reset credentials if compromised."
    ],
    "malware infection": [
      "Isolate infected devices.",
      "Run anti-malware scans.",
      "Reinstall OS if needed."
    ],
    "lost device": [
      "Remote wipe device.",
      "Change passwords immediately.",
      "Notify security team."
    ]
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
    const { data, error } = await supabase.from('bia_reports').select('*').order('created_at', { ascending: false });
    if (error) setToastMsg('Failed to load BIA reports: ' + error.message);
    else setBiaReports(data || []);
  };

  const fetchFeedbacks = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('incidents')
    .select('id, title, status, created_at, user_feedback')
    .order('created_at', { ascending: false });

  if (error) {
    setToastMsg('Failed to load feedbacks: ' + error.message);
    console.error('Fetch feedback error:', error);
  } else {
    console.log('Fetched feedback data:', data);
    setFeedbacks(data || []);
  }
  setLoading(false);
};


  useEffect(() => {
    fetchIncidents();
    fetchUsers();
    fetchBIAReports();
    fetchFeedbacks();
  }, []);

  const updateSolution = async (id: number, solution: string) => {
    setLoading(true);
    const { error } = await supabase.from('incidents').update({ admin_solution: solution, status: 'In Progress' }).eq('id', id);
    if (error) setToastMsg('Failed to update solution: ' + error.message);
    else {
      setToastMsg('Solution updated');
      fetchIncidents();
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: string) => {
    setLoading(true);
    const { error } = await supabase.from('incidents').update({ status }).eq('id', id);
    if (error) setToastMsg('Failed to update status: ' + error.message);
    else {
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

  const linkBiaReport = async (id: number, bia_id: number) => {
    setLoading(true);
    await supabase.from('incidents').update({ linked_bia: bia_id }).eq('id', id);
    fetchIncidents();
    setLoading(false);
  };

  const saveNote = async (id: number) => {
    const note = noteDrafts[id] || '';
    setLoading(true);
    const { error } = await supabase.from('incidents').update({ admin_note: note }).eq('id', id);
    if (error) setToastMsg('Failed to save note: ' + error.message);
    else {
      setToastMsg('Note saved');
      fetchIncidents();
    }
    setLoading(false);
  };

  const submitBiaReport = async () => {
    if (!biaTitle.trim() || !biaDescription.trim()) {
      setToastMsg('Title and description required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('bia_reports').insert([{ title: biaTitle.trim(), description: biaDescription.trim() }]);
    if (error) setToastMsg('Error saving BIA: ' + error.message);
    else {
      setToastMsg('BIA report submitted');
      setBiaTitle('');
      setBiaDescription('');
      fetchBIAReports();
      setActiveView('biaReports');
    }
    setLoading(false);
  };

  const chartData = [
    { status: 'Open', count: incidents.filter(i => i.status === 'Open').length },
    { status: 'In Progress', count: incidents.filter(i => i.status === 'In Progress').length },
    { status: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length }
  ];
  

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const BackToDashboardButton = () => (
    <IonButton size="small" onClick={() => setActiveView('dashboard')}>
      Back to Dashboard
    </IonButton>
  );

  const renderDashboard = () => (
    <div style={{ padding: 16 }}>
      <IonCard className="ion-margin-bottom">
        <IonCardHeader><IonCardTitle>📊 Incident Status Overview</IonCardTitle></IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton onClick={() => setActiveView('incidents')}>📋 View Incident Reports</IonButton>
          <IonButton onClick={() => setActiveView('bia')}>📝 Create BIA Report</IonButton>
          <IonButton onClick={() => setActiveView('biaReports')}>📄 View BIA Reports</IonButton>
          <IonButton onClick={() => setActiveView('feedbacks')}>📥 View User Feedback</IonButton>
        </div>
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
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderIncidents = () => (
    <IonList>
      <BackToDashboardButton />
      {incidents.map((incident) => {
        const typeKey = (incident.title || '').toLowerCase().trim();
        const solutions = solutionsByType[typeKey] || [];
        const reporter = usersMap[incident.reported_by] || 'Unknown';
        return (
          <IonCard key={incident.id} className="ion-margin-bottom">
            <IonCardHeader><IonCardTitle>{incident.title}</IonCardTitle></IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Status:</IonLabel>
                <IonSelect
                  value={incident.status}
                  placeholder="Select Status"
                  onIonChange={e => updateStatus(incident.id, e.detail.value!)}
                  interface="alert"
                >
                  <IonSelectOption value="Open">Open</IonSelectOption>
                  <IonSelectOption value="In Progress">Investigating</IonSelectOption>
                  <IonSelectOption value="Resolved">Resolved</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem><IonLabel><strong>Reported by:</strong> {reporter}</IonLabel></IonItem>
              <IonItem><IonLabel><strong>Reported at:</strong> {new Date(incident.created_at).toLocaleString()}</IonLabel></IonItem>
              <IonItem><IonLabel><strong>Login IP:</strong> {incident.login_ip}</IonLabel></IonItem>
              <IonItem><IonLabel><strong>Description:</strong> {incident.description}</IonLabel></IonItem>

              {currentUserRole === 'admin' && (
                <>
                  <IonLabel className="ion-margin-top"><strong>Admin Solution</strong></IonLabel>
                  <IonSelect
                    placeholder="Select a solution"
                    value={incident.admin_solution || ''}
                    onIonChange={e => updateSolution(incident.id, e.detail.value!)}
                    interface="alert"
                  >
                    {solutions.map((sol, idx) => (
                      <IonSelectOption key={idx} value={sol}>{sol}</IonSelectOption>
                    ))}
                  </IonSelect>

                  <IonLabel className="ion-margin-top"><strong>Risk Level</strong></IonLabel>
                  <IonSelect
                    placeholder="Select Risk"
                    value={incident.risk_level || ''}
                    onIonChange={e => updateRiskLevel(incident.id, e.detail.value!)}
                  >
                    <IonSelectOption value="Low">Low</IonSelectOption>
                    <IonSelectOption value="Medium">Medium</IonSelectOption>
                    <IonSelectOption value="High">High</IonSelectOption>
                  </IonSelect>

                  <IonLabel className="ion-margin-top"><strong>Link BIA Report</strong></IonLabel>
                  <IonSelect
                    placeholder="Link a BIA report"
                    onIonChange={e => linkBiaReport(incident.id, e.detail.value!)}
                  >
                    {biaReports.map(bia => (
                      <IonSelectOption key={bia.id} value={bia.id}>{bia.title}</IonSelectOption>
                    ))}
                  </IonSelect>
                </>
              )}

              <IonLabel className="ion-margin-top"><strong>Admin Notes</strong></IonLabel>
              <IonTextarea
                placeholder="Enter notes"
                value={noteDrafts[incident.id] || ''}
                onIonChange={e => setNoteDrafts(prev => ({ ...prev, [incident.id]: e.detail.value! }))}
                rows={3}
              />
              <IonButton expand="block" onClick={() => saveNote(incident.id)} className="ion-margin-top">
                Save Note
              </IonButton>
            </IonCardContent>
          </IonCard>
        );
      })}
    </IonList>
  );

  const renderBIAForm = () => (
    <div style={{ padding: 16 }}>
      <BackToDashboardButton />
      <IonCard>
        <IonCardHeader><IonCardTitle>📝 Create Business Impact Analysis (BIA) Report</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="floating">Title</IonLabel>
            <IonTextarea
              value={biaTitle}
              onIonChange={e => setBiaTitle(e.detail.value!)}
              rows={1}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">Description</IonLabel>
            <IonTextarea
              value={biaDescription}
              onIonChange={e => setBiaDescription(e.detail.value!)}
              rows={5}
            />
          </IonItem>
          <IonButton expand="block" className="ion-margin-top" onClick={submitBiaReport}>
            Submit BIA Report
          </IonButton>
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderBIAReports = () => (
    <IonList>
      <BackToDashboardButton />
      {biaReports.length === 0 && <p style={{ padding: 16 }}>No BIA reports submitted.</p>}
      {biaReports.map(bia => (
        <IonCard key={bia.id} className="ion-margin-bottom">
          <IonCardHeader><IonCardTitle>{bia.title}</IonCardTitle></IonCardHeader>
          <IonCardContent>
            <p>{bia.description}</p>
            <small>Created at: {new Date(bia.created_at).toLocaleString()}</small>
          </IonCardContent>
        </IonCard>
      ))}
    </IonList>
  );

 const renderFeedbacks = () => {
  if (feedbacks.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <BackToDashboardButton />
        <p>No user feedbacks available yet.</p>
      </div>
    );
  }

  return (
    <IonList>
      <BackToDashboardButton />
      {feedbacks.map(incident => (
        <IonCard key={incident.id} className="ion-margin-bottom">
          <IonCardHeader>
            <IonCardTitle>{incident.title}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel><strong>Reported:</strong> {new Date(incident.created_at).toLocaleDateString()}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel><strong>Status:</strong> {incident.status || 'N/A'}</IonLabel>
            </IonItem>
            <IonItem lines="none" style={{ marginTop: 8 }}>
              <IonLabel><strong>User Feedback:</strong></IonLabel>
            </IonItem>
            <IonItem lines="none">
              <div style={{ whiteSpace: 'pre-wrap', paddingLeft: '12px' }}>
                {incident.user_feedback || '(No feedback text)'}
              </div>
            </IonItem>
          </IonCardContent>
        </IonCard>
      ))}
    </IonList>
  );
};


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={logout}>
              <IonIcon icon={logOut} />
              Log out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading && <IonLoading isOpen={loading} message="Loading..." />}
        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={2500}
          color="danger"
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
