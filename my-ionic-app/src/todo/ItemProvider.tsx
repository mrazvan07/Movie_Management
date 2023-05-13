import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { ItemProps } from './ItemProps';
import { createItem, getItems, newWebSocket, updateItem } from './itemApi';
import { AuthContext } from '../auth';
import {Preferences } from "@capacitor/preferences" ;
import {Network} from "@capacitor/network";
const log = getLogger('ItemProvider');

const Storage = Preferences
type SaveItemFn = (item: ItemProps) => Promise<any>;

export interface ItemsState {
  items?: ItemProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveItem?: SaveItemFn,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  fetching: false,
  saving: false,
};

let isConnected = true;
Network.addListener("networkStatusChange", status => {
  isConnected = status.connected;

})

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
    (state, { type, payload }) => {
      switch (type) {
        case FETCH_ITEMS_STARTED:
          return { ...state, fetching: true, fetchingError: null };
        case FETCH_ITEMS_SUCCEEDED:
          return { ...state, items: payload.items, fetching: false };
        case FETCH_ITEMS_FAILED:
          return { ...state, fetchingError: payload.error, fetching: false };
        case SAVE_ITEM_STARTED:
          return { ...state, savingError: null, saving: true };
        case SAVE_ITEM_SUCCEEDED:
          const items = [...(state.items || [])];
          const item = payload.item;
          const index = items.findIndex(it => it._id === item._id);
          if (index === -1) {
            items.splice(0, 0, item);
          } else {
            items[index] = item;
          }
          return { ...state, items, saving: false };
        case SAVE_ITEM_FAILED:
          return { ...state, savingError: payload.error, saving: false };
        default:
          return state;
      }
    };

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, fetching, fetchingError, saving, savingError } = state;
  useEffect(getItemsEffect, [token]);
  useEffect(wsEffect, [token]);
  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const value = { items, fetching, fetchingError, saving, savingError, saveItem };
  log('returns');
  return (
      <ItemContext.Provider value={value}>
        {children}
      </ItemContext.Provider>
  );

  function getItemsEffect() {
    let canceled = false;
    fetchItems();
    return () => {
      canceled = true;
    }

    async function fetchItems() {
      if (!token?.trim()) {
        return;
      }
      if(isConnected) {
        try {
          log('fetchItems started');
          dispatch({ type: FETCH_ITEMS_STARTED });

          const { keys } = await Storage.keys();
          for(let i = 0; i < keys.length; i ++)
            if(keys[i] !== 'token'){
              const ret = await Storage.get({key: keys[i]});
              const result = JSON.parse(ret.value || '{}');
              result._id = keys[i].split("_")[1];
              log(result);
              await saveItem(result);
              await Storage.remove({key: keys[i]});
            }
          const items = await getItems(token);
          log('fetchItems succeeded');
          if (!canceled) {
            dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
          }
        } catch (error) {
          log('fetchItems failed');
          dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
        }
      }
      else {
        try {
          log('fetchItems started');
          dispatch({ type: FETCH_ITEMS_STARTED });

          const { keys } = await Storage.keys();
          let allItems = []
          for(let i = 0; i < keys.length; i ++)
            if(keys[i] !== 'token'){
              const ret = await Storage.get({key: keys[i]});
              const result = JSON.parse(ret.value || '{}');
              allItems.push(result)
            }

          const items = allItems;
          log('fetchItems succeeded');
          if (!canceled) {
            dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
          }
        } catch (error) {
          log('fetchItems failed');
          dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
        }
      }
    }
  }

  async function saveItemCallback(item: ItemProps) {
    if(isConnected) {
      try {
        log('saveItem started');
        dispatch({ type: SAVE_ITEM_STARTED });
        const savedItem = await (item._id ? updateItem(token, item) : createItem(token, item));
        log('saveItem succeeded');
        dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
      } catch (error) {
        log('saveItem failed');
        dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
      }
    } else {
      try {
        log('saveItem started');
        dispatch({ type: SAVE_ITEM_STARTED });

        await Storage.set({
          key: "item_" + item._id,
          value: JSON.stringify({
            title: item.title,
            releaseDate: item.releaseDate,
            rented: item.rented,
            noOfRentals: item.noOfRentals
          })
        });

        alert("You are offline. This action will be done when the server is up");

        log('saveItem succeeded');
        dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: item } });
      } catch (error) {
        log('saveItem failed');
        dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
      }
    }

  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, message => {
        if (canceled) {
          return;
        }
        const { type, payload: item } = message;
        log(`ws message, item ${type}`);
        if (type === 'created' || type === 'updated') {
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
        }
      });
    }
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
    }
  }
};
