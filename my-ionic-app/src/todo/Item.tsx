import React, { useCallback } from 'react';
import {IonDatetime, IonImg, IonItem, IonLabel, IonToggle} from '@ionic/react';
import { ItemProps } from './ItemProps';

interface ItemPropsExt extends ItemProps {
  onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ title,releaseDate,rented,noOfRentals, photoPath, _id, onEdit }) => {
  const handleEdit = useCallback(() => onEdit(_id), [_id, onEdit]);

  return (
    <IonItem onClick={handleEdit}>
      <IonLabel>{title}</IonLabel>
      <IonDatetime value={releaseDate.toString()}/>
      <IonToggle checked={rented}/>
      <IonLabel>{noOfRentals}</IonLabel>
      <IonImg style={{width: "200px", height: "200px", margin: "0 auto"}} alt={"No photo"} src={photoPath}/>
    </IonItem>
  );
};

export default Item;

