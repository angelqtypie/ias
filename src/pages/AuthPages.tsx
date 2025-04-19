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
  IonAvatar,
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

// 🔍 Fetch user's role from users table
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
    role: profile.role, // ensure this is 'admin' or 'user'
    logged_in_at: new Date().toISOString(),
    expire_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // optional
  }
]);

console.log("✅ Logged in role:", profile.role);

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
                fontSize: '30px',
                color: '#ffffff',
                letterSpacing: '0.5px',
                textTransform: 'capitalize'
              }}
            >
              Log In
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          style={{
            background: '#105796',
            display: 'flex',
            height: '89.4vh',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <IonAvatar style={{ width: '150px', height: '150px', marginBottom: '20px' }}>
            <img alt="User Avatar" src="https://heucollege.edu.vn/upload/2025/02/avatar-capybara-cute-4.webp" />
          </IonAvatar>

          <IonItem lines="inset" className="ion-margin-vertical" color="light" style={{ width: '300px', maxWidth: '90%', borderRadius: '10px' }}>
            <IonLabel position="floating" color="primary">Email</IonLabel>
            <IonInput
              value={username}
              onIonChange={e => setUsername(e.detail.value!)}
              required
              autocomplete="off"
              color="dark"
            />
          </IonItem>

          <IonItem lines="inset" className="ion-margin-bottom" color="light" style={{ width: '300px', maxWidth: '90%', borderRadius: '10px' }}>
            <IonLabel position="floating" color="primary">Password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              required
              autocomplete="off"
              color="dark"
            />
          </IonItem>

          <IonButton
            onClick={doLogin}
            expand="block"
            color="primary"
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
