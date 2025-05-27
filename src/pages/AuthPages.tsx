import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonAlert,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';

const AuthPage: React.FC = () => {
  const navigation = useIonRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useIonViewWillEnter(() => {
    setUsername('');
    setPassword('');
  });

  const doLogin = async () => {
    if (username === '' || password === '') {
      setAlertMessage('Please enter your email and password.');
      setShowAlert(true);
      return;
    }

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      setAlertMessage('Login failed: ' + error.message);
      setShowAlert(true);
      return;
    }

    const userId = loginData.user?.id;

    if (!userId) {
      setAlertMessage('No user found.');
      setShowAlert(true);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      setAlertMessage('Failed to fetch user role.');
      setShowAlert(true);
      return;
    }

    await supabase.from('login_logs').insert([
      {
        user_id: userId,
        email: username,
        role: profile.role,
        logged_in_at: new Date().toISOString(),
        expire_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    ]);

    localStorage.setItem('email', username);

    if (profile.role === 'admin') {
      navigation.push('/dashboard', 'forward', 'replace');
    } else {
      navigation.push('/welcome', 'forward', 'replace');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <IonTitle
              style={{
                fontWeight: '900',
                fontSize: '32px',
                color: 'black',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              RIPSEC
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          style={{
            background: 'linear-gradient(135deg, #1f4068,rgb(82, 142, 247))',
            display: 'flex',
            height: '100vh',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <img
  src="https://i.postimg.cc/J4qY9FkM/20250527-2051-RIPSEC-Logo-Design-simple-compose-01jw8wm8tnf719wz513heerw7f-1-removebg-preview.png"  // or use an online link
  alt="Login Icon"
  style={{
    width: '400px',
    height: '400px',
    objectFit: 'cover',
    marginTop:'-150px',
    marginBottom: '-260px', // optional: overlap effect
  }}
/>
          <h2 style={{
            fontWeight: 'bold',
            fontSize: '32px',
            color: '#ffffff',
            marginTop: '-100px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>Login</h2>

          <IonItem lines="inset" className="ion-margin-vertical" style={{ width: '300px', maxWidth: '90%', borderRadius: '10px', backgroundColor: '#f4f4f4' }}>
            <IonLabel position="floating" color="dark">Email</IonLabel>
            <IonInput
              value={username}
              onIonChange={e => setUsername(e.detail.value!)}
              required
              autocomplete="off"
              color="white"
            />
          </IonItem>

          <IonItem lines="inset" className="ion-margin-bottom" style={{ width: '300px', maxWidth: '90%', borderRadius: '10px', backgroundColor: '#f4f4f4' }}>
            <IonLabel position="floating" color="dark">Password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              required
              autocomplete="off"
              color="white"
            />
          </IonItem>

          <IonButton
            onClick={doLogin}
            expand="block"
            color="tertiary"
            className="ion-margin-bottom"
            style={{ width: '300px', maxWidth: '90%', fontWeight: 'bold' }}
          >
            Login
          </IonButton>

          <IonButton
            routerLink="/register"
            expand="block"
            fill="clear"
            shape="round"
            color="light"
            style={{ width: '300px', maxWidth: '50%', textDecoration: 'underline' }}
          >
            Don't have an account? Create here
          </IonButton>

          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Login Error"
            message={alertMessage}
            buttons={['OK']}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;
