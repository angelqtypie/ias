import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonText, IonGrid, IonRow, IonCol, IonIcon, IonButtons, IonItem, IonLabel,
  IonInput, IonToggle, IonModal, IonSelect, IonSelectOption, IonTextarea
} from '@ionic/react';
import {
  logOutOutline, alertCircleOutline, personCircleOutline,
  settingsOutline, helpCircleOutline, trashOutline, documentTextOutline,
  eyeOffOutline, eyeOutline
} from 'ionicons/icons';
import { useIonRouter, useIonToast } from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import '../components/Welcome.css'

const WelcomePage: React.FC = () => {
  const router = useIonRouter();
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [presentToast] = useIonToast();

  // Settings modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Incident detail
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const quotes = [
    "Security is not a product, it's a process.",
    "The best way to predict the future is to secure it.",
    "Safety is something that happens between your ears, not something you hold in your hands."
  ];
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
        setFullName(name.charAt(0).toUpperCase() + name.slice(1));
        setUserEmail(user.email ?? 'unknown');

        const { data: userIncidents } = await supabase
          .from('incidents')
          .select('*')
          .eq('reported_by', user.id)
          .order('created_at', { ascending: false });

        setIncidents(userIncidents || []);
      }
    };
    fetchUser();
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Load saved settings from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedNotifications = localStorage.getItem('notificationsEnabled') !== 'false'; // default true
    setDarkMode(savedDarkMode);
    setNotificationsEnabled(savedNotifications);

    // Apply dark mode CSS class if enabled
    if (savedDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem('darkMode', val.toString());
    if (val) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    localStorage.setItem('notificationsEnabled', val.toString());
    presentToast({ message: `Notifications ${val ? 'enabled' : 'disabled'}`, color: 'primary', duration: 1500 });
  };

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

  if (newPassword) {
    updates.password = newPassword;
  }

  const { error } = await supabase.auth.updateUser(updates);

  if (error) {
    presentToast({ message: `Update failed: ${error.message}`, color: 'danger', duration: 3000 });
    return;
  }

  presentToast({ message: 'Profile updated successfully!', color: 'success', duration: 2000 });

  setNewPassword('');
  setShowPassword(false);
  setShowProfileModal(false);

  if (newPassword) {
    setTimeout(() => router.push('/auth'), 2100); // Force re-login if password changed
  }
};

  const deleteIncident = async (id: number) => {
    const { error } = await supabase.from('incidents').delete().eq('id', id);
    if (error) {
      presentToast({ message: 'Failed to delete', color: 'danger', duration: 2000 });
    } else {
      setIncidents(prev => prev.filter(i => i.id !== id));
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
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          feedback_type: feedbackType,
          feedback_text: feedbackText,
        })
        .eq('id', selectedIncident.id);

      if (error) throw error;

      setIncidents(prev =>
        prev.map(inc => inc.id === selectedIncident.id ? { ...inc, feedback_type: feedbackType, feedback_text: feedbackText } : inc)
      );

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
      case 'open':
        return 'red';
      case 'investigating':
        return 'orange';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'gray';
      default:
        return 'yellow';
    }
  };

  return (
    <>
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

          {/* Incident List Modal */}
          <IonModal isOpen={showIncidentModal} onDidDismiss={() => { setShowIncidentModal(false); setSelectedIncident(null); }}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>My Incident Reports</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowIncidentModal(false)}>Close</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {incidents.length === 0 ? (
                <IonText>No incident reports found.</IonText>
              ) : (
                incidents.map(incident => (
                  <IonItem
                    key={incident.id}
                    button
                    onClick={() => setSelectedIncident(incident)}
                    detail
                    lines="inset"
                  >
                    <IonLabel>
                      <h3>{incident.title || 'Untitled'}</h3>
                      <p>Status: <span style={{ color: statusColor(incident.status) }}>{incident.status}</span></p>
                      {incident.feedback_type && (
                        <p>
                          Feedback: <b>{incident.feedback_type}</b><br />
                          <i>{incident.feedback_text}</i>
                        </p>
                      )}
                    </IonLabel>
                  </IonItem>
                ))
              )}

              {selectedIncident && (
                <>
                  <IonText className="ion-padding">
                    <h2>{selectedIncident.title}</h2>
                    <p><b>Status:</b> {selectedIncident.status}</p>
                    <p><b>Description:</b> {selectedIncident.description}</p>
                    <p><b>Reported At:</b> {new Date(selectedIncident.created_at).toLocaleString()}</p>
                  </IonText>

                  <IonButton expand="block" color="danger" onClick={() => deleteIncident(selectedIncident.id)} className="ion-margin-bottom">
                    <IonIcon icon={trashOutline} slot="start" />
                    Delete Report
                  </IonButton>

                  <IonButton expand="block" color="primary" onClick={() => setShowFeedbackModal(true)}>
                    <IonIcon icon={documentTextOutline} slot="start" />
                    Submit Feedback
                  </IonButton>
                </>
              )}
            </IonContent>
          </IonModal>

          {/* Feedback Modal */}
          <IonModal isOpen={showFeedbackModal} onDidDismiss={() => setShowFeedbackModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Submit Feedback</IonTitle>
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
                  <IonSelectOption value="positive">Helpful</IonSelectOption>
                  <IonSelectOption value="negative">Not Helpful</IonSelectOption>
                  <IonSelectOption value="neutral">Neutral</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonTextarea
                  value={feedbackText}
                  placeholder="Enter your feedback here..."
                  onIonChange={e => setFeedbackText(e.detail.value!)}
                  autoGrow={true}
                />
              </IonItem>
              <IonButton expand="block" className="ion-margin-top" onClick={submitFeedback}>
                Submit
              </IonButton>
            </IonContent>
          </IonModal>

          {/* Profile Modal */}
<IonModal isOpen={showProfileModal} onDidDismiss={() => setShowProfileModal(false)}>
  <IonHeader>
    <IonToolbar>
      <IonTitle>My Profile</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={() => setShowProfileModal(false)}>Close</IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent className="ion-padding">
    <IonItem>
      <IonLabel position="stacked">Full Name</IonLabel>
      <IonInput value={fullName} onIonChange={e => setFullName(e.detail.value!)} />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">Email</IonLabel>
      <IonInput value={userEmail} onIonChange={e => setUserEmail(e.detail.value!)} />
    </IonItem>
    <IonItem>
      <IonLabel position="stacked">New Password</IonLabel>
      <IonInput
        type={showPassword ? 'text' : 'password'}
        value={newPassword}
        onIonChange={e => setNewPassword(e.detail.value!)}
      />
      <IonButton slot="end" fill="clear" onClick={() => setShowPassword(!showPassword)}>
        <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
      </IonButton>
    </IonItem>

    <IonGrid className="ion-margin-top">
      <IonRow>
        <IonCol>
          <IonButton expand="block" color="medium" onClick={() => setShowProfileModal(false)}>
            Cancel
          </IonButton>
        </IonCol>
        <IonCol>
          <IonButton expand="block" color="primary" onClick={handleSaveProfile}>
            Save Changes
          </IonButton>
        </IonCol>
      </IonRow>
    </IonGrid>
  </IonContent>
</IonModal>

          {/* Settings Modal */}
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
              <IonItem>
                <IonLabel>Dark Mode</IonLabel>
                <IonToggle checked={darkMode} onIonChange={e => toggleDarkMode(e.detail.checked)} />
              </IonItem>
              <IonItem>
                <IonLabel>Notifications</IonLabel>
                <IonToggle checked={notificationsEnabled} onIonChange={e => toggleNotifications(e.detail.checked)} />
              </IonItem>
            </IonContent>
          </IonModal>
        </IonContent>
      </IonPage>
    </>
  );
};

export default WelcomePage;
