import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonModal,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/react';
import {getLogger} from '../core';
import {ItemContext} from './ItemProvider';
import {ItemProps} from './ItemProps';
import {MyMap} from "../utils/MyMap";
import {createAnimation} from "@ionic/core";
import {camera} from "ionicons/icons";
import {MyPhoto, usePhotos} from "../utils/usePhotos";
import {ItemEditProps} from "./ItemEditProps";

const log = getLogger('ItemEdit');

function mapLog(source: string){
  return (e:any) => console.log(source, e.latLng.lat(), e.latLng.lng());
}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem } = useContext(ItemContext);
  const [title, setTitle] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date());
  const [rented, setRented] = useState(false);
  const [noOfRentals, setNoOfRentals] = useState(0);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [photoPath, setPhotoPath] = useState('');
  const [item, setItem] = useState<ItemProps>();

  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const item = items?.find(it => it._id === routeId);
    setItem(item);
    if (item) {
      setTitle(item.title);
      setReleaseDate(item.releaseDate);
      setRented(item.rented);
      setNoOfRentals(item.noOfRentals);
      setLat(item.lat);
      setLng(item.lng);
      console.log(photoPath);
      setPhotoPath(item.photoPath);
      console.log(photoPath);
    }
  }, [match.params.id, items]);

  const handleSave = useCallback(() => {
    const editedItem = item ? { ...item, title, releaseDate, rented, noOfRentals, lat, lng, photoPath } : { title, releaseDate, rented, noOfRentals, lat, lng, photoPath};
    console.log(item);
    saveItem && saveItem(editedItem).then(() => history.goBack());
  }, [item, saveItem, title, releaseDate, rented, noOfRentals, lat, lng, photoPath, history]);

  const setMapPosition = (e: any) => {
    setLat(e.latLng.lat());
    setLng(e.latLng.lng());
  }

  const [showModal, setShowModal] = useState(false);

  const enterAnimation = (baseEl: any) => {
    const backdropAnimation = createAnimation()
      .addElement(baseEl.querySelector("ion-backdrop")!)
      .fromTo("opacity", "0.01", "var(--backdrop-opacity)");

    const wrapperAnimation = createAnimation()
      .addElement(baseEl.querySelector(".modal-wrapper")!)
      .keyframes([
        { offset: 0, opacity: "0", transform: "scale(0)" },
        { offset: 1, opacity: "0.99", transform: "scale(1)" },
      ]);

    return createAnimation()
      .addElement(baseEl)
      .easing("ease-out")
      .duration(500)
      .addAnimation([backdropAnimation, wrapperAnimation]);
  };

  const leaveAnimation = (baseEl: any) => {
    return enterAnimation(baseEl).direction("reverse");
  };

  const { photos, takePhoto} = usePhotos();
  const [photoToDelete, setPhotoToDelete] = useState<MyPhoto>();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>


      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel><i>Title</i></IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')}/>
        </IonItem>
        <IonItem>
          <IonLabel><i>Release Date</i></IonLabel>
          <IonDatetime value={releaseDate.toString()}
                       onIonChange={e => setReleaseDate(new Date(e.detail.value || new Date()))}/>
        </IonItem>
        <IonItem>
          <IonLabel><i>Rented</i></IonLabel>
          <IonToggle checked={rented} onIonChange={e => setRented(e.detail.checked)}/>
        </IonItem>
        <IonItem>
          <IonLabel><i>NoOfRentals</i></IonLabel>
          <IonInput value={noOfRentals} onIonChange={e => setNoOfRentals(parseInt(e.detail.value || '0'))}/>
        </IonItem>

        <IonItem>
          <IonLabel><i>Location</i></IonLabel>
          <IonButton onClick={() => setShowModal(true)}>Show Map</IonButton>
          <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
            <MyMap lat={lat} lng={lng} onMapClick={setMapPosition} onMarkerClick={mapLog('onMarker')} ></MyMap>
            <IonButton onClick={() => setShowModal(false)}>Close Map</IonButton>
          </IonModal>
        </IonItem>

        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}

        <IonImg style={{width: "400px", height: "400px", margin: "0 auto"}} alt={"No photo"} src={photoPath}/>

        <IonFab horizontal="end" >
          <IonFabButton size="small" color="tertiary"
                        onClick={() => {
                          const photoTaken = takePhoto();
                          photoTaken.then((data) => {
                            setPhotoPath(data.webviewPath!);
                          });
                        }}>
            <IonIcon icon={camera}/>
          </IonFabButton>
        </IonFab>


      </IonContent>
    </IonPage>
  );
};

export default ItemEdit;
