// File: src/pages/WelcomePage.tsx

import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonText, IonGrid, IonRow, IonCol, IonIcon, IonButtons, IonCard, IonCardHeader, IonCardTitle
} from '@ionic/react';
import {
  logOutOutline, alertCircleOutline, personCircleOutline,
  settingsOutline, helpCircleOutline
} from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

const WelcomePage: React.FC = () => {
  const router = useIonRouter();
  const [fullName, setFullName] = useState('');
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
      }
    };
    fetchUser();
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('email');
    router.push('/auth');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            Welcome, {fullName || 'User'}
          </IonTitle>
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

              <IonGrid className="ion-margin-top">
                <IonRow>
                  <IonCol>
                    <IonButton expand="block" fill="outline" routerLink="/profile">
                      <IonIcon icon={personCircleOutline} slot="start" />
                      Profile
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" fill="outline" routerLink="/settings">
                      <IonIcon icon={settingsOutline} slot="start" />
                      Settings
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" fill="outline" routerLink="/support">
                      <IonIcon icon={helpCircleOutline} slot="start" />
                      Support
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
