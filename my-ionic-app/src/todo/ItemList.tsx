import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonBadge, IonImg
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Item from './Item';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import {AuthContext} from "../auth";
import {Redirect} from "react-router-dom";
import {ItemProps} from "./ItemProps";

import {Network} from "@capacitor/network";
import {createAnimation} from "@ionic/core";

const log = getLogger('ItemList');

let isConnectedInitially = true;
Network.addListener("networkStatusChange", status => {
  isConnectedInitially = status.connected;
})

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  const [isConnected, setIsConnected] = useState<boolean>(isConnectedInitially)
  Network.addListener("networkStatusChange", status => {
    setIsConnected(status.connected);
  })

  const { items, fetching, fetchingError } = useContext(ItemContext);
  const { logout } = useContext(AuthContext);

  const[disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const[pos, setPos] = useState(10);

  const [filter, setFilter] = useState<string | undefined>("any number of rentals");
  const selectOptions = ["<=10 rentals", ">10 rentals", "any number of rentals"];
  const [searchText, setSearchText] = useState<string>("");

  const [moviesShow, setMoviesShow] = useState<ItemProps[]>([]);

  const handleLogout = () => {
    logout?.();
    return <Redirect to={{pathname: "/login"}} />;
  }

  async function searchNext($event: CustomEvent<void>) {
    if(items && pos < items.length) {
      setMoviesShow([...items.slice(0, 5+pos)]);
      setPos(pos+5);
    } else {
      setDisableInfiniteScroll(true);
    }
    log("items from" + 0 + "to " + pos)
    log(moviesShow)
    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  useEffect(()=>{
    if(searchText === "" && items){
      setMoviesShow(items);
    }
    if(searchText && items){
      setMoviesShow(items.filter((item) => item.title.startsWith(searchText)));
    }
  },[searchText]);

  useEffect(() =>{
    if(items?.length){
      setMoviesShow(items.slice(0, pos));
    }
  }, [items]);

  useEffect(()=>{
    if(filter && items){
      if(filter === "<=10 rentals") {
        setMoviesShow(items.filter((item) => item.noOfRentals <= 10) );
      }
      else if(filter === ">10 rentals") {
        setMoviesShow(items.filter((item) => item.noOfRentals > 10) );
      }
      else if(filter === "any number of rentals") {
        setMoviesShow(items);
      }
    }
  }, [filter]);

  useEffect(titleAnimation, []);

  function titleAnimation() {
    const el = document.querySelector('.page-title');
    if (el) {
      const animation = createAnimation()
        .addElement(el)
        .duration(5000)
        .direction('alternate')
        .iterations(Infinity)
        .keyframes([
          { offset: 0, color: "red" },
          { offset: 0.20, color: "orange" },
          { offset: 0.37, color: "yellow" },
          { offset: 0.55, color: "green" },
          { offset: 0.77, color: "blue" },
          { offset: 0.85, color: "indigo" },
          { offset: 1, color: "violet" }
        ]);
      animation.play();
    }
  }

  useEffect(badgeAnimation, []);

  function badgeAnimation() {
    const el = document.querySelector('.status-badge');
    if (el) {
      const animation = createAnimation()
        .addElement(el)
        .duration(2500)
        .direction('alternate')
        .iterations(Infinity)
        .keyframes([
          { offset: 0, transform: 'translateX(200px)' },
        ]);
      animation.play();
    }
  }

  log('render');
  return (
    <IonPage>
      <IonHeader>

        <IonToolbar>
          <IonButton slot="end" onClick = {handleLogout}>Logout</IonButton>
          <IonTitle className="page-title">Movie Management</IonTitle>
          <IonBadge className="status-badge" color = { isConnected ? "primary" : "danger" }>Network status: { isConnected ? "Online" : "Offline" }</IonBadge>
        </IonToolbar>

        <IonSearchbar value={searchText} debounce={500} onIonChange={(e) => setSearchText(e.detail.value!)}/>

        <IonItem>
          <IonLabel>Filter movies by title</IonLabel>
          <IonSelect value={filter} onIonChange={(e) => setFilter(e.detail.value)}>
            {selectOptions.map((option) => (
                <IonSelectOption key={option} value={option}>
                  {option}
                </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

      </IonHeader>

      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {items && moviesShow.map((item: ItemProps) => {
          return(
              <IonList>
                <Item key={item._id} _id={item._id} title={item.title} releaseDate={item.releaseDate}
                      rented={item.rented} noOfRentals={item.noOfRentals} lng={item.lng} lat={item.lat} photoPath={item.photoPath}
                      onEdit={id => history.push(`/item/${id}`)} />
              </IonList>
          );
        })}

        <IonInfiniteScroll threshold="75px" disabled={disableInfiniteScroll}
                           onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading for more items..."/>
        </IonInfiniteScroll>

        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/item')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

      </IonContent>
    </IonPage>
  );
};

export default ItemList;
