  import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonText, IonGrid, IonRow, IonCol, IonIcon, IonButtons, IonItem, IonLabel,
  IonInput, IonModal, IonSelect, IonSelectOption, IonTextarea, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';
import {
  logOutOutline, alertCircleOutline, personCircleOutline,
  helpCircleOutline, trashOutline, documentTextOutline,
  eyeOffOutline, settingsOutline, eyeOutline
} from 'ionicons/icons';
import { useIonRouter, useIonToast } from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import '../components/Welcome.css';

interface Incident {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  reported_by: string;
  admin_solution: string;
  admin_notes: string;
  risk_level: string;
}

interface Feedback {
  id: number;
  incident_id: number;
  feedback_type: string;
  feedback_text: string;
  created_at: string;
  user_id?: string; 
}

const WelcomePage: React.FC = () => {
  const router = useIonRouter();
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<number, Feedback[]>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [presentToast] = useIonToast();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [adminSolutions, setAdminSolutions] = useState<Record<number, Feedback[]>>({});
const [showAdminDetails, setShowAdminDetails] = useState(false);


  const quotes = [
    "Security is not a product, it's a process.",
    "The best way to predict the future is to secure it.",
    "Safety is something that happens between your ears, not something you hold in your hands."
  ];
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const fetchUserAndIncidents = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        presentToast({ message: 'Failed to get user data', color: 'danger', duration: 3000 });
        return;
      }

      setCurrentUserId(user.id);  // Save user id here

      const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
      setFullName(name.charAt(0).toUpperCase() + name.slice(1));
      setUserEmail(user.email ?? 'unknown');

      const { data: userIncidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (incidentsError) {
        presentToast({ message: 'Failed to load incidents', color: 'danger', duration: 3000 });
        return;
      }

      setIncidents(userIncidents || []);

      if (userIncidents && userIncidents.length > 0) {
        const incidentIds = userIncidents.map(i => i.id);
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedbacks')
          .select('*')
          .in('incident_id', incidentIds)
          .order('created_at', { ascending: true });

        if (feedbackError) {
          presentToast({ message: 'Failed to load feedbacks', color: 'danger', duration: 3000 });
          return;
        }

        const feedbackMap: Record<number, Feedback[]> = {};
        feedbackData?.forEach(fb => {
          if (!feedbackMap[fb.incident_id]) feedbackMap[fb.incident_id] = [];
          feedbackMap[fb.incident_id].push(fb);
        });
        setFeedbacks(feedbackMap);
      }
    };

    fetchUserAndIncidents();
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [presentToast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('email');
    router.push('/auth');
  };

 const handleSaveProfile = async () => {
  if (!fullName || !userEmail) {
    presentToast({ message: 'Name and email cannot be empty.', color: 'warning', duration: 2000 });
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    presentToast({ message: 'Session expired. Please log in again.', color: 'danger', duration: 3000 });
    return;
  }

  const updates: any = {
    email: userEmail,
    data: { full_name: fullName }
  };
  if (newPassword) updates.password = newPassword;

  const { error: authError } = await supabase.auth.updateUser(updates);
  if (authError) {
    presentToast({ message: `Update failed: ${authError.message}`, color: 'danger', duration: 3000 });
    return;
  }

  // 👇 ADD THIS TO SYNC FULL NAME TO USERS TABLE
  const { error: profileError } = await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', sessionData.session.user.id);

  if (profileError) {
    presentToast({ message: `Updated auth, but DB update failed: ${profileError.message}`, color: 'warning', duration: 3000 });
  }

  presentToast({ message: 'Profile updated successfully!', color: 'success', duration: 2000 });

  setNewPassword('');
  setShowPassword(false);
  setShowProfileModal(false);

  if (newPassword) setTimeout(() => router.push('/auth'), 2100);
};


  const deleteIncident = async (id: number) => {
    const { error } = await supabase.from('incidents').delete().eq('id', id);
    if (error) {
      presentToast({ message: 'Failed to delete', color: 'danger', duration: 2000 });
    } else {
      setIncidents(prev => prev.filter(i => i.id !== id));
      setFeedbacks(prev => {
        const newFeedbacks = { ...prev };
        delete newFeedbacks[id];
        return newFeedbacks;
      });
      presentToast({ message: 'Report deleted', color: 'success', duration: 2000 });
      setSelectedIncident(null);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackType) {
      presentToast({ message: 'Please select a feedback type', color: 'warning', duration: 2000 });
      return;
    }
    if (!selectedIncident) {
      presentToast({ message: 'No incident selected', color: 'danger', duration: 2000 });
      return;
    }
    if (!currentUserId) {
      presentToast({ message: 'You must be logged in to submit feedback', color: 'danger', duration: 2000 });
      return;
    }
    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert({
          incident_id: selectedIncident.id,
          user_id: currentUserId,   // IMPORTANT: Include user_id here
          feedback_type: feedbackType,
          feedback_text: feedbackText,
        });

      if (error) throw error;

      setFeedbacks(prev => {
        const incidentFeedbacks = prev[selectedIncident.id] || [];
        return {
          ...prev,
          [selectedIncident.id]: [...incidentFeedbacks, {
            id: Date.now(),
            incident_id: selectedIncident.id,
            user_id: currentUserId,
            feedback_type: feedbackType,
            feedback_text: feedbackText,
            created_at: new Date().toISOString(),
          }],
        };
      });

      presentToast({ message: 'Feedback submitted successfully', color: 'success', duration: 2000 });
      setFeedbackType(null);
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch (error: any) {
      presentToast({ message: `Failed to submit feedback: ${error.message || error}`, color: 'danger', duration: 3000 });
    }
  };

  const statusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'open': return 'red';
      case 'investigating': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'yellow';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Welcome, {fullName || 'User'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout} color="light">
              <IonIcon icon={logOutOutline} slot="start" />
              Logout
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center ion-text-center ion-margin-top">
            <IonCol size="12" sizeMd="8" sizeLg="6">
              <h2 style={{ fontWeight: 700, fontSize: '26px' }}>👋 Hello, {fullName || 'User'}!</h2>
              <p style={{ fontSize: '16px', margin: '10px 0', fontStyle: 'italic' }}>
                “{quote}”
              </p>

              <IonButton
                routerLink="/report-incidents"
                color="tertiary"
                expand="block"
                className="ion-margin-top"
              >
                <IonIcon icon={alertCircleOutline} slot="start" />
                Report an Incident
              </IonButton>

              <IonButton
                expand="block"
                color="secondary"
                className="ion-margin-top"
                onClick={() => {
                  setShowIncidentModal(true);
                  setSelectedIncident(null);
                }}
              >
                <IonIcon icon={documentTextOutline} slot="start" />
                View My Incident Reports
              </IonButton>

              <IonGrid className="ion-margin-top">
                <IonRow>
                  <IonCol>
                    <IonButton expand="block" fill="outline" onClick={() => setShowProfileModal(true)}>
                      <IonIcon icon={personCircleOutline} slot="start" />
                      Profile
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" fill="outline" onClick={() => setShowSettingsModal(true)}>
                      <IonIcon icon={settingsOutline} slot="start" />
                      Settings
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" fill="outline">
                      <IonIcon icon={helpCircleOutline} slot="start" />
                      Support
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCol>
          </IonRow>
        </IonGrid>

<IonModal isOpen={showIncidentModal} onDidDismiss={() => { setShowIncidentModal(false); setSelectedIncident(null); }}>
  <IonHeader>
    <IonToolbar>
      <IonTitle>My Incident Reports</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={() => setShowIncidentModal(false)}>Close</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent>
    {incidents.length === 0 ? (
      <IonText className="ion-padding">No incident reports found.</IonText>
    ) : (
      incidents.map(incident => (
        <IonItem
          key={incident.id}
          button
          detail
          onClick={() => setSelectedIncident(incident)}
        >
          <IonLabel>
            <h3>{incident.title}</h3>
            <p>Status: <span style={{ color: statusColor(incident.status) }}>{incident.status}</span></p>
            <p>{new Date(incident.created_at).toLocaleString()}</p>
          </IonLabel>
        </IonItem>
      ))
    )}

    {selectedIncident && (
      <>
        <IonItem lines="none" className="ion-padding-top">
          <IonLabel>
            <h2>{selectedIncident.title}</h2>
            <p>{selectedIncident.description}</p>
            <p><strong>Status:</strong> <span style={{ color: statusColor(selectedIncident.status) }}>{selectedIncident.status}</span></p>
            <p><small>Reported on: {new Date(selectedIncident.created_at).toLocaleString()}</small></p>
          </IonLabel>
        </IonItem>

        {/* TOGGLE ADMIN DETAILS */}
        <IonButton
          expand="block"
          fill="outline"
          onClick={() => setShowAdminDetails(prev => !prev)}
          className="ion-margin-top"
        >
          {showAdminDetails ? 'Hide Admin Details' : 'View Admin Details'}
        </IonButton>

        {/* ADMIN DETAILS SECTION */}
        {showAdminDetails && (
          <IonCard color="light" className="ion-margin-top">
            <IonCardHeader>
              <IonCardTitle>Admin Feedback</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {selectedIncident.admin_solution && (
                <p><strong>Solution:</strong> {selectedIncident.admin_solution}</p>
              )}
              {selectedIncident.admin_notes && (
                <p><strong>Notes:</strong> {selectedIncident.admin_notes}</p>
              )}
              {selectedIncident.risk_level && (
                <p><strong>Risk:</strong> {selectedIncident.risk_level}</p>
              )}
              {!selectedIncident.admin_solution &&
                !selectedIncident.admin_notes &&
                !selectedIncident.risk_level && (
                  <p>(No admin details yet.)</p>
              )}
            </IonCardContent>
          </IonCard>
        )}

        <IonButton
          color="danger"
          expand="block"
          onClick={() => deleteIncident(selectedIncident.id)}
          className="ion-margin-top"
        >
          <IonIcon icon={trashOutline} slot="start" />
          Delete Report
        </IonButton>

        <IonButton
          color="primary"
          expand="block"
          onClick={() => setShowFeedbackModal(true)}
          className="ion-margin-top"
        >
          <IonIcon icon={helpCircleOutline} slot="start" />
          Provide Feedback
        </IonButton>

        <IonText className="ion-padding">
          <h3>Feedbacks</h3>
          {feedbacks[selectedIncident.id]?.length ? (
            feedbacks[selectedIncident.id].map(fb => (
              <div key={fb.id} style={{ border: '1px solid #ccc', borderRadius: 4, padding: '6px 10px', margin: '6px 0' }}>
                <strong>{fb.feedback_type}:</strong> {fb.feedback_text}
                <br />
                <small>{new Date(fb.created_at).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No feedbacks yet.</p>
          )}
        </IonText>
      </>
    )}
  </IonContent>
</IonModal>


 {/* Feedback Submission Modal */}
        <IonModal isOpen={showFeedbackModal} onDidDismiss={() => setShowFeedbackModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Feedback</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFeedbackModal(false)}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel>Feedback Type</IonLabel>
              <IonSelect
                value={feedbackType}
                placeholder="Select Type"
                onIonChange={e => setFeedbackType(e.detail.value)}
              >
                <IonSelectOption value="Suggestion">Suggestion</IonSelectOption>
                <IonSelectOption value="Issue">Issue</IonSelectOption>
                <IonSelectOption value="Question">Question</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="floating">Feedback Text</IonLabel>
              <IonTextarea
                value={feedbackText}
                onIonChange={e => setFeedbackText(e.detail.value!)}
              />
            </IonItem>
            <IonButton expand="block" onClick={submitFeedback} disabled={!feedbackType || !feedbackText.trim()}>
              Submit Feedback
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Profile Modal */}
        <IonModal isOpen={showProfileModal} onDidDismiss={() => setShowProfileModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowProfileModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="floating">Full Name</IonLabel>
              <IonInput
                value={fullName}
                onIonChange={e => setFullName(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Email</IonLabel>
              <IonInput
                type="email"
                value={userEmail}
                onIonChange={e => setUserEmail(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">New Password</IonLabel>
              <IonInput
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onIonChange={e => setNewPassword(e.detail.value!)}
                autocomplete="new-password"
              />
              <IonButton slot="end" fill="clear" onClick={() => setShowPassword(!showPassword)}>
                <IonIcon icon={showPassword ? eyeOutline : eyeOffOutline} />
              </IonButton>
            </IonItem>

            <IonButton expand="block" className="ion-margin-top" onClick={handleSaveProfile}>
              Save Changes
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Settings Modal (placeholder) */}
        <IonModal isOpen={showSettingsModal} onDidDismiss={() => setShowSettingsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Settings</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSettingsModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p>No settings configured yet.</p>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
