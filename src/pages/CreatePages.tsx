import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonItem,
  IonLabel,
  IonAlert,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonText
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

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

      const cleanedRole = role.trim().toLowerCase();
      if (!['user', 'admin'].includes(cleanedRole)) {
        setAlertMessage("Invalid role. Please choose 'user' or 'admin'.");
        setShowAlert(true);
        return;
      }

      if (cleanedRole === 'admin' && !email.endsWith('@nbsc.edu.ph')) {
        setAlertMessage("Only users with @nbsc.edu.ph email can register as admin.");
        setShowAlert(true);
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { error: insertError } = await supabase
        .from("users")
        .insert([{
          id: userId,
          email: email,
          full_name: username,
          role: cleanedRole,
          user_password: hashedPassword
        }]);

      if (insertError) {
        throw new Error("Failed to save user profile: " + insertError.message);
      }

      setShowSuccessModal(true);

    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "An unknown error occurred.");
      setShowAlert(true);
    }
  };

  return (
    <IonPage >
      <IonContent className="ion-padding" style={{
        background: 'linear-gradient(135deg, #ff6f61, #ff9e7f)', // Bright gradient background
        minHeight: '100vh',
      }}>
        <IonCard style={{
          maxWidth: '500px',
          margin: 'auto',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Deep shadow for a more modern look
          backgroundColor: '#333', // Dark background for the card
        }}>
          <IonCardHeader style={{ textAlign: 'center' }}>
            <IonCardTitle style={{
              fontSize: '26px',
              fontWeight: 'bold',
              color: '#fff',  // Light color for the title to contrast with dark card
              textTransform: 'uppercase',
            }}>
              Create Your Account
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ color: '#fff' }}> {/* White text for better contrast */}
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonInput
                    label="Username"
                    labelPlacement="stacked"
                    fill="outline"
                    placeholder="Enter your full name"
                    value={username}
                    onIonChange={e => setUsername(e.detail.value!)}
                    style={{
                      marginBottom: '15px',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#444', // Darker input background
                      color: '#fff', // Light text in inputs
                    }}
                  />
                </IonCol>

                <IonCol size="12">
                  <IonInput
                    label="Email"
                    labelPlacement="stacked"
                    fill="outline"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onIonChange={e => setEmail(e.detail.value!)}
                    style={{
                      marginBottom: '15px',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#444',
                      color: '#fff',
                    }}
                  />
                </IonCol>

                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked" style={{ color: 'white' }}>Select Role</IonLabel>
                    <select
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '15px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        backgroundColor: '#444',
                        color: '#fff',
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
                    value={password}
                    onIonChange={e => setPassword(e.detail.value!)}
                    style={{
                      marginBottom: '15px',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#444',
                      color: '#fff',
                    }}
                  />
                </IonCol>

                <IonCol size="12">
                  <IonButton expand="block" shape="round" style={{
                
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                  }} onClick={handleOpenVerificationModal}>
                    Create Account
                  </IonButton>
                </IonCol>

                <IonCol size="12" style={{ marginTop: '10px' }}>
                  <IonButton routerLink="/auth" expand="block" fill="clear" shape="round" color="dark">
                    Already have an account? Sign in
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Verification Modal */}
        <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
          <IonContent
            className="ion-padding"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              background: 'linear-gradient(135deg,rgb(64, 106, 245),rgb(55, 101, 255))',
              borderRadius: '16px',
            }}
          >
            <IonCard style={{ maxWidth: '500px', width: '100%', background:'rgba(0, 0, 0, 0.27)' }}>
              <IonCardHeader>
                <IonCardTitle style={{
                  textAlign: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}>
                  Confirm Creation
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p><strong>Full Name:</strong> {username}</p>
                  <p><strong>Role:</strong> {role}</p>
                  <p><strong>Email:</strong> {email}</p>
                </IonText>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '20px',
                  }}
                >
                  <IonButton fill="outline" onClick={() => setShowVerificationModal(false)}>
                    Cancel
                  </IonButton>
                  <IonButton color="primary" onClick={doRegister}>
                    Confirm
                  </IonButton>
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
      background: 'linear-gradient(135deg,rgb(56, 92, 151),rgb(18, 58, 189))', // Background color
      borderRadius: '16px', // Rounded corners for the modal
    }}
  >
    <IonCard style={{ maxWidth: '500px', width: '100%' , background:'rgba(0, 0, 0, 0.27)'  }}>
      <IonCardHeader>
        <IonCardTitle
          style={{
            textAlign: 'center',
            color: 'white', 
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          🎉 Creation Successful
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText className="ion-text-center">
          <p>Your account has been created successfully.</p>
          <p>Please check your email to verify your account.</p>
        </IonText>
        <IonButton
          routerLink="/auth"
          routerDirection="back"
          color="primary"
          style={{
            marginTop: '20px',
            width: '100%',
            borderRadius: '8px', // Round the button corners
          }}
        >
          Go to Login
        </IonButton>
      </IonCardContent>
    </IonCard>
  </IonContent>
</IonModal>

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
      </IonContent>
    </IonPage>
  );
};

export default CreatePage;
