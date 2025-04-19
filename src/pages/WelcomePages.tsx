import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButton, IonText, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';

const WelcomePage: React.FC = () => {
  const router = useIonRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      setUsername(email);
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard color="light">
          <IonCardHeader>
            <IonCardTitle className="ion-text-center">
              👋 Hello, {username || 'email'}!
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText className="ion-text-center">
              <p>Welcome to your dashboard. Enjoy your personalized experience!</p>
              <p>We're glad you're here {username} 😊</p>
            </IonText>

            <IonGrid>
              <IonRow className="ion-justify-content-center ion-padding-top">
                <IonCol size="auto">
                  <IonButton expand="block" color="medium" onClick={() => router.push('/auth')}>
                    🔙 Back to Login
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
