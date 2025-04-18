// src/pages/WelcomePage.tsx
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/react';

const WelcomePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Hello, User! 🧑</h2>
        <p>This is your home page.</p>
      </IonContent>
    </IonPage>
  );
};

export default WelcomePage;
