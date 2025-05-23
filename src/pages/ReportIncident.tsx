// File: src/pages/ReportIncident.tsx

import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

const ReportIncident: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleSubmit = async () => {
    if (!title || !description || !severity) {
      setToastMsg('Please fill all fields');
      setShowToast(true);
      return;
    }

    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData?.user?.id;

    const { error } = await supabase.from('incidents').insert([
      {
        title,
        description,
        severity,
        status: 'open',
        reported_by: userId,
      }
    ]);

    if (error) {
      setToastMsg('Error reporting incident');
    } else {
      setToastMsg('Incident reported successfully');
      setTitle('');
      setDescription('');
      setSeverity('');
    }
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="danger">
          <IonTitle>🚨 Report Security Issue</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{
        background: 'linear-gradient(to bottom right, #fef3c7, #fcd34d)',
        minHeight: '100vh'
      }}>
        <IonCard color="light" className="ion-padding">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={alertCircleOutline} /> Incident Details
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem className="ion-margin-bottom">
              <IonLabel>What happened?</IonLabel>
              <IonSelect placeholder="Choose an incident type" value={title} onIonChange={e => setTitle(e.detail.value)}>
                <IonSelectOption value="Unauthorized Access">Unauthorized Access</IonSelectOption>
                <IonSelectOption value="Data Breach">Data Breach</IonSelectOption>
                <IonSelectOption value="Phishing Attempt">Phishing Attempt</IonSelectOption>
                <IonSelectOption value="Malware Infection">Malware Infection</IonSelectOption>
                <IonSelectOption value="Lost Device">Lost Device</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem className="ion-margin-bottom">
              <IonLabel>How severe is it?</IonLabel>
              <IonSelect placeholder="Select severity level" value={severity} onIonChange={e => setSeverity(e.detail.value)}>
                <IonSelectOption value="low">Low</IonSelectOption>
                <IonSelectOption value="medium">Medium</IonSelectOption>
                <IonSelectOption value="high">High</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem className="ion-margin-bottom">
              <IonLabel position="floating">Additional details (optional)</IonLabel>
              <IonTextarea autoGrow value={description} onIonChange={e => setDescription(e.detail.value!)} />
            </IonItem>

            <IonButton expand="block" color="danger" onClick={handleSubmit} className="ion-margin-top">
              Submit Report
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReportIncident;
