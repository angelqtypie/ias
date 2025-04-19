import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonItem,
  IonLabel,
  IonTitle,
  IonModal,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

// Reusable alert component
const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => (
  <IonAlert
    isOpen={isOpen}
    onDidDismiss={onClose}
    header="Notification"
    message={message}
    buttons={['OK']}
  />
);

const CreatePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const cleanedRole = role.trim().toLowerCase();
  const [password, setPassword] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const handleOpenVerificationModal = () => {
    setShowVerificationModal(true);
  };

  const doRegister = async () => {
    setShowVerificationModal(false);
  
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw new Error("Account creation failed: " + signUpError.message);
  
      const userId = data.user?.id;
      if (!userId) throw new Error("No user ID returned from Supabase.");
  
      // ✅ Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // ✅ Validate role
      if (!['user', 'admin'].includes(cleanedRole)) {
        setAlertMessage("Invalid role. Please choose 'user' or 'admin'.");
        setShowAlert(true);
        return;
      }
  
      // ✅ Restrict admin to nbsc.edu.ph emails
      if (cleanedRole === 'admin' && !email.endsWith('@nbsc.edu.ph')) {
        setAlertMessage("Only users with @nbsc.edu.ph email can register as admin.");
        setShowAlert(true);
        return;
      }
  
      // ✅ INSERT into 'users' table
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          email: email,
          full_name: username,
          role: cleanedRole,
          user_password: hashedPassword
        }
      ]);
  
      // ✅ Handle RLS error or any insert error
      if (insertError) {
        if (insertError.message.includes("row-level security")) {
          setAlertMessage("✅ Account created. Please check your email to verify before logging in.");
          setShowAlert(true);
          return;
        } else {
          throw new Error("Failed to save user profile: " + insertError.message);
        }
      }
  
      // ✅ Everything succeeded
      setShowSuccessModal(true);
  
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "An unknown error occurred.");
      setShowAlert(true);
    }
  };
  

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ textAlign: 'center', marginTop: '10px' }}>Create Your Account</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonInput
                    label="Username"
                    labelPlacement="stacked"
                    fill="outline"
                    placeholder="Enter your full name"
                    autocomplete="off"
                    value={username}
                    onIonChange={e => setUsername(e.detail.value!)}
                  />
                </IonCol>

                <IonCol size="12">
                  <IonInput
                    label="Email"
                    labelPlacement="stacked"
                    fill="outline"
                    type="email"
                    placeholder="Enter your email"
                    autocomplete="off"
                    value={email}
                    onIonChange={e => setEmail(e.detail.value!)}
                  />
                </IonCol>

                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Select Role</IonLabel>
                    <select
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        marginTop: '8px',
                        fontSize: '16px'
                      }}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </IonItem>
                </IonCol>

                <IonCol size="12">
                  <IonInput
                    label="Password"
                    labelPlacement="stacked"
                    fill="outline"
                    type="password"
                    placeholder="Enter password"
                    autocomplete="off"
                    value={password}
                    onIonChange={e => setPassword(e.detail.value!)}
                  >
                    <IonInputPasswordToggle slot="end" />
                  </IonInput>
                </IonCol>

                <IonCol size="12">
                  <IonButton expand="block" shape="round" onClick={handleOpenVerificationModal}>
                    Create
                  </IonButton>
                </IonCol>

                <IonCol size="12">
                  <IonButton routerLink="/auth" expand="block" fill="clear" shape="round">
                    Already have an account? Sign in
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Verification Modal */}
        <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
          <IonContent className="ion-padding">
            <IonCard style={{ marginTop: '25px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ textAlign: 'center' }}>Confirm Registration</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p><strong>Full Name:</strong> {username}</p>
                  <p><strong>Role:</strong> {role}</p>
                  <p><strong>Email:</strong> {email}</p>
                </IonText>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <IonButton fill="outline" onClick={() => setShowVerificationModal(false)}>Cancel</IonButton>
                  <IonButton color="primary" onClick={doRegister}>Confirm</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

        {/* Success Modal */}
        <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
          <IonContent
            className="ion-padding"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <IonTitle style={{ marginBottom: '10px' }}>🎉 Registration Successful</IonTitle>
            <IonText className="ion-text-center">
              <p>Your account has been created successfully.</p>
              <p>Please check your email to verify your account.</p>
            </IonText>
            <IonButton routerLink="/auth" routerDirection="back" color="primary" style={{ marginTop: '20px' }}>
              Go to Login
            </IonButton>
          </IonContent>
        </IonModal>

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
      </IonContent>
    </IonPage>
  );
};

export default CreatePage;
