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
      const name = email.split('@')[0];  // get the part before '@'
      setUsername(name.charAt(0).toUpperCase() + name.slice(1)); // capitalize first letter
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
                fontSize: '40px',
                color: '#ffffff',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
              }}
            >
              Welcome!
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          style={{
            background: 'linear-gradient(135deg,rgb(47, 67, 156),rgba(76, 0, 255, 0.53))', // Warm gradient
            display: 'flex',
            height: '100vh',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '30px',
            boxSizing: 'border-box',
          }}
        >
          <IonCard
            style={{
              maxWidth: '500px',
              margin: 'auto',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              backgroundColor: '#ffffff',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
            }}
          >
            <IonCardHeader>
              <IonCardTitle
                className="ion-text-center"
                style={{
                  fontWeight: '900',
                  fontSize: '28px',
                  color: 'purple',
                  letterSpacing: '1px',
                  marginBottom: '15px',
                }}
              >
                👋 Hello, {username || 'User'}!
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="ion-text-center" style={{ color: '#333' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Welcome to your personalized dashboard! 🚀
                </p>
                <p style={{ fontSize: '14px' }}>Enjoy exploring your new features and tools!</p>
              </IonText>

              <IonGrid>
                <IonRow className="ion-justify-content-center ion-padding-top">
                  <IonCol size="auto">
                    <IonButton
                      expand="block"
                      color="light"
                      onClick={() => router.push('/auth')}
                      style={{
                        fontWeight: 'bold',
                        backgroundColor: '#FF6347', // Contrasting button color
                        color: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FF4500';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FF6347';
                        e.currentTarget.style.transform = 'scale(1)';
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
