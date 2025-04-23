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
        <IonToolbar color="dark">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <IonTitle
              style={{
                fontWeight: '900',
                fontSize: '32px',
                color: '#ffffff',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Welcome
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          style={{
            background: 'linear-gradient(135deg, #1f4068, #2a5298)',  // Same gradient as in AuthPage
            display: 'flex',
            height: '100vh',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <IonCard style={{ maxWidth: '500px', margin: 'auto', padding: '20px' }}>
            <IonCardHeader>
              <IonCardTitle
                className="ion-text-center"
                style={{
                  fontWeight: '900',
                  fontSize: '24px',
                  color: 'dark',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                }}
              >
                👋 Hello, {username || 'User'}!
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="ion-text-center" style={{ color: 'dark' }}>
                <p>Welcome to your dashboard. Enjoy your personalized experience!</p>
                <p>We're glad you're here, {username} 😊</p>
              </IonText>

              <IonGrid>
                <IonRow className="ion-justify-content-center ion-padding-top">
                  <IonCol size="auto">
                    <IonButton
                      expand="block"
                      color="medium"
                      onClick={() => router.push('/auth')}
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#f4f4f4',  // Light color button for contrast
                      }}
                    >
                      🔙 Back to Login
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
