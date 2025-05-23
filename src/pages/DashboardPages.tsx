// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonText, IonModal, IonInput, IonSelect, IonSelectOption
} from '@ionic/react';
import { logOutOutline, eyeOutline } from 'ionicons/icons';
import { useIonRouter, useIonToast, useIonAlert } from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'incidents' | 'bia' | 'biaReports'>('dashboard');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [biaReports, setBiaReports] = useState<any[]>([]);
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const router = useIonRouter();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusOptions] = useState(['Open', 'Investigating', 'Resolved']);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('email');
    router.push('/auth');
  };

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') return;
    setIsAdmin(true);

    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: biaData } = await supabase
      .from('bia_reports')
      .select('*')
      .order('created_at', { ascending: false });

    setIncidents(incidentsData || []);
    setBiaReports(biaData || []);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredIncidents = incidents.filter(i => i.title.toLowerCase().includes(searchText.toLowerCase()));

  const IncidentManagement = () => (
    <div>
      <IonButton size="small" onClick={() => setActiveView('dashboard')}>← Back</IonButton>
      <IonInput placeholder="Search Incidents" value={searchText} onIonChange={e => setSearchText(e.detail.value ?? '')} />
      {filteredIncidents.map((incident) => (
        <div key={incident.id} style={{ padding: 10, border: '1px solid #ccc', marginBottom: 10 }}>
          <h3>{incident.title}</h3>
          <p>{incident.description}</p>
          <p>Status: <strong>{incident.status}</strong></p>
          <p>Severity: <strong>{incident.severity}</strong></p>
          <IonSelect interface="popover" value={incident.status} onIonChange={async (e) => {
            const newStatus = e.detail.value;
            await supabase.from('incidents').update({ status: newStatus }).eq('id', incident.id);
            setIncidents(incidents.map(i => i.id === incident.id ? { ...i, status: newStatus } : i));
            presentToast({ message: 'Status updated', duration: 1500, color: 'success' });
          }}>
            {statusOptions.map(opt => (
              <IonSelectOption key={opt} value={opt}>{opt}</IonSelectOption>
            ))}
          </IonSelect>
          <IonButton size="small" onClick={() => setSelectedIncident(incident)}>
            <IonIcon icon={eyeOutline} /> View Details
          </IonButton>
        </div>
      ))}
      <IonModal isOpen={!!selectedIncident} onDidDismiss={() => setSelectedIncident(null)}>
        <div style={{ padding: 20 }}>
          <h2>{selectedIncident?.title}</h2>
          <p>{selectedIncident?.description}</p>
          <p><strong>Severity:</strong> {selectedIncident?.severity}</p>
          <p><strong>Status:</strong> {selectedIncident?.status}</p>
          <p><strong>Created:</strong> {new Date(selectedIncident?.created_at).toLocaleString()}</p>
          <IonButton size="small" expand="block" onClick={() => setSelectedIncident(null)}>Close</IonButton>
        </div>
      </IonModal>
    </div>
  );

  const SummaryWidgets = () => {
    const chartData = [
      { status: 'Open', count: incidents.filter(i => i.status === 'Open').length },
      { status: 'Investigating', count: incidents.filter(i => i.status === 'Investigating').length },
      { status: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length }
    ];

    return (
      <div style={{ marginTop: 20, height: 300 }}>
        <h3>Dashboard Summary</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0070f3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p>Total BIA Reports: {biaReports.length}</p>
      </div>
    );
  };

  const DashboardMenu = () => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginTop: '1rem' }}>
    <IonButton size="default" fill="outline" onClick={() => setActiveView('incidents')}>📋 Manage Incidents</IonButton>
    <IonButton size="default" fill="outline" onClick={() => setActiveView('bia')}>📝 Create BIA Report</IonButton>
    <IonButton size="default" fill="outline" onClick={() => setActiveView('biaReports')}>📄 View BIA Reports</IonButton>
  </div>
);

  const BIAReportForm = () => <div><IonText color="medium">[Form placeholder]</IonText></div>;
  const BIAReportsView = () => <div><IonText color="medium">[Reports placeholder]</IonText></div>;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>🛠️ Admin Panel</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout} color="dark">
              <IonIcon icon={logOutOutline} slot="end" /> Logout
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!isAdmin ? (
          <IonText color="danger"><h3>Access Denied: Admins Only</h3></IonText>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <>
                <DashboardMenu />
                <SummaryWidgets />
              </>
            )}
            {activeView === 'incidents' && <IncidentManagement />}
            {activeView === 'bia' && <BIAReportForm />}
            {activeView === 'biaReports' && <BIAReportsView />}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
